/**
 * Isolation Verification Test
 * 
 * Verifies that tests can run in ANY order without interfering with each other.
 * This test creates data in Test A, then Test B, and verifies that:
 * 1. Test B's data doesn't collide with Test A
 * 2. Test A's cleanup doesn't affect Test B
 * 3. Global test accounts remain intact
 */

import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import { TEST_ACCOUNTS } from './global-setup'

function generateTestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

test.describe('🔬 Isolation Verification', () => {
  
  test('Isolation Test A: Create customer, verify, cleanup', async () => {
    const testId = generateTestId('isolation-a')
    let customerId: number | null = null
    
    try {
      // Create test-specific customer
      const customer = await prisma.customer.create({
        data: {
          name: `Isolation Test Customer A ${testId}`,
          email: `customer-a-${testId}@test.jessy.test`,
          phone: `555${testId.substr(-10)}`,
          whatsapp: `555${testId.substr(-10)}`,
          updatedAt: new Date()
        }
      })
      
      customerId = customer.id
      
      // Verify it exists
      const found = await prisma.customer.findUnique({
        where: { id: customerId }
      })
      
      expect(found).not.toBeNull()
      expect(found?.name).toContain('Isolation Test Customer A')
      
      console.log(`✅ Test A created customer ${customerId}`)
      
    } finally {
      // Clean up
      if (customerId) {
        await prisma.customer.delete({ where: { id: customerId } })
        console.log(`✅ Test A cleaned up customer ${customerId}`)
      }
    }
    
    // Verify global staff accounts still exist
    const ownerExists = await prisma.staffAccount.findUnique({
      where: { email: TEST_ACCOUNTS.owner.email }
    })
    expect(ownerExists, 'Global owner account should still exist after Test A').not.toBeNull()
  })
  
  test('Isolation Test B: Create customer with different ID, verify independence', async () => {
    const testId = generateTestId('isolation-b')
    let customerId: number | null = null
    
    try {
      // Create test-specific customer (different from Test A)
      const customer = await prisma.customer.create({
        data: {
          name: `Isolation Test Customer B ${testId}`,
          email: `customer-b-${testId}@test.jessy.test`,
          phone: `666${testId.substr(-10)}`,  // Different prefix to ensure uniqueness
          whatsapp: `666${testId.substr(-10)}`,
          updatedAt: new Date()
        }
      })
      
      customerId = customer.id
      
      // Verify it exists
      const found = await prisma.customer.findUnique({
        where: { id: customerId }
      })
      
      expect(found).not.toBeNull()
      expect(found?.name).toContain('Isolation Test Customer B')
      
      console.log(`✅ Test B created customer ${customerId}`)
      
      // Verify Test A's customer is NOT in the database
      // (it should have cleaned up after itself)
      const testACustomers = await prisma.customer.findMany({
        where: {
          name: {
            contains: 'Isolation Test Customer A'
          }
        }
      })
      
      expect(testACustomers.length, 'Test A should have cleaned up its customer').toBe(0)
      
    } finally {
      // Clean up
      if (customerId) {
        await prisma.customer.delete({ where: { id: customerId } })
        console.log(`✅ Test B cleaned up customer ${customerId}`)
      }
    }
    
    // Verify global staff accounts still exist
    const managerExists = await prisma.staffAccount.findUnique({
      where: { email: TEST_ACCOUNTS.manager.email }
    })
    expect(managerExists, 'Global manager account should still exist after Test B').not.toBeNull()
  })
  
  test('Isolation Test C: Verify no test customers remain', async () => {
    // After both tests, verify no isolation test customers exist
    const remainingTestCustomers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: 'Isolation Test Customer A' } },
          { name: { contains: 'Isolation Test Customer B' } }
        ]
      }
    })
    
    expect(remainingTestCustomers.length, 'All isolation test customers should be cleaned up').toBe(0)
    console.log(`✅ Test C verified all isolation test data was cleaned up`)
    
    // Verify all 5 global staff accounts still exist
    const staffCount = await prisma.staffAccount.count({
      where: {
        email: {
          in: [
            TEST_ACCOUNTS.owner.email,
            TEST_ACCOUNTS.manager.email,
            TEST_ACCOUNTS.fulfillment.email,
            TEST_ACCOUNTS.catalog.email,
            TEST_ACCOUNTS.inactive.email
          ]
        }
      }
    })
    
    expect(staffCount, 'All 5 global staff accounts should still exist').toBe(5)
    console.log(`✅ Test C verified all 5 global staff accounts intact`)
  })
})
