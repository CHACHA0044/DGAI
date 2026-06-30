import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Prevent multiple Prisma instances in development (hot-reload safe)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
    errorFormat: 'minimal',
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Connect to the database.
 * Uses DATABASE_URL (pooler) at runtime.
 * DIRECT_URL is used by Prisma CLI for migrations only.
 */
export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.log('✅  Database connected (Supabase PostgreSQL via pooler)');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('🔌  Database disconnected');
}
