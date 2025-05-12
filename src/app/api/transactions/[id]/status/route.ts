import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-utils";

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
  
  // Get storeId from URL query parameters
  const url = new URL(request.url);
  const storeId = url.searchParams.get('storeId');
  
  if (!storeId) {
    return NextResponse.json(
      { error: "Store ID is required" },
      { status: 400 }
    );
  }
  
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Get the current transaction to check its status
    const transactionResult = await client.query(
      'SELECT t.status, t."paymentMethod" ' +
      'FROM "Transaction" t ' +
      'WHERE t.id = $1 AND t."storeId" = $2',
      [transactionId, storeId]
    );
    
    if (transactionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }
    
    const transaction = transactionResult.rows[0];
    
    // Simply return the current status from the database
    return NextResponse.json({
      status: transaction.status,
      paymentMethod: transaction.paymentMethod
    });
    
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return NextResponse.json(
      { error: "Failed to check transaction status" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PUT method to handle transaction status updates
export async function PUT(
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
  
  // Get storeId from URL query parameters
  const url = new URL(request.url);
  const storeId = url.searchParams.get('storeId');
  
  if (!storeId) {
    return NextResponse.json(
      { error: "Store ID is required" },
      { status: 400 }
    );
  }
  
  try {
    // Parse request body
    const body = await request.json();
    const { status } = body;
    
    // Validate status
    if (!status || !['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be COMPLETED, CANCELLED, or EXPIRED" },
        { status: 400 }
      );
    }
    
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // First, check if the transaction exists and get its current status
      const checkResult = await client.query(
        'SELECT status, "storeId", "paymentMethod" FROM "Transaction" WHERE id = $1 AND "storeId" = $2',
        [transactionId, storeId]
      );
      
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 }
        );
      }
      
      const transaction = checkResult.rows[0];
      
      // Only allow status updates for PENDING transactions
      if (transaction.status !== 'PENDING') {
        return NextResponse.json({
          success: false,
          message: `Transaction is already ${transaction.status}`,
          status: transaction.status
        });
      }
      
      await client.query('BEGIN');
      
      // Update transaction status
      await client.query(
        'UPDATE "Transaction" SET status = $1, "updatedAt" = NOW() WHERE id = $2',
        [status, transactionId]
      );
      
      // If completing the transaction, update product stock
      if (status === 'COMPLETED') {
        console.log(`Updating product quantities for transaction ${transactionId}`);
        
        // Get transaction items
        const itemsResult = await client.query(
          'SELECT "productId", quantity FROM "TransactionItem" WHERE "transactionId" = $1',
          [transactionId]
        );
        
        console.log(`Found ${itemsResult.rows.length} items to update`);
        
        // Update stock for each product
        for (const item of itemsResult.rows) {
          console.log(`Updating product ${item.productId} stock by -${item.quantity}`);
          
          const updateResult = await client.query(
            'UPDATE "Product" SET stock = stock - $1, "updatedAt" = NOW() WHERE id = $2 AND "storeId" = $3 RETURNING stock',
            [item.quantity, item.productId, storeId]
          );
          
          if (updateResult.rows.length > 0) {
            console.log(`New stock for product ${item.productId}: ${updateResult.rows[0].stock}`);
          } else {
            console.warn(`Product ${item.productId} not found or not in store ${storeId}`);
          }
        }
      }
      
      await client.query('COMMIT');
      
      return NextResponse.json({
        success: true,
        message: `Transaction status updated to ${status}`,
        status: status
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating transaction status:', error);
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error processing transaction status update:', error);
    return NextResponse.json(
      { error: "Failed to update transaction status: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 