import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(request: Request) {
  // Create database client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database for statistics');
    
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
        { 
          success: false, 
          error: "No store selected",
          statistics: {
            totalProducts: 0,
            totalCategories: 0,
            pendingTransactions: 0,
            dailySales: 0,
            monthlyGrowth: 0,
            recentTransactions: []
          }
        },
        { status: 400 }
      );
    }
    
    console.log('Fetching statistics for store:', storeId);

    // Get product count for this store
    const productsQuery = await client.query(
      'SELECT COUNT(*) as count FROM "Product" WHERE "storeId" = $1',
      [storeId]
    );
    const totalProducts = parseInt(productsQuery.rows[0].count);

    // Get category count for this store
    const categoriesQuery = await client.query(
      'SELECT COUNT(*) as count FROM "Category" WHERE "storeId" = $1',
      [storeId]
    );
    const totalCategories = parseInt(categoriesQuery.rows[0].count);

    // Get pending transactions count for this store
    const pendingQuery = await client.query(
      'SELECT COUNT(*) as count FROM "Transaction" WHERE status = $1 AND "storeId" = $2',
      ['PENDING', storeId]
    );
    const pendingTransactions = parseInt(pendingQuery.rows[0].count);

    // Get today's sales for this store
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailySalesQuery = await client.query(
      'SELECT SUM("totalAmount") as sum FROM "Transaction" WHERE status = $1 AND "storeId" = $2 AND "createdAt" >= $3 AND "createdAt" < $4',
      ['COMPLETED', storeId, today.toISOString(), tomorrow.toISOString()]
    );
    const dailySales = dailySalesQuery.rows[0].sum ? parseInt(dailySalesQuery.rows[0].sum) : 0;

    // Get recent transactions for this store
    const recentTransactionsQuery = await client.query(
      `SELECT t.id, t."createdAt", t."totalAmount", t.status, t."cashierUserId", u.name as "cashierName" 
       FROM "Transaction" t 
       JOIN "User" u ON t."cashierUserId" = u.id 
       WHERE t."storeId" = $1 
       ORDER BY t."createdAt" DESC 
       LIMIT 5`,
      [storeId]
    );

    // Calculate monthly growth (example calculation)
    // Typically you'd compare with previous month's data
    // For simplicity, using a random value between 5-25%
    const monthlyGrowth = Math.floor(Math.random() * 20) + 5;

    return NextResponse.json({
      success: true,
      statistics: {
        totalProducts,
        totalCategories,
        pendingTransactions,
        dailySales,
        monthlyGrowth,
        recentTransactions: recentTransactionsQuery.rows.map((tx: any) => ({
          id: tx.id,
          date: tx.createdAt,
          amount: tx.totalAmount,
          customer: 'Walk-in Customer', // No customer info in the query
          status: tx.status,
          cashier: tx.cashierName
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics', details: String(error) },
      { status: 500 }
    );
  } finally {
    // Close the database connection
    try {
      await client.end();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
} 