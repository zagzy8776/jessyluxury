import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting production-safe seed...')

  // NOTE: This seed intentionally does NOT create demo products, customers or orders.
  // Running demo data on a live domain is unsafe. Use admin UI to add real catalogue.
  // The minimal settings seed lives in prisma/seed.ts (PaymentSettings, NotificationSettings, SystemDefaults).

  // Categories (idempotent-ish via unique name/slug – re-run is safe if already present)
  const categories = [
    { name: 'Oud & Amber', slug: 'oud-amber' },
    { name: 'Fresh', slug: 'fresh' },
    { name: 'Sweet & Gourmand', slug: 'sweet-gourmand' },
    { name: 'Perfume Oils', slug: 'perfume-oils' },
    { name: 'Gift Sets', slug: 'gift-sets' },
    { name: 'Best Sellers', slug: 'best-sellers' },
  ]

  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        ...c,
        updatedAt: new Date(),
      },
    })
  }
  console.log('✅ Categories ready')

  // Shipping zones
  const zones = [
    {
      name: 'Store Pickup (Owerri)',
      fee: 0,
      estimatedDays: 'Same Day',
      description: 'Pick up in person at our store in Owerri after WhatsApp confirmation.',
      active: true,
      isPickup: true,
    },
    {
      name: 'Owerri Central Express Rider',
      fee: 3000,
      estimatedDays: 'Same Day',
      description: 'Fast motorcycle dispatch direct to your home or office in Owerri central.',
      active: true,
    },
    {
      name: 'Owerri Outskirts Delivery',
      fee: 4000,
      estimatedDays: '1 Day',
      description: 'Rider delivery to Nekede, Irete, Umuchima, Egbu and environs.',
      active: true,
    },
    {
      name: 'Interstate Park Waybill',
      fee: 2500,
      estimatedDays: '1-2 Days',
      description: 'Dispatched to driver at motor park for delivery to your state/city.',
      active: true,
    },
    {
      name: 'Nationwide Doorstep Courier',
      fee: 5500,
      estimatedDays: '2-4 Days',
      description: 'Direct courier parcel delivery to Lagos, Abuja, Port Harcourt and all states.',
      active: true,
    },
  ]

  for (const z of zones) {
    await prisma.shippingZone.upsert({
      where: { name: z.name },
      update: {
        fee: z.fee,
        estimatedDays: z.estimatedDays,
        description: z.description,
        active: z.active,
        isPickup: z.isPickup || false,
        updatedAt: new Date(),
      },
      create: {
        ...z,
        updatedAt: new Date(),
      },
    })
  }
  console.log('✅ Shipping zones ready')

  // Core coupons (optional starter set – deactivate or delete in admin if not wanted)
  const coupons = [
    { code: 'JESSY10', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 20000, usageLimit: 100, autoReactivate: true, isActive: true },
    { code: 'WELCOME5', discountType: 'PERCENTAGE', discountValue: 5, minOrderAmount: 10000, usageLimit: 200, autoReactivate: true, isActive: true },
    { code: 'LUXURY2000', discountType: 'FIXED', discountValue: 2000, minOrderAmount: 30000, usageLimit: 50, autoReactivate: true, isActive: true },
  ]

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: {
        ...c,
        updatedAt: new Date(),
      },
    })
  }
  console.log('✅ Starter coupons ready')

  console.log('Production-safe seed complete. No demo products / customers / orders were created.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
