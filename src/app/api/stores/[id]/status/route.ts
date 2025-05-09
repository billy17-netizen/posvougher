import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

export async function GET(
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
    console.log('Connected to database for store status check');
    
    const storeId = params.id;
    
    // Get store
    const storeQuery = await client.query(
      'SELECT id, name, "isActive" FROM "Store" WHERE id = $1 LIMIT 1',
      [storeId]
    );
    
    if (storeQuery.rows.length === 0) {
      return NextResponse.json(
        { message: 'Store not found' },
        { status: 404 }
      );
    }
    
    const store = storeQuery.rows[0];
    
    return NextResponse.json(store);
  } catch (error) {
    console.error('Error checking store status:', error);
    return NextResponse.json(
      { message: 'Error checking store status', error: String(error) },
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