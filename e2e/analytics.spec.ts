import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { generateAdminToken } from '../lib/auth-crypto'
import fs from 'fs'
import path from 'path'

// Load .env variables manually
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

test.describe('Jessy Luxury Executive Analytics E2E Test', () => {
  let authToken: string
  let testCategory: any
  let testProduct: any
  let testCustomer: any
  let createdOrderId: number
  const testCustomerName = 'Analytics Tester'
  const testCustomerPhone = '+2348001112223'

  test.beforeAll(async () => {
    test.setTimeout(180000)
    // 1. Programmatic database setup
    testCategory = await prisma.category.create({
      data: {
        name: 'Analytics Test Category',
        slug: 'analytics-test-cat',
      },
    })

    testProduct = await prisma.product.create({
      data: {
        name: 'Analytics Initial Name',
        brand: 'Initial Brand',
        price: 30000,
        costPrice: 15000, // Margin = 15,000
        volume: '100ml EDP',
        notes: 'Rose · Vanilla',
        stock: 10,
        reserved: 0,
        categoryId: testCategory.id,
      },
    })

    testCustomer = await prisma.customer.create({
      data: {
        name: testCustomerName,
        phone: testCustomerPhone,
        whatsapp: testCustomerPhone,
        acquisitionSource: 'Instagram',
      },
    })

    // 2. Generate authorization cookie token
    const config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    const sessionVersion = config?.sessionVersion ?? 1
    authToken = await generateAdminToken(sessionVersion)
  })

  test.afterAll(async () => {
    // Teardown cleanup
    try {
      if (createdOrderId) {
        await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } })
        await prisma.orderTimeline.deleteMany({ where: { orderId: createdOrderId } })
        await prisma.order.delete({ where: { id: createdOrderId } })
      }
      if (testProduct) {
        await prisma.stockMovement.deleteMany({ where: { productId: testProduct.id } })
        await prisma.product.delete({ where: { id: testProduct.id } })
      }
      if (testCategory) {
        await prisma.category.delete({ where: { id: testCategory.id } })
      }
      if (testCustomer) {
        await prisma.customer.delete({ where: { id: testCustomer.id } })
      }
    } catch (e) {
      console.error('Teardown cleanup error:', e)
    } finally {
      await prisma.$disconnect()
    }
  })

  test('verify historical cost, product identity snapshots and channel analytics', async ({ page }) => {
    test.setTimeout(180000)
    await page.context().addCookies([
      {
        name: 'jl_admin_token',
        value: authToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
      },
    ])

    // Go to POS create order page
    await page.goto('http://localhost:3000/store-portal-jl/dashboard/orders/create')
    await page.waitForSelector('input[placeholder="Search catalog to add..."]', { timeout: 60000 })

    // Wait for product catalog to load
    await page.waitForFunction(
      () => {
        const spans = Array.from(document.querySelectorAll('span'))
        const countSpan = spans.find(el => el.textContent && el.textContent.includes('in catalog'))
        if (!countSpan) return false
        const match = countSpan.textContent!.match(/(\d+)/)
        return match ? parseInt(match[1]) > 0 : false
      },
      { timeout: 15000 }
    )

    // Search product
    const productName = 'Analytics Initial Name'
    await page.fill('input[placeholder="Search catalog to add..."]', productName)
    await expect(page.getByText(productName, { exact: false })).toBeVisible({ timeout: 10000 })

    // Add to cart
    const productRow = page.locator('div').filter({ hasText: new RegExp(productName) }).filter({ has: page.locator('button:has-text("Add")') }).last()
    await productRow.locator('button:has-text("Add")').click()
    await expect(page.getByText('Order Summary (1 items)')).toBeVisible({ timeout: 5000 })

    // Fill customer details
    await page.fill('input[placeholder="e.g. Blessing Okafor"]', testCustomerName)
    await page.fill('input[placeholder="08012345678"]', testCustomerPhone)

    // Select payment status and submit order
    await page.selectOption('#payment-status-select', 'PAID')
    await page.click('button:has-text("Confirm & Generate Order")')
    await page.waitForSelector('h2:has-text("Order Recorded Successfully!")', { timeout: 60000 })

    // Extract Order Number from receipt screen
    const orderNumberEl = page.locator('p.text-amber-500').first()
    const orderNumber = (await orderNumberEl.innerText()).trim().replace(/^#/, '')

    // Verify DB snapshots immediately
    const dbOrder = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    })
    expect(dbOrder).toBeDefined()
    createdOrderId = dbOrder!.id

    // Check salesChannel is recorded as "Physical"
    expect(dbOrder!.salesChannel).toBe('Physical')

    const dbItem = dbOrder!.items[0]
    expect(dbItem.unitCost).toBe(15000)
    expect(dbItem.productNameSnapshot).toBe('Analytics Initial Name')
    expect(dbItem.brandSnapshot).toBe('Initial Brand')

    // ─── Simulate historical edits ──────────────────────────────────────────
    // Change current product cost, name, and brand
    await prisma.product.update({
      where: { id: testProduct.id },
      data: {
        name: 'Analytics Modified Name',
        brand: 'Modified Brand',
        costPrice: 22000,
      },
    })

    // Fetch analytics and verify snapshots are preserved
    await page.goto('http://localhost:3000/store-portal-jl/dashboard/analytics')
    await page.waitForSelector('h1:has-text("Executive Analytics Hub")')

    // Check KPI profit card is visible
    const profitValueEl = page.locator('div:has(span:has-text("Profit after Discounts")) > p.font-display').first()
    await expect(profitValueEl).toBeVisible()
    const profitText = await profitValueEl.innerText()
    expect(profitText).toContain('₦')

    // Switch to Products Tab
    await page.click('button:has-text("Products Report")')

    const bestSellersCard = page.locator('div').filter({ hasText: 'Top Selling Fragrances' }).last()
    // Historic name and brand should still display in the transaction snapshot list
    await expect(bestSellersCard.locator('text=Analytics Initial Name')).toBeVisible()
    await expect(bestSellersCard.locator('text=Initial Brand')).toBeVisible()
    await expect(bestSellersCard.locator('text=Analytics Modified Name')).not.toBeVisible()

    // Switch to Channels Tab
    await page.click('button:has-text("Channels Report")')
    // Recorded salesChannel is Physical
    await expect(page.locator('span:has-text("Physical")')).toBeVisible()
  })
})
