/**
 * Smoke Test: Test Account Provisioning
 * 
 * This test MUST run first (000- prefix ensures ordering).
 * It verifies that all required test accounts exist and can authenticate.
 * 
 * If this test fails, the entire test suite is invalid.
 */

import { test, expect } from '@playwright/test'
import { TEST_ACCOUNTS } from './global-setup'

const API_BASE = 'http://localhost:3000/api'

/**
 * Helper: Authenticate and return token
 */
async function authenticate(email: string, password: string): Promise<{ success: boolean; token?: string; status: number }> {
  const response = await fetch(`${API_BASE}/admin-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  if (!response.ok) {
    return { success: false, status: response.status }
  }
  
  const setCookieHeader = response.headers.get('set-cookie')
  if (!setCookieHeader) {
    return { success: false, status: 500 }
  }
  
  const match = setCookieHeader.match(/jl_staff_token=([^;]+)/)
  if (!match) {
    return { success: false, status: 500 }
  }
  
  return { success: true, token: match[1], status: 200 }
}

test.describe('🔥 CRITICAL: Test Account Provisioning Smoke Test', () => {
  
  test('owner@jessy.test can authenticate', async () => {
    const result = await authenticate(TEST_ACCOUNTS.owner.email, TEST_ACCOUNTS.owner.password)
    expect(result.success, `owner@jessy.test authentication failed with status ${result.status}`).toBe(true)
    expect(result.token).toBeDefined()
    console.log(`✅ owner@jessy.test authenticated successfully`)
  })

  test('manager@jessy.test can authenticate', async () => {
    const result = await authenticate(TEST_ACCOUNTS.manager.email, TEST_ACCOUNTS.manager.password)
    expect(result.success, `manager@jessy.test authentication failed with status ${result.status}`).toBe(true)
    expect(result.token).toBeDefined()
    console.log(`✅ manager@jessy.test authenticated successfully`)
  })

  test('fulfillment@jessy.test can authenticate', async () => {
    const result = await authenticate(TEST_ACCOUNTS.fulfillment.email, TEST_ACCOUNTS.fulfillment.password)
    expect(result.success, `fulfillment@jessy.test authentication failed with status ${result.status}`).toBe(true)
    expect(result.token).toBeDefined()
    console.log(`✅ fulfillment@jessy.test authenticated successfully`)
  })

  test('catalog@jessy.test can authenticate', async () => {
    const result = await authenticate(TEST_ACCOUNTS.catalog.email, TEST_ACCOUNTS.catalog.password)
    expect(result.success, `catalog@jessy.test authentication failed with status ${result.status}`).toBe(true)
    expect(result.token).toBeDefined()
    console.log(`✅ catalog@jessy.test authenticated successfully`)
  })

  test('inactive@jessy.test CANNOT authenticate (negative test)', async () => {
    const result = await authenticate(TEST_ACCOUNTS.inactive.email, TEST_ACCOUNTS.inactive.password)
    expect(result.success, 'inactive@jessy.test should NOT be able to authenticate').toBe(false)
    expect([401, 403]).toContain(result.status) // Either 401 or 403 is acceptable for inactive accounts
    console.log(`✅ inactive@jessy.test correctly rejected (${result.status})`)
  })

  test('All test accounts have expected properties', async () => {
    // Verify TEST_ACCOUNTS export is complete
    expect(TEST_ACCOUNTS.owner).toBeDefined()
    expect(TEST_ACCOUNTS.manager).toBeDefined()
    expect(TEST_ACCOUNTS.fulfillment).toBeDefined()
    expect(TEST_ACCOUNTS.catalog).toBeDefined()
    expect(TEST_ACCOUNTS.inactive).toBeDefined()

    // Verify role assignments
    expect(TEST_ACCOUNTS.owner.role).toBe('Owner')
    expect(TEST_ACCOUNTS.manager.role).toBe('Manager')
    expect(TEST_ACCOUNTS.fulfillment.role).toBe('Fulfillment')
    expect(TEST_ACCOUNTS.catalog.role).toBe('Catalog')

    // Verify active status
    expect(TEST_ACCOUNTS.owner.active).toBe(true)
    expect(TEST_ACCOUNTS.manager.active).toBe(true)
    expect(TEST_ACCOUNTS.fulfillment.active).toBe(true)
    expect(TEST_ACCOUNTS.catalog.active).toBe(true)
    expect(TEST_ACCOUNTS.inactive.active).toBe(false)

    console.log(`✅ All test accounts have correct properties`)
  })
})
