import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('[CertiFlow DB] Connected successfully.');
  } catch (error) {
    console.error('[CertiFlow DB] Connection error:', error);
  }
}

