import { NextResponse } from "next/server";

export async function POST() {
  try {
    // In a real application with proper session management, 
    // we would clear session cookies or tokens here
    
    // For this simple implementation, we'll just return a success response
    // Client-side will handle clearing any local storage or state
    
    return NextResponse.json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat logout" },
      { status: 500 }
    );
  }
} 