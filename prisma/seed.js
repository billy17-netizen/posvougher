const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seed with Super Admin only...');
    
    // Clean up existing data if needed
    console.log('Cleaning existing data...');
    await prisma.$transaction([
      prisma.storeSettings.deleteMany({}),
      prisma.category.deleteMany({}),
      prisma.product.deleteMany({}),
      prisma.transaction.deleteMany({}),
      prisma.userStore.deleteMany({}),
      prisma.store.deleteMany({}),
      prisma.user.deleteMany({})
    ]);
    
    console.log('All existing data cleared.');
    
    // Create the super admin user
    const superAdminId = randomUUID();
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    
    const superAdmin = await prisma.user.create({
      data: {
        id: superAdminId,
        name: 'Super Administrator',
        username: 'superadmin',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`Super Admin created with ID: ${superAdmin.id}`);
    console.log('Username: superadmin');
    console.log('Password: superadmin123');
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during database seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 