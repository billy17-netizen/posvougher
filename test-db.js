// Test Prisma connection
const { PrismaClient } = require('./src/generated/prisma');

// Create a Prisma client with debug logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
  errorFormat: 'pretty',
});

async function main() {
  try {
    console.log('Testing database connection...');
    
    // Check environment variable
    console.log('DATABASE_URL from env:', process.env.DATABASE_URL);
    
    // Try to get a user count
    const userCount = await prisma.user.count();
    console.log('Connection successful!');
    console.log(`Total users in database: ${userCount}`);
    
    // Try to get a list of users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
      },
      take: 5,
    });
    
    console.log('First 5 users:', users);
    
  } catch (error) {
    console.error('Error connecting to database:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    console.log('Disconnected from database');
  }
}

main();
