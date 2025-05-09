import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function resetAndSeedDatabase() {
  try {
    console.log('Starting database reset and seeding...');

    // Clean up existing data
    console.log('Cleaning existing data...');
    
    await prisma.transactionItem.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.storeSettings.deleteMany();
    await prisma.userStore.deleteMany();
    await prisma.store.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('Database cleaned.');

    // Create admin user
    console.log('Creating admin user...');
    const hashedPassword = await hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Administrator',
        username: 'admin',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log(`Admin user created with ID: ${admin.id}`);

    // Create demo store
    console.log('Creating demo store...');
    const store = await prisma.store.create({
      data: {
        name: 'Toko Demo',
        address: 'Jl. Contoh No. 123',
        phone: '08123456789',
        email: 'demo@example.com',
        taxRate: 11.0,
        currency: 'IDR',
      },
    });
    console.log(`Demo store created with ID: ${store.id}`);

    // Associate admin with store
    console.log('Associating admin with store...');
    await prisma.userStore.create({
      data: {
        userId: admin.id,
        storeId: store.id,
        role: 'ADMIN',
      },
    });

    // Create store settings
    console.log('Creating store settings...');
    await prisma.storeSettings.createMany({
      data: [
        { 
          storeId: store.id,
          key: 'receiptHeader',
          value: `${store.name}`,
          category: 'receipt'
        },
        { 
          storeId: store.id,
          key: 'receiptFooter',
          value: 'Barang yang sudah dibeli tidak dapat dikembalikan',
          category: 'receipt'
        },
        { 
          storeId: store.id,
          key: 'theme',
          value: 'blue',
          category: 'display'
        },
        {
          storeId: store.id,
          key: 'fontSize',
          value: 'medium',
          category: 'display'
        },
        {
          storeId: store.id,
          key: 'language',
          value: 'id',
          category: 'display'
        }
      ]
    });
    console.log('Store settings created');

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error resetting and seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAndSeedDatabase()
  .then(() => console.log('Done!'))
  .catch(console.error); 