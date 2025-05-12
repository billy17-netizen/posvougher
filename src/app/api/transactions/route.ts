import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-utils";

interface TransactionItem {
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface TransactionData {
  items: TransactionItem[];
  totalAmount: number;
  amountPaid: number;
  changeAmount: number;
  paymentMethod: 'CASH' | 'QRIS' | 'DEBIT' | 'CREDIT' | 'MIDTRANS';
  cashierUserId?: string; // Make this optional as we'll have a fallback
  storeId: string;
}

// GET - Fetch all transactions
export async function GET(request: Request) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Get store ID from query parameters or cookies
    const url = new URL(request.url);
    let storeId = url.searchParams.get('storeId');
    
    // If no storeId in query, check cookies
    if (!storeId) {
      const cookies = request.headers.get('cookie');
      if (cookies) {
        const storeIdMatch = cookies.match(/currentStoreId=([^;]+)/);
        if (storeIdMatch) {
          storeId = storeIdMatch[1];
        }
      }
    }
    
    // If still no storeId, return error
    if (!storeId) {
      return NextResponse.json(
        { error: "No store selected", transactions: [] },
        { status: 400 }
      );
    }
    
    console.log('Fetching transactions for store:', storeId);
    
    // Fetch all transactions with user information, filtered by storeId using direct PostgreSQL
    const result = await client.query(
      `SELECT t.id, t."totalAmount", t."amountPaid", t."changeAmount", 
              t."paymentMethod", t.status, t."createdAt", t."updatedAt", 
              t."cashierUserId", u.name as "cashierName"
       FROM "Transaction" t
       LEFT JOIN "User" u ON t."cashierUserId" = u.id
       WHERE t."storeId" = $1
       ORDER BY t."createdAt" DESC`,
      [storeId]
    );

    return NextResponse.json({ transactions: result.rows });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST - Create a new transaction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      items, 
      totalAmount, 
      amountPaid, 
      changeAmount, 
      paymentMethod, 
      cashierUserId, 
      storeId
    } = body as TransactionData;
    
    // Validate request
    if (!items || !items.length || !totalAmount || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate storeId
    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }
    
    // Validate cashierUserId
    if (!cashierUserId) {
      return NextResponse.json(
        { error: "Cashier User ID is required" },
        { status: 400 }
      );
    }
    
    // Validate payment data - special handling for QRIS
    if (paymentMethod === 'CASH' && amountPaid < totalAmount) {
      return NextResponse.json(
        { error: "Amount paid cannot be less than total amount" },
        { status: 400 }
      );
    }
    
    // For QRIS payments, ensure amount paid is equal to total amount
    const finalAmountPaid = paymentMethod === 'QRIS' ? totalAmount : amountPaid;
    
    // Verify the change amount calculation is correct
    let finalChangeAmount = 0;
    if (paymentMethod === 'CASH') {
      finalChangeAmount = Math.max(0, finalAmountPaid - totalAmount);
    }
    // QRIS payments have no change
    
    const pool = getPool();
    const now = new Date();
    
    // Start a transaction to ensure all operations are atomic
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 1. Create the transaction record with storeId
      const transactionResult = await client.query(
        'INSERT INTO "Transaction" (id, "totalAmount", "amountPaid", "changeAmount", "paymentMethod", "cashierUserId", "storeId", status, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
        [
          totalAmount,
          finalAmountPaid, // Use the validated amount
          finalChangeAmount, // Use the calculated change amount
          paymentMethod,
          cashierUserId,
          storeId,
          'PENDING', // Set initial status to PENDING for all transactions
          now,
          now
        ]
      );
      
      const transactionId = transactionResult.rows[0].id;
      
      // 2. Create transaction items WITHOUT updating product stock
      // (stock will be updated when transaction status changes to COMPLETED)
      for (const item of items) {
        // Add transaction item
        await client.query(
          'INSERT INTO "TransactionItem" (id, "transactionId", "productId", quantity, price, subtotal, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)',
          [
            transactionId,
            item.productId,
            item.quantity,
            item.price,
            item.subtotal,
            now,
            now
          ]
        );
        
        // Remove automatic stock update - will be done when status is COMPLETED
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      return NextResponse.json({ 
        success: true,
        message: "Transaction completed successfully",
        transactionId
      }, { status: 201 });
      
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      console.error("Database transaction error:", error);
      throw error;
    } finally {
      // Release the client back to the pool
      client.release();
    }
    
  } catch (error) {
    console.error("Error processing transaction:", error);
    return NextResponse.json(
      { error: "Failed to process transaction: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 