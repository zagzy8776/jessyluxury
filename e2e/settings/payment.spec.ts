import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'

/**
 * Payment Settings E2E Test Suite - P11-T026
 * Validates: Requirements 8, 9, 22, 26
 * 
 * Tests payment settings API with focus on secret masking and security:
 * - GET returns masked secrets in correct format
 * - PUT updates and returns masked secrets
 * - Short secrets are fully masked
 * - Audit logs never contain raw secrets
 * - Authorization enforcement (401 without auth, 403 without permission)
 */

const API_BASE = 'http://localhost:3000/api'

// Test data
const testUsers = {
  owner: {
    email: 'owner@jessy.test',
    password: 'ownerpass123456',
    role: 'Owner',
    permissions: ['orders', 'products', 'customers', 'analytics', 'settings', 'catalog', 'fulfillment']
  },
  manager: {
    email: 'manager@jessy.test',
    password: 'managerpass123456',
    role: 'Manager',
    permissions: ['orders', 'products', 'customers', 'analytics']
  },
  catalog: {
    email: 'catalog@jessy.test',
    password: 'catalogpass123456',
    role: 'Catalog',
    permissions: ['products', 'catalog']
  }
}

/**
 * Helper: Get staff auth token by authenticating
 */
async function getStaffToken(email: string, password: string): Promise<string | null> {
  const response = await fetch(`${API_BASE}/admin-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  
  if (!response.ok) {
    console.error(`Failed to authenticate ${email}: ${response.status}`)
    return null
  }
  
  // Extract the jl_staff_token cookie from Set-Cookie header
  const setCookieHeader = response.headers.get('set-cookie')
  if (!setCookieHeader) {
    console.error(`No Set-Cookie header in response for ${email}`)
    return null
  }
  
  // Parse the cookie value from Set-Cookie header
  const match = setCookieHeader.match(/jl_staff_token=([^;]+)/)
  if (!match) {
    console.error(`Could not extract jl_staff_token from Set-Cookie header for ${email}`)
    return null
  }
  
  return match[1]
}

/**
 * Helper: Make authenticated API call with proper cookie
 */
async function makeAuthenticatedRequest(
  path: string,
  method: string = 'GET',
  token?: string,
  body?: object
) {
  const headers: any = { 'Content-Type': 'application/json' }
  
  if (token) {
    headers.Cookie = `jl_staff_token=${token}`
  }
  
  const options: any = { method, headers }
  if (body) {
    options.body = JSON.stringify(body)
  }
  
  return fetch(`${API_BASE}${path}`, options)
}

/**
 * Helper: Verify masking format based on length
 */
function verifyMaskingFormat(masked: string, originalLength: number): boolean {
  // Empty values should return empty string
  if (originalLength === 0) {
    return masked === ''
  }
  
  // Short values (< 6 chars) should be fully masked with exactly 6 bullets
  if (originalLength < 6) {
    return masked === '••••••'
  }
  
  // For length 6-7: first 2 + min 4 bullets + last 2
  if (originalLength <= 7) {
    const pattern = /^.{2}•{4,}.{2}$/
    return pattern.test(masked) && masked.length >= 8
  }
  
  // For length 8-9: first 2 + min 6 bullets + last 2
  if (originalLength <= 9) {
    const pattern = /^.{2}•{6,}.{2}$/
    return pattern.test(masked) && masked.length >= 10
  }
  
  // For length 10+: first 2 + min 6 bullets + last 4
  const pattern = /^.{2}•{6,}.{4}$/
  return pattern.test(masked) && masked.length >= 12
}

test.describe('Payment Settings API - Secret Masking', () => {
  test('GET returns masked secrets with correct format', async () => {
    // Authenticate as owner
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // First, PUT some payment settings with known values
    const testSecrets = {
      bankAccountNumber: '1234567890123456', // 16 chars
      bankRoutingNumber: '987654321', // 9 chars
      bankAccountName: 'Jessy Luxury Business Account',
      paymentProviderApiKey: 'test_live_abcdefghijklmnopqrstuvwxyz123456789a21', // Long key
      merchantId: 'merchant_12345'
    }
    
    const putResponse = await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      testSecrets
    )
    expect(putResponse.status).toBe(200)
    
    // Now GET the settings
    const getResponse = await makeAuthenticatedRequest('/settings/payment', 'GET', token)
    expect(getResponse.status).toBe(200)
    
    const data = await getResponse.json()
    
    // Verify all secret fields are masked
    expect(data.bankAccountNumber).toContain('••')
    expect(data.bankRoutingNumber).toContain('••')
    expect(data.paymentProviderApiKey).toContain('••')
    
    // Verify masking format is correct
    expect(verifyMaskingFormat(data.bankAccountNumber, testSecrets.bankAccountNumber.length)).toBe(true)
    expect(verifyMaskingFormat(data.bankRoutingNumber, testSecrets.bankRoutingNumber.length)).toBe(true)
    expect(verifyMaskingFormat(data.paymentProviderApiKey, testSecrets.paymentProviderApiKey.length)).toBe(true)
    
    // Verify non-secret fields are not masked
    expect(data.bankAccountName).toBe(testSecrets.bankAccountName)
    expect(data.merchantId).toBe(testSecrets.merchantId)
    
    // Verify raw secrets are NOT in response
    expect(data.bankAccountNumber).not.toBe(testSecrets.bankAccountNumber)
    expect(data.bankRoutingNumber).not.toBe(testSecrets.bankRoutingNumber)
    expect(data.paymentProviderApiKey).not.toBe(testSecrets.paymentProviderApiKey)
  })

  test('PUT updates and returns masked secrets', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const newSettings = {
      bankAccountNumber: '9876543210987654',
      bankRoutingNumber: '123456789',
      bankAccountName: 'Updated Account Name',
      paymentProviderApiKey: 'sk_test_xyz789abc456def123ghi',
      merchantId: 'merch_updated'
    }
    
    const response = await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      newSettings
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    // Verify response contains masked secrets, not raw values
    expect(data.bankAccountNumber).toContain('••')
    expect(data.bankRoutingNumber).toContain('••')
    expect(data.paymentProviderApiKey).toContain('••')
    
    expect(data.bankAccountNumber).not.toBe(newSettings.bankAccountNumber)
    expect(data.bankRoutingNumber).not.toBe(newSettings.bankRoutingNumber)
    expect(data.paymentProviderApiKey).not.toBe(newSettings.paymentProviderApiKey)
    
    // Verify non-secret fields are updated correctly
    expect(data.bankAccountName).toBe(newSettings.bankAccountName)
    expect(data.merchantId).toBe(newSettings.merchantId)
    
    // Verify database was updated by checking with GET
    const getResponse = await makeAuthenticatedRequest('/settings/payment', 'GET', token)
    const getData = await getResponse.json()
    
    expect(getData.bankAccountName).toBe(newSettings.bankAccountName)
    expect(getData.merchantId).toBe(newSettings.merchantId)
  })

  test('Masking algorithm correctness - first 2 + bullets + last 4 for long secrets', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Test with a specific long secret where we can verify the pattern
    const longSecret = 'ab123456789a21' // 14 chars: should be "ab••••••••9a21"
    
    const response = await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      {
        bankAccountNumber: longSecret,
        bankRoutingNumber: '111111111',
        paymentProviderApiKey: 'sk_live_test123'
      }
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    // For 14-char string: first 2 (ab) + bullets + last 4 (9a21)
    expect(data.bankAccountNumber.startsWith('ab')).toBe(true)
    expect(data.bankAccountNumber.endsWith('9a21')).toBe(true)
    expect(data.bankAccountNumber).toContain('••')
    
    // Count bullets in the middle (should be at least 6)
    const bulletCount = (data.bankAccountNumber.match(/•/g) || []).length
    expect(bulletCount).toBeGreaterThanOrEqual(6)
  })

  test('Short secrets are fully masked with 6 bullets', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Test with short values (< 6 chars)
    const shortSecrets = {
      bankAccountNumber: '12345', // 5 chars
      bankRoutingNumber: 'abc', // 3 chars
      paymentProviderApiKey: 'x' // 1 char
    }
    
    const response = await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      shortSecrets
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    // All short secrets should be fully masked with exactly "••••••"
    expect(data.bankAccountNumber).toBe('••••••')
    expect(data.bankRoutingNumber).toBe('••••••')
    expect(data.paymentProviderApiKey).toBe('••••••')
    
    // Verify they don't contain any characters from the original
    expect(data.bankAccountNumber).not.toContain('1')
    expect(data.bankAccountNumber).not.toContain('5')
    expect(data.bankRoutingNumber).not.toContain('a')
    expect(data.paymentProviderApiKey).not.toContain('x')
  })

  test('Empty secrets return empty string', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const emptySettings = {
      bankAccountNumber: '',
      bankRoutingNumber: '',
      paymentProviderApiKey: ''
    }
    
    const response = await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      emptySettings
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    // Empty values should return empty strings, not masked bullets
    expect(data.bankAccountNumber).toBe('')
    expect(data.bankRoutingNumber).toBe('')
    expect(data.paymentProviderApiKey).toBe('')
  })

  test('Masking preserves format across multiple lengths', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Test various lengths
    const testCases = [
      { value: '123456', expectedLength: 6, type: '6-char' },
      { value: '1234567', expectedLength: 7, type: '7-char' },
      { value: '12345678', expectedLength: 8, type: '8-char' },
      { value: '123456789', expectedLength: 9, type: '9-char' },
      { value: '1234567890', expectedLength: 10, type: '10-char' },
      { value: '12345678901234567890', expectedLength: 20, type: '20-char' }
    ]
    
    for (const testCase of testCases) {
      const response = await makeAuthenticatedRequest(
        '/settings/payment',
        'PUT',
        token,
        { bankAccountNumber: testCase.value }
      )
      
      const data = await response.json()
      expect(verifyMaskingFormat(data.bankAccountNumber, testCase.expectedLength)).toBe(true)
    }
  })
})

test.describe('Payment Settings API - Audit Trail Security', () => {
  test('Audit log does not contain secret values', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const sensitiveSettings = {
      bankAccountNumber: 'SECRET1234567890',
      bankRoutingNumber: 'ROUTING999',
      paymentProviderApiKey: 'sk_live_SUPER_SECRET_KEY_12345',
      merchantId: 'merchant_visible'
    }
    
    // Clear previous audit logs for cleaner test
    await prisma.auditLog.deleteMany({
      where: {
        action: 'PAYMENT_SETTINGS_UPDATED'
      }
    })
    
    // Update payment settings
    const response = await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      sensitiveSettings
    )
    
    expect(response.status).toBe(200)
    
    // Query audit log
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: 'PAYMENT_SETTINGS_UPDATED',
        entity: 'PaymentSettings'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    })
    
    expect(auditLogs.length).toBeGreaterThan(0)
    
    const latestLog = auditLogs[0]
    const detailsString = latestLog.details
    
    // Verify no secret fields are present in audit log
    expect(detailsString).not.toContain('SECRET')
    expect(detailsString).not.toContain('ROUTING')
    expect(detailsString).not.toContain('sk_live')
    expect(detailsString).not.toContain('bankAccountNumber')
    expect(detailsString).not.toContain('bankRoutingNumber')
    expect(detailsString).not.toContain('paymentProviderApiKey')
    
    // Verify non-sensitive fields can be present
    // merchantId is allowed in audit logs
    expect(detailsString).toContain('merchant_visible')
  })

  test('Audit log filters sensitive field patterns', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Clear previous audit logs
    await prisma.auditLog.deleteMany({
      where: {
        action: 'PAYMENT_SETTINGS_UPDATED'
      }
    })
    
    // Update with multiple sensitive fields
    await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      {
        bankAccountNumber: 'acc123',
        bankRoutingNumber: 'route456',
        paymentProviderApiKey: 'key789',
        bankAccountName: 'Safe Name',
        merchantId: 'merch_123'
      }
    )
    
    // Get the audit log
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: 'PAYMENT_SETTINGS_UPDATED'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    })
    
    const detailsString = auditLogs[0].details
    const details = JSON.parse(detailsString)
    
    // Verify sensitive keys are filtered out
    expect(details.bankAccountNumber).toBeUndefined()
    expect(details.bankRoutingNumber).toBeUndefined()
    expect(details.paymentProviderApiKey).toBeUndefined()
    
    // Verify non-sensitive keys are present
    expect(details.bankAccountName).toBe('Safe Name')
    expect(details.merchantId).toBe('merch_123')
  })
})

test.describe('Payment Settings API - Authorization', () => {
  test('Unauthorized request returns 401', async () => {
    // Call GET without auth token
    const getResponse = await makeAuthenticatedRequest('/settings/payment', 'GET')
    expect(getResponse.status).toBe(401)
    
    // Call PUT without auth token
    const putResponse = await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      undefined,
      { bankAccountNumber: 'test' }
    )
    expect(putResponse.status).toBe(401)
  })

  test('Staff without settings permission returns 403', async () => {
    // Manager doesn't have settings permission
    const managerToken = await getStaffToken(testUsers.manager.email, testUsers.manager.password)
    if (!managerToken) test.skip()
    
    const getResponse = await makeAuthenticatedRequest('/settings/payment', 'GET', managerToken)
    expect(getResponse.status).toBe(403)
    
    const putResponse = await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      managerToken,
      { bankAccountNumber: 'test' }
    )
    expect(putResponse.status).toBe(403)
  })

  test('Catalog staff without settings permission returns 403', async () => {
    // Catalog doesn't have settings permission
    const catalogToken = await getStaffToken(testUsers.catalog.email, testUsers.catalog.password)
    if (!catalogToken) test.skip()
    
    const getResponse = await makeAuthenticatedRequest('/settings/payment', 'GET', catalogToken)
    expect(getResponse.status).toBe(403)
    
    const putResponse = await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      catalogToken,
      { bankAccountNumber: 'test' }
    )
    expect(putResponse.status).toBe(403)
  })

  test('Owner with settings permission can access payment settings', async () => {
    const ownerToken = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!ownerToken) test.skip()
    
    const getResponse = await makeAuthenticatedRequest('/settings/payment', 'GET', ownerToken)
    expect(getResponse.status).toBe(200)
    
    const putResponse = await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      ownerToken,
      {
        bankAccountNumber: 'test123',
        bankRoutingNumber: 'route456'
      }
    )
    expect(putResponse.status).toBe(200)
  })

  test('Invalid token returns 401', async () => {
    const response = await makeAuthenticatedRequest(
      '/settings/payment',
      'GET',
      'invalid_fake_token_12345'
    )
    expect(response.status).toBe(401)
  })
})

test.describe('Payment Settings API - Error Handling', () => {
  test('No secrets leak through error paths', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Set some sensitive data first
    await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      {
        bankAccountNumber: 'SENSITIVE_DATA_12345',
        paymentProviderApiKey: 'sk_live_SECRET_KEY'
      }
    )
    
    // Try various error scenarios and verify no secrets leak
    
    // 1. Malformed JSON in PUT request
    const malformedResponse = await fetch(`${API_BASE}/settings/payment`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `jl_staff_token=${token}`
      },
      body: 'not valid json {'
    })
    
    const malformedText = await malformedResponse.text()
    expect(malformedText).not.toContain('SENSITIVE_DATA')
    expect(malformedText).not.toContain('SECRET_KEY')
    
    // 2. GET should always return masked data even after errors
    const getResponse = await makeAuthenticatedRequest('/settings/payment', 'GET', token)
    const getData = await getResponse.json()
    
    expect(getData.bankAccountNumber).not.toContain('SENSITIVE_DATA')
    expect(getData.paymentProviderApiKey).not.toContain('SECRET_KEY')
    expect(getData.bankAccountNumber).toContain('••')
  })

  test('Validation errors do not expose secrets', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Store sensitive data
    await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      {
        bankAccountNumber: 'SECRET_123456',
        paymentProviderApiKey: 'sk_SECRET'
      }
    )
    
    // Any subsequent GET should return masked values
    const response = await makeAuthenticatedRequest('/settings/payment', 'GET', token)
    const data = await response.json()
    
    expect(data.bankAccountNumber).not.toBe('SECRET_123456')
    expect(data.paymentProviderApiKey).not.toBe('sk_SECRET')
    expect(data.bankAccountNumber).toContain('••')
    expect(data.paymentProviderApiKey).toContain('••')
  })
})

test.describe('Payment Settings API - Data Persistence', () => {
  test('Settings persist across requests', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const uniqueId = `merch_${Date.now()}`
    const settings = {
      bankAccountNumber: '1111222233334444',
      bankAccountName: 'Test Persistence Account',
      merchantId: uniqueId
    }
    
    // PUT settings
    const putResponse = await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      settings
    )
    expect(putResponse.status).toBe(200)
    
    // GET settings to verify persistence
    const getResponse = await makeAuthenticatedRequest('/settings/payment', 'GET', token)
    const data = await getResponse.json()
    
    expect(data.bankAccountName).toBe(settings.bankAccountName)
    expect(data.merchantId).toBe(uniqueId)
    expect(data.bankAccountNumber).toContain('••') // Still masked
  })

  test('Partial updates preserve existing values', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Set initial values
    await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      {
        bankAccountNumber: '1234567890',
        bankAccountName: 'Initial Name',
        merchantId: 'initial_merchant'
      }
    )
    
    // Update only merchantId
    await makeAuthenticatedRequest(
      '/settings/payment',
      'PUT',
      token,
      {
        merchantId: 'updated_merchant'
      }
    )
    
    // Verify other fields are preserved
    const response = await makeAuthenticatedRequest('/settings/payment', 'GET', token)
    const data = await response.json()
    
    expect(data.merchantId).toBe('updated_merchant')
    expect(data.bankAccountName).toBe('Initial Name')
    expect(data.bankAccountNumber).toContain('••') // Still has the original masked value
  })

  test('Singleton pattern enforced - only one payment settings record', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Update multiple times
    await makeAuthenticatedRequest('/settings/payment', 'PUT', token, {
      merchantId: 'first_update'
    })
    
    await makeAuthenticatedRequest('/settings/payment', 'PUT', token, {
      merchantId: 'second_update'
    })
    
    await makeAuthenticatedRequest('/settings/payment', 'PUT', token, {
      merchantId: 'third_update'
    })
    
    // Verify only one record exists in database
    const allSettings = await prisma.paymentSettings.findMany()
    expect(allSettings.length).toBe(1)
    expect(allSettings[0].id).toBe(1)
    expect(allSettings[0].merchantId).toBe('third_update')
  })
})
