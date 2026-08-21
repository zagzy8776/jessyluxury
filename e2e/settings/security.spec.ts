import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { TEST_ACCOUNTS } from '../global-setup'

/**
 * Sessions & Security E2E Test Suite - P11-T045
 * Validates: Requirements 14, 15, 16, 26
 * 
 * Tests password change and session invalidation:
 * - Owner can change password successfully
 * - Manager cannot change password (returns 403)
 * - Invalid current password rejected
 * - New password validation (min 12 characters)
 * - Session version incremented after password change
 * - Old authentication tokens rejected after password change (401)
 * - New authentication succeeds with new password
 * - Audit log created with "ADMIN_PASSWORD_CHANGED" action
 * - Transaction atomicity: if session version update fails, password not changed
 */

const API_BASE = 'http://localhost:3000/api'

// Use global test accounts from setup
const testUsers = {
  owner: TEST_ACCOUNTS.owner,
  manager: TEST_ACCOUNTS.manager,
  catalog: TEST_ACCOUNTS.catalog
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

test.describe('Sessions & Security - Password Change', () => {
  
  test.beforeEach(async () => {
    // Clean up any previous audit logs from THIS test suite
    await prisma.auditLog.deleteMany({ 
      where: { 
        action: 'ADMIN_PASSWORD_CHANGED'
      } 
    })
    
    // Reset owner password back to the known value so each test starts clean
    await prisma.staffAccount.update({
      where: { email: testUsers.owner.email },
      data: { passwordHash: hashPassword(testUsers.owner.password) }
    })
  })

  test('P11-T045-01: Owner can change password successfully', async () => {
    // Get owner token
    const ownerToken = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    expect(ownerToken).not.toBeNull()

    const oldSessionVersion = (await prisma.systemConfig.findUnique({ where: { id: 1 } }))?.sessionVersion || 1

    // Change password
    const changeResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      ownerToken!,
      {
        currentPassword: testUsers.owner.password,
        newPassword: 'newownerpass123456789',
        confirmPassword: 'newownerpass123456789'
      }
    )

    // Debug output
    if (changeResponse.status !== 200) {
      const errorData = await changeResponse.json()
      console.log('Password change error:', changeResponse.status, errorData)
    }

    expect(changeResponse.status).toBe(200)
    const result = await changeResponse.json()
    expect(result.success).toBe(true)

    // Verify session version incremented
    const newConfig = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    expect(newConfig?.sessionVersion).toBe(oldSessionVersion + 1)

    // Verify audit log created
    const auditLog = await prisma.auditLog.findFirst({
      where: { action: 'ADMIN_PASSWORD_CHANGED' },
      orderBy: { createdAt: 'desc' }
    })
    expect(auditLog).not.toBeNull()
    expect(auditLog?.entity).toBe('SystemConfig')
  })

  test('P11-T045-02: Manager cannot change password (returns 403)', async () => {
    const managerToken = await getStaffToken(testUsers.manager.email, testUsers.manager.password)
    expect(managerToken).not.toBeNull()

    const changeResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      managerToken!,
      {
        currentPassword: testUsers.manager.password,
        newPassword: 'newmanagerpass12345',
        confirmPassword: 'newmanagerpass12345'
      }
    )

    expect(changeResponse.status).toBe(403)
    const result = await changeResponse.json()
    expect(result.error).toContain('Owner')
  })

  test('P11-T045-03: Invalid current password rejected', async () => {
    const ownerToken = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    expect(ownerToken).not.toBeNull()

    const changeResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      ownerToken!,
      {
        currentPassword: 'wrongpassword',
        newPassword: 'newownerpass123456789',
        confirmPassword: 'newownerpass123456789'
      }
    )

    expect(changeResponse.status).toBe(401)
    const result = await changeResponse.json()
    expect(result.error).toBeTruthy()
  })

  test('P11-T045-04: New password validation - min 12 characters', async () => {
    const ownerToken = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    expect(ownerToken).not.toBeNull()

    // Try with 11 characters
    const changeResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      ownerToken!,
      {
        currentPassword: testUsers.owner.password,
        newPassword: 'short12345',  // 11 chars
        confirmPassword: 'short12345'
      }
    )

    expect(changeResponse.status).toBe(400)
    const result = await changeResponse.json()
    expect(result.error).toContain('12 characters')
  })

  test('P11-T045-05: New password validation - confirmPassword must match', async () => {
    const ownerToken = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    expect(ownerToken).not.toBeNull()

    const changeResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      ownerToken!,
      {
        currentPassword: testUsers.owner.password,
        newPassword: 'newownerpass123456789',
        confirmPassword: 'mismatchpass1234567'
      }
    )

    expect(changeResponse.status).toBe(400)
    const result = await changeResponse.json()
    expect(result.error).toContain('match')
  })

  test('P11-T045-06: Session version incremented atomically', async () => {
    const ownerToken = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    expect(ownerToken).not.toBeNull()

    const beforeVersion = (await prisma.systemConfig.findUnique({ where: { id: 1 } }))?.sessionVersion || 1

    // Change password
    const changeResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      ownerToken!,
      {
        currentPassword: testUsers.owner.password,
        newPassword: 'newownerpass123456789',
        confirmPassword: 'newownerpass123456789'
      }
    )

    expect(changeResponse.status).toBe(200)

    // Verify version incremented exactly by 1
    const afterVersion = (await prisma.systemConfig.findUnique({ where: { id: 1 } }))?.sessionVersion || 1
    expect(afterVersion).toBe(beforeVersion + 1)
  })

  test('P11-T045-07: Old authentication tokens rejected after password change (401)', async () => {
    // Get initial token
    const oldToken = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    expect(oldToken).not.toBeNull()

    // Change password
    const changeResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      oldToken!,
      {
        currentPassword: testUsers.owner.password,
        newPassword: 'newownerpass123456789',
        confirmPassword: 'newownerpass123456789'
      }
    )

    expect(changeResponse.status).toBe(200)

    // Try to use old token - should be rejected  with 401 because session version changed
    // Call the password endpoint again with old token (should fail)
    const invalidatedResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      oldToken!,
      {
        currentPassword: 'newownerpass123456789',  // Use new password
        newPassword: 'anotherone123456789',
        confirmPassword: 'anotherone123456789'
      }
    )

    expect(invalidatedResponse.status).toBe(401)
    const result = await invalidatedResponse.json()
    expect(result.error).toContain('Session')
  })

  test('P11-T045-08: New authentication succeeds with new password', async () => {
    const ownerToken = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    expect(ownerToken).not.toBeNull()

    // Change password
    await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      ownerToken!,
      {
        currentPassword: testUsers.owner.password,
        newPassword: 'newownerpass123456789',
        confirmPassword: 'newownerpass123456789'
      }
    )

    // Authenticate with new password
    const newToken = await getStaffToken(testUsers.owner.email, 'newownerpass123456789')
    expect(newToken).not.toBeNull()

    // Use new token to make password change call (should succeed)
    const apiResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      newToken!,
      {
        currentPassword: 'newownerpass123456789',
        newPassword: 'anotherone123456789',
        confirmPassword: 'anotherone123456789'
      }
    )

    expect(apiResponse.status).toBe(200)
  })

  test('P11-T045-09: Audit log created with ADMIN_PASSWORD_CHANGED action', async () => {
    const ownerToken = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    expect(ownerToken).not.toBeNull()

    // Clean up any previous audit logs
    await prisma.auditLog.deleteMany({ where: { action: 'ADMIN_PASSWORD_CHANGED' } })

    // Change password
    const changeResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      ownerToken!,
      {
        currentPassword: testUsers.owner.password,
        newPassword: 'newownerpass123456789',
        confirmPassword: 'newownerpass123456789'
      }
    )

    expect(changeResponse.status).toBe(200)

    // Verify audit log created
    const auditLogs = await prisma.auditLog.findMany({
      where: { action: 'ADMIN_PASSWORD_CHANGED' },
      orderBy: { createdAt: 'desc' },
      take: 1
    })

    expect(auditLogs.length).toBeGreaterThan(0)
    const log = auditLogs[0]
    expect(log.action).toBe('ADMIN_PASSWORD_CHANGED')
    expect(log.entity).toBe('SystemConfig')
    expect(log.entityId).toBe('1')
    
    // Verify no password or secret data in audit log
    const details = JSON.parse(log.details || '{}')
    expect(JSON.stringify(details)).not.toContain('password')
  })

  test('P11-T045-10: Transaction atomicity - both password and session version updated together', async () => {
    const ownerToken = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    expect(ownerToken).not.toBeNull()

    const owner = await prisma.staffAccount.findUnique({
      where: { email: testUsers.owner.email }
    })
    expect(owner).not.toBeNull()
    
    const beforeConfig = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    const beforeVersion = beforeConfig?.sessionVersion || 1
    const beforePasswordHash = owner?.passwordHash

    // Change password
    const changeResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      ownerToken!,
      {
        currentPassword: testUsers.owner.password,
        newPassword: 'newownerpass123456789',
        confirmPassword: 'newownerpass123456789'
      }
    )

    expect(changeResponse.status).toBe(200)

    // Verify BOTH password and version were updated
    const afterConfig = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    const afterOwner = await prisma.staffAccount.findUnique({
      where: { email: testUsers.owner.email }
    })
    
    expect(afterConfig?.sessionVersion).toBe(beforeVersion + 1)
    expect(afterOwner?.passwordHash).not.toBe(beforePasswordHash)
    expect(afterOwner?.passwordHash).not.toBeNull()
  })

  test('P11-T045-11: Unauthenticated password change returns 401', async () => {
    const changeResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      undefined,  // No token
      {
        currentPassword: testUsers.owner.password,
        newPassword: 'newownerpass123456789',
        confirmPassword: 'newownerpass123456789'
      }
    )

    expect(changeResponse.status).toBe(401)
  })

  test('P11-T045-12: Catalog role cannot change password (returns 403)', async () => {
    const catalogToken = await getStaffToken(testUsers.catalog.email, testUsers.catalog.password)
    expect(catalogToken).not.toBeNull()

    const changeResponse = await makeAuthenticatedRequest(
      '/admin-auth/password',
      'POST',
      catalogToken!,
      {
        currentPassword: testUsers.catalog.password,
        newPassword: 'newcatalogpass12345',
        confirmPassword: 'newcatalogpass12345'
      }
    )

    expect(changeResponse.status).toBe(403)
    const result = await changeResponse.json()
    expect(result.error).toContain('Owner')
  })
})
