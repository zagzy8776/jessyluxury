import './load-env'
import { test, expect } from '@playwright/test'
import { PrismaClient, Category, Customer, CustomerGroup, Product, WholesalePriceRule } from '@prisma/client'
import { generateAdminToken } from '../lib/auth-crypto'

const prisma = new PrismaClient()

test.describe('Jessy Luxury Wholesale & Tier Pricing E2E', () => {
  test.setTimeout(180000)

  const runId = Math.floor(1000 + Math.random() * 9000)
  const ns = `WS_${runId}`
  const wholesalePhone = `+234803${String(runId).padStart(7, '0').slice(-7)}`
  const retailPhone = `+234804${String(runId).padStart(7, '0').slice(-7)}`

  let authToken = ''
  let category: Category
  let productA: Product // Wholesale eligible
  let productB: Product // Retail only
  let group: CustomerGroup
  let wholesaleCustomer: Customer
  let retailCustomer: Customer
  const orderIds: number[] = []
  const couponCodes: string[] = []

  test.beforeAll(async () => {
    const config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    authToken = await generateAdminToken(config?.sessionVersion ?? 1)

    category = await prisma.category.create({
      data: { name: `Wholesale Cat ${ns}`, slug: `wholesale-cat-${ns.toLowerCase()}`, updatedAt: new Date() },
    })

    productA = await prisma.product.create({
      data: {
        name: `Wholesale Perfume ${ns}`,
        brand: 'Jessy Luxury',
        notes: 'Oud, Amber',
        price: 30000,
        costPrice: 10000,
        stock: 200,
        categoryId: category.id,
        updatedAt: new Date(),
      },
    })

    productB = await prisma.product.create({
      data: {
        name: `Retail-Only Perfume ${ns}`,
        brand: 'Jessy Luxury',
        notes: 'Citrus, Floral',
        price: 15000,
        costPrice: 7000,
        stock: 200,
        categoryId: category.id,
        updatedAt: new Date(),
      },
    })

    group = await prisma.customerGroup.create({
      data: {
        name: `Resellers ${ns}`,
        slug: `resellers-${ns.toLowerCase()}`,
        code: 'WHOLESALE',
        isActive: true,
        updatedAt: new Date(),
      },
    })

    // Tiered pricing rules
    await prisma.wholesalePriceRule.createMany({
      data: [
        { customerGroupId: group.id, productId: productA.id, minQuantity: 10, unitPrice: 20000, updatedAt: new Date() },
        { customerGroupId: group.id, productId: productA.id, minQuantity: 20, unitPrice: 18000, updatedAt: new Date() },
      ],
    })

    wholesaleCustomer = await prisma.customer.create({
      data: {
        name: `Wholesale Buyer ${ns}`,
        phone: wholesalePhone,
        whatsapp: wholesalePhone,
        customerGroupId: group.id,
        updatedAt: new Date(),
      },
    })

    retailCustomer = await prisma.customer.create({
      data: {
        name: `Retail Buyer ${ns}`,
        phone: retailPhone,
        whatsapp: retailPhone,
        updatedAt: new Date(),
      },
    })
  })

  test.afterAll(async () => {
    try {
      if (orderIds.length) {
        await prisma.priceAdjustmentLog.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.orderTimeline.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.couponRedemption.deleteMany({ where: { orderId: { in: orderIds } } })
        await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
      }
      if (couponCodes.length) {
        await prisma.coupon.deleteMany({ where: { code: { in: couponCodes } } })
      }
      if (wholesaleCustomer) await prisma.customer.delete({ where: { id: wholesaleCustomer.id } })
      if (retailCustomer) await prisma.customer.delete({ where: { id: retailCustomer.id } })
      if (group) await prisma.wholesalePriceRule.deleteMany({ where: { customerGroupId: group.id } })
      if (group) await prisma.customerGroup.delete({ where: { id: group.id } })
      if (productA || productB) {
        const pids = [productA?.id, productB?.id].filter(Boolean)
        await prisma.stockMovement.deleteMany({ where: { productId: { in: pids } } })
        await prisma.product.deleteMany({ where: { id: { in: pids } } })
      }
      if (category) await prisma.category.delete({ where: { id: category.id } })
    } catch (err) {
      console.error('Wholesale teardown error:', err)
    } finally {
      await prisma.$disconnect()
    }
  })

  test('should correctly apply tiered pricing and handle overrides', async ({ request }) => {
    const adminHeaders = { Cookie: `jl_admin_token=${authToken}` }

    // Test Case 1: Boundary checks for tier resolution
    const boundaryTests = [
      { qty: 9, expectedPrice: 30000, label: 'Below Tier 1' },
      { qty: 10, expectedPrice: 20000, label: 'At Tier 1' },
      { qty: 19, expectedPrice: 20000, label: 'Below Tier 2' },
      { qty: 20, expectedPrice: 18000, label: 'At Tier 2' },
    ]

    for (const { qty, expectedPrice, label } of boundaryTests) {
      await test.step(`Boundary Test: ${label} (Qty: ${qty})`, async () => {
        const subtotal = qty * expectedPrice
        const res = await request.post('http://localhost:3000/api/orders', {
          headers: { ...adminHeaders, 'Content-Type': 'application/json' },
          data: {
            customerName: wholesaleCustomer.name,
            customerPhone: wholesalePhone,
            subtotal,
            total: subtotal,
            paymentStatus: 'PAID',
            salesChannel: 'Physical',
            items: [{ productId: productA.id, price: expectedPrice, quantity: qty }],
          },
        })
        expect(res.status(), `Order creation failed for ${label}`).toBe(201)
        const order = await res.json()
        orderIds.push(order.id)
        expect(order.OrderItem[0].price, `Price mismatch for ${label}`).toBe(expectedPrice)
        const adjCount = await prisma.priceAdjustmentLog.count({ where: { orderId: order.id } })
        expect(adjCount, `Unexpected price adjustment for ${label}`).toBe(0)
      })
    }

    // Test Case 2: Server-side authority - client sends wrong price, server logs adjustment
    await test.step('Server-Side Authority Test', async () => {
      const overrideRes = await request.post('http://localhost:3000/api/orders', {
        headers: { ...adminHeaders, 'Content-Type': 'application/json' },
        data: {
          customerName: wholesaleCustomer.name,
          customerPhone: wholesalePhone,
          subtotal: 250000, // Client sends wrong price: 10 * 25,000
          total: 250000,
          paymentStatus: 'PAID',
          salesChannel: 'Physical',
          items: [{ productId: productA.id, price: 25000, quantity: 10 }],
        },
      })
      expect(overrideRes.status()).toBe(201)
      const overrideOrder = await overrideRes.json()
      orderIds.push(overrideOrder.id)
      const adj = await prisma.priceAdjustmentLog.findFirst({ where: { orderId: overrideOrder.id } })
      expect(adj).toBeTruthy()
      expect(adj?.originalPrice).toBe(20000) // Server knew the correct price was 20k
      expect(adj?.customPrice).toBe(25000) // Server recorded the client's override
    })
  })

  test('should handle mixed carts and preserve historical prices', async ({ request }) => {
    const adminHeaders = { Cookie: `jl_admin_token=${authToken}` }

    // Test Case 3: Mixed cart (Wholesale + Retail)
    await test.step('Mixed Cart Test', async () => {
      const mixedCartRes = await request.post('http://localhost:3000/api/orders', {
        headers: { ...adminHeaders, 'Content-Type': 'application/json' },
        data: {
          customerName: wholesaleCustomer.name,
          customerPhone: wholesalePhone,
          subtotal: 230000, // (10 * 20,000) + (2 * 15,000)
          total: 230000,
          paymentStatus: 'PAID',
          salesChannel: 'Physical',
          items: [
            { productId: productA.id, price: 20000, quantity: 10 }, // Should get wholesale price
            { productId: productB.id, price: 15000, quantity: 2 }, // Should get retail price
          ],
        },
      })
      expect(mixedCartRes.status()).toBe(201)
      const mixedCartOrder = await mixedCartRes.json()
      orderIds.push(mixedCartOrder.id)
      const itemA = mixedCartOrder.OrderItem.find((i: any) => i.productId === productA.id)
      const itemB = mixedCartOrder.OrderItem.find((i: any) => i.productId === productB.id)
      expect(itemA.price).toBe(20000)
      expect(itemB.price).toBe(15000)

      // Test Case 4: Historical price preservation
      await test.step('Historical Price Preservation Test', async () => {
        // Change the wholesale rule for Product A
        await prisma.wholesalePriceRule.updateMany({
          where: { productId: productA.id, minQuantity: 10 },
          data: { unitPrice: 21000 },
        })

        // Re-fetch the original mixed cart order
        const historicOrder = await prisma.order.findUnique({
          where: { id: mixedCartOrder.id },
          include: { OrderItem: true },
        })
        const historicItemA = historicOrder!.OrderItem.find((i) => i.productId === productA.id)
        expect(historicItemA?.price).toBe(20000) // Price is preserved, not recalculated to 21,000
      })
    })
  })

  test('should isolate retail and wholesale coupons by customer group', async ({ request }) => {
    const adminHeaders = { Cookie: `jl_admin_token=${authToken}`, 'Content-Type': 'application/json' }
    const retailCode = `RET-${ns}`
    const wholesaleCode = `WHO-${ns}`
    couponCodes.push(retailCode, wholesaleCode)

    const retailCoupon = await request.post('http://localhost:3000/api/coupons', {
      headers: adminHeaders,
      data: {
        code: retailCode,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minOrderAmount: 0,
        usageLimit: 100,
        wholesaleEligible: false,
      },
    })
    expect(retailCoupon.status()).toBe(201)

    const wholesaleCoupon = await request.post('http://localhost:3000/api/coupons', {
      headers: adminHeaders,
      data: {
        code: wholesaleCode,
        discountType: 'PERCENTAGE',
        discountValue: 5,
        minOrderAmount: 0,
        usageLimit: 100,
        wholesaleEligible: true,
      },
    })
    expect(wholesaleCoupon.status()).toBe(201)

    const retailBlocked = await request.post('http://localhost:3000/api/coupons/validate', {
      data: {
        code: retailCode,
        customerId: wholesaleCustomer.id,
        subtotal: 30000, // Qty 1 -> retail price
        items: [{ productId: productA.id, price: 30000, quantity: 1 }],
      },
    })
    expect(retailBlocked.status()).toBe(400)
    expect((await retailBlocked.json()).error).toContain('retail customers only')

    const wholesaleBlockedOnRetail = await request.post('http://localhost:3000/api/coupons/validate', {
      data: {
        code: wholesaleCode,
        customerId: retailCustomer.id,
        subtotal: 30000,
        items: [{ productId: productA.id, price: 30000, quantity: 1 }],
      },
    })
    expect(wholesaleBlockedOnRetail.status()).toBe(400)
    expect((await wholesaleBlockedOnRetail.json()).error).toContain('wholesale customers only')

    const wholesaleOk = await request.post('http://localhost:3000/api/coupons/validate', {
      data: {
        code: wholesaleCode,
        customerId: wholesaleCustomer.id,
        subtotal: 200000, // Qty 10 -> tier 1 price
        items: [{ productId: productA.id, price: 20000, quantity: 10 }],
      },
    })
    expect(wholesaleOk.status()).toBe(200)

    const orderBlocked = await request.post('http://localhost:3000/api/orders', {
      headers: adminHeaders,
      data: {
        customerName: wholesaleCustomer.name,
        customerPhone: wholesalePhone,
        subtotal: 200000,
        couponCode: retailCode,
        paymentStatus: 'PAID',
        salesChannel: 'Physical',
        items: [{ productId: productA.id, price: 20000, quantity: 10 }],
      },
    })
    expect(orderBlocked.status()).toBe(400)
  })
})
