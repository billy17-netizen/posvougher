const { Client } = require('pg');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();

async function resetAndSeedDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting database reset and seeding...');
    
    await client.connect();
    console.log('Connected to database');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Delete all data
    console.log('Cleaning existing data...');
    await client.query('DELETE FROM "TransactionItem"');
    await client.query('DELETE FROM "Transaction"');
    await client.query('DELETE FROM "Product"');
    await client.query('DELETE FROM "Category"');
    await client.query('DELETE FROM "StoreSettings"');
    await client.query('DELETE FROM "UserStore"');
    await client.query('DELETE FROM "Store"');
    await client.query('DELETE FROM "Settings"');
    await client.query('DELETE FROM "User"');
    console.log('Database cleaned.');
    
    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminResult = await client.query(
      'INSERT INTO "User" (id, name, username, password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [
        crypto.randomUUID(),
        'Administrator',
        'admin',
        hashedPassword,
        new Date(),
        new Date()
      ]
    );
    const adminId = adminResult.rows[0].id;
    console.log(`Admin user created with ID: ${adminId}`);
    
    // Create demo store
    console.log('Creating demo store...');
    const storeResult = await client.query(
      'INSERT INTO "Store" (id, name, address, phone, email, "taxRate", currency, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [
        crypto.randomUUID(),
        'Toko Demo',
        'Jl. Contoh No. 123',
        '08123456789',
        'demo@example.com',
        11.0,
        'IDR',
        new Date(),
        new Date()
      ]
    );
    const storeId = storeResult.rows[0].id;
    console.log(`Demo store created with ID: ${storeId}`);
    
    // Associate admin with store
    console.log('Associating admin with store...');
    await client.query(
      'INSERT INTO "UserStore" (id, "userId", "storeId", role, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
      [
        crypto.randomUUID(),
        adminId,
        storeId,
        'ADMIN',
        new Date(),
        new Date()
      ]
    );
    
    // Create default categories
    console.log('Creating demo categories...');
    const category1Result = await client.query(
      'INSERT INTO "Category" (id, name, "storeId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [crypto.randomUUID(), 'Makanan', storeId, new Date(), new Date()]
    );
    const category2Result = await client.query(
      'INSERT INTO "Category" (id, name, "storeId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [crypto.randomUUID(), 'Minuman', storeId, new Date(), new Date()]
    );
    const category3Result = await client.query(
      'INSERT INTO "Category" (id, name, "storeId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [crypto.randomUUID(), 'Snack', storeId, new Date(), new Date()]
    );
    
    // Create store settings
    console.log('Creating store settings...');
    await client.query(
      'INSERT INTO "StoreSettings" (id, "storeId", key, value, category, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [crypto.randomUUID(), storeId, 'receiptHeader', `Toko Demo`, 'receipt', new Date(), new Date()]
    );
    await client.query(
      'INSERT INTO "StoreSettings" (id, "storeId", key, value, category, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [crypto.randomUUID(), storeId, 'receiptFooter', 'Barang yang sudah dibeli tidak dapat dikembalikan', 'receipt', new Date(), new Date()]
    );
    await client.query(
      'INSERT INTO "StoreSettings" (id, "storeId", key, value, category, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [crypto.randomUUID(), storeId, 'theme', 'blue', 'display', new Date(), new Date()]
    );
    await client.query(
      'INSERT INTO "StoreSettings" (id, "storeId", key, value, category, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [crypto.randomUUID(), storeId, 'fontSize', 'medium', 'display', new Date(), new Date()]
    );
    await client.query(
      'INSERT INTO "StoreSettings" (id, "storeId", key, value, category, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [crypto.randomUUID(), storeId, 'language', 'id', 'display', new Date(), new Date()]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Seeding completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error resetting and seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the function
resetAndSeedDatabase()
  .then(() => console.log('Done!'))
  .catch(console.error); 