import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { Client } from 'pg';
import { randomUUID } from 'crypto';

// GET /api/stores - Get stores for the current user
export async function GET(request: NextRequest) {
  console.log('Stores API called with direct DB access');
  
  // Create database client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');
    
    // Get current user ID for permission check
    const userIdCookie = request.cookies.get('userId');
    const userId = userIdCookie?.value;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if user exists and get role
    const userQuery = await client.query(
      'SELECT * FROM "User" WHERE id = $1 LIMIT 1',
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
      'SELECT us.*, s.name as "storeName", s."isActive" FROM "UserStore" us JOIN "Store" s ON us."storeId" = s.id WHERE us."userId" = $1',
      [userId]
    );
    
    const userStores = userStoresQuery.rows;
    
    // Check if user has SUPER_ADMIN role
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || 
                        userStores.some(store => store.role === 'SUPER_ADMIN');
    
    let stores;
    
    if (isSuperAdmin) {
      // Super admins can see all stores
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
      
      stores = storesQuery.rows;
    } else {
      // Regular users can see their associated stores (including inactive ones)
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
          s.currency,
          us.role as "userRole"
        FROM 
          "Store" s
        JOIN 
          "UserStore" us ON s.id = us."storeId"
        WHERE 
          us."userId" = $1
        ORDER BY 
          s."createdAt" DESC
      `, [userId]);
      
      stores = storesQuery.rows;
    }
    
    // Format dates to be serializable
    const formattedStores = stores.map(store => ({
      ...store,
      createdAt: store.createdAt.toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      stores: formattedStores
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch stores', error: String(error) },
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

// POST /api/stores - Create a new store
export async function POST(request: Request) {
  // Create database client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database for store creation');
    
    // Clone the request so we can read the body multiple times
    const clonedRequest = request.clone();
    
    // Parse the request body first
    const data = await clonedRequest.json();
    console.log('Store creation request data:', data);
    
    // Check for session authentication
    const session = await getServerSession(authOptions);
    let userEmail = session?.user?.email;
    
    // If no session, check for user info in headers
    if (!userEmail) {
      const headers = new Headers(request.headers);
      const authHeader = headers.get('Authorization');
      
      if (authHeader) {
        // Parse authorization header if present
        try {
          const token = authHeader.replace('Bearer ', '');
          const decodedToken = JSON.parse(atob(token.split('.')[1]));
          userEmail = decodedToken.email;
        } catch (error) {
          console.error('Error parsing auth header:', error);
        }
      }
    }
    
    // If still no user, check the request body for username
    if (!userEmail && data.username) {
      userEmail = data.username;
      console.log('Using username from request body:', userEmail);
    }
    
    // If we couldn't find a user identifier, return error
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid user found' },
        { status: 401 }
      );
    }
    
    // Find user by email/username
    const userQuery = await client.query(
      'SELECT * FROM "User" WHERE username = $1 LIMIT 1',
      [userEmail]
    );
    
    if (userQuery.rows.length === 0) {
      return NextResponse.json(
        { error: `User not found with username: ${userEmail}` },
        { status: 404 }
      );
    }
    
    const user = userQuery.rows[0];
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Store name is required' },
        { status: 400 }
      );
    }
    
    // Declare store variable outside try-catch block
    let store: any;
    
    // Generate UUID for the store using Node.js crypto
    const storeUuid = randomUUID();
    
    try {
      // Create the store using the UUID - set isActive to false by default
      const storeResult = await client.query(
        `INSERT INTO "Store" (
          id, name, address, phone, email, "taxRate", currency, "isActive", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
        [
          storeUuid,
          data.name, 
          data.address || '', 
          data.phone || '', 
          data.email || '', 
          parseFloat(data.taxRate || '11'), 
          data.currency || 'IDR',
          false // Set isActive to false by default
        ]
      );
      
      store = storeResult.rows[0];
      console.log('Store created with UUID:', store.id, store.name, 'Active:', store.isActive);
    } catch (error) {
      console.error('Error creating store:', error);
      return NextResponse.json(
        { error: 'Failed to create store', details: String(error) },
        { status: 500 }
      );
    }
    
    // Also update the user's role to ADMIN if they don't have a role yet
    if (user.role === null) {
      await client.query(
        'UPDATE "User" SET role = $1 WHERE id = $2',
        ['ADMIN', user.id]
      );
      console.log('User role set to ADMIN:', user.id);
    }
    
    // Associate store with user (as Administrator) with UUID
    const userStoreUuid = randomUUID();
    await client.query(
      `INSERT INTO "UserStore" (
        id, "userId", "storeId", role, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [userStoreUuid, user.id, store.id, 'ADMIN']
    );
    
    console.log('Store associated with user:', user.id);
    
    // Create default categories for the store with UUIDs
    await client.query(
      `INSERT INTO "Category" (id, name, "storeId", "createdAt", "updatedAt")
      VALUES 
        ($1, $2, $3, NOW(), NOW()),
        ($4, $5, $6, NOW(), NOW()),
        ($7, $8, $9, NOW(), NOW())`,
      [
        randomUUID(), 'Makanan', store.id, 
        randomUUID(), 'Minuman', store.id, 
        randomUUID(), 'Lainnya', store.id
      ]
    );
    
    // Create default store settings
    const settings = [
      { 
        storeId: store.id,
        key: 'receiptHeader',
        value: `${store.name}`,
        category: 'receipt'
      },
      { 
        storeId: store.id,
        key: 'receiptFooter',
        value: 'Barang yang sudah dibeli tidak dapat dikembalikan',
        category: 'receipt'
      },
      { 
        storeId: store.id,
        key: 'theme',
        value: 'blue',
        category: 'display'
      },
      {
        storeId: store.id,
        key: 'fontSize',
        value: 'medium',
        category: 'display'
      },
      {
        storeId: store.id,
        key: 'language',
        value: 'id',
        category: 'display'
      },
      {
        storeId: store.id,
        key: 'storeName',
        value: store.name,
        category: 'general'
      },
      {
        storeId: store.id,
        key: 'address',
        value: store.address || '',
        category: 'general'
      },
      {
        storeId: store.id,
        key: 'phone',
        value: store.phone || '',
        category: 'general'
      }
    ];
    
    // Insert settings with UUIDs
    for (const setting of settings) {
      await client.query(
        `INSERT INTO "StoreSettings" (
          id, "storeId", key, value, category, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [randomUUID(), setting.storeId, setting.key, setting.value, setting.category]
      );
    }
    
    // Set this store as user's default if they don't have one yet
    if (!user.defaultStoreId) {
      await client.query(
        'UPDATE "User" SET "defaultStoreId" = $1 WHERE id = $2',
        [store.id, user.id]
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Store created successfully. Please wait for activation by an administrator.',
      store: {
        id: store.id,
        name: store.name,
        isActive: store.isActive
      }
    });
    
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json(
      { error: 'Failed to create store', details: String(error) },
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