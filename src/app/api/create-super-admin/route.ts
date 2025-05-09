import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// Function to generate UUID v4 in JavaScript
function generateUUID() {
  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  console.log('Create Super Admin API called (direct DB version)');

  // Create a database client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Parse request body
    const body = await request.json();
    const { username, password, name } = body;
    
    console.log('Request body received', { username, name });
    
    if (!username || !password || !name) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username, password and name are required' 
      }, { status: 400 });
    }
    
    // Connect to the database
    await client.connect();
    console.log('Connected to database');
    
    // Check if user exists
    console.log('Checking if user exists...');
    const existingUserQuery = await client.query(
      'SELECT * FROM "User" WHERE username = $1 LIMIT 1',
      [username]
    );
    
    const existingUser = existingUserQuery.rows[0];
    
    if (existingUser) {
      console.log('User exists, updating role');
      // Update existing user
      const updatedUserQuery = await client.query(
        'UPDATE "User" SET role = $1 WHERE id = $2 RETURNING id, username, name, role',
        ['SUPER_ADMIN', existingUser.id]
      );
      
      const updatedUser = updatedUserQuery.rows[0];
      
      return NextResponse.json({ 
        success: true,
        message: 'User already exists. Updated to SUPER_ADMIN role.',
        user: { 
          id: updatedUser.id, 
          username: updatedUser.username,
          name: updatedUser.name,
          role: updatedUser.role
        }
      });
    }
    
    // Create password hash
    console.log('Creating password hash');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate UUID for new user using JavaScript
    const newUserId = generateUUID();
    console.log('Generated new user ID:', newUserId);
    
    // Create new user
    console.log('Creating new user');
    const newUserQuery = await client.query(
      'INSERT INTO "User" (id, username, password, name, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, username, name, role',
      [newUserId, username, hashedPassword, name, 'SUPER_ADMIN']
    );
    
    const newUser = newUserQuery.rows[0];
    console.log('User created successfully', { id: newUser.id, username: newUser.username });
    
    return NextResponse.json({ 
      success: true,
      message: 'Super admin created successfully',
      user: { 
        id: newUser.id, 
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    });
    
  } catch (error) {
    console.error('Error in create-super-admin:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create super admin',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  } finally {
    // Close the database connection
    try {
      await client.end();
    } catch (err) {
      console.error('Error closing DB connection:', err);
    }
  }
} 