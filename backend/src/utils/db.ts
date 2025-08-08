import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Configure Prisma logging levels via PRISMA_LOG_LEVEL environment variable
 * 
 * Available options:
 * - 'none': No logging (recommended for development to reduce noise)
 * - 'error': Error messages only
 * - 'warn': Errors + warnings
 * - 'info': Errors + warnings + info messages
 * - 'query': All above + SQL queries (useful for debugging)
 * - 'all': All logging levels (most verbose)
 * 
 * Default: 'error' and 'warn' in development, 'error' only in production
 */
const getPrismaLogLevel = () => {
  // Check for specific PRISMA_LOG_LEVEL environment variable
  const logLevel = process.env.PRISMA_LOG_LEVEL;
  
  if (logLevel === 'none') return [];
  if (logLevel === 'error') return ['error'];
  if (logLevel === 'warn') return ['error', 'warn'];
  if (logLevel === 'info') return ['error', 'warn', 'info'];
  if (logLevel === 'query') return ['error', 'warn', 'info', 'query'];
  if (logLevel === 'all') return ['query', 'error', 'warn', 'info'];
  
  // Default: only errors and warnings in development, errors only in production
  return process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'];
};

export const prisma = 
  globalThis.__prisma ||
  new PrismaClient({
    log: getPrismaLogLevel(),
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;