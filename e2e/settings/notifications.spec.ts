import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'

/**
 * Notification Settings E2E Test Suite - P11-T029
 * Validates: Requirements 10, 26
 * 
 * Tests notification settings API with focus on secret masking and security:
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
  managerWithSettings: {
    email: 'manager-settings@jessy.test',
    password: 'managersettings123',
    role: 'Manager',
    permissions: ['orders', 'products', 'settings']
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

test.describe('Notification Settings API - Secret Masking', () => {
  test('GET returns masked secrets with correct format', async () => {
    // Authenticate as owner
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // First, PUT some notification settings with known values
    const testSettings = {
      emailEnabled: true,
      pushEnabled: true,
      resendApiKey: 're_live_abc123xyz789def456ghi012', // 32 chars
      oneSignalAppId: 'ab1234567890-cd-ef-gh-9a21', // 28 chars
      oneSignalApiKey: 'OSabc123def456ghi789jkl012KEY1', // 32 chars
    }
    
    const putResponse = await makeAuthenticatedRequest(
      '/settings/notifications',
      'PUT',
      token,
      testSettings
    )
    expect(putResponse.status).toBe(200)
    
    // Now GET the settings
    const getResponse = await makeAuthenticatedRequest('/settings/notifications', 'GET', token)
    expect(getResponse.status).toBe(200)
    
    const data = await getResponse.json()
    
    // Verify all secret fields are masked
    expect(data.resendApiKey).toContain('••')
    expect(data.oneSignalAppId).toContain('••')
    expect(data.oneSignalApiKey).toContain('••')
    
    // Verify masking format is correct
    expect(verifyMaskingFormat(data.resendApiKey, testSettings.resendApiKey.length)).toBe(true)
    expect(verifyMaskingFormat(data.oneSignalAppId, testSettings.oneSignalAppId.length)).toBe(true)
    expect(verifyMaskingFormat(data.oneSignalApiKey, testSettings.oneSignalApiKey.length)).toBe(true)
    
    // Verify boolean fields are not masked
    expect(data.emailEnabled).toBe(true)
    expect(data.pushEnabled).toBe(true)
    
    // Verify raw secrets are NOT in response
    expect(data.resendApiKey).not.toBe(testSettings.resendApiKey)
    expect(data.oneSignalAppId).not.toBe(testSettings.oneSignalAppId)
    expect(data.oneSignalApiKey).not.toBe(testSettings.oneSignalApiKey)
  })

  test('PUT updates and returns masked secrets', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const newSettings = {
      emailEnabled: false,
      pushEnabled: true,
      resendApiKey: 're_test_xyz789abc456def123ghi',
      oneSignalAppId: 'cd5678901234-ef-gh-ij-8b43',
      oneSignalApiKey: 'OS987yxw654vut321srq098PON2',
    }
    
    const response = await makeAuthenticatedRequest(
      '/settings/notifications',
      'PUT',
      token,
      newSettings
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    // Verify response contains masked secrets, not raw values
    expect(data.resendApiKey).toContain('••')
    expect(data.oneSignalAppId).toContain('••')
    expect(data.oneSignalApiKey).toContain('••')
    
    // Verify raw values NOT returned
    expect(data.resendApiKey).not.toBe(newSettings.resendApiKey)
    expect(data.oneSignalAppId).not.toBe(newSettings.oneSignalAppId)
    expect(data.oneSignalApiKey).not.toBe(newSettings.oneSignalApiKey)
    
    // Verify boolean fields updated correctly
    expect(data.emailEnabled).toBe(false)
    expect(data.pushEnabled).toBe(true)
  })

  test('Short secrets are fully masked', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const shortSettings = {
      resendApiKey: 'abc', // 3 chars - should be fully masked
      oneSignalAppId: 'xy12', // 4 chars - should be fully masked
      oneSignalApiKey: 'short', // 5 chars - should be fully masked
    }
    
    const response = await makeAuthenticatedRequest(
      '/settings/notifications',
      'PUT',
      token,
      shortSettings
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    // All short secrets should be masked as exactly 6 bullets
    expect(data.resendApiKey).toBe('••••••')
    expect(data.oneSignalAppId).toBe('••••••')
    expect(data.oneSignalApiKey).toBe('••••••')
  })

  test('Empty secrets return empty string', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const emptySettings = {
      emailEnabled: true,
      pushEnabled: false,
      resendApiKey: '',
      oneSignalAppId: '',
      oneSignalApiKey: '',
    }
    
    const response = await makeAuthenticatedRequest(
      '/settings/notifications',
      'PUT',
      token,
      emptySettings
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    // All empty secrets should return empty string
    expect(data.resendApiKey).toBe('')
    expect(data.oneSignalAppId).toBe('')
    expect(data.oneSignalApiKey).toBe('')
  })
})

test.describe('Notification Settings API - Audit Trail Security', () => {
  test('Audit log does not contain secret values', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const secretSettings = {
      emailEnabled: true,
      pushEnabled: true,
      resendApiKey: 're_secret_key_that_should_not_appear_in_audit',
      oneSignalAppId: 'secret_app_id_not_in_audit',
      oneSignalApiKey: 'secret_api_key_not_in_audit',
    }
    
    // Update settings
    const response = await makeAuthenticatedRequest(
      '/settings/notifications',
      'PUT',
      token,
      secretSettings
    )
    expect(response.status).toBe(200)
    
    // Query audit log for NOTIFICATION_SETTINGS_UPDATED entry
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'NOTIFICATION_SETTINGS_UPDATED',
        entity: 'NotificationSettings',
      },
      orderBy: { createdAt: 'desc' },
    })
    
    expect(auditLog).not.toBeNull()
    
    if (auditLog) {
      const details = JSON.parse(auditLog.details)
      
      // Verify secrets are NOT in audit log details
      expect(JSON.stringify(details)).not.toContain('re_secret_key')
      expect(JSON.stringify(details)).not.toContain('secret_app_id')
      expect(JSON.stringify(details)).not.toContain('secret_api_key')
      
      // Verify non-secret fields ARE in audit log
      expect(details.emailEnabled).toBe(true)
      expect(details.pushEnabled).toBe(true)
      
      // Verify updated flag is present
      expect(details.updated).toBe(true)
    }
  })
})

test.describe('Notification Settings API - Authorization', () => {
  test('Unauthorized request returns 401', async () => {
    // Call GET without auth token
    const getResponse = await makeAuthenticatedRequest('/settings/notifications', 'GET')
    expect(getResponse.status).toBe(401)
    
    const getData = await getResponse.json()
    expect(getData.error).toContain('Unauthorized')
    
    // Call PUT without auth token
    const putResponse = await makeAuthenticatedRequest(
      '/settings/notifications',
      'PUT',
      undefined,
      { emailEnabled: false }
    )
    expect(putResponse.status).toBe(401)
    
    const putData = await putResponse.json()
    expect(putData.error).toContain('Unauthorized')
  })

  test('Staff without settings permission returns 403', async () => {
    // Manager without settings permission
    const token = await getStaffToken(testUsers.manager.email, testUsers.manager.password)
    if (!token) test.skip()
    
    const getResponse = await makeAuthenticatedRequest('/settings/notifications', 'GET', token)
    expect(getResponse.status).toBe(403)
    
    const getData = await getResponse.json()
    expect(getData.error).toContain('settings')
  })

  test('Staff with settings permission can access', async () => {
    // This test requires a staff account with settings permission to exist
    // Skip if the test account doesn't exist yet
    const token = await getStaffToken(testUsers.managerWithSettings.email, testUsers.managerWithSettings.password)
    if (!token) {
      console.log('Skipping: Test account with settings permission not found')
      test.skip()
    }
    
    const response = await makeAuthenticatedRequest('/settings/notifications', 'GET', token)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('emailEnabled')
    expect(data).toHaveProperty('pushEnabled')
  })

  test('Owner role has implicit access', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const getResponse = await makeAuthenticatedRequest('/settings/notifications', 'GET', token)
    expect(getResponse.status).toBe(200)
    
    const putResponse = await makeAuthenticatedRequest(
      '/settings/notifications',
      'PUT',
      token,
      { emailEnabled: true, pushEnabled: true }
    )
    expect(putResponse.status).toBe(200)
  })
})

test.describe('Notification Settings API - Data Persistence', () => {
  test('Settings persist across requests', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const uniqueSettings = {
      emailEnabled: false,
      pushEnabled: true,
      resendApiKey: `re_persist_test_${Date.now()}`,
      oneSignalAppId: `app_persist_${Date.now()}`,
      oneSignalApiKey: `key_persist_${Date.now()}`,
    }
    
    // Update settings
    const putResponse = await makeAuthenticatedRequest(
      '/settings/notifications',
      'PUT',
      token,
      uniqueSettings
    )
    expect(putResponse.status).toBe(200)
    
    // Retrieve settings
    const getResponse = await makeAuthenticatedRequest('/settings/notifications', 'GET', token)
    expect(getResponse.status).toBe(200)
    
    const data = await getResponse.json()
    
    // Verify boolean values persisted
    expect(data.emailEnabled).toBe(false)
    expect(data.pushEnabled).toBe(true)
    
    // Verify secrets were stored (returned masked)
    expect(data.resendApiKey).toContain('••')
    expect(data.oneSignalAppId).toContain('••')
    expect(data.oneSignalApiKey).toContain('••')
  })

  test('Partial updates preserve other fields', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Set initial complete settings
    const initialSettings = {
      emailEnabled: true,
      pushEnabled: true,
      resendApiKey: 're_initial_full_key_abc123',
      oneSignalAppId: 'app_initial_xyz789',
      oneSignalApiKey: 'key_initial_def456',
    }
    
    await makeAuthenticatedRequest('/settings/notifications', 'PUT', token, initialSettings)
    
    // Update only emailEnabled
    const partialUpdate = {
      emailEnabled: false,
    }
    
    const response = await makeAuthenticatedRequest(
      '/settings/notifications',
      'PUT',
      token,
      partialUpdate
    )
    expect(response.status).toBe(200)
    
    // Verify all fields still exist
    const data = await response.json()
    expect(data.emailEnabled).toBe(false) // Updated
    expect(data.pushEnabled).toBe(true) // Preserved
    expect(data.resendApiKey).toContain('••') // Preserved (masked)
    expect(data.oneSignalAppId).toContain('••') // Preserved (masked)
    expect(data.oneSignalApiKey).toContain('••') // Preserved (masked)
  })
})

test.describe('Notification Settings API - Boolean Field Handling', () => {
  test('emailEnabled and pushEnabled work correctly', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Test all boolean combinations
    const testCases = [
      { emailEnabled: true, pushEnabled: true },
      { emailEnabled: true, pushEnabled: false },
      { emailEnabled: false, pushEnabled: true },
      { emailEnabled: false, pushEnabled: false },
    ]
    
    for (const testCase of testCases) {
      const response = await makeAuthenticatedRequest(
        '/settings/notifications',
        'PUT',
        token,
        testCase
      )
      
      expect(response.status).toBe(200)
      const data = await response.json()
      
      expect(data.emailEnabled).toBe(testCase.emailEnabled)
      expect(data.pushEnabled).toBe(testCase.pushEnabled)
    }
  })
})
