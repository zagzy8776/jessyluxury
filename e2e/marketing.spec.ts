import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { generateAdminToken } from '../lib/auth-crypto'
import fs from 'fs'
import path from 'path'

function loadDotEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx < 1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const raw = trimmed.slice(eqIdx + 1).trim()
    const value = raw.replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}
loadDotEnv()

const prisma = new PrismaClient()

test.describe('Jessy Luxury Sales & Marketing Engine E2E Test', () => {
  test.setTimeout(180000)

  const runId = Math.floor(1000 + Math.random() * 9000)
  const codeSuffix = `MKT${runId}`
  
  let testCustomer: any = null
  let testProduct: any = null
  let testCategory: any = null
  let authToken: string = ''

  test.beforeAll(async () => {
    // Generate admin auth token using production algorithm
    const config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    const sessionVersion = config?.sessionVersion ?? 1
    authToken = await generateAdminToken(sessionVersion)

    testCategory = await prisma.category.upsert({
      where: { name: 'Marketing Test Category' },
      update: {},
      create: { name: 'Marketing Test Category', slug: 'marketing-test-category' },
    })

    testProduct = await prisma.product.create({
      data: {
        name: `Marketing Target Perfume ${runId}`,
        price: 45000,
        costPrice: 20000,
        stock: 50,
        brand: 'Marketing Brand',
        notes: 'Marketing notes description',
        categoryId: testCategory.id,
      },
    })

    testCustomer = await prisma.customer.create({
      data: {
        name: `Promo Target User ${runId}`,
        phone: `+234812345${runId}`,
        whatsapp: `+234812345${runId}`,
      },
    })
  })

  test.afterAll(async () => {
    // Cleanup records
    if (testCustomer) {
      await prisma.couponRedemption.deleteMany({
        where: { customerId: testCustomer.id },
      })
      await prisma.order.deleteMany({
        where: { customerId: testCustomer.id },
      })
    }
    if (testProduct) {
      await prisma.orderItem.deleteMany({
        where: { productId: testProduct.id },
      })
    }
    await prisma.campaign.deleteMany({
      where: { coupon: { code: { contains: codeSuffix } } },
    })
    await prisma.coupon.deleteMany({
      where: { code: { contains: codeSuffix } },
    })
    if (testProduct) {
      await prisma.product.delete({ where: { id: testProduct.id } })
    }
    await prisma.$disconnect()
  })

  test('should validate coupon constraints correctly', async ({ request }) => {
    // 1. Create a coupon restricted to a specific category, minimum spend, and customer limit
    const couponCode = `TESTCON-${codeSuffix}`
    const createRes = await request.post('http://localhost:3000/api/coupons', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        code: couponCode,
        name: 'Restricted Coupon',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: 50000, // require subtotal >= 50k
        usageLimit: 100,
        customerLimit: 1,
        categoryIds: [testCategory.id],
      },
    })
    expect(createRes.status()).toBe(201)

    // 2. Validate: fails if under minimum subtotal (cart subtotal is 45000, under 50000 minimum requirement)
    const valUnderMin = await request.post('http://localhost:3000/api/coupons/validate', {
      data: {
        code: couponCode,
        customerId: testCustomer.id,
        subtotal: 45000,
        items: [{ productId: testProduct.id, price: 45000, quantity: 1 }],
      },
    })
    expect(valUnderMin.status()).toBe(400)
    const resUnderMin = await valUnderMin.json()
    expect(resUnderMin.error).toContain('Minimum order subtotal')

    // 3. Validate: passes if overall cart subtotal meets minOrderAmount
    const valPass = await request.post('http://localhost:3000/api/coupons/validate', {
      data: {
        code: couponCode,
        customerId: testCustomer.id,
        subtotal: 90000,
        items: [{ productId: testProduct.id, price: 45000, quantity: 2 }],
      },
    })
    expect(valPass.status()).toBe(200)
    const resPass = await valPass.json()
    expect(resPass.calculatedDiscount).toBe(9000) // 10% of 90k
  })

  test('should enforce customer redemption limit and preserve usedCount on cancellation', async ({ request }) => {
    const couponCode = `LIMIT-${codeSuffix}`
    const couponRes = await request.post('http://localhost:3000/api/coupons', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        code: couponCode,
        name: 'Single Limit Coupon',
        discountType: 'FIXED',
        discountValue: 5000,
        minOrderAmount: 10000,
        usageLimit: 5,
        customerLimit: 1, // maximum 1 redemption per customer
      },
    })
    expect(couponRes.status()).toBe(201)

    // Create active campaign
    const campaignRes = await request.post('http://localhost:3000/api/campaigns', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: `Campaign ${codeSuffix}`,
        couponId: (await couponRes.json()).id,
        channel: 'WhatsApp',
        audience: 'ALL',
        startDate: new Date(Date.now() - 3600000).toISOString(),
        endDate: new Date(Date.now() + 3600000).toISOString(),
      },
    })
    expect(campaignRes.status()).toBe(201)
    const campaign = await campaignRes.json()

    // Place Order 1 using the coupon code
    const order1Res = await request.post('http://localhost:3000/api/orders', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        customerWhatsapp: testCustomer.whatsapp,
        subtotal: 45000,
        total: 40000,
        paymentStatus: 'PAID',
        salesChannel: 'Physical',
        couponCode: couponCode,
        items: [{ productId: testProduct.id, price: 45000, quantity: 1 }],
      },
    })
    expect(order1Res.status()).toBe(201)
    const order1 = await order1Res.json()

    // Place Order 2 using the same coupon code -> must fail due to customerLimit = 1
    const order2Res = await request.post('http://localhost:3000/api/orders', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        customerName: testCustomer.name,
        customerPhone: testCustomer.phone,
        customerWhatsapp: testCustomer.whatsapp,
        subtotal: 45000,
        total: 40000,
        paymentStatus: 'PAID',
        salesChannel: 'Physical',
        couponCode: couponCode,
        items: [{ productId: testProduct.id, price: 45000, quantity: 1 }],
      },
    })
    expect(order2Res.status()).toBe(500) // Transaction rolled back by throw Error in customerLimit checks

    // Verify campaign stats (1 completed order, revenue is order total)
    const statsRes1 = await request.get(`http://localhost:3000/api/campaigns/${campaign.id}/stats`, {
      headers: { 'Cookie': `jl_admin_token=${authToken}` },
    })
    expect(statsRes1.status()).toBe(200)
    const stats1 = await statsRes1.json()
    expect(stats1.completedOrdersCount).toBe(1)
    expect(stats1.revenue).toBe(40000)

    // Cancel order 1: completed status goes away, campaign financial revenue should decrease, but coupon usedCount stays consumed
    await request.put(`http://localhost:3000/api/orders/${order1.id}`, {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        status: 'CANCELLED',
      },
    })

    // Fetch stats again: revenue should be 0, completedOrdersCount 0, but redemptionsCount stays 1
    const statsRes2 = await request.get(`http://localhost:3000/api/campaigns/${campaign.id}/stats`, {
      headers: { 'Cookie': `jl_admin_token=${authToken}` },
    })
    const stats2 = await statsRes2.json()
    expect(stats2.completedOrdersCount).toBe(0)
    expect(stats2.revenue).toBe(0)
    expect(stats2.redemptionsCount).toBe(1)

    // Verify coupon usedCount stays consumed (usedCount = 1)
    const couponState = await prisma.coupon.findUnique({
      where: { code: couponCode },
    })
    expect(couponState?.usedCount).toBe(1)
  })

  test('should prevent double spend via atomic increment checks on concurrent transactions', async ({ request }) => {
    const couponCode = `CONCUR-${codeSuffix}`
    await request.post('http://localhost:3000/api/coupons', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        code: couponCode,
        name: 'Single Allocation Coupon',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: 0,
        usageLimit: 1, // Only 1 use allowed globally
        customerLimit: 5,
      },
    })

    const payload = {
      customerName: testCustomer.name,
      customerPhone: testCustomer.phone,
      customerWhatsapp: testCustomer.whatsapp,
      subtotal: 45000,
      total: 40500,
      paymentStatus: 'PAID',
      salesChannel: 'Physical',
      couponCode: couponCode,
      items: [{ productId: testProduct.id, price: 45000, quantity: 1 }],
    }

    // Trigger concurrent orders
    const [res1, res2] = await Promise.all([
      request.post('http://localhost:3000/api/orders', {
        headers: { 'Cookie': `jl_admin_token=${authToken}`, 'Content-Type': 'application/json' },
        data: payload,
      }),
      request.post('http://localhost:3000/api/orders', {
        headers: { 'Cookie': `jl_admin_token=${authToken}`, 'Content-Type': 'application/json' },
        data: payload,
      }),
    ])

    // Assert only one checkout completed successfully, the other failed with validation limit exception
    const codes = [res1.status(), res2.status()]
    expect(codes).toContain(201)
    expect(codes).toContain(500) // The second one throws Error in transaction because affectedRows === 0

    // Assert database usedCount is exactly 1
    const finalCoupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    })
    expect(finalCoupon?.usedCount).toBe(1)
  })
})
