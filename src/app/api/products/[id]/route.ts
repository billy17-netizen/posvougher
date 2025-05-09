import { NextResponse } from "next/server";
import { getProductById, updateProduct, deleteProduct } from "@/lib/db-utils";
import { ProductInput } from "@/lib/db-utils";

// GET - Get product by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get store ID from query parameters
    const url = new URL(request.url);
    const storeId = url.searchParams.get('storeId');
    
    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }
    
    const product = await getProductById(id, storeId);
    
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();
    
    // Validate storeId
    const { storeId } = body;
    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
        { status: 400 }
      );
    }
    
    // Check if product exists
    const existingProduct = await getProductById(id, storeId);
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Validate required fields
    const { name, description, price, stock, categoryId } = body;
    
    if (!name || !description || price === undefined || stock === undefined || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate numeric fields
    if (isNaN(Number(price)) || isNaN(Number(stock))) {
      return NextResponse.json(
        { error: "Price and stock must be numeric values" },
        { status: 400 }
      );
    }
    
    const productData: ProductInput = {
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      image: body.image || null,
      categoryId,
      storeId
    };
    
    await updateProduct(id, productData);
    
    return NextResponse.json({
      message: "Product updated successfully"
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get store ID from query parameters
    const url = new URL(request.url);
    let storeId = url.searchParams.get('storeId');
    
    if (!storeId) {
      // Try to get storeId from cookies
      const cookies = request.headers.get('cookie');
      let cookieStoreId = null;
      
      if (cookies) {
        const storeIdMatch = cookies.match(/currentStoreId=([^;]+)/);
        if (storeIdMatch) {
          cookieStoreId = storeIdMatch[1];
        }
      }
      
      if (!cookieStoreId) {
        return NextResponse.json(
          { error: "Store ID is required" },
          { status: 400 }
        );
      }
      
      storeId = cookieStoreId;
    }
    
    // Check if product exists
    const existingProduct = await getProductById(id, storeId);
    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    await deleteProduct(id, storeId);
    
    return NextResponse.json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
} 