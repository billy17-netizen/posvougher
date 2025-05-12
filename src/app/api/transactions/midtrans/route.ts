import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-utils";
import { generateSnapToken } from "@/lib/utils/midtrans";
import { v4 as uuidv4 } from "uuid";

// POST - Create a Midtrans transaction
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      items, 
      totalAmount, 
      customerName,
      customerEmail,
      customerPhone,
      cashierUserId, 
      storeId
    } = body;
    
    // Validate request
    if (!items || !items.length || !totalAmount || !storeId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Generate a unique order ID
    const orderId = `order-${uuidv4()}`;
    
    // Format items for Midtrans
    const formattedItems = items.map((item: any) => ({
      id: item.productId,
      name: item.productName || 'Product',
      price: item.price,
      quantity: item.quantity
    }));
    
    // Calculate the sum of all items to ensure it matches totalAmount
    const calculatedAmount = formattedItems.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // Calculate tax as the difference between totalAmount and calculatedAmount
    const taxAmount = totalAmount - calculatedAmount;
    
    // If there's a difference (tax), add it as a separate line item
    if (taxAmount > 0) {
      formattedItems.push({
        id: 'tax',
        name: 'Tax',
        price: taxAmount,
        quantity: 1
      });
    }
    
    // Use the provided totalAmount for the transaction
    const finalAmount = totalAmount;
    
    // Generate Midtrans Snap token
    const snapResponse = await generateSnapToken({
      orderId: orderId,
      amount: finalAmount,
      customerName: customerName || 'Customer',
      customerEmail: customerEmail,
      customerPhone: customerPhone,
      items: formattedItems
    });
    
    // Store pending transaction in database
    const pool = getPool();
    const now = new Date();
    
    // Start a transaction to ensure all operations are atomic
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Create the transaction record with storeId and PENDING status
      const transactionResult = await client.query(
        'INSERT INTO "Transaction" (id, "totalAmount", "amountPaid", "changeAmount", "paymentMethod", "cashierUserId", "storeId", status, "midtransToken", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id',
        [
          totalAmount,
          0, // No amount paid yet
          0, // No change amount
          'MIDTRANS', // Set payment method to MIDTRANS
          cashierUserId || null,
          storeId,
          'PENDING', // Initialize with PENDING status
          snapResponse.token, // Store Midtrans token directly in the transaction record
          now,
          now
        ]
      );
      
      const transactionId = transactionResult.rows[0].id;
      
      // Create transaction items without updating product stock (will update on success)
      for (const item of items) {
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
      }
      
      // Store Midtrans order ID in StoreSettings for reference
      await client.query(
        'INSERT INTO "StoreSettings" (id, "storeId", key, value, category, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)',
        [
          storeId,
          `midtrans_order_${transactionId}`,
          orderId,
          'payment',
          now,
          now
        ]
      );
      
      // No need to store the token in StoreSettings anymore since it's stored directly in the Transaction table
      
      // Commit the transaction
      await client.query('COMMIT');
      
      // Return success with Midtrans token and redirect URL
      return NextResponse.json({ 
        success: true,
        message: "Midtrans transaction initiated",
        transactionId,
        token: snapResponse.token,
        redirectUrl: snapResponse.redirectUrl
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
    console.error("Error processing Midtrans transaction:", error);
    return NextResponse.json(
      { error: "Failed to process transaction: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 