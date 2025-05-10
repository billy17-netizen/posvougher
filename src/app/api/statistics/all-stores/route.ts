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
    console.log('Connected to database for all stores statistics');
    
    // Get user ID for permission check
    const cookies = request.headers.get('cookie');
    let userId = null;
    
    if (cookies) {
      const userIdMatch = cookies.match(/userId=([^;]+)/);
      if (userIdMatch) {
        userId = userIdMatch[1];
      }
    }
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }
    
    // Check if user exists and is a SUPER_ADMIN
    const userQuery = await client.query(
      'SELECT * FROM "User" WHERE id = $1 LIMIT 1',
      [userId]
    );
    
    if (userQuery.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    const user = userQuery.rows[0];
    
    // Get user's store roles
    const userStoresQuery = await client.query(
      'SELECT us.*, s.name as "storeName" FROM "UserStore" us JOIN "Store" s ON us."storeId" = s.id WHERE us."userId" = $1',
      [userId]
    );
    
    const userStores = userStoresQuery.rows;
    
    // Check if user has SUPER_ADMIN role
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || 
                        userStores.some(store => store.role === 'SUPER_ADMIN') ||
                        request.headers.get('cookie')?.includes('isSuperAdmin=true');
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: "Not authorized" },
        { status: 403 }
      );
    }
    
    // Get all stores
    const storesQuery = await client.query(`
      SELECT 
        s.id, 
        s.name, 
        s.address, 
        s.phone, 
        s.email, 
        s."isActive", 
        s."createdAt",
        s."taxRate",
        s.currency
      FROM 
        "Store" s 
      ORDER BY 
        s."createdAt" DESC
    `);
    
    const stores = storesQuery.rows.map(store => ({
      ...store,
      createdAt: store.createdAt.toISOString()
    }));
    
    // Get statistics for each store
    const storeStats = await Promise.all(stores.map(async (store) => {
      // Get product count
      const productsQuery = await client.query(
        'SELECT COUNT(*) as count FROM "Product" WHERE "storeId" = $1',
        [store.id]
      );
      const totalProducts = parseInt(productsQuery.rows[0].count);
    
      // Get category count
      const categoriesQuery = await client.query(
        'SELECT COUNT(*) as count FROM "Category" WHERE "storeId" = $1',
        [store.id]
      );
      const totalCategories = parseInt(categoriesQuery.rows[0].count);
    
      // Get pending transactions count
      const pendingQuery = await client.query(
        'SELECT COUNT(*) as count FROM "Transaction" WHERE status = $1 AND "storeId" = $2',
        ['PENDING', store.id]
      );
      const pendingTransactions = parseInt(pendingQuery.rows[0].count);
    
      // Get today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
    
      const dailySalesQuery = await client.query(
        'SELECT SUM("totalAmount") as sum FROM "Transaction" WHERE status = $1 AND "storeId" = $2 AND "createdAt" >= $3 AND "createdAt" < $4',
        ['COMPLETED', store.id, today.toISOString(), tomorrow.toISOString()]
      );
      const dailySales = dailySalesQuery.rows[0].sum ? parseInt(dailySalesQuery.rows[0].sum) : 0;
    
      // Get total sales (all time)
      const totalSalesQuery = await client.query(
        'SELECT SUM("totalAmount") as sum FROM "Transaction" WHERE status = $1 AND "storeId" = $2',
        ['COMPLETED', store.id]
      );
      const totalSales = totalSalesQuery.rows[0].sum ? parseInt(totalSalesQuery.rows[0].sum) : 0;
    
      // Get total transaction count
      const totalTransactionsQuery = await client.query(
        'SELECT COUNT(*) as count FROM "Transaction" WHERE "storeId" = $1 AND status = $2',
        [store.id, 'COMPLETED']
      );
      const totalTransactions = parseInt(totalTransactionsQuery.rows[0].count);
    
      // Get total user count for this store
      const userCountQuery = await client.query(
        'SELECT COUNT(DISTINCT "userId") as count FROM "UserStore" WHERE "storeId" = $1',
        [store.id]
      );
      const totalUsers = parseInt(userCountQuery.rows[0].count);
    
      // Get recent transactions
      const recentTransactionsQuery = await client.query(
        `SELECT t.id, t."createdAt", t."totalAmount", t.status, t."cashierUserId", u.name as "cashierName" 
         FROM "Transaction" t 
         JOIN "User" u ON t."cashierUserId" = u.id 
         WHERE t."storeId" = $1 AND t.status = 'COMPLETED'
         ORDER BY t."createdAt" DESC 
         LIMIT 3`,
        [store.id]
      );
    
      const recentTransactions = recentTransactionsQuery.rows.map((tx) => ({
        id: tx.id,
        date: tx.createdAt.toISOString(),
        amount: tx.totalAmount,
        cashier: tx.cashierName
      }));
    
      // Get monthly data for trends (last 6 months)
      const monthlyDataQuery = await client.query(`
        SELECT 
          TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
          SUM("totalAmount") as total
        FROM 
          "Transaction"
        WHERE 
          "storeId" = $1 
          AND status = 'COMPLETED'
          AND "createdAt" >= NOW() - INTERVAL '6 months'
        GROUP BY 
          DATE_TRUNC('month', "createdAt")
        ORDER BY 
          month ASC
      `, [store.id]);
    
      const monthlyData = monthlyDataQuery.rows.map(row => ({
        month: row.month,
        total: parseInt(row.total) || 0
      }));
    
      // Calculate growth rate from previous month
      let monthlyGrowth = 0;
      if (monthlyData.length >= 2) {
        const currentMonth = monthlyData[monthlyData.length - 1].total;
        const previousMonth = monthlyData[monthlyData.length - 2].total;
        if (previousMonth > 0) {
          monthlyGrowth = Math.round(((currentMonth - previousMonth) / previousMonth) * 100);
        } else if (currentMonth > 0) {
          monthlyGrowth = 100; // If previous month was 0 and current is > 0, it's 100% growth
        }
      }
    
      return {
        id: store.id,
        name: store.name,
        address: store.address || '',
        isActive: store.isActive,
        createdAt: store.createdAt,
        stats: {
          totalProducts,
          totalCategories,
          pendingTransactions,
          dailySales,
          totalSales,
          totalTransactions,
          totalUsers,
          monthlyGrowth,
          monthlyData,
          recentTransactions
        }
      };
    }));

    return NextResponse.json({
      success: true,
      storeStats
    });
  } catch (error) {
    console.error('Error fetching all stores statistics:', error);
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