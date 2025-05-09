import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db-utils";
import { hash } from 'bcrypt';

interface Params {
  params: {
    id: string;
  };
}

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

// GET /api/users/[id] - Get a single user
export async function GET(request: NextRequest, { params }: Params) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const { id } = params;
    
    // Get storeId from request
    const storeId = getStoreId(request);
    
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "No store selected" },
        { status: 400 }
      );
    }
    
    // Verify user exists in this store
    const userStoreQuery = await client.query(
      'SELECT * FROM "UserStore" WHERE "userId" = $1 AND "storeId" = $2 LIMIT 1',
      [id, storeId]
    );
    
    if (userStoreQuery.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found in this store" },
        { status: 404 }
      );
    }

    const userQuery = await client.query(
      'SELECT id, name, username, role, "createdAt" FROM "User" WHERE id = $1 LIMIT 1',
      [id]
    );

    if (userQuery.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: userQuery.rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(request: NextRequest, { params }: Params) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const { id } = params;
    const { name, username, password, role } = await request.json();
    
    // Get storeId from request
    const storeId = getStoreId(request);
    
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "No store selected" },
        { status: 400 }
      );
    }
    
    await client.query('BEGIN');
    
    // Verify user exists in this store
    const userStoreQuery = await client.query(
      'SELECT * FROM "UserStore" WHERE "userId" = $1 AND "storeId" = $2 LIMIT 1',
      [id, storeId]
    );
    
    if (userStoreQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: "User not found in this store" },
        { status: 404 }
      );
    }

    // Check if user exists
    const existingUserQuery = await client.query(
      'SELECT id, name, username, role FROM "User" WHERE id = $1 LIMIT 1',
      [id]
    );

    if (existingUserQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    const existingUser = existingUserQuery.rows[0];

    // Check if username is already taken (by another user)
    if (username && username !== existingUser.username) {
      const userWithSameUsernameQuery = await client.query(
        'SELECT id FROM "User" WHERE username = $1 LIMIT 1',
        [username]
      );

      if (userWithSameUsernameQuery.rows.length > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: "Username already exists" },
          { status: 400 }
        );
      }
    }

    // Update user
    let updateUserQuery = 'UPDATE "User" SET ';
    const queryParams = [];
    const queryParts = [];
    let paramCounter = 1;

    if (name) {
      queryParts.push(`name = $${paramCounter++}`);
      queryParams.push(name);
    }
    
    if (username) {
      queryParts.push(`username = $${paramCounter++}`);
      queryParams.push(username);
    }
    
    if (password) {
      const hashedPassword = await hash(password, 10);
      queryParts.push(`password = $${paramCounter++}`);
      queryParams.push(hashedPassword);
    }
    
    if (role) {
      queryParts.push(`role = $${paramCounter++}`);
      queryParams.push(role);
    }
    
    // Add updatedAt
    queryParts.push(`"updatedAt" = NOW()`);
    
    // Add WHERE clause
    updateUserQuery += queryParts.join(', ') + ` WHERE id = $${paramCounter++}`;
    queryParams.push(id);
    
    if (queryParts.length > 1) { // Check if there's more than just updatedAt
      await client.query(updateUserQuery, queryParams);
    }
    
    // Always update the user's role in the UserStore relation if provided
    // This is critical because the UserStore role is what's actually used for permissions
    if (role) {
      console.log(`Updating role for user ${id} in store ${storeId} to ${role}`);
      await client.query(
        'UPDATE "UserStore" SET role = $1, "updatedAt" = NOW() WHERE "userId" = $2 AND "storeId" = $3',
        [role, id, storeId]
      );
    }
    
    // Get updated user data
    const updatedUserQuery = await client.query(
      'SELECT id, name, username, role, "createdAt" FROM "User" WHERE id = $1 LIMIT 1',
      [id]
    );
    
    const updatedUser = updatedUserQuery.rows[0];
    
    await client.query('COMMIT');

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE /api/users/[id] - Delete a user from store (not globally)
export async function DELETE(request: NextRequest, { params }: Params) {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const { id } = params;
    
    // Get storeId from request
    const storeId = getStoreId(request);
    
    if (!storeId) {
      return NextResponse.json(
        { success: false, error: "No store selected" },
        { status: 400 }
      );
    }
    
    await client.query('BEGIN');
    
    // Verify the user exists in this store
    const userStoreQuery = await client.query(
      'SELECT * FROM "UserStore" WHERE "userId" = $1 AND "storeId" = $2 LIMIT 1',
      [id, storeId]
    );
    
    if (userStoreQuery.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { success: false, error: "User not found in this store" },
        { status: 404 }
      );
    }
    
    // Delete the user from this store (UserStore relation)
    await client.query(
      'DELETE FROM "UserStore" WHERE "userId" = $1 AND "storeId" = $2',
      [id, storeId]
    );
    
    // Check if user is still associated with any other store
    const otherStoresQuery = await client.query(
      'SELECT COUNT(*) as count FROM "UserStore" WHERE "userId" = $1',
      [id]
    );
    
    const otherStoresCount = parseInt(otherStoresQuery.rows[0].count);
    
    // If user isn't associated with any other store, consider deleting the user entirely
    // For now, we'll keep the user record for historical data
    
    await client.query('COMMIT');
    
    return NextResponse.json({ 
      success: true, 
      message: "User removed from store"
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
} 