// Script to create a super admin user from the command line
const { PrismaClient } = require('./src/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Default credentials (can be overridden by command line args)
const DEFAULT_USERNAME = 'superadmin';
const DEFAULT_PASSWORD = 'admin123';
const DEFAULT_NAME = 'Super Admin';

async function main() {
  try {
    // Get credentials from command line args or use defaults
    const username = process.argv[2] || DEFAULT_USERNAME;
    const password = process.argv[3] || DEFAULT_PASSWORD;
    const name = process.argv[4] || DEFAULT_NAME;

    console.log(`Creating super admin user: ${username}`);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      console.log(`User ${username} already exists. Updating to SUPER_ADMIN role...`);
      
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'SUPER_ADMIN' }
      });
      
      console.log(`User updated: ${JSON.stringify({
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role
      }, null, 2)}`);
      
      return;
    }

    // Create new super admin user
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: 'SUPER_ADMIN'
      }
    });
    
    console.log(`Super admin created successfully: ${JSON.stringify({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role
    }, null, 2)}`);
    
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 