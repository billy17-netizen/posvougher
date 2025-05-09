import { Pool } from 'pg';

// Define a type for product rows
interface ProductRow {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image: string;
  categoryId: string;
  category_name: string;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define type for product input
export interface ProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  image?: string;
  categoryId: string;
  storeId: string;
}

// Define a type for category count row
interface CategoryCountRow {
  id: string;
  name: string;
  product_count: string;
}

// Create a global var to hold the connection pool
let globalPool: any;

export function getPool(): any {
  if (!globalPool) {
    globalPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Add error handler
    globalPool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return globalPool;
}

// Helper function to get a user by ID
export async function getUserById(id: string) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, name, username, role, "createdAt", "updatedAt" FROM "User" WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

// Helper function to get a user by username
export async function getUserByUsername(username: string) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, name, username, password, role, "createdAt", "updatedAt" FROM "User" WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

// Helper function for getting categories, updated to filter by storeId
export async function getCategories(storeId: string) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, name, "storeId", "createdAt", "updatedAt" FROM "Category" WHERE "storeId" = $1 ORDER BY name',
      [storeId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
}

// Helper function for products with category, updated to filter by storeId
export async function getProducts(storeId: string) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT p.id, p.name, p.description, p.price, p.stock, p.image, p."categoryId", p."storeId", c.name as category_name, p."createdAt", p."updatedAt" FROM "Product" p JOIN "Category" c ON p."categoryId" = c.id WHERE p."storeId" = $1 ORDER BY p.name',
      [storeId]
    );
    
    // Transform the results to include category as an object
    return result.rows.map((row: ProductRow) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      stock: row.stock,
      image: row.image,
      storeId: row.storeId,
      category: {
        id: row.categoryId,
        name: row.category_name
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
}

// Helper function for products by category, updated to filter by storeId
export async function getProductsByCategory(categoryId: string, storeId: string) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, name, description, price, stock, image, "categoryId", "storeId", "createdAt", "updatedAt" FROM "Product" WHERE "categoryId" = $1 AND "storeId" = $2 ORDER BY name',
      [categoryId, storeId]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting products by category:', error);
    throw error;
  }
}

// Helper function to get a product by ID, updated to also check storeId
export async function getProductById(id: string, storeId: string) {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT p.id, p.name, p.description, p.price, p.stock, p.image, p."categoryId", p."storeId", c.name as category_name, p."createdAt", p."updatedAt" FROM "Product" p JOIN "Category" c ON p."categoryId" = c.id WHERE p.id = $1 AND p."storeId" = $2',
      [id, storeId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const product = result.rows[0];
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      image: product.image,
      storeId: product.storeId,
      category: {
        id: product.categoryId,
        name: product.category_name
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    };
  } catch (error) {
    console.error('Error getting product by ID:', error);
    throw error;
  }
}

// Helper function to add a new product, updated to include storeId
export async function addProduct(productData: ProductInput) {
  try {
    const pool = getPool();
    const now = new Date();
    
    const result = await pool.query(
      'INSERT INTO "Product" (id, name, description, price, stock, image, "categoryId", "storeId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [
        productData.name,
        productData.description,
        productData.price,
        productData.stock,
        productData.image || null,
        productData.categoryId,
        productData.storeId,
        now,
        now
      ]
    );
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

// Helper function to update a product, updated to check storeId
export async function updateProduct(id: string, productData: ProductInput) {
  try {
    const pool = getPool();
    const now = new Date();
    
    await pool.query(
      'UPDATE "Product" SET name = $1, description = $2, price = $3, stock = $4, image = $5, "categoryId" = $6, "updatedAt" = $7 WHERE id = $8 AND "storeId" = $9',
      [
        productData.name,
        productData.description,
        productData.price,
        productData.stock,
        productData.image || null,
        productData.categoryId,
        now,
        id,
        productData.storeId
      ]
    );
    
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
}

// Helper function to delete a product, updated to check storeId
export async function deleteProduct(id: string, storeId: string) {
  try {
    const pool = getPool();
    
    await pool.query(
      'DELETE FROM "Product" WHERE id = $1 AND "storeId" = $2',
      [id, storeId]
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
}

// Helper function to get product counts by category, updated to filter by storeId
export async function getProductCountsByCategory(storeId: string) {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT c.id, c.name, COUNT(p.id)::text as product_count 
       FROM "Category" c 
       LEFT JOIN "Product" p ON c.id = p."categoryId" 
       WHERE c."storeId" = $1
       GROUP BY c.id, c.name 
       ORDER BY c.name`,
      [storeId]
    );
    
    return result.rows.map((row: CategoryCountRow) => ({
      id: row.id,
      name: row.name,
      productCount: parseInt(row.product_count)
    }));
  } catch (error) {
    console.error('Error getting product counts by category:', error);
    throw error;
  }
} 