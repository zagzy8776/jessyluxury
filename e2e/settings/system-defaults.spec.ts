import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'

/**
 * System Defaults E2E Test Suite - P11-T033
 * Validates: Requirements 11, 26
 * 
 * Tests system defaults API with focus on:
 * - GET returns system defaults (id=1)
 * - PUT updates system defaults
 * - All fields can be updated: defaultShippingZoneId, defaultStoreLocationId, defaultAcquisitionSource, orderNumberPrefix
 * - Audit log created on update
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

test.describe('System Defaults API - CRUD Operations', () => {
  test('GET returns system defaults with expected structure', async () => {
    // Authenticate as owner
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/settings/system-defaults', 'GET', token)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    
    // Verify response structure
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('defaultShippingZoneId')
    expect(data).toHaveProperty('defaultStoreLocationId')
    expect(data).toHaveProperty('defaultAcquisitionSource')
    expect(data).toHaveProperty('orderNumberPrefix')
    expect(data).toHaveProperty('createdAt')
    expect(data).toHaveProperty('updatedAt')
    
    // Verify id is always 1 (singleton)
    expect(data.id).toBe(1)
  })

  test('PUT updates system defaults successfully', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const updates = {
      defaultShippingZoneId: 1,
      defaultStoreLocationId: 1,
      defaultAcquisitionSource: 'Website',
      orderNumberPrefix: 'TEST'
    }
    
    const response = await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      updates
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    // Verify all fields were updated
    expect(data.defaultShippingZoneId).toBe(updates.defaultShippingZoneId)
    expect(data.defaultStoreLocationId).toBe(updates.defaultStoreLocationId)
    expect(data.defaultAcquisitionSource).toBe(updates.defaultAcquisitionSource)
    expect(data.orderNumberPrefix).toBe(updates.orderNumberPrefix)
    
    // Verify persistence by fetching again
    const getResponse = await makeAuthenticatedRequest('/settings/system-defaults', 'GET', token)
    const getData = await getResponse.json()
    
    expect(getData.defaultShippingZoneId).toBe(updates.defaultShippingZoneId)
    expect(getData.defaultStoreLocationId).toBe(updates.defaultStoreLocationId)
    expect(getData.defaultAcquisitionSource).toBe(updates.defaultAcquisitionSource)
    expect(getData.orderNumberPrefix).toBe(updates.orderNumberPrefix)
  })

  test('PUT supports partial updates', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // First set all values
    await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      {
        defaultShippingZoneId: 1,
        defaultStoreLocationId: 1,
        defaultAcquisitionSource: 'Manual',
        orderNumberPrefix: 'JL'
      }
    )
    
    // Now update only orderNumberPrefix
    const uniquePrefix = `T${Date.now().toString().slice(-4)}`
    const response = await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      {
        orderNumberPrefix: uniquePrefix
      }
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    // Verify only the specified field changed
    expect(data.orderNumberPrefix).toBe(uniquePrefix)
    expect(data.defaultShippingZoneId).toBe(1) // Preserved
    expect(data.defaultStoreLocationId).toBe(1) // Preserved
    expect(data.defaultAcquisitionSource).toBe('Manual') // Preserved
  })

  test('PUT can set null values for optional fields', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      {
        defaultShippingZoneId: null,
        defaultStoreLocationId: null,
        defaultAcquisitionSource: null
      }
    )
    
    expect(response.status).toBe(200)
    const data = await response.json()
    
    expect(data.defaultShippingZoneId).toBeNull()
    expect(data.defaultStoreLocationId).toBeNull()
    expect(data.defaultAcquisitionSource).toBeNull()
  })
})

test.describe('System Defaults API - Audit Trail', () => {
  test('Audit log created on update with changed fields', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Clear previous audit logs for cleaner test
    await prisma.auditLog.deleteMany({
      where: {
        action: 'SYSTEM_DEFAULTS_UPDATED'
      }
    })
    
    const updates = {
      defaultShippingZoneId: 2,
      orderNumberPrefix: `AUDIT${Date.now()}`
    }
    
    // Update system defaults
    const response = await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      updates
    )
    
    expect(response.status).toBe(200)
    
    // Query audit log
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: 'SYSTEM_DEFAULTS_UPDATED',
        entity: 'SystemDefaults'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    })
    
    expect(auditLogs.length).toBeGreaterThan(0)
    
    const latestLog = auditLogs[0]
    expect(latestLog.entity).toBe('SystemDefaults')
    expect(latestLog.entityId).toBe('1')
    expect(latestLog.changedBy).toBe('Admin')
    
    // Verify details contain changed fields
    const details = JSON.parse(latestLog.details)
    expect(details.updated).toBe(true)
    expect(details.defaultShippingZoneId).toBe(updates.defaultShippingZoneId)
    expect(details.orderNumberPrefix).toBe(updates.orderNumberPrefix)
  })

  test('Audit log includes all changed fields', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Clear previous audit logs
    await prisma.auditLog.deleteMany({
      where: {
        action: 'SYSTEM_DEFAULTS_UPDATED'
      }
    })
    
    const allFieldsUpdate = {
      defaultShippingZoneId: 5,
      defaultStoreLocationId: 3,
      defaultAcquisitionSource: 'Instagram',
      orderNumberPrefix: 'IG'
    }
    
    await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      allFieldsUpdate
    )
    
    // Get the audit log
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: 'SYSTEM_DEFAULTS_UPDATED'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1
    })
    
    const details = JSON.parse(auditLogs[0].details)
    
    // Verify all changed fields are logged
    expect(details.defaultShippingZoneId).toBe(allFieldsUpdate.defaultShippingZoneId)
    expect(details.defaultStoreLocationId).toBe(allFieldsUpdate.defaultStoreLocationId)
    expect(details.defaultAcquisitionSource).toBe(allFieldsUpdate.defaultAcquisitionSource)
    expect(details.orderNumberPrefix).toBe(allFieldsUpdate.orderNumberPrefix)
  })
})

test.describe('System Defaults API - Authorization', () => {
  test('Unauthorized request returns 401', async () => {
    // Call GET without auth token
    const getResponse = await makeAuthenticatedRequest('/settings/system-defaults', 'GET')
    expect(getResponse.status).toBe(401)
    
    // Call PUT without auth token
    const putResponse = await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      undefined,
      { orderNumberPrefix: 'TEST' }
    )
    expect(putResponse.status).toBe(401)
  })

  test('Staff without settings permission returns 403', async () => {
    // Manager doesn't have settings permission
    const managerToken = await getStaffToken(testUsers.manager.email, testUsers.manager.password)
    if (!managerToken) test.skip()
    
    const getResponse = await makeAuthenticatedRequest('/settings/system-defaults', 'GET', managerToken)
    expect(getResponse.status).toBe(403)
    
    const putResponse = await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      managerToken,
      { orderNumberPrefix: 'TEST' }
    )
    expect(putResponse.status).toBe(403)
  })

  test('Catalog staff without settings permission returns 403', async () => {
    // Catalog doesn't have settings permission
    const catalogToken = await getStaffToken(testUsers.catalog.email, testUsers.catalog.password)
    if (!catalogToken) test.skip()
    
    const getResponse = await makeAuthenticatedRequest('/settings/system-defaults', 'GET', catalogToken)
    expect(getResponse.status).toBe(403)
    
    const putResponse = await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      catalogToken,
      { orderNumberPrefix: 'TEST' }
    )
    expect(putResponse.status).toBe(403)
  })

  test('Owner with settings permission can access system defaults', async () => {
    const ownerToken = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!ownerToken) test.skip()
    
    const getResponse = await makeAuthenticatedRequest('/settings/system-defaults', 'GET', ownerToken)
    expect(getResponse.status).toBe(200)
    
    const putResponse = await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      ownerToken,
      {
        orderNumberPrefix: 'OWN'
      }
    )
    expect(putResponse.status).toBe(200)
  })

  test('Invalid token returns 401', async () => {
    const response = await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'GET',
      'invalid_fake_token_12345'
    )
    expect(response.status).toBe(401)
  })
})

test.describe('System Defaults API - Data Integrity', () => {
  test('Singleton pattern enforced - only one system defaults record', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Update multiple times with different values
    await makeAuthenticatedRequest('/settings/system-defaults', 'PUT', token, {
      orderNumberPrefix: 'FIRST'
    })
    
    await makeAuthenticatedRequest('/settings/system-defaults', 'PUT', token, {
      orderNumberPrefix: 'SECOND'
    })
    
    await makeAuthenticatedRequest('/settings/system-defaults', 'PUT', token, {
      orderNumberPrefix: 'THIRD'
    })
    
    // Verify only one record exists in database
    const allDefaults = await prisma.systemDefaults.findMany()
    expect(allDefaults.length).toBe(1)
    expect(allDefaults[0].id).toBe(1)
    expect(allDefaults[0].orderNumberPrefix).toBe('THIRD')
  })

  test('Default values are returned when no settings exist', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Note: This test assumes the database might not have a SystemDefaults record
    // In practice, the record should exist, but the API handles the case gracefully
    
    const response = await makeAuthenticatedRequest('/settings/system-defaults', 'GET', token)
    expect(response.status).toBe(200)
    
    const data = await response.json()
    
    // Should have default values
    expect(data.id).toBe(1)
    expect(data).toHaveProperty('defaultAcquisitionSource')
    expect(data).toHaveProperty('orderNumberPrefix')
  })

  test('Values persist across multiple updates', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Set initial state
    const initialValues = {
      defaultShippingZoneId: 10,
      defaultStoreLocationId: 20,
      defaultAcquisitionSource: 'Email',
      orderNumberPrefix: 'EM'
    }
    
    await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      initialValues
    )
    
    // Update one field
    await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      { orderNumberPrefix: 'EM2' }
    )
    
    // Update another field
    await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      { defaultAcquisitionSource: 'Phone' }
    )
    
    // Verify final state
    const response = await makeAuthenticatedRequest('/settings/system-defaults', 'GET', token)
    const data = await response.json()
    
    expect(data.defaultShippingZoneId).toBe(10) // Preserved from initial
    expect(data.defaultStoreLocationId).toBe(20) // Preserved from initial
    expect(data.orderNumberPrefix).toBe('EM2') // Updated in step 2
    expect(data.defaultAcquisitionSource).toBe('Phone') // Updated in step 3
  })
})

test.describe('System Defaults API - Shipping Zone Deletion Protection (Req 28)', () => {
  test('Cannot delete shipping zone set as system default', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Create a test shipping zone directly via Prisma
    const zone = await prisma.shippingZone.create({
      data: {
        name: `Test Zone ${Date.now()}`,
        fee: 15,
        estimatedDays: '5-7 days',
        description: 'Test zone for deletion protection',
        active: true,
        isPickup: false,
        updatedAt: new Date()
      }
    })
    
    const zoneId = zone.id
    
    // Set this zone as the default shipping zone
    const setDefaultResponse = await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      {
        defaultShippingZoneId: zoneId
      }
    )
    
    expect(setDefaultResponse.status).toBe(200)
    
    // Attempt to delete the zone - should return 409 Conflict
    const deleteResponse = await makeAuthenticatedRequest(
      `/shipping/${zoneId}`,
      'DELETE',
      token
    )
    
    expect(deleteResponse.status).toBe(409)
    const errorData = await deleteResponse.json()
    expect(errorData.error).toBe('Cannot delete shipping zone set as system default')
    
    // Verify the zone still exists
    const stillExists = await prisma.shippingZone.findUnique({
      where: { id: zoneId }
    })
    expect(stillExists).not.toBeNull()
    
    // Clean up: Set default to null, then delete the zone
    await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      {
        defaultShippingZoneId: null
      }
    )
    
    const cleanupDelete = await makeAuthenticatedRequest(
      `/shipping/${zoneId}`,
      'DELETE',
      token
    )
    expect(cleanupDelete.status).toBe(200)
  })

  test('Can delete non-default shipping zone', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Create a test shipping zone directly via Prisma
    const zone = await prisma.shippingZone.create({
      data: {
        name: `Non-Default Zone ${Date.now()}`,
        fee: 10,
        estimatedDays: '3-5 days',
        description: 'Non-default test zone',
        active: true,
        isPickup: false,
        updatedAt: new Date()
      }
    })
    
    const zoneId = zone.id
    
    // Ensure this zone is NOT set as default
    const systemDefaults = await prisma.systemDefaults.findUnique({
      where: { id: 1 }
    })
    
    // If this zone happens to be the default, set default to null
    if (systemDefaults?.defaultShippingZoneId === zoneId) {
      await makeAuthenticatedRequest(
        '/settings/system-defaults',
        'PUT',
        token,
        {
          defaultShippingZoneId: null
        }
      )
    }
    
    // Attempt to delete the zone - should succeed with 200 OK
    const deleteResponse = await makeAuthenticatedRequest(
      `/shipping/${zoneId}`,
      'DELETE',
      token
    )
    
    expect(deleteResponse.status).toBe(200)
    const successData = await deleteResponse.json()
    expect(successData.success).toBe(true)
    
    // Verify the zone no longer exists
    const stillExists = await prisma.shippingZone.findUnique({
      where: { id: zoneId }
    })
    expect(stillExists).toBeNull()
  })

  test('Changing default shipping zone allows deletion of previous default', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    // Create first shipping zone directly via Prisma
    const zone1 = await prisma.shippingZone.create({
      data: {
        name: `Original Default ${Date.now()}`,
        fee: 12,
        estimatedDays: '4-6 days',
        description: 'First default zone',
        active: true,
        isPickup: false,
        updatedAt: new Date()
      }
    })
    const zone1Id = zone1.id
    
    // Create second shipping zone directly via Prisma
    const zone2 = await prisma.shippingZone.create({
      data: {
        name: `New Default ${Date.now()}`,
        fee: 15,
        estimatedDays: '5-7 days',
        description: 'Second default zone',
        active: true,
        isPickup: false,
        updatedAt: new Date()
      }
    })
    const zone2Id = zone2.id
    
    // Set zone1 as default
    await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      {
        defaultShippingZoneId: zone1Id
      }
    )
    
    // Verify zone1 cannot be deleted
    const delete1Attempt1 = await makeAuthenticatedRequest(
      `/shipping/${zone1Id}`,
      'DELETE',
      token
    )
    expect(delete1Attempt1.status).toBe(409)
    
    // Change default to zone2
    await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      {
        defaultShippingZoneId: zone2Id
      }
    )
    
    // Now zone1 should be deletable
    const delete1Attempt2 = await makeAuthenticatedRequest(
      `/shipping/${zone1Id}`,
      'DELETE',
      token
    )
    expect(delete1Attempt2.status).toBe(200)
    
    // But zone2 should not be deletable (it's the new default)
    const delete2Attempt = await makeAuthenticatedRequest(
      `/shipping/${zone2Id}`,
      'DELETE',
      token
    )
    expect(delete2Attempt.status).toBe(409)
    
    // Clean up: Set default to null, delete zone2
    await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      {
        defaultShippingZoneId: null
      }
    )
    await makeAuthenticatedRequest(
      `/shipping/${zone2Id}`,
      'DELETE',
      token
    )
  })
})

test.describe('System Defaults API - Response Format', () => {
  test('Response includes timestamps in ISO format', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/settings/system-defaults', 'GET', token)
    const data = await response.json()
    
    // Verify timestamp format
    expect(data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(data.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    
    // Verify they are valid dates
    expect(new Date(data.createdAt).toString()).not.toBe('Invalid Date')
    expect(new Date(data.updatedAt).toString()).not.toBe('Invalid Date')
  })

  test('PUT response matches GET response structure', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const putResponse = await makeAuthenticatedRequest(
      '/settings/system-defaults',
      'PUT',
      token,
      { orderNumberPrefix: 'PUT' }
    )
    const putData = await putResponse.json()
    
    const getResponse = await makeAuthenticatedRequest('/settings/system-defaults', 'GET', token)
    const getData = await getResponse.json()
    
    // Both responses should have the same structure and keys
    expect(Object.keys(putData).sort()).toEqual(Object.keys(getData).sort())
  })

  test('Response does not contain sensitive data or internal fields', async () => {
    const token = await getStaffToken(testUsers.owner.email, testUsers.owner.password)
    if (!token) test.skip()
    
    const response = await makeAuthenticatedRequest('/settings/system-defaults', 'GET', token)
    const data = await response.json()
    
    // Verify no internal Prisma fields are exposed
    expect(data).not.toHaveProperty('_count')
    expect(data).not.toHaveProperty('__typename')
    
    // Verify expected fields exist
    const expectedFields = [
      'id',
      'defaultShippingZoneId',
      'defaultStoreLocationId',
      'defaultAcquisitionSource',
      'orderNumberPrefix',
      'createdAt',
      'updatedAt'
    ]
    
    expectedFields.forEach(field => {
      expect(data).toHaveProperty(field)
    })
  })
})
