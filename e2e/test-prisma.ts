/**
 * Shared Prisma Client for E2E Tests
 * 
 * This provides a singleton Prisma client instance that all E2E tests
 * can share, preventing connection pool exhaustion.
 * 
 * Usage in test files:
 * ```typescript
 * import { testPrisma } from './test-prisma'
 * 
 * // Use testPrisma instead of creating new PrismaClient()
 * const customer = await testPrisma.customer.create({ ... })
 * ```
 */

import { PrismaClient } from '@prisma/client'

// Singleton instance
let prismaInstance: PrismaClient | null = null

export function getTestPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  return prismaInstance
}

export const testPrisma = getTestPrisma()

// Cleanup function for global teardown
export async function disconnectTestPrisma() {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
  }
}
