import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db-utils";
import { hash } from 'bcrypt';

// Helper function to extract storeId from request
const getStoreId = (request: Request): string | null => {
  // Try from query parameters
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
  
  return storeId;
};

// GET /api/users - Get all users for a specific store
export async function GET(request: NextRequest) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Get storeId from request
    const storeId = getStoreId(request);
    
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "No store selected" },
        { status: 400 }
      );
    }
    
    // Get role filter from query params
    const url = new URL(request.url);
    const roleFilter = url.searchParams.get('role');
    
    // Verify the store exists
    const storeQuery = await client.query(
      'SELECT id FROM "Store" WHERE id = $1 LIMIT 1',
      [storeId]
    );
    
    if (storeQuery.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Store not found"
      }, { status: 404 });
    }
    
    // Build the query with role filter if provided
    let query = `
      SELECT us."userId", us."storeId", us.role as "storeRole", 
             u.id, u.name, u.username, u.role, u."createdAt"
      FROM "UserStore" us
      JOIN "User" u ON us."userId" = u.id
      WHERE us."storeId" = $1
    `;
    
    const queryParams = [storeId];
    
    // Add role filter if provided and valid
    if (roleFilter && ['ADMIN', 'KASIR', 'OWNER'].includes(roleFilter)) {
      query += ' AND us.role = $2';
      queryParams.push(roleFilter);
    }
    
    // Order by created date
    query += ' ORDER BY u."createdAt" DESC';
    
    // Execute the query
    const result = await client.query(query, queryParams);
    
    // Format the results to match the expected structure
    const users = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      username: row.username,
      role: row.role,
      createdAt: row.createdAt,
      storeRole: row.storeRole
    }));

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST /api/users - Create a new user for a specific store
export async function POST(request: NextRequest) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // Parse request body
    const body = await request.json();
    const { name, username, password, role } = body;
    const userRole = role || "KASIR"; // Default to KASIR if no role provided

    console.log("Creating user with data:", { name, username, role: userRole });

    // Validate input
    if (!name || !username || !password) {
      console.log("Missing required fields:", { name: !!name, username: !!username, password: !!password });
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get storeId from request
    const storeId = getStoreId(request);
    
    if (!storeId) {
      console.log("No store ID found in request");
      return NextResponse.json(
        { success: false, error: "No store selected" },
        { status: 400 }
      );
    }
    
    console.log(`Using store ID: ${storeId}`);
    
    // Start a transaction for database operations
    await client.query('BEGIN');
    
    // Verify the store exists
    const storeQuery = await client.query(
      'SELECT id FROM "Store" WHERE id = $1 LIMIT 1',
      [storeId]
    );
    
    if (storeQuery.rows.length === 0) {
      console.log(`Store not found: ${storeId}`);
      await client.query('ROLLBACK');
      return NextResponse.json({
        success: false,
        error: "Store not found"
      }, { status: 404 });
    }

    // Check if username already exists
    const existingUserQuery = await client.query(
      'SELECT id, name, username, role, "createdAt" FROM "User" WHERE username = $1 LIMIT 1',
      [username]
    );
    
    const existingUser = existingUserQuery.rows[0];

    // If user exists, check if they're already associated with this store
    if (existingUser) {
      console.log(`User with username ${username} already exists with ID ${existingUser.id}`);
      
      const existingUserStoreQuery = await client.query(
        'SELECT * FROM "UserStore" WHERE "userId" = $1 AND "storeId" = $2 LIMIT 1',
        [existingUser.id, storeId]
      );
      
      if (existingUserStoreQuery.rows.length > 0) {
        console.log(`User ${existingUser.id} already exists in store ${storeId}`);
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: "User already exists in this store" },
          { status: 400 }
        );
      }
      
      // Update the existing user's role if needed
      if (userRole && (!existingUser.role || existingUser.role !== userRole)) {
        await client.query(
          'UPDATE "User" SET role = $1, "updatedAt" = NOW() WHERE id = $2',
          [userRole, existingUser.id]
        );
        console.log(`Updated existing user ${existingUser.id} role to ${userRole}`);
      }
      
      try {
        // If user exists but is not in this store, associate them with this store
        await client.query(
          'INSERT INTO "UserStore" (id, "userId", "storeId", role, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())',
          [existingUser.id, storeId, userRole]
        );
        console.log(`Added existing user ${existingUser.id} to store ${storeId} with role ${userRole}`);
        
        await client.query('COMMIT');
        
        // Return the existing user
        return NextResponse.json({ 
          success: true, 
          user: {
            id: existingUser.id,
            name: existingUser.name,
            username: existingUser.username,
            role: existingUser.role,
            createdAt: existingUser.createdAt
          },
          message: "Existing user added to store" 
        });
      } catch (err) {
        console.error("Error adding existing user to store:", err);
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: "Failed to add existing user to store" },
          { status: 500 }
        );
      }
    }

    try {
      // Hash the password
      const hashedPassword = await hash(password, 10);
      console.log("Password hashed successfully");

      // Create the new user with the role
      const newUserResult = await client.query(
        'INSERT INTO "User" (id, name, username, password, role, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW()) RETURNING id, name, username, role, "createdAt"',
        [name, username, hashedPassword, userRole]
      );
      
      const newUser = newUserResult.rows[0];
      console.log(`Created new user ${newUser.id} with role ${userRole}`);

      // Associate user with the store
      await client.query(
        'INSERT INTO "UserStore" (id, "userId", "storeId", role, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())',
        [newUser.id, storeId, userRole]
      );
      console.log(`Added new user ${newUser.id} to store ${storeId} with role ${userRole}`);

      await client.query('COMMIT');
      
      // Return user without password
      return NextResponse.json({ 
        success: true, 
        user: {
          id: newUser.id,
          name: newUser.name,
          username: newUser.username,
          role: newUser.role,
          createdAt: newUser.createdAt
        }
      });
    } catch (err) {
      console.error("Error creating new user:", err);
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: `Failed to create user: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      );
    }
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error in user creation process:", error);
    return NextResponse.json(
      { success: false, error: `Failed to create user: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 