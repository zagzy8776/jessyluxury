import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { loginAsOwner, getOwnerSessionCookie } from './helpers/admin-login'
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
  let testCategory: any
  let testProduct: any
  let testCustomer: any
  let createdOrderId: number
  const runId = Math.floor(1000 + Math.random() * 9000)
  const ns = `ANA_${runId}`
  const testCustomerName = `Analytics Tester ${ns}`
  // Same local/canonical pattern as smoke.spec.ts — derive canonical from local so the fixture is valid regardless of runId width
  const rawCustomerPhone = `0800111${String(runId).padStart(4, '0').slice(-4)}`
  const canonicalCustomerPhone = `+234${rawCustomerPhone.slice(1)}`

  test.beforeAll(async () => {
    test.setTimeout(180000)
    // 1. Programmatic database setup
    testCategory = await prisma.category.create({
      data: {
        name: `Analytics Test Category ${ns}`,
        slug: `analytics-test-cat-${ns.toLowerCase()}`,
        updatedAt: new Date(),
      },
    })

    testProduct = await prisma.product.create({
      data: {
        name: `Analytics Initial Name ${ns}`,
        brand: 'Initial Brand',
        price: 30000,
        costPrice: 15000,
        volume: '100ml EDP',
        notes: 'Rose · Vanilla',
        stock: 10,
        reserved: 0,
        categoryId: testCategory.id,
        updatedAt: new Date(),
      },
    })

    testCustomer = await prisma.customer.create({
      data: {
        name: testCustomerName,
        phone: canonicalCustomerPhone,
        whatsapp: canonicalCustomerPhone,
        acquisitionSource: 'Instagram',
        updatedAt: new Date(),
      },
    })

    // 2. Warm the dev-server compile cache for the POS page. Next.js compiles
    // routes on demand; a cold compile of this page can exceed the 60s
    // selector timeout below, so pre-render it once here.
    // Authentication uses a REAL login (server-issued session cookie) —
    // no client-side token generation.
    const sessionCookie = await getOwnerSessionCookie()
    await fetch('http://localhost:3000/store-portal-jl/dashboard/orders/create', {
      headers: { Cookie: `${sessionCookie.name}=${sessionCookie.value}` },
    }).catch(() => {})
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
    test.setTimeout(300000)
    // Establish an authenticated session through the real login endpoint;
    // the server-issued cookie persists in this page's browser context.
    await loginAsOwner(page)

    // Go to POS create order page.
    // 180s selector budget: on a cold dev server this page's on-demand compile
    // plus hydration can exceed 60s (verified via failure screenshot showing the
    // page fully rendered shortly after the 60s timeout fired).
    await page.goto('http://localhost:3000/store-portal-jl/dashboard/orders/create')
    await page.waitForSelector('input[placeholder="Search catalog to add…"]', { timeout: 280000 })

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
    const productName = `Analytics Initial Name ${ns}`
    await page.fill('input[placeholder="Search catalog to add…"]', productName)
    await expect(page.getByText(productName, { exact: false })).toBeVisible({ timeout: 10000 })

    // Add to cart
    const productRow = page.locator('div').filter({ hasText: new RegExp(productName) }).filter({ has: page.locator('button:has-text("Add")') }).last()
    await productRow.locator('button:has-text("Add")').click()
    // Cart panel heading renders as "Cart ({cartItems.length})"
    await expect(page.locator('h2:has-text("Cart (1)")')).toBeVisible({ timeout: 10000 })

    // Fill customer details
    await page.fill('input[placeholder="e.g. Blessing Okafor"]', testCustomerName)
    await page.fill('input[placeholder="08012345678"]', rawCustomerPhone)

    // Select payment status and submit order
    await page.selectOption('#payment-status-select', 'PAID')
    await page.click('button:has-text("Confirm & Generate Order")')
    await page.waitForSelector('h2:has-text("Order Recorded Successfully!")', { timeout: 60000 })

    // Extract Order Number from receipt screen
    // Receipt renders: <p class="mt-1 font-mono text-lg font-bold ...">#{orderNumber}</p>
    const orderNumberEl = page.locator('p.font-mono:has-text("JL-")').first()
    const orderNumber = (await orderNumberEl.innerText()).trim().replace(/^#/, '')

    // Verify DB snapshots immediately
    const dbOrder = await prisma.order.findUnique({
      where: { orderNumber },
      include: { OrderItem: true },
    })
    expect(dbOrder).toBeDefined()
    createdOrderId = dbOrder!.id

    // Check salesChannel is recorded as "Physical"
    expect(dbOrder!.salesChannel).toBe('Physical')

    const dbItem = dbOrder!.OrderItem[0]
    expect(dbItem.unitCost).toBe(15000)
    expect(dbItem.productNameSnapshot).toBe(`Analytics Initial Name ${ns}`)
    expect(dbItem.brandSnapshot).toBe('Initial Brand')

    // ─── Simulate historical edits ──────────────────────────────────────────
    // Change current product cost, name, and brand
    await prisma.product.update({
      where: { id: testProduct.id },
      data: {
        name: `Analytics Modified Name ${ns}`,
        brand: 'Modified Brand',
        costPrice: 22000,
      },
    })

    // Fetch analytics and verify snapshots are preserved
    await page.goto('http://localhost:3000/store-portal-jl/dashboard/analytics')
    // Dashboard h1 renders "Analytics"
    await page.waitForSelector('h1:has-text("Analytics")')

    // Check KPI profit card is visible (data loads asynchronously; the page
    // renders skeletons while fetching, so allow a generous budget)
    const profitValueEl = page.locator('div:has(span:has-text("Profit after Discounts")) > p.font-display').first()
    await expect(profitValueEl).toBeVisible({ timeout: 120000 })
    const profitText = await profitValueEl.innerText()
    expect(profitText).toContain('₦')

    // Switch to Products Tab
    await page.getByRole('button', { name: 'Products', exact: true }).click()

    const bestSellersCard = page.locator('div').filter({ hasText: 'Top Selling Fragrances' }).last()
    // Historic name and brand should still display in the transaction snapshot list
    // Best-sellers list may render the same product in multiple rows (historic
    // snapshot + current), so target the first match and assert the modified
    // name is absent (count-based) rather than relying on single-element matches.
    await expect(bestSellersCard.getByText(`Analytics Initial Name ${ns}`).first()).toBeVisible()
    await expect(bestSellersCard.getByText('Initial Brand').first()).toBeVisible()
    await expect(bestSellersCard.getByText(`Analytics Modified Name ${ns}`)).toHaveCount(0)

    // Switch to Channels Tab
    await page.getByRole('button', { name: 'Channels', exact: true }).click()
    // Recorded salesChannel is Physical
    await expect(page.locator('span:has-text("Physical")').first()).toBeVisible({ timeout: 15000 })
  })
})
