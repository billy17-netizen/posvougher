import { PrismaClient, Prisma } from '@/generated/prisma';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Define log levels with proper typing
const logLevels: Prisma.LogLevel[] = process.env.NODE_ENV === 'development' 
  ? ['query', 'error', 'warn'] 
  : ['error'];

// Use existing client in development to avoid too many connections
export const prisma = 
  globalForPrisma.prisma || 
  new PrismaClient({
    log: logLevels,
  });

// Save reference to the client instance in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
} 