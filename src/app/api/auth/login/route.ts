import { NextResponse } from "next/server";
import { compare } from "bcrypt";
import db from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input fields
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await db.user.findUnique({
      where: {
        username,
      },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    // Don't return the password
    const { password: _, ...userWithoutPassword } = user;

    // In a real application, you'd set a cookie or session here
    // For now, we'll just return the user
    return NextResponse.json(
      {
        message: "Login berhasil",
        user: userWithoutPassword
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat login" },
      { status: 500 }
    );
  }
} 