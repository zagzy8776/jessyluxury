/**
 * Jessy Luxury — SAFE demo/test data cleanup.
 *
 * DRY-RUN BY DEFAULT. Nothing is deleted unless you pass --confirm.
 *
 * Usage:
 *   node scripts/cleanup-demo-data.mjs             # preview only (safe)
 *   node scripts/cleanup-demo-data.mjs --confirm   # actually delete
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const CONFIRM = process.argv.includes('--confirm')

// Demo/test identification patterns — tight and explicit on purpose so real
// production records can never match.
const DEMO_NAME_RE =
  /\b(test|demo|sample|fake|dummy|placeholder|john doe|jane doe)\b/i
const DEMO_EMAIL_RE = /@(test|demo|example|fake|mailinator|yopmail)\.[a-z]+$/i
const DEMO_ORDER_RE = /^(demo|test)[-_]/i
const DEMO_PHONES = ['0000000000', '1234567890', '08000000000', '9999999999']
// Explicit E2E-suite artefacts observed in this database.
const DEMO_CUSTOMER_RE = /\b(promo target user|notif_e2e|optout cust)\b/i
const DEMO_COUPON_RE = /(loc_crud_e2e|^e2e_|_coupon_test$)/i

function isDemoCustomer(c) {
  const phone = (c.phone || '').replace(/\s/g, '')
  return (
    DEMO_NAME_RE.test(c.name || '') ||
    DEMO_CUSTOMER_RE.test(c.name || '') ||
    (!!c.email && DEMO_EMAIL_RE.test(c.email)) ||
    /^(\+?234)?0{6,}/.test(phone) ||
    DEMO_PHONES.includes(phone)
  )
}

function isDemoCoupon(code) {
  return DEMO_COUPON_RE.test((code || '').toLowerCase())
}

function isDemoOrder(o) {
  return DEMO_ORDER_RE.test(o.orderNumber || '') || DEMO_NAME_RE.test(o.customerName || '')
}

async function main() {
  console.log('─'.repeat(70))
  console.log(`Jessy Luxury demo-data cleanup — ${CONFIRM ? 'CONFIRMED RUN' : 'DRY RUN (nothing will be deleted)'}`)
  console.log('─'.repeat(70))

  const [customers, orders, products] = await Promise.all([
    prisma.customer.findMany({ include: { _count: { select: { Order: true } } } }),
    prisma.order.findMany({
      include: {
        OrderItem: { select: { id: true, productId: true, quantity: true } },
        CouponRedemption: { select: { id: true, couponId: true } },
      },
    }),
    prisma.product.findMany({ include: { _count: { select: { OrderItem: true } } } }),
  ])

  const demoCustomers = customers.filter((c) => isDemoCustomer(c))
  const demoCustomerIds = new Set(demoCustomers.map((c) => c.id))

  // Orders matching patterns, or belonging to a demo customer.
  const demoOrders = orders.filter(
    (o) => isDemoOrder(o) || (o.customerId && demoCustomerIds.has(o.customerId))
  )
  const demoOrderIdSet = new Set(demoOrders.map((o) => o.id))

  // Products: name matches AND never sold.
  const demoProducts = products.filter(
    (p) => DEMO_NAME_RE.test(p.name || '') && p._count.OrderItem === 0
  )

  // Coupons: explicit E2E naming only, never redeemed, no campaign attached.
  const allCouponRows = await prisma.coupon.findMany({
    include: { _count: { select: { CouponRedemption: true, Campaign: true } } },
  })
  const demoCoupons = allCouponRows.filter(
    (c) => isDemoCoupon(c.code) && c._count.CouponRedemption === 0
  )

  // Customers whose ONLY orders are demo orders are removable too.
  const realOrderCustomerIds = new Set(
    orders.filter((o) => !demoOrderIdSet.has(o.id)).map((o) => o.customerId).filter(Boolean)
  )
  const removableCustomers = customers.filter(
    (c) =>
      !realOrderCustomerIds.has(c.id) &&
      c._count.Order ===
        orders.filter((o) => o.customerId === c.id && demoOrderIdSet.has(o.id)).length &&
      (demoCustomerIds.has(c.id) || c._count.Order > 0)
  )

  console.log('\nIDENTIFIED DEMO/TEST RECORDS')
  console.log(`   Orders:    ${demoOrders.length} of ${orders.length}`)
  console.log(`   Customers: ${removableCustomers.length} of ${customers.length}`)
  console.log(`   Products:  ${demoProducts.length} of ${products.length} (unsold + name matched)`)

  for (const o of demoOrders.slice(0, 20)) {
    console.log(`   - Order ${o.orderNumber} (${o.status}/${o.paymentStatus}, N${o.total})`)
  }
  for (const c of removableCustomers.slice(0, 30)) {
    console.log(`   - Customer #${c.id} ${c.name} <${c.phone}>`)
  }
  for (const p of demoProducts.slice(0, 30)) {
    console.log(`   - Product #${p.id} ${p.name}`)
  }
  for (const c of demoCoupons.slice(0, 30)) {
    console.log(`   - Coupon #${c.id} ${c.code}`)
  }

  if (!CONFIRM) {
    console.log('\nDRY RUN COMPLETE — no data was modified.')
    console.log('Review the list above, then re-run with --confirm to delete.')
    await prisma.$disconnect()
    return
  }

  await runDeletion(demoOrders, removableCustomers, demoProducts, demoCoupons)
}

export async function runDeletion(demoOrders, removableCustomers, demoProducts, demoCoupons = []) {
  console.log('\nDELETING...')

  // Never allow wiping the whole commercial history by accident.
  const totalOrders = await prisma.order.count()
  if (totalOrders > 0 && demoOrders.length >= totalOrders) {
    console.error('REFUSING: every order in the database matched demo patterns. Aborting.')
    await prisma.$disconnect()
    process.exit(1)
  }

  let deletedOrders = 0
  let deletedCustomers = 0
  let deletedProducts = 0
  let deletedCoupons = 0

  // Demo ORDERS: dependents first, inventory restored like the admin API.
  for (const order of demoOrders) {
    await prisma.$transaction(async (tx) => {
      const paid = order.paymentStatus === 'PAID'
      const cancelledOrReturned = order.status === 'CANCELLED' || order.status === 'RETURNED'

      if (!cancelledOrReturned) {
        for (const item of order.OrderItem) {
          if (paid) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            })
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { reserved: { decrement: item.quantity } },
            })
          }
        }
      }

      // Recalculate coupon usage before removing redemptions.
      for (const redemption of order.CouponRedemption) {
        await tx.coupon.update({
          where: { id: redemption.couponId },
          data: { usedCount: { decrement: 1 } },
        })
      }

      await tx.orderTimeline.deleteMany({ where: { orderId: order.id } })
      await tx.priceAdjustmentLog.deleteMany({ where: { orderId: order.id } })
      await tx.couponRedemption.deleteMany({ where: { orderId: order.id } })
      await tx.orderItem.deleteMany({ where: { orderId: order.id } })
      await tx.order.delete({ where: { id: order.id } })

      await tx.auditLog.create({
        data: {
          action: 'DEMO_DATA_CLEANUP',
          entity: 'Order',
          entityId: String(order.id),
          details: `Removed demo order ${order.orderNumber}. Inventory restored.`,
          changedBy: 'cleanup-script',
        },
      })

      deletedOrders++
    })
  }

  // Demo CUSTOMERS that now have zero remaining orders.
  for (const customer of removableCustomers) {
    const remaining = await prisma.order.count({ where: { customerId: customer.id } })
    if (remaining > 0) continue

    await prisma.$transaction(async (tx) => {
      await tx.couponRedemption.deleteMany({ where: { customerId: customer.id } })
      await tx.customerPushSubscription.deleteMany({ where: { customerId: customer.id } })
      await tx.customer.delete({ where: { id: customer.id } })
      deletedCustomers++
    })
  }

  // Unsold demo PRODUCTS.
  for (const product of demoProducts) {
    const stillReferenced = await prisma.orderItem.count({ where: { productId: product.id } })
    if (stillReferenced > 0) continue

    await prisma.$transaction(async (tx) => {
      await tx.stockMovement.deleteMany({ where: { productId: product.id } })
      await tx.review.deleteMany({ where: { productId: product.id } })
      await tx.wholesalePriceRule.deleteMany({ where: { productId: product.id } })
      await tx.product.delete({ where: { id: product.id } })
      deletedProducts++
    })
  }

  // E2E test COUPONS (never redeemed; campaign-linked ones are skipped).
  for (const coupon of demoCoupons) {
    if (coupon._count.Campaign > 0) {
      console.log(`   ! Skipping coupon ${coupon.code} — still attached to a campaign.`)
      continue
    }
    await prisma.coupon.delete({ where: { id: coupon.id } })
    deletedCoupons++
  }

  // Recalculate derived statistics so every dashboard number is truthful.
  const allCoupons = await prisma.coupon.findMany({ select: { id: true } })
  for (const coupon of allCoupons) {
    const used = await prisma.couponRedemption.count({
      where: { couponId: coupon.id },
    })
    await prisma.coupon.update({
      where: { id: coupon.id },
      data: { usedCount: used },
    })
  }

  const allCustomers = await prisma.customer.findMany({ select: { id: true } })
  for (const customer of allCustomers) {
    const agg = await prisma.order.aggregate({
      where: {
        customerId: customer.id,
        paymentStatus: 'PAID',
        status: { notIn: ['CANCELLED', 'RETURNED'] },
      },
      _count: { _all: true },
      _sum: { total: true },
    })
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        ordersCount: agg._count._all,
        totalSpent: agg._sum.total || 0,
      },
    })
  }

  console.log('\nCLEANUP COMPLETE')
  console.log(`   Orders deleted:    ${deletedOrders}`)
  console.log(`   Customers deleted: ${deletedCustomers}`)
  console.log(`   Products deleted:  ${deletedProducts}`)
  console.log(`   Coupons deleted:   ${deletedCoupons}`)
  console.log('   Coupon usage recalculated for all coupons.')
  console.log('   Customer ordersCount/totalSpent recalculated for all accounts.')
  console.log('   Untouched: categories, shipping zones, staff, settings, campaigns.')

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('\nCleanup failed:', err)
  await prisma.$disconnect()
  process.exit(1)
})
