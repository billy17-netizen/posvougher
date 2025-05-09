import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { Pool } from 'pg';
import crypto from 'crypto';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, password } = body;
    
    console.log("Direct SQL registration attempt:", { name, username });
    
    // Validate input fields
    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "Nama, username, dan password wajib diisi" },
        { status: 400 }
      );
    }
    
    try {
      // Check if username already exists
      const checkResult = await pool.query(
        'SELECT id FROM "User" WHERE username = $1',
        [username]
      );
      
      if (checkResult.rows.length > 0) {
        return NextResponse.json(
          { error: "Username sudah digunakan" },
          { status: 409 }
        );
      }
      
      // Hash password
      const hashedPassword = await hash(password, 10);
      
      // Generate UUID
      const uuid = crypto.randomUUID();
      
      // Create user with direct SQL
      const result = await pool.query(
        'INSERT INTO "User" (id, name, username, password, role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, username, role, "createdAt", "updatedAt"',
        [
          uuid,
          name,
          username,
          hashedPassword,
          null, // No role initially
          new Date(),
          new Date()
        ]
      );
      
      const user = result.rows[0];
      console.log("User created successfully:", { userId: user.id, username: user.username });
      
      return NextResponse.json(
        { 
          message: "Registrasi berhasil", 
          user
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("Database error during registration:", dbError);
      return NextResponse.json(
        { error: "Terjadi kesalahan database: " + (dbError instanceof Error ? dbError.message : String(dbError)) },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error during simple registration:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mendaftar: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 