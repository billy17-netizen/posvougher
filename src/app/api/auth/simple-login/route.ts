import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  console.log('Login API called with direct DB access');
  
  // Create database client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database');
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Error parsing JSON:", parseError);
      return NextResponse.json(
        { message: 'Invalid JSON request body' },
        { status: 400 }
      );
    }
    
    const { username, password, storeId } = body;
    console.log("Login attempt for username:", username);

    // Basic validation
    if (!username || !password) {
      return NextResponse.json(
        { message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user with this username
    const userQuery = await client.query(
      'SELECT * FROM "User" WHERE username = $1 LIMIT 1',
      [username]
    );
    
    if (userQuery.rows.length === 0) {
      console.log(`Login failed: User not found for username ${username}`);
      return NextResponse.json(
        { message: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    const user = userQuery.rows[0];
    console.log(`User found: ${user.id}, attempting password verification`);
    
    // Verify password using bcrypt
    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log(`Login failed: Invalid password for username ${username}`);
        return NextResponse.json(
          { message: 'Invalid username or password' },
          { status: 401 }
        );
      }
    } catch (bcryptError) {
      console.error("Bcrypt comparison error:", bcryptError);
      return NextResponse.json(
        { message: 'Authentication error' },
        { status: 500 }
      );
    }

    console.log(`Password verified successfully for ${username}`);

    // Get user's stores with store details
    const userStoresQuery = await client.query(
      `SELECT us.*, s.name as "storeName", s."isActive" 
       FROM "UserStore" us 
       JOIN "Store" s ON us."storeId" = s.id 
       WHERE us."userId" = $1`,
      [user.id]
    );
    
    const userStores = userStoresQuery.rows;
    console.log(`Found ${userStores.length} stores for user`);
    
    // If storeId is provided, verify that user belongs to this store
    if (storeId) {
      console.log(`Checking if user ${user.id} has access to store ${storeId}`);
      
      // Find if the user has a relationship with this store
      const storeRelationship = userStores.find(
        userStore => userStore.storeId === storeId
      );
      
      if (!storeRelationship) {
        console.log(`Store access denied: User ${username} does not have access to store ${storeId}`);
        return NextResponse.json(
          { message: 'User does not have access to this store' },
          { status: 403 }
        );
      }
      
      // Check if store is active
      if (!storeRelationship.isActive && user.role !== 'SUPER_ADMIN' && storeRelationship.role !== 'SUPER_ADMIN') {
        console.log(`Store access denied: Store ${storeId} is inactive`);
        return NextResponse.json(
          { message: 'This store is currently inactive' },
          { status: 403 }
        );
      }
      
      console.log(`User has access to store ${storeId} with role: ${storeRelationship.role}`);
    }

    // Determine which store to use (provided storeId, defaultStoreId, or first available)
    const userStoreId = storeId || user.defaultStoreId || (userStores.length > 0 ? userStores[0].storeId : null);
    
    // If we have a storeId but it wasn't provided in the request, verify access
    if (!storeId && userStoreId) {
      const hasAccessToStore = userStores.some(store => store.storeId === userStoreId);
      if (!hasAccessToStore) {
        console.log(`Store access denied: User ${username} does not have access to determined store ${userStoreId}`);
        return NextResponse.json(
          { message: 'User does not have access to this store' },
          { status: 403 }
        );
      }
      
      // Check if the determined store is active
      const userStore = userStores.find(store => store.storeId === userStoreId);
      if (userStore && !userStore.isActive && user.role !== 'SUPER_ADMIN' && userStore.role !== 'SUPER_ADMIN') {
        console.log(`Store ${userStoreId} is inactive, but allowing login`);
        // Note that the store is inactive but don't block login
        // User will see this store in their list but won't be able to access it
      }
    }

    // Prepare user data for client (excluding sensitive information)
    const safeUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      // Use the determined storeId
      storeId: userStoreId,
      defaultStoreId: user.defaultStoreId,
      // Include stores info for debugging and UI purposes
      stores: userStores.map(store => ({
        id: store.storeId,
        name: store.storeName,
        role: store.role
      }))
    };

    // Special handling for SUPER_ADMIN
    // Super admins can access everything and don't need store-specific validation
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || 
                         userStores.some(store => store.role === 'SUPER_ADMIN');

    if (isSuperAdmin) {
      console.log(`Super admin login: ${username}`);
      // No need to validate specific store access for super admins
    }

    console.log(`Login successful for ${username}`);
    return NextResponse.json({
      message: 'Login successful',
      user: safeUser,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'An error occurred during login', error: String(error) },
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