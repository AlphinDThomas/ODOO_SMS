import { PrismaClient } from '@prisma/client';

/**
 * Privileged database client singleton.
 * Uses globalThis caching in non-production environments to prevent connection
 * pool exhaustion during nodemon hot-reloads.
 */
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}
