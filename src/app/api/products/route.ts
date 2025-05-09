import { NextResponse } from "next/server";
import { getProducts, addProduct } from "@/lib/db-utils";
import { ProductInput } from "@/lib/db-utils";

// GET - Get all products for the current store
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
        { error: "No store selected", products: [] },
        { status: 400 }
      );
    }
    
    console.log('Fetching products for store:', storeId);
    const products = await getProducts(storeId);
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", products: [] },
      { status: 500 }
    );
  }
}

// POST - Add a new product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name, description, price, stock, categoryId, storeId } = body;
    
    if (!name || !description || price === undefined || stock === undefined || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    if (!storeId) {
      return NextResponse.json(
        { error: "Store ID is required" },
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
    
    console.log('Adding product to store:', storeId);
    
    const productData: ProductInput = {
      name,
      description,
      price: Number(price),
      stock: Number(stock),
      image: body.image || null,
      categoryId,
      storeId
    };
    
    const productId = await addProduct(productData);
    
    return NextResponse.json({
      message: "Product added successfully",
      productId
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json(
      { error: "Failed to add product" },
      { status: 500 }
    );
  }
} 