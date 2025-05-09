import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

// GET /api/auth/session - Get current user session
export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies - fixed to handle Promise
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Not authenticated" 
        },
        { status: 401 }
      );
    }

    // Verify token
    const secret = process.env.JWT_SECRET || "default_secret_replace_in_production";
    const decoded = jwt.verify(token, secret) as { userId: string };

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: "User not found" 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      user 
    });
    
  } catch (error) {
    console.error("Error getting session:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get session" 
      },
      { status: 500 }
    );
  }
} 