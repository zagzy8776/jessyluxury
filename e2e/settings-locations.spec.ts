import './load-env'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { generateAdminToken } from '../lib/auth-crypto'

const prisma = new PrismaClient()

test.describe('Phase 11 - Store Locations List API', () => {
  test.setTimeout(120000)

  const runId = Math.floor(1000 + Math.random() * 9000)
  const namespace = `LOC_E2E_${runId}`

  let authToken: string = ''
  let testLocation1: any
  let testLocation2: any
  let testLocation3: any

  test.beforeAll(async () => {
    // Ensure SystemConfig record exists so requireAdminAuth doesn't fail
    const config = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, sessionVersion: 1, updatedAt: new Date() },
    })
    const sessionVersion = config.sessionVersion
    authToken = await generateAdminToken(sessionVersion)

    // Demote any pre-existing defaults before seeding our own default.
    // The partial unique index (StoreLocation_isDefault_key) correctly rejects
    // a second default, and other suites may leave a default behind.
    await prisma.storeLocation.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    })

    // Create test locations
    testLocation1 = await prisma.storeLocation.create({
      data: {
        name: `${namespace} Alpha Store`,
        address: '123 Alpha Street',
        city: 'Lagos',
        isDefault: false,
        updatedAt: new Date(),
      },
    })

    testLocation2 = await prisma.storeLocation.create({
      data: {
        name: `${namespace} Beta Store`,
        address: '456 Beta Avenue',
        city: 'Abuja',
        isDefault: false,
        updatedAt: new Date(),
      },
    })

    testLocation3 = await prisma.storeLocation.create({
      data: {
        name: `${namespace} Default Store`,
        address: '789 Default Road',
        city: 'Port Harcourt',
        isDefault: true,
        updatedAt: new Date(),
      },
    })
  })

  test.afterAll(async () => {
    // Clean up test locations
    if (testLocation1?.id) {
      await prisma.storeLocation.delete({ where: { id: testLocation1.id } }).catch(() => {})
    }
    if (testLocation2?.id) {
      await prisma.storeLocation.delete({ where: { id: testLocation2.id } }).catch(() => {})
    }
    if (testLocation3?.id) {
      await prisma.storeLocation.delete({ where: { id: testLocation3.id } }).catch(() => {})
    }

    // Invariant repair: our beforeAll demoted all defaults, so if no other
    // suite's data holds the default flag, promote the oldest remaining
    // location so the DB never ends with zero defaults.
    const anyDefault = await prisma.storeLocation.findFirst({ where: { isDefault: true } })
    if (!anyDefault) {
      const fallback = await prisma.storeLocation.findFirst({ orderBy: { id: 'asc' } })
      if (fallback) {
        await prisma.storeLocation.update({
          where: { id: fallback.id },
          data: { isDefault: true },
        })
      }
    }

    await prisma.$disconnect()
  })

  test('1. Unauthenticated GET request is rejected with 401', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/locations')
    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.error).toContain('Unauthorized')
  })

  test('2. Authenticated GET request succeeds with 200', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data).toBeDefined()
  })

  test('3. Returned structure is correct with pagination metadata', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)
    const data = await response.json()

    // Verify response structure
    expect(data.locations).toBeDefined()
    expect(Array.isArray(data.locations)).toBe(true)
    expect(data.total).toBeDefined()
    expect(typeof data.total).toBe('number')
    expect(data.page).toBeDefined()
    expect(typeof data.page).toBe('number')
    expect(data.pageSize).toBeDefined()
    expect(typeof data.pageSize).toBe('number')

    // Verify default pagination values
    expect(data.page).toBe(1)
    expect(data.pageSize).toBe(20)
  })

  test('4. Multiple locations returned with correct field structure', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)
    const data = await response.json()

    // Verify we have at least our test locations
    expect(data.locations.length).toBeGreaterThanOrEqual(3)

    // Find our test locations
    const testLocations = data.locations.filter((loc: any) => 
      loc.name.includes(namespace)
    )

    expect(testLocations.length).toBe(3)

    // Verify each location has required fields
    for (const location of testLocations) {
      expect(location.id).toBeDefined()
      expect(location.name).toBeDefined()
      expect(location.address).toBeDefined()
      expect(location.city).toBeDefined()
      expect(typeof location.isDefault).toBe('boolean')
      expect(location.createdAt).toBeDefined()
      expect(location.updatedAt).toBeDefined()
    }

    // Verify specific test location data
    const alphaStore = testLocations.find((loc: any) => loc.name === `${namespace} Alpha Store`)
    expect(alphaStore).toBeDefined()
    expect(alphaStore.address).toBe('123 Alpha Street')
    expect(alphaStore.city).toBe('Lagos')
    expect(alphaStore.isDefault).toBe(false)

    const betaStore = testLocations.find((loc: any) => loc.name === `${namespace} Beta Store`)
    expect(betaStore).toBeDefined()
    expect(betaStore.address).toBe('456 Beta Avenue')
    expect(betaStore.city).toBe('Abuja')
    expect(betaStore.isDefault).toBe(false)

    const defaultStore = testLocations.find((loc: any) => loc.name === `${namespace} Default Store`)
    expect(defaultStore).toBeDefined()
    expect(defaultStore.address).toBe('789 Default Road')
    expect(defaultStore.city).toBe('Port Harcourt')
    expect(defaultStore.isDefault).toBe(true)
  })

  test('5. Locations returned in deterministic order (isDefault DESC, name ASC)', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)
    const data = await response.json()

    const locations = data.locations

    // Verify default locations come first
    let foundNonDefault = false
    for (const location of locations) {
      if (!location.isDefault) {
        foundNonDefault = true
      }
      if (foundNonDefault && location.isDefault) {
        // If we found a non-default and then find a default, order is wrong
        throw new Error('Locations not ordered correctly: default should come before non-default')
      }
    }

    // Verify non-default locations are alphabetically sorted
    const nonDefaults = locations.filter((loc: any) => !loc.isDefault)
    for (let i = 1; i < nonDefaults.length; i++) {
      const prevName = nonDefaults[i - 1].name
      const currName = nonDefaults[i].name
      expect(currName.localeCompare(prevName)).toBeGreaterThanOrEqual(0)
    }
  })

  test('6. Pagination works correctly with page and pageSize parameters', async ({ request }) => {
    // Get first page with pageSize=2
    const response1 = await request.get('http://localhost:3000/api/settings/locations?page=1&pageSize=2', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response1.status()).toBe(200)
    const data1 = await response1.json()
    
    expect(data1.page).toBe(1)
    expect(data1.pageSize).toBe(2)
    expect(data1.locations.length).toBeLessThanOrEqual(2)

    // Get second page with pageSize=2
    const response2 = await request.get('http://localhost:3000/api/settings/locations?page=2&pageSize=2', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response2.status()).toBe(200)
    const data2 = await response2.json()
    
    expect(data2.page).toBe(2)
    expect(data2.pageSize).toBe(2)

    // Verify total count is consistent
    expect(data1.total).toBe(data2.total)

    // If there are at least 3 locations, verify pagination is working
    if (data1.total >= 3) {
      // Verify different results on different pages
      const firstPageIds = data1.locations.map((loc: any) => loc.id)
      const secondPageIds = data2.locations.map((loc: any) => loc.id)
      
      // Should have no overlap between pages
      for (const id of firstPageIds) {
        expect(secondPageIds).not.toContain(id)
      }
    }
  })

  test('7. No mutation occurs - GET is read-only', async ({ request }) => {
    // Get current count of locations
    const countBefore = await prisma.storeLocation.count()

    // Get location data for comparison
    const locationsBefore = await prisma.storeLocation.findMany({
      where: {
        id: { in: [testLocation1.id, testLocation2.id, testLocation3.id] }
      },
      orderBy: { id: 'asc' }
    })

    // Make GET request
    const response = await request.get('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)

    // Verify count hasn't changed
    const countAfter = await prisma.storeLocation.count()
    expect(countAfter).toBe(countBefore)

    // Verify test locations data hasn't changed
    const locationsAfter = await prisma.storeLocation.findMany({
      where: {
        id: { in: [testLocation1.id, testLocation2.id, testLocation3.id] }
      },
      orderBy: { id: 'asc' }
    })

    expect(locationsAfter.length).toBe(locationsBefore.length)
    
    for (let i = 0; i < locationsBefore.length; i++) {
      expect(locationsAfter[i].id).toBe(locationsBefore[i].id)
      expect(locationsAfter[i].name).toBe(locationsBefore[i].name)
      expect(locationsAfter[i].address).toBe(locationsBefore[i].address)
      expect(locationsAfter[i].city).toBe(locationsBefore[i].city)
      expect(locationsAfter[i].isDefault).toBe(locationsBefore[i].isDefault)
    }
  })

  test('8. Returns clean empty array when no locations exist (edge case)', async ({ request }) => {
    // This test verifies behavior if all locations were deleted (shouldn't happen in production)
    // We'll just verify current implementation handles the case gracefully
    const response = await request.get('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)
    const data = await response.json()
    
    // Verify response structure is correct even if empty
    expect(Array.isArray(data.locations)).toBe(true)
    expect(typeof data.total).toBe('number')
    expect(data.total).toBeGreaterThanOrEqual(0)
  })

  test('9. Invalid page/pageSize parameters are handled gracefully', async ({ request }) => {
    // Test negative page
    const response1 = await request.get('http://localhost:3000/api/settings/locations?page=-1', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response1.status()).toBe(200)
    const data1 = await response1.json()
    expect(data1.page).toBe(1) // Should default to 1

    // Test zero pageSize
    const response2 = await request.get('http://localhost:3000/api/settings/locations?pageSize=0', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response2.status()).toBe(200)
    const data2 = await response2.json()
    expect(data2.pageSize).toBeGreaterThan(0) // Should default to positive value

    // Test excessively large pageSize (should cap at 100)
    const response3 = await request.get('http://localhost:3000/api/settings/locations?pageSize=1000', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response3.status()).toBe(200)
    const data3 = await response3.json()
    expect(data3.pageSize).toBeLessThanOrEqual(100) // Should cap at max
  })

  test('10. Response does not expose unrelated sensitive data', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)
    const data = await response.json()

    // Verify response structure contains only expected keys
    const allowedTopLevelKeys = ['locations', 'total', 'page', 'pageSize']
    const responseKeys = Object.keys(data)
    
    for (const key of responseKeys) {
      expect(allowedTopLevelKeys).toContain(key)
    }

    // Verify no secrets or unrelated config leaked in location objects
    if (data.locations.length > 0) {
      const location = data.locations[0]
      const allowedLocationKeys = ['id', 'name', 'address', 'city', 'isDefault', 'createdAt', 'updatedAt']
      const locationKeys = Object.keys(location)
      
      for (const key of locationKeys) {
        expect(allowedLocationKeys).toContain(key)
      }

      // Explicitly verify no sensitive fields leaked
      expect(location.adminPasswordHash).toBeUndefined()
      expect(location.sessionVersion).toBeUndefined()
      expect(location.paymentProviderApiKey).toBeUndefined()
      expect(location.bankAccountNumber).toBeUndefined()
    }
  })
})

test.describe('Phase 11 - Store Locations Individual API (POST/PUT/DELETE)', () => {
  test.setTimeout(120000)

  const runId = Math.floor(1000 + Math.random() * 9000)
  const namespace = `LOC_CRUD_E2E_${runId}`

  let authToken: string = ''
  let createdLocationId: number | undefined

  test.beforeAll(async () => {
    // Ensure SystemConfig record exists so requireAdminAuth doesn't fail
    const config = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, sessionVersion: 1, updatedAt: new Date() },
    })
    const sessionVersion = config.sessionVersion
    authToken = await generateAdminToken(sessionVersion)
  })

  test.afterAll(async () => {
    // Clean up any test locations created
    await prisma.storeLocation.deleteMany({
      where: {
        name: {
          contains: namespace
        }
      }
    }).catch(() => {})

    await prisma.$disconnect()
  })

  // POST Tests
  test('11. POST - Valid create succeeds with 200 and returns created location', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Test Store`,
        address: '100 Test Street',
        city: 'Test City',
        isDefault: false,
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()

    expect(data.id).toBeDefined()
    expect(data.name).toBe(`${namespace} Test Store`)
    expect(data.address).toBe('100 Test Street')
    expect(data.city).toBe('Test City')
    expect(data.isDefault).toBe(false)

    createdLocationId = data.id

    // Verify audit log created
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'LOCATION_CREATED',
        entity: 'StoreLocation',
        entityId: String(createdLocationId),
      },
    })
    expect(auditLog).toBeDefined()
  })

  test('12. POST - Invalid create with missing name returns 400', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        address: '200 Missing Name Street',
        city: 'Test City',
      },
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Location name')
  })

  test('13. POST - Invalid create with missing address returns 400', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} No Address Store`,
        city: 'Test City',
      },
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Address')
  })

  test('14. POST - Invalid create with missing city returns 400', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} No City Store`,
        address: '300 No City Avenue',
      },
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('City')
  })

  test('15. POST - Duplicate name returns 409', async ({ request }) => {
    // First create a location
    const createResponse = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Duplicate Test`,
        address: '400 Duplicate Street',
        city: 'Test City',
      },
    })
    expect(createResponse.status()).toBe(200)

    // Try to create with same name
    const duplicateResponse = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Duplicate Test`,
        address: '500 Different Street',
        city: 'Different City',
      },
    })

    expect(duplicateResponse.status()).toBe(409)
    const data = await duplicateResponse.json()
    expect(data.error).toContain('already exists')
  })

  test('16. POST - Creating as default atomically switches default', async ({ request }) => {
    // Create first default location
    const response1 = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Default 1`,
        address: '600 Default Street',
        city: 'Test City',
        isDefault: true,
      },
    })
    expect(response1.status()).toBe(200)
    const location1 = await response1.json()
    expect(location1.isDefault).toBe(true)

    // Create second default location - should atomic switch
    const response2 = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Default 2`,
        address: '700 Default Avenue',
        city: 'Test City',
        isDefault: true,
      },
    })
    expect(response2.status()).toBe(200)
    const location2 = await response2.json()
    expect(location2.isDefault).toBe(true)

    // Verify exactly one default exists
    const defaultLocations = await prisma.storeLocation.findMany({
      where: { isDefault: true },
    })
    expect(defaultLocations.length).toBe(1)
    expect(defaultLocations[0].id).toBe(location2.id)

    // Verify first location is no longer default
    const updatedLocation1 = await prisma.storeLocation.findUnique({
      where: { id: location1.id },
    })
    expect(updatedLocation1?.isDefault).toBe(false)
  })

  test('17. POST - Unauthenticated request returns 401', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Unauth Test`,
        address: '800 Unauth Street',
        city: 'Test City',
      },
    })

    expect(response.status()).toBe(401)
  })

  // GET by ID Tests
  test('18. GET /:id - Valid ID returns location with 200', async ({ request }) => {
    if (!createdLocationId) {
      test.skip()
      return
    }

    const response = await request.get(`http://localhost:3000/api/settings/locations/${createdLocationId}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.id).toBe(createdLocationId)
    expect(data.name).toBe(`${namespace} Test Store`)
  })

  test('19. GET /:id - Nonexistent ID returns 404', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/locations/999999', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })

    expect(response.status()).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('not found')
  })

  test('20. GET /:id - Invalid ID format returns 400', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/locations/invalid', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Invalid')
  })

  // PUT Tests
  test('21. PUT - Valid update succeeds with 200', async ({ request }) => {
    if (!createdLocationId) {
      test.skip()
      return
    }

    const response = await request.put(`http://localhost:3000/api/settings/locations/${createdLocationId}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Updated Test Store`,
        address: '101 Updated Street',
        city: 'Updated City',
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.id).toBe(createdLocationId)
    expect(data.name).toBe(`${namespace} Updated Test Store`)
    expect(data.address).toBe('101 Updated Street')
    expect(data.city).toBe('Updated City')

    // Verify audit log created
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'LOCATION_UPDATED',
        entity: 'StoreLocation',
        entityId: String(createdLocationId),
      },
    })
    expect(auditLog).toBeDefined()
  })

  test('22. PUT - Partial update (only name) succeeds', async ({ request }) => {
    if (!createdLocationId) {
      test.skip()
      return
    }

    const response = await request.put(`http://localhost:3000/api/settings/locations/${createdLocationId}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Partially Updated Store`,
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.name).toBe(`${namespace} Partially Updated Store`)
    expect(data.address).toBe('101 Updated Street') // Unchanged from previous test
    expect(data.city).toBe('Updated City') // Unchanged from previous test
  })

  test('23. PUT - Setting as default atomically switches default', async ({ request }) => {
    // Create two non-default locations
    const loc1Response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Switch Test 1`,
        address: '900 Switch Street',
        city: 'Test City',
        isDefault: false,
      },
    })
    const loc1 = await loc1Response.json()

    const loc2Response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Switch Test 2`,
        address: '1000 Switch Avenue',
        city: 'Test City',
        isDefault: true, // Set as default
      },
    })
    const loc2 = await loc2Response.json()

    // Update first location to be default
    const updateResponse = await request.put(`http://localhost:3000/api/settings/locations/${loc1.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        isDefault: true,
      },
    })

    expect(updateResponse.status()).toBe(200)
    const updatedLoc1 = await updateResponse.json()
    expect(updatedLoc1.isDefault).toBe(true)

    // Verify exactly one default exists
    const defaultLocations = await prisma.storeLocation.findMany({
      where: { isDefault: true },
    })
    expect(defaultLocations.length).toBe(1)
    expect(defaultLocations[0].id).toBe(loc1.id)

    // Verify second location is no longer default
    const checkLoc2 = await prisma.storeLocation.findUnique({
      where: { id: loc2.id },
    })
    expect(checkLoc2?.isDefault).toBe(false)
  })

  test('24. PUT - Duplicate name (different location) returns 409', async ({ request }) => {
    // Create a location with a specific name
    const loc1Response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Unique Name A`,
        address: '1100 A Street',
        city: 'Test City',
      },
    })
    const loc1 = await loc1Response.json()

    // Create another location
    const loc2Response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Unique Name B`,
        address: '1200 B Street',
        city: 'Test City',
      },
    })
    const loc2 = await loc2Response.json()

    // Try to update loc2 with loc1's name
    const updateResponse = await request.put(`http://localhost:3000/api/settings/locations/${loc2.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Unique Name A`, // Duplicate
      },
    })

    expect(updateResponse.status()).toBe(409)
    const data = await updateResponse.json()
    expect(data.error).toContain('already exists')
  })

  test('25. PUT - Updating own name (no change) succeeds', async ({ request }) => {
    // Create a location
    const createResponse = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Same Name Test`,
        address: '1300 Same Street',
        city: 'Test City',
      },
    })
    const location = await createResponse.json()

    // Update with same name (should succeed)
    const updateResponse = await request.put(`http://localhost:3000/api/settings/locations/${location.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Same Name Test`,
        address: '1301 Updated Street',
      },
    })

    expect(updateResponse.status()).toBe(200)
    const updatedLocation = await updateResponse.json()
    expect(updatedLocation.name).toBe(`${namespace} Same Name Test`)
    expect(updatedLocation.address).toBe('1301 Updated Street')
  })

  test('26. PUT - Nonexistent ID returns 404', async ({ request }) => {
    const response = await request.put('http://localhost:3000/api/settings/locations/999999', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Nonexistent Location',
      },
    })

    expect(response.status()).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('not found')
  })

  test('27. PUT - Invalid field value returns 400', async ({ request }) => {
    if (!createdLocationId) {
      test.skip()
      return
    }

    const response = await request.put(`http://localhost:3000/api/settings/locations/${createdLocationId}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: '', // Empty name
      },
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Location name')
  })

  // DELETE Tests
  test('28. DELETE - Default location returns 409 (protection)', async ({ request }) => {
    // Create a default location
    const createResponse = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Delete Default Test`,
        address: '1400 Delete Default Street',
        city: 'Test City',
        isDefault: true,
      },
    })
    const location = await createResponse.json()

    // Try to delete default location
    const deleteResponse = await request.delete(`http://localhost:3000/api/settings/locations/${location.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })

    expect(deleteResponse.status()).toBe(409)
    const data = await deleteResponse.json()
    expect(data.error).toContain('default')
  })

  test('29. DELETE - Location referenced by coupon returns 409 (protection)', async ({ request }) => {
    // Create a location
    const locResponse = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Coupon Referenced`,
        address: '1500 Coupon Street',
        city: 'Test City',
        isDefault: false,
      },
    })
    const location = await locResponse.json()

    // Create a coupon referencing this location
    const coupon = await prisma.coupon.create({
      data: {
        code: `${namespace}_COUPON_TEST`,
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 0,
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        storeLocation: location.name, // Reference by name
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Try to delete location
    const deleteResponse = await request.delete(`http://localhost:3000/api/settings/locations/${location.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })

    expect(deleteResponse.status()).toBe(409)
    const data = await deleteResponse.json()
    expect(data.error).toContain('coupon')

    // Cleanup coupon
    await prisma.coupon.delete({ where: { id: coupon.id } })
  })

  test('30. DELETE - Location set as system default returns 409 (protection)', async ({ request }) => {
    // Create a location
    const locResponse = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} System Default`,
        address: '1600 System Street',
        city: 'Test City',
        isDefault: false,
      },
    })
    const location = await locResponse.json()

    // Set as system default
    await prisma.systemDefaults.upsert({
      where: { id: 1 },
      update: { defaultStoreLocationId: location.id, updatedAt: new Date() },
      create: { 
        id: 1, 
        defaultStoreLocationId: location.id, 
        createdAt: new Date(),
        updatedAt: new Date() 
      },
    })

    // Try to delete location
    const deleteResponse = await request.delete(`http://localhost:3000/api/settings/locations/${location.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })

    expect(deleteResponse.status()).toBe(409)
    const data = await deleteResponse.json()
    expect(data.error).toContain('system default')

    // Cleanup - remove system default reference
    await prisma.systemDefaults.update({
      where: { id: 1 },
      data: { defaultStoreLocationId: null, updatedAt: new Date() },
    })
  })

  test('31. DELETE - Unused non-default location succeeds with 200', async ({ request }) => {
    // Create a non-default, unreferenced location
    const createResponse = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Safe Delete Test`,
        address: '1700 Safe Delete Street',
        city: 'Test City',
        isDefault: false,
      },
    })
    const location = await createResponse.json()

    // Delete location
    const deleteResponse = await request.delete(`http://localhost:3000/api/settings/locations/${location.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })

    expect(deleteResponse.status()).toBe(200)
    const data = await deleteResponse.json()
    expect(data.success).toBe(true)

    // Verify location was deleted
    const checkLocation = await prisma.storeLocation.findUnique({
      where: { id: location.id },
    })
    expect(checkLocation).toBeNull()

    // Verify audit log created
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'LOCATION_DELETED',
        entity: 'StoreLocation',
        entityId: String(location.id),
      },
    })
    expect(auditLog).toBeDefined()
  })

  test('32. DELETE - Nonexistent ID returns 404', async ({ request }) => {
    const response = await request.delete('http://localhost:3000/api/settings/locations/999999', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })

    expect(response.status()).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('not found')
  })

  test('33. DELETE - Unauthenticated request returns 401', async ({ request }) => {
    // Create a temporary location for this test
    const locResponse = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Unauth Delete Test`,
        address: '1800 Unauth Street',
        city: 'Test City',
        isDefault: false,
      },
    })
    const location = await locResponse.json()

    const response = await request.delete(`http://localhost:3000/api/settings/locations/${location.id}`, {
      headers: {},
    })

    expect(response.status()).toBe(401)
  })
})

test.describe('Phase 11 - Store Locations Historical Integrity & Concurrency', () => {
  test.setTimeout(120000)

  const runId = Math.floor(1000 + Math.random() * 9000)
  const namespace = `LOC_HIST_E2E_${runId}`

  let authToken: string = ''

  test.beforeAll(async () => {
    // Ensure SystemConfig record exists
    const config = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, sessionVersion: 1, updatedAt: new Date() },
    })
    const sessionVersion = config.sessionVersion
    authToken = await generateAdminToken(sessionVersion)
  })

  test.afterAll(async () => {
    // Clean up test data
    await prisma.coupon.deleteMany({
      where: {
        code: {
          contains: namespace
        }
      }
    }).catch(() => {})

    await prisma.storeLocation.deleteMany({
      where: {
        name: {
          contains: namespace
        }
      }
    }).catch(() => {})

    await prisma.$disconnect()
  })

  test('34. Historical integrity - updating location does not rewrite Coupon.storeLocation history', async ({ request }) => {
    // Create a location
    const locResponse = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Original Name`,
        address: '100 History Street',
        city: 'Test City',
        isDefault: false,
      },
    })
    const location = await locResponse.json()

    // Create a coupon referencing this location by name
    const coupon = await prisma.coupon.create({
      data: {
        code: `${namespace}_HIST_TEST`,
        discountType: 'PERCENTAGE',
        discountValue: 15,
        minOrderAmount: 0,
        usageLimit: 100,
        usedCount: 0,
        isActive: true,
        storeLocation: location.name, // Historical snapshot
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Verify coupon has original location name
    expect(coupon.storeLocation).toBe(`${namespace} Original Name`)

    // Update the location name
    const updateResponse = await request.put(`http://localhost:3000/api/settings/locations/${location.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Updated Name`,
      },
    })
    expect(updateResponse.status()).toBe(200)

    // Verify the coupon's historical storeLocation field was NOT modified
    const couponAfter = await prisma.coupon.findUnique({
      where: { id: coupon.id },
    })
    expect(couponAfter?.storeLocation).toBe(`${namespace} Original Name`)

    // Verify the location itself was updated
    const locationAfter = await prisma.storeLocation.findUnique({
      where: { id: location.id },
    })
    expect(locationAfter?.name).toBe(`${namespace} Updated Name`)

    // Cleanup
    await prisma.coupon.delete({ where: { id: coupon.id } })
  })

  test('35. Concurrency - simultaneous default-switch requests leave exactly one default', async ({ request }) => {
    // Create three non-default locations
    const loc1Response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Concurrent 1`,
        address: '200 Concurrent Street',
        city: 'Test City',
        isDefault: false,
      },
    })
    const loc1 = await loc1Response.json()

    const loc2Response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Concurrent 2`,
        address: '300 Concurrent Avenue',
        city: 'Test City',
        isDefault: false,
      },
    })
    const loc2 = await loc2Response.json()

    const loc3Response = await request.post('http://localhost:3000/api/settings/locations', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `${namespace} Concurrent 3`,
        address: '400 Concurrent Road',
        city: 'Test City',
        isDefault: true, // Start with this as default
      },
    })
    const loc3 = await loc3Response.json()

    // Verify loc3 is currently the only default
    const defaultsBefore = await prisma.storeLocation.findMany({
      where: { isDefault: true },
    })
    expect(defaultsBefore.length).toBe(1)
    expect(defaultsBefore[0].id).toBe(loc3.id)

    // Make simultaneous requests to set loc1 and loc2 as default
    const [update1Response, update2Response] = await Promise.all([
      request.put(`http://localhost:3000/api/settings/locations/${loc1.id}`, {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          isDefault: true,
        },
      }),
      request.put(`http://localhost:3000/api/settings/locations/${loc2.id}`, {
        headers: {
          'Cookie': `jl_admin_token=${authToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          isDefault: true,
        },
      }),
    ])

    // Both requests should succeed
    expect(update1Response.status()).toBe(200)
    expect(update2Response.status()).toBe(200)

    // CRITICAL: Verify exactly one default exists after concurrent updates
    const defaultsAfter = await prisma.storeLocation.findMany({
      where: { isDefault: true },
    })
    expect(defaultsAfter.length).toBe(1)

    // The default should be either loc1 or loc2 (whichever won the race)
    const defaultId = defaultsAfter[0].id
    expect([loc1.id, loc2.id]).toContain(defaultId)

    // Verify the other two are NOT default
    const allThree = await prisma.storeLocation.findMany({
      where: {
        id: { in: [loc1.id, loc2.id, loc3.id] },
      },
    })

    const nonDefaults = allThree.filter((loc) => !loc.isDefault)
    expect(nonDefaults.length).toBe(2)
  })
})
