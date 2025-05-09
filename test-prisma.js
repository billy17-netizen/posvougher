// Test if Prisma can connect to the database
const { PrismaClient } = require('./src/generated/prisma');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main() {
  try {
    console.log('Attempting to connect to the database...');
    // Test a simple query
    const users = await prisma.user.findMany({
      take: 1,
    });
    console.log('Connection successful!');
    console.log('Sample user:', users[0] || 'No users found');
  } catch (error) {
    console.error('Error connecting to the database:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 