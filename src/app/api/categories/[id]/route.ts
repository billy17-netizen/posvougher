import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db-utils";
import { CategoryHandler, RouteSegmentContext, CategoryParams } from "@/lib/route-types";

// Define category input type
interface CategoryInput {
  name: string;
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

// GET - Get a category by ID
export const GET: CategoryHandler = async (
  request: NextRequest,
  context: RouteSegmentContext<CategoryParams>
) => {
  try {
    const id = context.params.id;
    const pool = getPool();
    
    // Get store ID
    const storeId = getStoreId(request);
    if (!storeId) {
      return NextResponse.json(
        { error: "No store selected" },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      'SELECT id, name, "createdAt", "updatedAt" FROM "Category" WHERE id = $1 AND "storeId" = $2',
      [id, storeId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Category not found in this store" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ category: result.rows[0] });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
};

// PUT - Update a category
export const PUT: CategoryHandler = async (
  request: NextRequest,
  context: RouteSegmentContext<CategoryParams>
) => {
  try {
    const id = context.params.id;
    const pool = getPool();
    
    // Get store ID
    const storeId = getStoreId(request);
    if (!storeId) {
      return NextResponse.json(
        { error: "No store selected" },
        { status: 400 }
      );
    }
    
    // Check if category exists in this store
    const checkResult = await pool.query(
      'SELECT id FROM "Category" WHERE id = $1 AND "storeId" = $2',
      [id, storeId]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Category not found in this store" },
        { status: 404 }
      );
    }
    
    // Get and validate request body
    const body = await request.json();
    const { name } = body;
    
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }
    
    // Update category
    const now = new Date();
    
    await pool.query(
      'UPDATE "Category" SET name = $1, "updatedAt" = $2 WHERE id = $3 AND "storeId" = $4',
      [name, now, id, storeId]
    );
    
    return NextResponse.json({
      message: "Category updated successfully"
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
};

// DELETE - Delete a category
export const DELETE: CategoryHandler = async (
  request: NextRequest,
  context: RouteSegmentContext<CategoryParams>
) => {
  try {
    const id = context.params.id;
    const pool = getPool();
    
    // Get store ID
    const storeId = getStoreId(request);
    if (!storeId) {
      return NextResponse.json(
        { error: "No store selected" },
        { status: 400 }
      );
    }
    
    // Check if category exists in this store
    const checkResult = await pool.query(
      'SELECT id FROM "Category" WHERE id = $1 AND "storeId" = $2',
      [id, storeId]
    );
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Category not found in this store" },
        { status: 404 }
      );
    }
    
    // Check if category is being used by any products
    const productsResult = await pool.query(
      'SELECT COUNT(*) as count FROM "Product" WHERE "categoryId" = $1 AND "storeId" = $2',
      [id, storeId]
    );
    
    if (parseInt(productsResult.rows[0].count) > 0) {
      return NextResponse.json(
        { error: "Cannot delete category because it is being used by products" },
        { status: 400 }
      );
    }
    
    // Delete category
    await pool.query(
      'DELETE FROM "Category" WHERE id = $1 AND "storeId" = $2',
      [id, storeId]
    );
    
    return NextResponse.json({
      message: "Category deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}; 