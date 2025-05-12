/**
 * This script migrates Midtrans tokens from StoreSettings to the Transaction table.
 * Run this after adding the midtransToken field to the Transaction table.
 */

const { Pool } = require('pg');
require('dotenv').config();

async function migrateTokens() {
  // Create a new PostgreSQL pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();
  
  try {
    console.log('Starting token migration...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Get all Midtrans tokens from StoreSettings
    const tokenResult = await client.query(
      'SELECT s.key, s.value, s."storeId" FROM "StoreSettings" s ' +
      'WHERE s.key LIKE $1',
      ['midtrans_token_%']
    );
    
    console.log(`Found ${tokenResult.rows.length} tokens to migrate`);
    
    // Update each transaction with its token
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of tokenResult.rows) {
      try {
        // Extract transaction ID from the key (midtrans_token_[transactionId])
        const transactionId = row.key.replace('midtrans_token_', '');
        
        // Update the transaction
        const updateResult = await client.query(
          'UPDATE "Transaction" SET "midtransToken" = $1, "updatedAt" = NOW() ' +
          'WHERE id = $2 AND "storeId" = $3 RETURNING id',
          [row.value, transactionId, row.storeId]
        );
        
        if (updateResult.rows.length > 0) {
          successCount++;
          console.log(`Migrated token for transaction: ${transactionId}`);
        } else {
          errorCount++;
          console.error(`Failed to migrate token for transaction: ${transactionId} - Transaction not found`);
        }
      } catch (err) {
        errorCount++;
        console.error('Error migrating token:', err);
      }
    }
    
    console.log(`Migration complete: ${successCount} succeeded, ${errorCount} failed`);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Migration transaction committed successfully');
    
  } catch (err) {
    // Rollback in case of error
    await client.query('ROLLBACK').catch(() => {});
    console.error('Migration failed:', err);
  } finally {
    // Release the client back to the pool
    client.release();
    
    // Close the pool
    await pool.end();
    
    console.log('Database connection closed');
  }
}

migrateTokens().catch(console.error); 