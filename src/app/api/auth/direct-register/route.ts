import { NextResponse } from "next/server";
import { hash } from "bcrypt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, username, password } = body;
    
    // Log the request
    console.log("Registration request received:", { name, username });
    
    // Simple validation
    if (!name || !username || !password) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // We're not actually saving to the database, just pretending
    // This helps test if the API route itself is working
    const hashedPassword = await hash(password, 10);
    
    // Create a fake user object
    const fakeUser = {
      id: "fake-id-" + Date.now(),
      name,
      username,
      role: "KASIR",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return NextResponse.json(
      { 
        success: true,
        message: "Registration simulated successfully", 
        user: fakeUser,
        note: "This is a test endpoint that doesn't actually save to the database"
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in direct-register:", error);
    
    return NextResponse.json(
      { 
        success: false,
        error: "Error processing registration",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 