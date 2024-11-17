import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = global.prisma || new PrismaClient();

// Assign to global variable if in development
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

export default prisma;
