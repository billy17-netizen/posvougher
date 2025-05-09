import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db-utils";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";

// Define interfaces based on actual schema
interface TransactionItemWithProduct {
  id: string;
  quantity: number;
  subtotal: number;
  productId: string;
  product_name: string;
  categoryId: string;
  category_name: string;
}

interface ExtendedTransaction {
  id: string;
  totalAmount: number;
  paymentMethod: string; // CASH, DEBIT, CREDIT, QRIS
  status: string; // COMPLETED, PENDING, CANCELLED
  createdAt: Date;
  updatedAt: Date;
  cashierUserId: string;
  cashierName: string;
  items: TransactionItemWithProduct[];
}

export async function GET(request: NextRequest) {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Get query parameters
    const url = new URL(request.url);
    const startDateParam = url.searchParams.get('startDate');
    const endDateParam = url.searchParams.get('endDate');
    const categoryId = url.searchParams.get('categoryId');
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
        { success: false, error: "No store selected" },
        { status: 400 }
      );
    }
    
    console.log("API received params:", { startDateParam, endDateParam, categoryId, storeId });
    
    // Validate date params
    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        { success: false, error: "Start and end dates are required" },
        { status: 400 }
      );
    }
    
    // Parse dates
    const startDate = startOfDay(parseISO(startDateParam));
    const endDate = endOfDay(parseISO(endDateParam));
    
    // Find transactions that match our criteria
    const transactionsQuery = await client.query(
      `SELECT t.id, t."totalAmount", t."paymentMethod", t.status, t."createdAt", t."updatedAt", 
              t."cashierUserId", u.name AS "cashierName"
       FROM "Transaction" t
       LEFT JOIN "User" u ON t."cashierUserId" = u.id
       WHERE t."storeId" = $1 
       AND t.status = 'COMPLETED'
       AND t."createdAt" >= $2 
       AND t."createdAt" <= $3
       ORDER BY t."createdAt" DESC`,
      [storeId, startDate, endDate]
    );
    
    const transactions = transactionsQuery.rows;
    console.log(`Found ${transactions.length} transactions in the date range for store ${storeId}`);
    
    if (transactions.length === 0) {
      // Return empty report structure if no transactions found
      return NextResponse.json({
        success: true,
        totalSales: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        salesByDay: [],
        topProducts: [],
        topCategories: [],
        salesByPaymentMethod: []
      });
    }
    
    // Get transaction IDs
    const transactionIds = transactions.map((t: any) => t.id);
    
    // Get transaction items with product and category information
    const itemsQuery = await client.query(
      `SELECT ti.id, ti."transactionId", ti.quantity, ti.subtotal, ti."productId", 
              p.name AS product_name, c.id AS "categoryId", c.name AS category_name
       FROM "TransactionItem" ti
       JOIN "Product" p ON ti."productId" = p.id
       JOIN "Category" c ON p."categoryId" = c.id
       WHERE ti."transactionId" = ANY($1)`,
      [transactionIds]
    );
    
    // Group items by transaction ID
    const itemsByTransaction: Record<string, TransactionItemWithProduct[]> = {};
    itemsQuery.rows.forEach((item: any) => {
      if (!itemsByTransaction[item.transactionId]) {
        itemsByTransaction[item.transactionId] = [];
      }
      itemsByTransaction[item.transactionId].push({
        id: item.id,
        quantity: item.quantity,
        subtotal: item.subtotal,
        productId: item.productId,
        product_name: item.product_name,
        categoryId: item.categoryId,
        category_name: item.category_name
      });
    });
    
    // Add items to each transaction
    const extendedTransactions: ExtendedTransaction[] = transactions.map((t: any) => ({
      ...t,
      items: itemsByTransaction[t.id] || []
    }));
    
    // Filter by category if specified
    let filteredTransactions = extendedTransactions;
    if (categoryId) {
      filteredTransactions = extendedTransactions.filter(transaction => 
        transaction.items.some(item => item.categoryId === categoryId)
      );
      console.log(`Filtered to ${filteredTransactions.length} transactions for category ${categoryId}`);
    }
    
    // Calculate total sales
    const totalSales = filteredTransactions.reduce((sum, tx) => sum + Number(tx.totalAmount), 0);
    const totalTransactions = filteredTransactions.length;
    const averageTransactionValue = totalTransactions > 0 
      ? Math.round(totalSales / totalTransactions) 
      : 0;
    
    // Organize transactions by day
    const salesByDay = getSalesByDay(filteredTransactions);
    
    // Get top products
    const topProducts = getTopProducts(filteredTransactions, categoryId);
    
    // Get top categories
    const topCategories = getTopCategories(filteredTransactions);
    
    // Get sales by payment method
    const salesByPaymentMethod = getSalesByPaymentMethod(filteredTransactions);
    
    const responseData = {
      success: true,
      totalSales,
      totalTransactions,
      averageTransactionValue,
      salesByDay,
      topProducts,
      topCategories,
      salesByPaymentMethod,
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching sales report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sales report" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// Helper function to organize sales by day
function getSalesByDay(transactions: ExtendedTransaction[]) {
  const salesByDay: Record<string, { sales: number, transactions: number }> = {};
  
  transactions.forEach(transaction => {
    const dateKey = format(new Date(transaction.createdAt), 'yyyy-MM-dd');
    
    if (!salesByDay[dateKey]) {
      salesByDay[dateKey] = { sales: 0, transactions: 0 };
    }
    
    salesByDay[dateKey].sales += Number(transaction.totalAmount);
    salesByDay[dateKey].transactions += 1;
  });
  
  return Object.entries(salesByDay)
    .map(([date, stats]) => ({
      date,
      sales: stats.sales,
      transactions: stats.transactions,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Helper function to get top selling products
function getTopProducts(transactions: ExtendedTransaction[], categoryId: string | null = null) {
  const productSales: Record<string, { id: string, name: string, quantity: number, revenue: number }> = {};
  
  transactions.forEach(transaction => {
    transaction.items.forEach((item) => {
      // Skip items not in the selected category if a category filter is applied
      if (categoryId && item.categoryId !== categoryId) {
        return;
      }
      
      const productId = item.productId;
      
      if (!productSales[productId]) {
        productSales[productId] = {
          id: productId,
          name: item.product_name,
          quantity: 0,
          revenue: 0,
        };
      }
      
      productSales[productId].quantity += item.quantity;
      productSales[productId].revenue += Number(item.subtotal);
    });
  });
  
  return Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Return top 10 products
}

// Helper function to get top categories
function getTopCategories(transactions: ExtendedTransaction[]) {
  const categorySales: Record<string, { id: string, name: string, count: number, revenue: number }> = {};
  
  transactions.forEach(transaction => {
    transaction.items.forEach((item) => {
      const categoryId = item.categoryId;
      const categoryName = item.category_name;
      
      if (!categorySales[categoryId]) {
        categorySales[categoryId] = {
          id: categoryId,
          name: categoryName,
          count: 0,
          revenue: 0,
        };
      }
      
      categorySales[categoryId].count += item.quantity;
      categorySales[categoryId].revenue += Number(item.subtotal);
    });
  });
  
  return Object.values(categorySales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5); // Return top 5 categories
}

// Helper function to get sales by payment method
function getSalesByPaymentMethod(transactions: ExtendedTransaction[]) {
  const methodSales: Record<string, { method: string, count: number, amount: number }> = {};
  
  transactions.forEach(transaction => {
    const method = transaction.paymentMethod;
    
    if (!methodSales[method]) {
      methodSales[method] = {
        method,
        count: 0,
        amount: 0,
      };
    }
    
    methodSales[method].count += 1;
    methodSales[method].amount += Number(transaction.totalAmount);
  });
  
  return Object.values(methodSales)
    .sort((a, b) => b.amount - a.amount);
} 