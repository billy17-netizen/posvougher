import { NextResponse } from "next/server";
import { getCategories, getPool, getProductCountsByCategory } from "@/lib/db-utils";

// Define category input type
interface CategoryInput {
  name: string;
  storeId: string;
}

// GET - Get all categories for the current store
export async function GET(request: Request) {
  try {
    // Get store ID from query parameters or cookies
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
    
    // If still no storeId, return error
    if (!storeId) {
      return NextResponse.json(
        { error: "No store selected", categories: [] },
        { status: 400 }
      );
    }
    
    console.log('Fetching categories for store:', storeId);
    const categoriesWithCounts = await getProductCountsByCategory(storeId);
    return NextResponse.json({ categories: categoriesWithCounts });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories", categories: [] },
      { status: 500 }
    );
  }
}

// POST - Add a new category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, storeId } = body;
    
    // Validate name
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }
    
    // Validate storeId
    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }
    
    console.log('Adding category to store:', storeId);
    
    // Add category to database
    const pool = getPool();
    const now = new Date();
    
    // Generate a random UUID for the category ID and include storeId
    const result = await pool.query(
      'INSERT INTO "Category" (id, name, "storeId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING id, name',
      [name, storeId, now, now]
    );
    
    return NextResponse.json({
      message: "Category added successfully",
      category: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding category:", error);
    return NextResponse.json(
      { error: "Failed to add category: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 