import './load-env'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { generateAdminToken } from '../lib/auth-crypto'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

test.describe('Jessy Luxury Shipping & Delivery Engine E2E Test', () => {
  test.setTimeout(180000)

  const runId = Math.floor(1000 + Math.random() * 9000)
  const namespace = `SHIP_E2E_${runId}`

  let testCategory: any
  let testProduct: any
  let testCustomer: any
  let zoneA: any
  let zoneB: any
  let zoneC: any
  let authToken: string = ''

  test.beforeAll(async () => {
    // Ensure SystemConfig record exists so requireAdminAuth doesn't fail
    const config = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, sessionVersion: 1, updatedAt: new Date() },
    })
    const sessionVersion = config.sessionVersion
    authToken = await generateAdminToken(sessionVersion)

    // 2. Setup mock Category & Product
    testCategory = await prisma.category.create({
      data: {
        name: `Shipping Cat ${namespace}`,
        slug: `shipping-cat-${namespace.toLowerCase()}`,
        updatedAt: new Date(),
      },
    })

    testProduct = await prisma.product.create({
      data: {
        name: `Fragrance ${namespace}`,
        brand: 'Jessy Luxury',
        notes: 'Bergamot, Jasmin',
        price: 30000,
        costPrice: 15000,
        stock: 50,
        categoryId: testCategory.id,
        updatedAt: new Date(),
      },
    })

    // 3. Setup Customer
    testCustomer = await prisma.customer.create({
      data: {
        name: `Shipment Cust ${namespace}`,
        phone: `+234803333${runId}`,
        whatsapp: `+234803333${runId}`,
        updatedAt: new Date(),
      },
    })

    // 4. Setup Shipping Zones
    zoneA = await prisma.shippingZone.create({
      data: {
        name: `Lagos Mainland ${namespace}`,
        fee: 2000,
        estimatedDays: '1-2 business days',
        active: true,
        updatedAt: new Date(),
      },
    })

    zoneB = await prisma.shippingZone.create({
      data: {
        name: `Abuja Express ${namespace}`,
        fee: 3000,
        estimatedDays: '2-3 business days',
        active: true,
        updatedAt: new Date(),
      },
    })

    zoneC = await prisma.shippingZone.create({
      data: {
        name: `Lagos Island Inactive ${namespace}`,
        fee: 4000,
        estimatedDays: '1-2 business days',
        active: false,
        updatedAt: new Date(),
      },
    })
  })

  test.afterAll(async () => {
    // Clean up
    await prisma.order.deleteMany({
      where: {
        customerPhone: `+234803333${runId}`,
      },
    })
    const zoneIds = [zoneA?.id, zoneB?.id, zoneC?.id].filter(Boolean)
    if (zoneIds.length > 0) {
      await prisma.shippingZone.deleteMany({
        where: {
          id: { in: zoneIds },
        },
      })
    }
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

  test('should enforce money recalculations, state machine rules, and public privacy on tracking', async ({ request }) => {
    // Step 1: Create order with Zone A (fee = ₦2,000, subtotal = ₦30,000, discount = ₦3,000)
    const createRes = await request.post('http://localhost:3000/api/orders', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        shippingAddress: '123 Lagos St, Lagos Mainland',
        shippingZoneId: zoneA.id,
        shippingFee: 9999, // Should be overridden by server
        subtotal: 30000,
        discountAmount: 3000,
        paymentStatus: 'PAID',
        salesChannel: 'Online Store',
        items: [
          {
            productId: testProduct.id,
            price: 30000,
            quantity: 1,
          },
        ],
      },
    })
    expect(createRes.status()).toBe(201)
    const createdOrder = await createRes.json()

    // Server-side calculation assertions
    expect(createdOrder.shippingFee).toBe(2000)
    expect(createdOrder.total).toBe(29000) // 30000 - 3000 + 2000
    expect(createdOrder.shippingZoneNameSnapshot).toBe(zoneA.name)
    expect(createdOrder.estimatedDaysSnapshot).toBe(zoneA.estimatedDays)
    expect(createdOrder.trackingToken).not.toBeNull()
    expect(createdOrder.trackingToken.startsWith('track_')).toBe(true)

    const trackingToken = createdOrder.trackingToken

    // Step 2: Change shipping zone to Zone B (fee = ₦3,000) and verify recalculation
    const updateZoneBRes = await request.put(`http://localhost:3000/api/orders/${createdOrder.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        shippingZoneId: zoneB.id,
      },
    })
    expect(updateZoneBRes.status()).toBe(200)
    const updatedOrderB = await updateZoneBRes.json()
    expect(updatedOrderB.shippingFee).toBe(3000)
    expect(updatedOrderB.total).toBe(30000) // 30000 - 3000 + 3000
    expect(updatedOrderB.shippingZoneNameSnapshot).toBe(zoneB.name)
    expect(updatedOrderB.estimatedDaysSnapshot).toBe(zoneB.estimatedDays)

    // Step 3: Change shipping zone back to Zone A (fee = ₦2,000) and verify total doesn't compound
    const updateZoneARes = await request.put(`http://localhost:3000/api/orders/${createdOrder.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        shippingZoneId: zoneA.id,
      },
    })
    expect(updateZoneARes.status()).toBe(200)
    const updatedOrderA = await updateZoneARes.json()
    expect(updatedOrderA.shippingFee).toBe(2000)
    expect(updatedOrderA.total).toBe(29000) // 30000 - 3000 + 2000

    // Step 4: Verify assigning inactive shipping zone C fails
    const updateZoneCRes = await request.put(`http://localhost:3000/api/orders/${createdOrder.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        shippingZoneId: zoneC.id,
      },
    })
    expect(updateZoneCRes.status()).toBe(500) // Returns custom error inside transaction
    const updateZoneCJson = await updateZoneCRes.json()
    expect(updateZoneCJson.error).toContain('Cannot newly assign inactive shipping zone')

    // Step 5: Verify status transitions and timeline event logs
    // PENDING -> PROCESSING
    const transitionProc = await request.put(`http://localhost:3000/api/orders/${createdOrder.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        status: 'PROCESSING',
      },
    })
    expect(transitionProc.status()).toBe(200)

    // PROCESSING -> SHIPPED
    const transitionShip = await request.put(`http://localhost:3000/api/orders/${createdOrder.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        status: 'SHIPPED',
        trackingNumber: `TRACK-${runId}`,
        courierName: 'DHL Nigeria',
        courierPhone: '  +234 81 0000 9999 ', // Needs normalisation
        waybillNotes: 'Leave with receptionist.',
      },
    })
    expect(transitionShip.status()).toBe(200)
    const shippedOrder = await transitionShip.json()
    expect(shippedOrder.courierPhone).toBe('+2348100009999')

    // Step 6: Query public order details by token and verify privacy restrictions
    const publicTrackRes = await request.get(`http://localhost:3000/api/orders/track/${trackingToken}`)
    expect(publicTrackRes.status()).toBe(200)
    const publicOrder = await publicTrackRes.json()

    // Assert public variables allowed
    expect(publicOrder.orderNumber).toBe(createdOrder.orderNumber)
    expect(publicOrder.status).toBe('SHIPPED')
    expect(publicOrder.trackingNumber).toBe(`TRACK-${runId}`)
    expect(publicOrder.courierName).toBe('DHL Nigeria')
    expect(publicOrder.shippingZone).toBe(zoneA.name)
    expect(publicOrder.estimatedDays).toBe(zoneA.estimatedDays)
    expect(publicOrder.total).toBe(29000)

    // Assert items allowlist properties
    expect(publicOrder.items.length).toBe(1)
    expect(publicOrder.items[0].productName).toBe(testProduct.name)
    expect(publicOrder.items[0].brand).toBe(testProduct.brand)
    expect(publicOrder.items[0].quantity).toBe(1)
    expect(publicOrder.items[0].price).toBe(30000)
    expect(publicOrder.items[0].productId).toBeUndefined() // Stripped relation key
    expect(publicOrder.items[0].product).toBeUndefined() // Stripped relation object

    // Assert public timeline properties
    expect(publicOrder.timeline.length).toBeGreaterThan(0)
    expect(publicOrder.timeline[0].actorId).toBeUndefined()

    // Assert STRICT privacy stripping
    expect(publicOrder.customerPhone).toBeUndefined()
    expect(publicOrder.customerWhatsapp).toBeUndefined()
    expect(publicOrder.shippingAddress).toBeUndefined()
    expect(publicOrder.courierPhone).toBeUndefined()
    expect(publicOrder.customerId).toBeUndefined()
    expect(publicOrder.customer).toBeUndefined()

    // Step 7: Verify querying invalid token returns generic 404
    const publicTrackInvalid = await request.get('http://localhost:3000/api/orders/track/invalid-token-1234')
    expect(publicTrackInvalid.status()).toBe(404)
    const publicTrackInvalidJson = await publicTrackInvalid.json()
    expect(publicTrackInvalidJson.error).toBe('Order not found')

    // Step 8: Verify search validation
    // Valid orderNumber + phone -> returns trackingToken
    const searchValid = await request.post('http://localhost:3000/api/orders/track/search', {
      data: {
        orderNumber: createdOrder.orderNumber,
        customerPhone: testCustomer.phone,
      },
    })
    expect(searchValid.status()).toBe(200)
    const searchValidJson = await searchValid.json()
    expect(searchValidJson.trackingToken).toBe(trackingToken)

    // Invalid combination -> returns 404
    const searchInvalid = await request.post('http://localhost:3000/api/orders/track/search', {
      data: {
        orderNumber: createdOrder.orderNumber,
        customerPhone: '+2348000000000',
      },
    })
    expect(searchInvalid.status()).toBe(404)
  })
})
