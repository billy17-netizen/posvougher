import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import prisma from "@/lib/prisma-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, password } = body;
    
    console.log("Registration attempt:", { name, username });
    
    // Validate input fields
    if (!name || !username || !password) {
      console.log("Validation failed: Missing required fields");
      return NextResponse.json(
        { error: "Nama, username, dan password wajib diisi" },
        { status: 400 }
      );
    }
    
    try {
      // Check if username already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          username,
        },
      });
      
      if (existingUser) {
        console.log("Username already exists:", username);
        return NextResponse.json(
          { error: "Username sudah digunakan" },
          { status: 409 }
        );
      }
      
      // Hash password
      const hashedPassword = await hash(password, 10);
      
      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          username,
          password: hashedPassword,
        },
      });
      
      console.log("User created successfully:", { userId: user.id, username: user.username });
      
      // Don't return the password
      const { password: _, ...userWithoutPassword } = user;
      
      return NextResponse.json(
        { 
          message: "Registrasi berhasil", 
          user: userWithoutPassword 
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
    console.error("Error during registration:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mendaftar: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 