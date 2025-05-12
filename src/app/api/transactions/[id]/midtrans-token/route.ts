import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-utils";
import { generateSnapToken } from "@/lib/utils/midtrans";
import { v4 as uuidv4 } from "uuid";

// GET - Generate Midtrans token for an existing transaction
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const transactionId = params.id;
  
  if (!transactionId) {
    return NextResponse.json(
      { error: "Transaction ID is required" },
      { status: 400 }
    );
  }
  
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    console.log(`[midtrans-token] Getting token for transaction: ${transactionId}`);
    
    // First, check if we already have a token stored in the Transaction table
    const tokenResult = await client.query(
      'SELECT "midtransToken", status, "paymentMethod", "totalAmount" FROM "Transaction" ' +
      'WHERE id = $1',
      [transactionId]
    );
    
    // If token is found, return it
    if (tokenResult.rows.length > 0 && tokenResult.rows[0].midtransToken) {
      console.log(`[midtrans-token] Found existing token for transaction: ${transactionId}`);
      
      // Get the order ID
      const orderIdResult = await client.query(
        'SELECT value as "midtransOrderId" FROM "StoreSettings" ' +
        'WHERE key = $1',
        [`midtrans_order_${transactionId}`]
      );
      
      const orderId = orderIdResult.rows.length > 0 ? orderIdResult.rows[0].midtransOrderId : null;
      
      return NextResponse.json({ 
        success: true,
        message: "Existing Midtrans token retrieved",
        transactionId,
        token: tokenResult.rows[0].midtransToken,
        orderId
      });
    }
    
    // Get the transaction details
    const transactionResult = await client.query(
      'SELECT t.id, t."totalAmount", t."paymentMethod", t.status, s.value as "midtransOrderId" ' +
      'FROM "Transaction" t ' +
      'LEFT JOIN "StoreSettings" s ON s.key = CONCAT(\'midtrans_order_\', t.id) ' +
      'WHERE t.id = $1',
      [transactionId]
    );
    
    if (transactionResult.rows.length === 0) {
      console.log(`[midtrans-token] Transaction not found: ${transactionId}`);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    
    const transaction = transactionResult.rows[0];
    console.log(`[midtrans-token] Transaction found:`, JSON.stringify(transaction));
    
    // Check if transaction is EXPIRED and update to PENDING if needed
    if (transaction.status === 'EXPIRED') {
      console.log(`[midtrans-token] Resetting EXPIRED transaction to PENDING: ${transactionId}`);
      try {
        // Reset expired transaction to PENDING status
        await client.query(
          'UPDATE "Transaction" SET status = $1, "updatedAt" = NOW() WHERE id = $2',
          ['PENDING', transactionId]
        );
        
        // Update transaction object for further processing
        transaction.status = 'PENDING';
        
        // Do not reset the Midtrans order ID for expired transactions
        // This ensures we don't create a duplicate order ID
        // transaction.midtransOrderId = null;
        console.log(`[midtrans-token] Transaction reset successful`);
      } catch (updateError: any) {
        console.error(`[midtrans-token] Error resetting transaction status:`, updateError);
        throw new Error(`Failed to reset transaction status: ${updateError.message || 'Unknown error'}`);
      }
    }
    
    // Only allow for PENDING Midtrans transactions
    if (transaction.status !== 'PENDING') {
      console.log(`[midtrans-token] Transaction has invalid status: ${transaction.status}`);
      return NextResponse.json(
        { error: `Cannot generate token. Transaction is already ${transaction.status}` },
        { status: 400 }
      );
    }
    
    if (transaction.paymentMethod !== 'MIDTRANS') {
      console.log(`[midtrans-token] Invalid payment method: ${transaction.paymentMethod}`);
      return NextResponse.json(
        { error: "Cannot generate Midtrans token for non-Midtrans transactions" },
        { status: 400 }
      );
    }
    
    // Existing Midtrans orderId or generate a new one if not found
    let orderId = transaction.midtransOrderId;
    if (!orderId) {
      orderId = `order-${uuidv4()}`;
      console.log(`[midtrans-token] Generating new order ID: ${orderId}`);
      
      try {
        // Store the new order ID
        await client.query(
          'INSERT INTO "StoreSettings" (id, "storeId", key, value, category, "createdAt", "updatedAt") ' +
          'VALUES (gen_random_uuid(), (SELECT "storeId" FROM "Transaction" WHERE id = $1), $2, $3, $4, NOW(), NOW())',
          [transactionId, `midtrans_order_${transactionId}`, orderId, 'payment']
        );
      } catch (orderIdError: any) {
        console.error(`[midtrans-token] Error storing order ID:`, orderIdError);
        throw new Error(`Failed to store order ID: ${orderIdError.message || 'Unknown error'}`);
      }
    } else {
      console.log(`[midtrans-token] Reusing existing order ID: ${orderId}`);
    }
    
    // Get transaction items
    let formattedItems;
    try {
      console.log(`[midtrans-token] Getting transaction items...`);
      const itemsResult = await client.query(
        'SELECT ti."productId", p.name as "productName", ti.quantity, ti.price ' +
        'FROM "TransactionItem" ti ' +
        'JOIN "Product" p ON ti."productId" = p.id ' +
        'WHERE ti."transactionId" = $1',
        [transactionId]
      );
      
      // Format items for Midtrans
      formattedItems = itemsResult.rows.map((item: any) => ({
        id: item.productId,
        name: item.productName || 'Product',
        price: item.price,
        quantity: item.quantity
      }));
      
      console.log(`[midtrans-token] Found ${formattedItems.length} items`);
    } catch (itemsError: any) {
      console.error(`[midtrans-token] Error getting transaction items:`, itemsError);
      throw new Error(`Failed to get transaction items: ${itemsError.message || 'Unknown error'}`);
    }
    
    // Calculate items total and check if tax should be added
    const calculatedAmount = formattedItems.reduce((sum: number, item: { price: number; quantity: number }) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // Calculate tax as the difference between totalAmount and calculatedAmount
    const taxAmount = transaction.totalAmount - calculatedAmount;
    console.log(`[midtrans-token] Calculated amount: ${calculatedAmount}, Tax amount: ${taxAmount}`);
    
    // If there's a difference (tax), add it as a separate line item
    if (taxAmount > 0) {
      formattedItems.push({
        id: 'tax',
        name: 'Tax',
        price: taxAmount,
        quantity: 1
      });
    }
    
    // Get customer data
    let customerName = 'Customer';
    let customerEmail = null;
    let customerPhone = null;
    
    try {
      console.log(`[midtrans-token] Getting customer data...`);
      const userResult = await client.query(
        'SELECT u.name, u.email, u.phone ' +
        'FROM "Transaction" t ' +
        'JOIN "User" u ON t."cashierUserId" = u.id ' +
        'WHERE t.id = $1',
        [transactionId]
      );
      
      if (userResult.rows.length > 0) {
        customerName = userResult.rows[0].name || 'Customer';
        customerEmail = userResult.rows[0].email;
        customerPhone = userResult.rows[0].phone;
      }
      
      console.log(`[midtrans-token] Customer name: ${customerName}`);
    } catch (customerError) {
      console.error(`[midtrans-token] Error getting customer data:`, customerError);
      // Continue with default values
    }
    
    // Generate Midtrans Snap token
    try {
      console.log(`[midtrans-token] Generating Midtrans token with order ID: ${orderId}`);
      const snapResponse = await generateSnapToken({
        orderId: orderId,
        amount: transaction.totalAmount,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        items: formattedItems
      });
      
      console.log(`[midtrans-token] Token generated successfully`);
      
      // Store the generated token in the Transaction table
      try {
        await client.query(
          'UPDATE "Transaction" SET "midtransToken" = $1, "updatedAt" = NOW() WHERE id = $2',
          [snapResponse.token, transactionId]
        );
        
        console.log(`[midtrans-token] Token stored successfully in Transaction record: ${transactionId}`);
      } catch (tokenStoreError: any) {
        console.error(`[midtrans-token] Error storing token:`, tokenStoreError);
        // Continue even if token storage fails
      }
      
      // Return success with Midtrans token and redirect URL
      return NextResponse.json({ 
        success: true,
        message: "Midtrans token generated",
        transactionId,
        token: snapResponse.token,
        redirectUrl: snapResponse.redirectUrl
      });
    } catch (snapError: any) {
      console.error(`[midtrans-token] Error generating Snap token:`, snapError);
      throw new Error(`Failed to generate Snap token: ${snapError.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error("[midtrans-token] Error generating Midtrans token:", error);
    return NextResponse.json(
      { error: "Failed to generate Midtrans token: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 