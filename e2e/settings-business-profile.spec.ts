import './load-env'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { generateAdminToken } from '../lib/auth-crypto'

const prisma = new PrismaClient()

test.describe('Phase 11 Domain 1: Business Profile Settings', () => {
  test.setTimeout(120000)

  const runId = Math.floor(1000 + Math.random() * 9000)
  const namespace = `BPROF_E2E_${runId}`

  let authToken: string = ''
  let testCategory: any
  let testProduct: any
  let testCustomer: any
  let testOrder: any

  test.beforeAll(async () => {
    // Ensure SystemConfig record exists so requireAdminAuth doesn't fail
    const config = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, sessionVersion: 1, updatedAt: new Date() },
    })
    const sessionVersion = config.sessionVersion
    authToken = await generateAdminToken(sessionVersion)

    // Setup test data for historical immutability test
    testCategory = await prisma.category.create({
      data: {
        name: `Business Profile Cat ${namespace}`,
        slug: `business-profile-cat-${namespace.toLowerCase()}`,
        updatedAt: new Date(),
      },
    })

    testProduct = await prisma.product.create({
      data: {
        name: `Business Profile Product ${namespace}`,
        brand: 'Jessy Luxury',
        notes: 'Bergamot, Jasmin',
        price: 30000,
        costPrice: 15000,
        stock: 50,
        categoryId: testCategory.id,
        updatedAt: new Date(),
      },
    })

    testCustomer = await prisma.customer.create({
      data: {
        name: `Business Profile Customer ${namespace}`,
        phone: `+234801111${runId}`,
        whatsapp: `+234801111${runId}`,
        updatedAt: new Date(),
      },
    })
  })

  test.afterAll(async () => {
    // Clean up
    if (testOrder?.id) {
      await prisma.auditLog.deleteMany({ 
        where: { entity: 'Order', entityId: String(testOrder.id) } 
      })
      await prisma.order.deleteMany({ where: { id: testOrder.id } })
    }
    
    // Clean up business profile audit logs from this test run
    await prisma.auditLog.deleteMany({
      where: {
        entity: 'BusinessProfile',
        changedBy: 'Admin',
        createdAt: {
          gte: new Date(Date.now() - 300000) // Last 5 minutes
        }
      }
    })

    if (testProduct?.id) {
      await prisma.product.delete({ where: { id: testProduct.id } })
    }
    if (testCategory?.id) {
      await prisma.category.delete({ where: { id: testCategory.id } })
    }
    if (testCustomer?.id) {
      await prisma.customer.delete({ where: { id: testCustomer.id } })
    }
    await prisma.$disconnect()
  })

  test('1. Unauthenticated GET returns 401', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/business-profile')
    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.error).toContain('Unauthorized')
  })

  test('2. Authenticated GET returns the profile', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)
    const profile = await response.json()
    expect(profile).toBeDefined()
    expect(profile.id).toBe(1)
    expect(profile.name).toBeDefined()
    expect(profile.email).toBeDefined()
    expect(profile.phone).toBeDefined()
    expect(profile.address).toBeDefined()
    expect(profile.hours).toBeDefined()
  })

  test('3. Valid PUT updates the profile', async ({ request }) => {
    const timestamp = Date.now()
    const testName = `Jessy Luxury Test ${timestamp}`
    const testEmail = `test${timestamp}@jessyluxury.com`
    const testPhone = `+2348${timestamp.toString().slice(-9)}`

    const response = await request.put('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: testName,
        email: testEmail,
        phone: testPhone,
        address: '123 Test Street, Lagos',
        hours: 'Mon – Sun, 24/7',
        taxId: 'RC999888'
      }
    })

    expect(response.status()).toBe(200)
    const updateData = await response.json()
    expect(updateData.name).toBe(testName)
    expect(updateData.email).toBe(testEmail)
    expect(updateData.phone).toBe(testPhone)
    expect(updateData.address).toBe('123 Test Street, Lagos')
    expect(updateData.hours).toBe('Mon – Sun, 24/7')
    expect(updateData.taxId).toBe('RC999888')

    // Verify persistence
    const getResponse = await request.get('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(getResponse.status()).toBe(200)
    const getData = await getResponse.json()
    expect(getData.name).toBe(testName)
    expect(getData.email).toBe(testEmail)
    expect(getData.phone).toBe(testPhone)
  })

  test('4. Invalid/missing required business name returns 400', async ({ request }) => {
    const response = await request.put('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: '',
        email: 'test@test.com',
        phone: '+2341234567890',
        address: '123 Test Street',
        hours: 'Mon-Fri 9-5'
      }
    })
    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Business name is required')
  })

  test('5. Invalid email returns 400', async ({ request }) => {
    const response = await request.put('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Business',
        email: 'invalid-email',
        phone: '+2341234567890',
        address: '123 Test Street',
        hours: 'Mon-Fri 9-5'
      }
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid email format')
  })

  test('6. Missing required phone/address returns 400', async ({ request }) => {
    // Test missing phone
    let response = await request.put('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Business',
        email: 'test@test.com',
        phone: '',
        address: '123 Test Street',
        hours: 'Mon-Fri 9-5'
      }
    })
    expect(response.status()).toBe(400)
    let data = await response.json()
    expect(data.error).toBe('Phone is required')

    // Test missing address
    response = await request.put('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Business',
        email: 'test@test.com',
        phone: '+2341234567890',
        address: '',
        hours: 'Mon-Fri 9-5'
      }
    })
    expect(response.status()).toBe(400)
    data = await response.json()
    expect(data.error).toBe('Address is required')

    // Test missing hours
    response = await request.put('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Business',
        email: 'test@test.com',
        phone: '+2341234567890',
        address: '123 Test Street',
        hours: ''
      }
    })
    expect(response.status()).toBe(400)
    data = await response.json()
    expect(data.error).toBe('Business hours is required')
  })

  test('7. Successful update creates exactly one BUSINESS_PROFILE_UPDATED audit entry', async ({ request }) => {
    const timestamp = Date.now()
    const testName = `Audit Test ${timestamp}`

    // Get count before update
    const auditCountBefore = await prisma.auditLog.count({
      where: {
        entity: 'BusinessProfile',
        action: 'BUSINESS_PROFILE_UPDATED'
      }
    })

    // Update profile
    const response = await request.put('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: testName,
        email: `audit${timestamp}@test.com`,
        phone: '+2341234567890',
        address: '789 Audit Street',
        hours: 'Mon-Fri 9-5'
      }
    })

    expect(response.status()).toBe(200)

    // Verify exactly one new audit entry was created
    const auditCountAfter = await prisma.auditLog.count({
      where: {
        entity: 'BusinessProfile',
        action: 'BUSINESS_PROFILE_UPDATED'
      }
    })

    expect(auditCountAfter).toBe(auditCountBefore + 1)

    // Verify audit log details
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entity: 'BusinessProfile',
        entityId: '1',
        action: 'BUSINESS_PROFILE_UPDATED'
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    expect(auditLog).not.toBeNull()
    expect(auditLog?.action).toBe('BUSINESS_PROFILE_UPDATED')
    expect(auditLog?.entity).toBe('BusinessProfile')
    expect(auditLog?.entityId).toBe('1')
    expect(auditLog?.changedBy).toBe('Admin')
    
    // Verify details contain expected fields and no secrets
    const details = JSON.parse(auditLog?.details || '{}')
    expect(details.name).toBe(testName)
    expect(details.email).toBe(`audit${timestamp}@test.com`)
  })

  test('8. Returned response never exposes unrelated secrets/configuration', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(response.status()).toBe(200)
    const profile = await response.json()

    // Verify response contains only BusinessProfile fields
    const allowedKeys = ['id', 'name', 'phone', 'email', 'address', 'hours', 'taxId', 'createdAt', 'updatedAt']
    const responseKeys = Object.keys(profile)
    
    for (const key of responseKeys) {
      expect(allowedKeys).toContain(key)
    }

    // Verify no secrets or unrelated config leaked
    expect(profile.adminPasswordHash).toBeUndefined()
    expect(profile.sessionVersion).toBeUndefined()
    expect(profile.paymentProviderApiKey).toBeUndefined()
    expect(profile.bankAccountNumber).toBeUndefined()
  })

  test('9. Updating Business Profile does not modify existing Order/Customer historical snapshot', async ({ request }) => {
    // First, get current business profile
    const profileBefore = await prisma.businessProfile.findUnique({ where: { id: 1 } })
    expect(profileBefore).not.toBeNull()

    // Create an order with current business profile data in customerName
    testOrder = await prisma.order.create({
      data: {
        orderNumber: `BP-${namespace}-${runId}`,
        Customer: {
          connect: { id: testCustomer.id }
        },
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        customerWhatsapp: testCustomer.whatsapp,
        shippingAddress: '123 Test Address',
        subtotal: 30000,
        total: 30000,
        paymentStatus: 'PAID',
        status: 'PENDING',
        updatedAt: new Date(),
        OrderItem: {
          create: {
            productId: testProduct.id,
            quantity: 1,
            price: 30000,
            productNameSnapshot: testProduct.name,
            brandSnapshot: testProduct.brand,
          }
        }
      }
    })

    const orderCustomerNameBefore = testOrder.customerName
    const orderCustomerPhoneBefore = testOrder.customerPhone

    // Now update the business profile with new name and phone
    const timestamp = Date.now()
    const newBusinessName = `Updated Business ${timestamp}`
    const newBusinessPhone = `+2349${timestamp.toString().slice(-9)}`

    const updateResponse = await request.put('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: newBusinessName,
        email: `updated${timestamp}@test.com`,
        phone: newBusinessPhone,
        address: 'New Address 456',
        hours: 'Mon-Sun 24/7'
      }
    })

    expect(updateResponse.status()).toBe(200)

    // Verify business profile was updated
    const profileAfter = await prisma.businessProfile.findUnique({ where: { id: 1 } })
    expect(profileAfter?.name).toBe(newBusinessName)
    expect(profileAfter?.phone).toBe(newBusinessPhone)

    // Verify the existing order's customer snapshots remain UNCHANGED
    const orderAfter = await prisma.order.findUnique({ where: { id: testOrder.id } })
    expect(orderAfter?.customerName).toBe(orderCustomerNameBefore)
    expect(orderAfter?.customerPhone).toBe(orderCustomerPhoneBefore)

    // Explicitly verify they did NOT change to the new business profile values
    expect(orderAfter?.customerName).not.toBe(newBusinessName)
  })

  test('10. Repeated valid updates remain consistent', async ({ request }) => {
    const timestamp = Date.now()
    const testName = `Consistent Test ${timestamp}`
    const testEmail = `consistent${timestamp}@test.com`
    const testPhone = `+2347${timestamp.toString().slice(-9)}`

    // First update
    const response1 = await request.put('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: testName,
        email: testEmail,
        phone: testPhone,
        address: 'Consistency Address',
        hours: 'Mon-Fri 9-5'
      }
    })
    expect(response1.status()).toBe(200)
    const data1 = await response1.json()

    // Second update with same data
    const response2 = await request.put('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: testName,
        email: testEmail,
        phone: testPhone,
        address: 'Consistency Address',
        hours: 'Mon-Fri 9-5'
      }
    })
    expect(response2.status()).toBe(200)
    const data2 = await response2.json()

    // Verify consistent results
    expect(data2.name).toBe(data1.name)
    expect(data2.email).toBe(data1.email)
    expect(data2.phone).toBe(data1.phone)
    expect(data2.address).toBe(data1.address)
    expect(data2.hours).toBe(data1.hours)

    // Third update with different data
    const timestamp3 = Date.now()
    const testName3 = `Consistent Test 3 ${timestamp3}`

    const response3 = await request.put('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: testName3,
        email: testEmail,
        phone: testPhone,
        address: 'Consistency Address',
        hours: 'Mon-Fri 9-5'
      }
    })
    expect(response3.status()).toBe(200)
    const data3 = await response3.json()
    expect(data3.name).toBe(testName3)

    // Verify retrieval is consistent
    const getResponse = await request.get('http://localhost:3000/api/settings/business-profile', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(getResponse.status()).toBe(200)
    const getData = await getResponse.json()
    expect(getData.name).toBe(testName3)
  })
})
