import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Create database client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database for toggle store status');
    
    const storeId = params.id;
    const { isActive } = await request.json();
    
    // Get current user ID for permission check
    const userIdCookie = request.cookies.get('userId');
    const userId = userIdCookie?.value;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user is a super admin
    const userQuery = await client.query(
      `SELECT * FROM "User" WHERE id = $1 LIMIT 1`,
      [userId]
    );
    
    if (userQuery.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = userQuery.rows[0];
    
    // Get user's store roles
    const userStoresQuery = await client.query(
      `SELECT * FROM "UserStore" WHERE "userId" = $1`,
      [userId]
    );
    
    const userStores = userStoresQuery.rows;
    
    // Check if user has SUPER_ADMIN role
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || 
                        userStores.some(store => store.role === 'SUPER_ADMIN');
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized access' },
        { status: 403 }
      );
    }
    
    // Check if store exists
    const storeQuery = await client.query(
      `SELECT * FROM "Store" WHERE id = $1 LIMIT 1`,
      [storeId]
    );
    
    if (storeQuery.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Store not found' },
        { status: 404 }
      );
    }
    
    // Update store status
    const updateQuery = await client.query(
      `UPDATE "Store" SET "isActive" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING *`,
      [isActive, storeId]
    );
    
    const updatedStore = updateQuery.rows[0];
    
    return NextResponse.json({
      success: true,
      store: updatedStore
    });
  } catch (error) {
    console.error('Error updating store status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update store status', error: String(error) },
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