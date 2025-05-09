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
  paymentMethod: 'CASH' | 'DEBIT' | 'CREDIT' | 'QRIS';
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
    const { items, totalAmount, amountPaid, changeAmount, paymentMethod, cashierUserId, storeId } = body as TransactionData;
    
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
    
    // Validate payment data
    if (amountPaid < totalAmount) {
      return NextResponse.json(
        { error: "Amount paid cannot be less than total amount" },
        { status: 400 }
      );
    }
    
    // Verify the change amount calculation is correct
    const expectedChange = amountPaid - totalAmount;
    if (Math.abs(expectedChange - changeAmount) > 1) { // Allow for small rounding errors
      console.warn(`Change amount mismatch: expected ${expectedChange}, got ${changeAmount}`);
      // Auto-correct the change amount
      const correctedChangeAmount = Math.max(0, expectedChange);
      console.log(`Auto-correcting change amount to: ${correctedChangeAmount}`);
    }
    
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
          amountPaid, // Use the validated amount
          Math.max(0, amountPaid - totalAmount), // Calculate change amount directly to ensure accuracy
          paymentMethod,
          cashierUserId,
          storeId,
          'COMPLETED', // Status
          now,
          now
        ]
      );
      
      const transactionId = transactionResult.rows[0].id;
      
      // 2. Create transaction items and update product stock
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
        
        // Update product stock (ensure we're only updating products that belong to this store)
        await client.query(
          'UPDATE "Product" SET stock = stock - $1, "updatedAt" = $2 WHERE id = $3 AND "storeId" = $4',
          [item.quantity, now, item.productId, storeId]
        );
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