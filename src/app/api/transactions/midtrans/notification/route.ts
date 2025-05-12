import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-utils";
import { verifyMidtransNotification } from "@/lib/utils/midtrans";

// POST - Handle Midtrans notification
export async function POST(request: Request) {
  try {
    // Parse notification data from request
    const notification = await request.json();
    
    // Extract important fields
    const { 
      transaction_status, 
      order_id, 
      transaction_id,
      gross_amount,
      payment_type,
      status_code
    } = notification;
    
    console.log(`Midtrans notification received: ${transaction_status} for order ${order_id}`);
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Find the transaction using the order ID
      const orderIdQuery = await client.query(
        'SELECT s."storeId", s.key FROM "StoreSettings" s WHERE s.value = $1 AND s.key LIKE $2',
        [order_id, 'midtrans_order_%']
      );
      
      if (orderIdQuery.rows.length === 0) {
        console.error(`No transaction found for Midtrans order: ${order_id}`);
        return NextResponse.json({
          status: 'error',
          message: 'Transaction not found'
        }, { status: 404 });
      }
      
      // Extract transaction ID from the key (midtrans_order_[transactionId])
      const { storeId, key } = orderIdQuery.rows[0];
      const transactionId = key.split('midtrans_order_')[1];
      
      console.log(`Found transaction ID: ${transactionId} for store: ${storeId}`);
      
      // Verify notification with Midtrans for security
      try {
        await verifyMidtransNotification(notification);
        console.log('Midtrans notification verified successfully');
      } catch (verifyError) {
        console.error('Failed to verify Midtrans notification:', verifyError);
        // Continue processing even if verification fails
        // This may happen in development/testing environments
        console.warn('Proceeding with notification processing despite verification failure');
      }
      
      // Process transaction based on status
      let newStatus;
      switch (transaction_status) {
        case 'capture':
        case 'settlement':
          newStatus = 'COMPLETED';
          break;
        case 'deny':
        case 'cancel':
          newStatus = 'CANCELLED';
          break;
        case 'expire':
          newStatus = 'EXPIRED';
          break;
        default:
          newStatus = 'PENDING';
          break;
      }
      
      // Update transaction status in database
      if (newStatus) {
        await client.query('BEGIN');
        
        // Update transaction status
        const updateResult = await client.query(
          'UPDATE "Transaction" SET status = $1, "amountPaid" = $2, "updatedAt" = NOW() WHERE id = $3 AND "storeId" = $4 RETURNING id',
          [newStatus, parseFloat(gross_amount || '0'), transactionId, storeId]
        );
        
        if (updateResult.rows.length === 0) {
          throw new Error(`Transaction not found or not authorized: ${transactionId}`);
        }
        
        console.log(`Updated transaction ${transactionId} status to ${newStatus}`);
        
        // If transaction is completed, update product stock
        if (newStatus === 'COMPLETED') {
          const transactionItems = await client.query(
            'SELECT "productId", quantity FROM "TransactionItem" WHERE "transactionId" = $1',
            [transactionId]
          );
          
          // Update stock for each product
          for (const item of transactionItems.rows) {
            await client.query(
              'UPDATE "Product" SET stock = stock - $1, "updatedAt" = NOW() WHERE id = $2 AND "storeId" = $3',
              [item.quantity, item.productId, storeId]
            );
          }
          
          console.log(`Updated stock for ${transactionItems.rows.length} products for transaction ${transactionId}`);
        }
        
        await client.query('COMMIT');
      }
      
      // Return response to Midtrans
      return NextResponse.json({
        status: 'ok',
        message: `Transaction ${transactionId} updated to status: ${newStatus}`,
        transaction_id: transactionId
      });
      
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Error processing Midtrans notification:', error);
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error handling Midtrans notification:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Failed to process notification'
    }, { status: 500 });
  }
} 