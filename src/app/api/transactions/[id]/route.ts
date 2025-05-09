import { NextResponse } from "next/server";
import { getPool } from "@/lib/db-utils";

interface TransactionItem {
  id: string;
  quantity: string | number;
  price: string | number;
  subtotal: string | number;
  productId: string;
  productName: string;
  productImage: string | null;
  categoryName: string;
}

// GET - Get transaction details by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const pool = getPool();
    
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
        { error: "No store selected" },
        { status: 400 }
      );
    }
    
    // 1. Get transaction information with storeId verification
    const transactionResult = await pool.query(
      'SELECT t.id, t."totalAmount", t."amountPaid", t."changeAmount", t."paymentMethod", t.status, t."createdAt", ' +
      'u.name as "cashierName" ' +
      'FROM "Transaction" t ' +
      'JOIN "User" u ON t."cashierUserId" = u.id ' +
      'WHERE t.id = $1 AND t."storeId" = $2',
      [id, storeId]
    );
    
    if (transactionResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found in this store" },
        { status: 404 }
      );
    }
    
    const transaction = transactionResult.rows[0];
    
    // Convert string values to numbers where needed
    transaction.totalAmount = Number(transaction.totalAmount);
    transaction.amountPaid = Number(transaction.amountPaid || 0);
    transaction.changeAmount = Number(transaction.changeAmount || 0);
    
    // Verify change amount calculation is correct
    if (transaction.amountPaid > 0 && Math.abs((transaction.amountPaid - transaction.totalAmount) - transaction.changeAmount) > 1) {
      console.warn(`Change amount in database may be incorrect. Expected: ${transaction.amountPaid - transaction.totalAmount}, Actual: ${transaction.changeAmount}`);
      // Auto-correct the change amount for display
      transaction.changeAmount = Math.max(0, transaction.amountPaid - transaction.totalAmount);
    }
    
    // 2. Get transaction items with product details
    const itemsResult = await pool.query(
      'SELECT ti.id, ti.quantity, ti.price, ti.subtotal, ' +
      'p.id as "productId", p.name as "productName", p.image as "productImage", c.name as "categoryName" ' +
      'FROM "TransactionItem" ti ' +
      'JOIN "Product" p ON ti."productId" = p.id ' +
      'JOIN "Category" c ON p."categoryId" = c.id ' +
      'WHERE ti."transactionId" = $1',
      [id]
    );
    
    // Convert numeric fields in items to numbers
    const items = itemsResult.rows.map((item: TransactionItem) => ({
      ...item,
      quantity: Number(item.quantity),
      price: Number(item.price),
      subtotal: Number(item.subtotal),
    }));
    
    // Return transaction with items
    return NextResponse.json({
      transaction: {
        ...transaction,
        items
      }
    });
    
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction details" },
      { status: 500 }
    );
  }
} 