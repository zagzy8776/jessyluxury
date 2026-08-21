import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { generateAdminToken } from '../lib/auth-crypto'
import fs from 'fs'
import path from 'path'

// Load .env variables manually so DATABASE_URL etc. are available
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

// Ensure cleanup even if test fails
process.on('beforeExit', async () => {
  await prisma.$disconnect().catch(() => {})
})

test.describe('Jessy Luxury CRM & POS E2E Smoke Test', () => {
  test.setTimeout(180000)

  const runId = Math.floor(1000 + Math.random() * 9000)
  const smokeNamespace = `POS_SMOKE_TEST_20260818_02_55_${runId}`
  const testProductName = `${smokeNamespace}_perfume`
  const testCustomerName = `POS Smoke Tester ${runId}`
  const rawCustomerPhone = '08012345678'
  const canonicalCustomerPhone = '+2348012345678'

  let testProduct: any = null
  let testCategory: any = null
  let authToken: string = ''

  test.beforeAll(async () => {
    // 1. Seed a test product directly in the database
    testCategory = await prisma.category.upsert({
      where: { name: 'Smoke Test Category' },
      update: {},
      create: { name: 'Smoke Test Category', slug: `smoke-test-cat-${runId}`, updatedAt: new Date() },
    })

    testProduct = await prisma.product.create({
      data: {
        name: testProductName,
        brand: 'Jessy E2E',
        price: 10000,
        costPrice: 5000,
        volume: '100ml EDP',
        notes: 'Vanilla · Rose',
        stock: 5,
        reserved: 0,
        categoryId: testCategory.id,
        updatedAt: new Date()
      },
    })

    // 2. Resolve current session version from database to build a valid token
    const config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    const sessionVersion = config?.sessionVersion ?? 1
    authToken = await generateAdminToken(sessionVersion)

    // Warm the dev-server compile cache for the POS page. Next.js compiles
    // routes on demand; a cold compile of this page can exceed the 60s
    // selector timeout below, so pre-render it once here.
    await fetch('http://localhost:3000/store-portal-jl/dashboard/orders/create', {
      headers: { Cookie: `jl_admin_token=${authToken}` },
    }).catch(() => {})
  })

  test.afterAll(async () => {
    try {
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { customerPhone: canonicalCustomerPhone },
            { customerName: testCustomerName },
          ],
        },
      })
      const orderIds = orders.map((o) => o.id)

      await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
      await prisma.orderTimeline.deleteMany({ where: { orderId: { in: orderIds } } })
      await prisma.priceAdjustmentLog.deleteMany({ where: { orderId: { in: orderIds } } })
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } })

      await prisma.customer.deleteMany({
        where: {
          OR: [
            { phone: canonicalCustomerPhone },
            { name: testCustomerName },
          ],
        },
      })

      if (testProduct) {
        await prisma.stockMovement.deleteMany({ where: { productId: testProduct.id } })
        await prisma.product.delete({ where: { id: testProduct.id } })
      }

      for (const id of orderIds) {
        await prisma.auditLog.deleteMany({ where: { entity: 'Order', entityId: String(id) } })
      }
    } catch (e) {
      console.error('Teardown cleanup error:', e)
    } finally {
      await prisma.$disconnect()
    }
  })

  test('checkout POS order and navigate through CRM', async ({ page, context }) => {
    // ── 1. Inject auth cookie directly (skip UI login entirely) ──────────
    await context.addCookies([
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

    // Navigate directly to create order page
    await page.goto('http://localhost:3000/store-portal-jl/dashboard/orders/create')
    await page.waitForSelector('input[placeholder="Search catalog to add..."]', { timeout: 60000 })

    // ── 2. Add seeded product to POS cart ─────────────────────────────────
    // Wait for product catalog to load from /api/products before searching
    // The catalog count span text says "N in catalog"
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
    // Fill search to filter to the test product
    await page.fill('input[placeholder="Search catalog to add..."]', testProductName)
    // Use getByText for robustness - wait for the product name text node
    await expect(page.getByText(testProductName, { exact: false })).toBeVisible({ timeout: 10000 })
    // Click the Add button nearest to the product name text
    const productRow = page.locator('div').filter({ hasText: new RegExp(testProductName) }).filter({ has: page.locator('button:has-text("Add")') }).last()
    await productRow.locator('button:has-text("Add")').click()
    // Verify item was added - cart should show at least 1 item now
    await expect(page.getByText('Order Summary (1 items)')).toBeVisible({ timeout: 5000 })

    // ── 3. Fill customer info ─────────────────────────────────────────────
    await page.fill('input[placeholder="e.g. Blessing Okafor"]', testCustomerName)
    await page.fill('input[placeholder="08012345678"]', rawCustomerPhone)

    // Select payment status
    await page.selectOption('#payment-status-select', 'PAID')

    // ── 4. Submit the order ───────────────────────────────────────────
    await page.click('button:has-text("Confirm & Generate Order")')

    // Capture a screenshot to diagnose what's on screen after submit
    await page.screenshot({ path: 'test-results/debug-after-submit.png', fullPage: true })

    // Log any visible error messages for debugging
    const toastEl = page.locator('[role="alert"], [class*="toast"], [class*="Toast"]').first()
    const hasToast = await toastEl.isVisible().catch(() => false)
    if (hasToast) {
      const toastText = await toastEl.innerText().catch(() => 'unknown')
      console.log('[SMOKE TEST] Toast after submit:', toastText)
    }

    // Wait for receipt screen — allow up to 60s for Neon DB cold-start
    await page.waitForSelector('h2:has-text("Order Recorded Successfully!")', { timeout: 60000 })
    const orderNumberEl = page.locator('p.text-amber-500').first()
    // Receipt displays as "#JL-XXXXXX" — strip the leading # before DB lookup
    const orderNumber = (await orderNumberEl.innerText()).trim().replace(/^#/, '')
    expect(orderNumber).toContain('JL-')

    // ── 5. Verify DB records ──────────────────────────────────────────────
    const dbProduct = await prisma.product.findUnique({ where: { id: testProduct.id } })
    expect(dbProduct?.stock).toBe(4) // Stock decremented 5 → 4

    const dbCustomer = await prisma.customer.findUnique({ where: { phone: canonicalCustomerPhone } })
    expect(dbCustomer).toBeDefined()
    expect(dbCustomer?.phone).toBe(canonicalCustomerPhone)  // Canonical +234 normalization
    // totalSpent includes product (10000) + default shipping (500) = 10500
    expect(dbCustomer?.totalSpent).toBe(10500)
    expect(dbCustomer?.ordersCount).toBe(1)

    const dbOrder = await prisma.order.findUnique({ where: { orderNumber } })
    expect(dbOrder).toBeDefined()
    expect(dbOrder?.customerId).toBe(dbCustomer?.id)

    const timeline = await prisma.orderTimeline.findFirst({
      where: { orderId: dbOrder?.id, eventType: 'ORDER_CREATED' },
    })
    expect(timeline).toBeDefined()

    const audit = await prisma.auditLog.findFirst({
      where: { entity: 'Order', entityId: String(dbOrder?.id), action: 'ORDER_CREATED' },
    })
    expect(audit).toBeDefined()

    // ── 6. CRM Navigation Deep-Link ───────────────────────────────────────
    await page.goto('http://localhost:3000/store-portal-jl/dashboard/customers')
    await page.waitForSelector('input[placeholder="Search by name, phone, email..."]')

    // Search by customer name to filter
    await page.fill('input[placeholder="Search by name, phone, email..."]', testCustomerName)
    await page.waitForSelector(`h3:has-text("${testCustomerName}")`)
    await page.click(`h3:has-text("${testCustomerName}")`)

    // CRM drawer opens — check order history panel
    await page.waitForSelector('h4:has-text("Purchase Transaction History")')
    await expect(page.locator('p:has-text("₦10,000")').first()).toBeVisible()

    // Click the order history link to deep-link back to orders page
    await page.click(`p.font-mono:has-text("${orderNumber}")`)

    // Should navigate to the orders page with ?openId= and open the drawer modal
    await page.waitForURL(`**/store-portal-jl/dashboard/orders?openId=${dbOrder?.id}`, { timeout: 15000 })
    await page.waitForSelector('p:has-text("Fulfillment tracking & payment validation")')
    await expect(page.locator(`h3:has-text("${orderNumber}")`)).toBeVisible()
  })
})
