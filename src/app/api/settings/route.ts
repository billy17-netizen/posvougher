import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Client } from 'pg';

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

// GET /api/settings - Get all settings or store-specific settings
export async function GET(request: Request) {
  // Create database client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Connect to database
    await client.connect();
    console.log('Connected to database for settings');
    
    // Get store ID
    const storeId = getStoreId(request);
    
    if (storeId) {
      // Get store-specific settings
      const settingsQuery = await client.query(
        'SELECT * FROM "StoreSettings" WHERE "storeId" = $1',
        [storeId]
      );
      
      return NextResponse.json({ 
        success: true, 
        settings: settingsQuery.rows 
      });
    } else {
      // Get global settings
      const settingsQuery = await client.query(
        'SELECT * FROM "Settings"'
      );
      
      return NextResponse.json({ 
        success: true, 
        settings: settingsQuery.rows 
      });
    }
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch settings',
      details: String(error)
    }, { status: 500 });
  } finally {
    // Close the database connection
    try {
      await client.end();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// POST /api/settings - Save settings (either global or store-specific)
export async function POST(request: Request) {
  // Create database client
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to database for saving settings');
    
    // Parse request data
    const requestData = await request.json();
    let { settings, storeId } = requestData;
    
    console.log('Received settings request:', { storeId, settingsKeys: Object.keys(settings) });
    
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid settings data' 
      }, { status: 400 });
    }
    
    // If storeId not provided in the request body, try to get it from query/cookies
    if (!storeId) {
      storeId = getStoreId(request);
    }
    
    if (!storeId) {
      return NextResponse.json({
        success: false,
        error: "Store ID is required"
      }, { status: 400 });
    }
    
    // Verify the store exists
    const storeQuery = await client.query(
      'SELECT id FROM "Store" WHERE id = $1 LIMIT 1',
      [storeId]
    );
    
    if (storeQuery.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Store not found"
      }, { status: 404 });
    }
    
    // Save store-specific settings
    const results = [];
    
    for (const [key, value] of Object.entries(settings)) {
      // Skip null or undefined values
      if (value === null || value === undefined) {
        continue;
      }
      
      const category = getCategoryForKey(key);
      
      try {
        // Check if setting exists
        const existingQuery = await client.query(
          'SELECT id FROM "StoreSettings" WHERE "storeId" = $1 AND key = $2 LIMIT 1',
          [storeId, key]
        );
        
        let result;
        
        if (existingQuery.rows.length > 0) {
          // Update existing setting
          result = await client.query(
            'UPDATE "StoreSettings" SET value = $1, category = $2, "updatedAt" = NOW() WHERE "storeId" = $3 AND key = $4 RETURNING *',
            [String(value), category, storeId, key]
          );
        } else {
          // Create new setting
          result = await client.query(
            'INSERT INTO "StoreSettings" ("storeId", key, value, category, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
            [storeId, key, String(value), category]
          );
        }
        
        results.push(result.rows[0]);
      } catch (err) {
        console.error(`Error saving setting ${key}:`, err);
        // Continue with other settings even if one fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Settings saved successfully',
      settings: results 
    });
    
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to save settings',
      details: String(error)
    }, { status: 500 });
  } finally {
    // Close the database connection
    try {
      await client.end();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Helper function to determine the category for a setting
function getCategoryForKey(key: string): string {
  if (['storeName', 'address', 'phone', 'email', 'taxRate'].includes(key)) {
    return 'general';
  } else if (['language', 'currency', 'theme', 'fontSize'].includes(key)) {
    return 'display';
  } else if (['receiptHeader', 'receiptFooter'].includes(key)) {
    return 'receipt';
  } else if (['notifyLowStock', 'notifyNewOrder'].includes(key)) {
    return 'notification';
  } else if (['allowCreditCard', 'allowQRIS', 'allowDebit'].includes(key)) {
    return 'payment';
  }
  
  return 'other';
} 