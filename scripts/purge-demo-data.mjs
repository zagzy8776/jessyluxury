/**
 * purge-demo-data.mjs
 *
 * Removes demo / sample data that may have been inserted by older versions of
 * scripts/seed.mjs. Safe for production use after you have confirmed real
 * catalogue data is already present (or you are ready to re-seed via admin).
 *
 * Usage:
 *   DATABASE_URL="..." node scripts/purge-demo-data.mjs
 *
 * What it deletes (in dependency order):
 * - CouponRedemption, OrderItem, OrderTimeline, PriceAdjustmentLog, Order
 * - Review
 * - Customer (and related push subs via cascade)
 * - Product (and stock movements via cascade)
 *
 * What it KEEPS:
 * - Categories, ShippingZones, Coupons, Campaigns, Staff, Settings, etc.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Purging demo products / customers / orders...')

  // Order of deletion respects FKs
  const deletedRedemptions = await prisma.couponRedemption.deleteMany()
  console.log('  CouponRedemption:', deletedRedemptions.count)

  const deletedTimeline = await prisma.orderTimeline.deleteMany()
  console.log('  OrderTimeline:', deletedTimeline.count)

  const deletedAdjustments = await prisma.priceAdjustmentLog.deleteMany()
  console.log('  PriceAdjustmentLog:', deletedAdjustments.count)

  const deletedItems = await prisma.orderItem.deleteMany()
  console.log('  OrderItem:', deletedItems.count)

  const deletedOrders = await prisma.order.deleteMany()
  console.log('  Order:', deletedOrders.count)

  const deletedReviews = await prisma.review.deleteMany()
  console.log('  Review:', deletedReviews.count)

  // Stock movements go with products via cascade, but explicit is fine
  const deletedMovements = await prisma.stockMovement.deleteMany()
  console.log('  StockMovement:', deletedMovements.count)

  const deletedProducts = await prisma.product.deleteMany()
  console.log('  Product:', deletedProducts.count)

  // Customers last (cascades push subscriptions)
  const deletedCustomers = await prisma.customer.deleteMany()
  console.log('  Customer:', deletedCustomers.count)

  console.log('\nDone. Demo catalogue data removed. Re-add real products via admin UI.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
