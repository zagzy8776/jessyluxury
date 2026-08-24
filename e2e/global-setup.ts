/**
 * Global Setup for E2E Tests
 * 
 * This runs ONCE before all tests and provisions required test accounts.
 * All test files can rely on these accounts existing.
 * 
 * Test Accounts Created:
 * - owner@jessy.test (Owner role, all permissions)
 * - manager@jessy.test (Manager role, limited permissions)
 * - fulfillment@jessy.test (Fulfillment role)
 * - catalog@jessy.test (Catalog role)
 * - inactive@jessy.test (Inactive account for negative tests)
 */

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

// Standard test account definitions
export const TEST_ACCOUNTS = {
  owner: {
    name: 'Test Owner',
    email: 'owner@jessy.test',
    password: 'ownerpass123456',
    role: 'Owner' as const,
    permissions: ['orders', 'products', 'customers', 'analytics', 'settings', 'catalog', 'fulfillment'],
    active: true
  },
  manager: {
    name: 'Test Manager',
    email: 'manager@jessy.test',
    password: 'managerpass123456',
    role: 'Manager' as const,
    permissions: ['orders', 'products', 'customers', 'analytics'],
    active: true
  },
  fulfillment: {
    name: 'Test Fulfillment',
    email: 'fulfillment@jessy.test',
    password: 'fulfillmentpass123456',
    role: 'Fulfillment' as const,
    permissions: ['orders', 'fulfillment'],
    active: true
  },
  catalog: {
    name: 'Test Catalog',
    email: 'catalog@jessy.test',
    password: 'catalogpass123456',
    role: 'Catalog' as const,
    permissions: ['products', 'catalog'],
    active: true
  },
  inactive: {
    name: 'Test Inactive',
    email: 'inactive@jessy.test',
    password: 'inactivepass123456',
    role: 'Manager' as const,
    permissions: ['orders', 'products'],
    active: false
  },
  managerWithSettings: {
    name: 'Test Manager Settings',
    email: 'manager-settings@jessy.test',
    password: 'managersettings123',
    role: 'Manager' as const,
    permissions: ['orders', 'products', 'settings'],
    active: true
  }
}

// Alias for backward compatibility
export const testUsers = TEST_ACCOUNTS;

async function globalSetup() {
  console.log('\n🔧 [Global Setup] Starting test account provisioning...\n')
  
  const now = new Date()

  try {
    // Wait for any previous connections to close
    console.log('   Waiting for previous connections to close...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Upsert test accounts (idempotent - safe to run multiple times)
    for (const [key, account] of Object.entries(TEST_ACCOUNTS)) {
      console.log(`   Creating/updating ${account.email} (${account.role})...`)
      
      await prisma.staffAccount.upsert({
        where: { email: account.email },
        create: {
          name: account.name,
          email: account.email,
          passwordHash: hashPassword(account.password),
          role: account.role,
          permissions: account.permissions,
          active: account.active,
          createdAt: now,
          updatedAt: now
        },
        update: {
          name: account.name,
          passwordHash: hashPassword(account.password),
          role: account.role,
          permissions: account.permissions,
          active: account.active,
          updatedAt: now
        }
      })
    }

    console.log('\n✅ [Global Setup] All test accounts provisioned successfully\n')
    
    // Verify accounts can be found
    const accountCount = await prisma.staffAccount.count({
      where: {
        email: {
          in: Object.values(TEST_ACCOUNTS).map(a => a.email)
        }
      }
    })
    
    if (accountCount !== Object.keys(TEST_ACCOUNTS).length) {
      throw new Error(`Expected ${Object.keys(TEST_ACCOUNTS).length} test accounts, found ${accountCount}`)
    }
    
    console.log(`✅ [Global Setup] Verified ${accountCount} test accounts exist\n`)

  } catch (error) {
    console.error('\n❌ [Global Setup] Failed to provision test accounts:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

export default globalSetup


// Allow running standalone for testing
if (require.main === module) {
  globalSetup().catch(error => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
}
