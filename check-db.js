// Test direct PostgreSQL connection
const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    console.log('Connection string:', process.env.DATABASE_URL);
    
    await client.connect();
    console.log('Connected successfully!');
    
    // Test a simple query
    const res = await client.query('SELECT NOW() as time');
    console.log('Database time:', res.rows[0].time);

    // Check if the User table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `);
    
    console.log('User table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get user count
      const userCount = await client.query('SELECT COUNT(*) FROM "User"');
      console.log('Number of users:', userCount.rows[0].count);
    }
    
  } catch (error) {
    console.error('Database connection error:');
    console.error(error);
  } finally {
    await client.end();
    console.log('Connection closed');
  }
}

main();
