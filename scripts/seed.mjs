import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Clear existing data in reverse order of dependencies
  await prisma.review.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.shippingZone.deleteMany()
  await prisma.coupon.deleteMany()

  // 1. Seed Categories
  const catOud = await prisma.category.create({ data: { name: 'Oud & Amber', slug: 'oud-amber' } })
  const catFresh = await prisma.category.create({ data: { name: 'Fresh', slug: 'fresh' } })
  const catSweet = await prisma.category.create({ data: { name: 'Sweet & Gourmand', slug: 'sweet-gourmand' } })
  const catOils = await prisma.category.create({ data: { name: 'Perfume Oils', slug: 'perfume-oils' } })
  const catGifts = await prisma.category.create({ data: { name: 'Gift Sets', slug: 'gift-sets' } })
  const catBest = await prisma.category.create({ data: { name: 'Best Sellers', slug: 'best-sellers' } })

  // 2. Seed Shipping Zones
  const zone1 = await prisma.shippingZone.create({
    data: {
      name: 'Store Pickup (Owerri)',
      fee: 0,
      estimatedDays: 'Same Day',
      description: 'Pick up in person at our store in Owerri after WhatsApp confirmation.',
      active: true,
    },
  })

  const zone2 = await prisma.shippingZone.create({
    data: {
      name: 'Owerri Central Express Rider',
      fee: 3000,
      estimatedDays: 'Same Day',
      description: 'Fast motorcycle dispatch direct to your home or office in Owerri central.',
      active: true,
    },
  })

  const zone3 = await prisma.shippingZone.create({
    data: {
      name: 'Owerri Outskirts Delivery',
      fee: 4000,
      estimatedDays: '1 Day',
      description: 'Rider delivery to Nekede, Irete, Umuchima, Egbu and environs.',
      active: true,
    },
  })

  const zone4 = await prisma.shippingZone.create({
    data: {
      name: 'Interstate Park Waybill',
      fee: 2500,
      estimatedDays: '1-2 Days',
      description: 'Dispatched to driver at motor park for delivery to your state/city.',
      active: true,
    },
  })

  const zone5 = await prisma.shippingZone.create({
    data: {
      name: 'Nationwide Doorstep Courier',
      fee: 5500,
      estimatedDays: '2-4 Days',
      description: 'Direct courier parcel delivery to Lagos, Abuja, Port Harcourt and all states.',
      active: true,
    },
  })

  // 3. Seed 6 Active Coupons with Auto-Reactivation
  await prisma.coupon.createMany({
    data: [
      { code: 'JESSY10', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 20000, usageLimit: 100, autoReactivate: true, isActive: true },
      { code: 'WELCOME5', discountType: 'PERCENTAGE', discountValue: 5, minOrderAmount: 10000, usageLimit: 200, autoReactivate: true, isActive: true },
      { code: 'LUXURY2000', discountType: 'FIXED', discountValue: 2000, minOrderAmount: 30000, usageLimit: 50, autoReactivate: true, isActive: true },
      { code: 'OUD2026', discountType: 'PERCENTAGE', discountValue: 15, minOrderAmount: 40000, usageLimit: 30, autoReactivate: true, isActive: true },
      { code: 'VIPGIFT', discountType: 'FIXED', discountValue: 5000, minOrderAmount: 60000, usageLimit: 20, autoReactivate: true, isActive: true },
      { code: 'FLASH20', discountType: 'PERCENTAGE', discountValue: 20, minOrderAmount: 50000, usageLimit: 15, autoReactivate: true, isActive: true },
    ],
  })

  // 4. Seed Products
  const p1 = await prisma.product.create({
    data: {
      name: 'Khair Pistachio',
      brand: 'Paris Corner',
      price: 36000,
      salePrice: 32000,
      badge: 'BEST',
      categoryId: catSweet.id,
      volume: '100ml EDP',
      notes: 'Pistachio · Cream · Vanilla',
      topNotes: 'Italian Bergamot, Pistachio Gelato, Hazelnut',
      middleNotes: 'Peony, White Peach, Raspberry, Jasmine',
      baseNotes: 'Whipped Cream, Marshmallow, Cotton Candy, Tonka Bean',
      description: 'A decadent and irresistible gourmand fragrance opening with creamy pistachio gelato and sweet hazelnut. Perfect for statement occasions and long-lasting impression.',
      tone: 'pistachio',
      stock: 8,
      featured: true,
      images: [
        'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
      ],
    },
  })

  const p2 = await prisma.product.create({
    data: {
      name: 'Supremacy Collector',
      brand: 'Afnan',
      price: 62000,
      badge: 'BEST',
      categoryId: catBest.id,
      volume: '100ml EDP',
      notes: 'Fruity · Woody · Amber',
      topNotes: 'Pineapple, Bergamot, Blackcurrant, Apple',
      middleNotes: 'Birch, Patchouli, Moroccan Jasmine, Rose',
      baseNotes: 'Musk, Oakmoss, Ambergris, Vanilla',
      description: 'An iconic fragrance of royal charisma. Combining rich fruity accords with smokey birch and ambergris foundation for effortless elegance.',
      tone: 'amber',
      stock: 5,
      featured: true,
      images: [
        'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
      ],
    },
  })

  const p3 = await prisma.product.create({
    data: {
      name: 'Invicto Legend',
      brand: 'Fragrance World',
      price: 38000,
      badge: 'NEW',
      categoryId: catFresh.id,
      volume: '100ml EDP',
      notes: 'Fresh · Aromatic · Woody',
      topNotes: 'Sea Salt, Sea Notes, Grapefruit',
      middleNotes: 'Bay Leaf, Geranium, Spices',
      baseNotes: 'Red Amber, Guaiac Wood',
      description: 'An invigorating oceanic blast designed for modern men. Clean aquatic energy balanced by warm red amber.',
      tone: 'fresh',
      stock: 12,
      featured: true,
      images: [
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
      ],
    },
  })

  const p4 = await prisma.product.create({
    data: {
      name: 'Almas Perfume Oil',
      brand: 'Jessy Selection',
      price: 14000,
      salePrice: 12000,
      badge: 'OIL',
      categoryId: catOils.id,
      volume: '12ml Concentrated Oil',
      notes: 'Warm · Floral · Musk',
      topNotes: 'Damask Rose, White Floral Accord',
      middleNotes: 'Warm Amber, Honeycomb',
      baseNotes: 'Velvety White Musk, Sandalwood',
      description: 'Alcohol-free concentrated perfume oil that sits intimately on your pulse points for 24+ hours.',
      tone: 'rose',
      stock: 20,
      featured: true,
      images: [
        'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800&auto=format&fit=crop',
      ],
    },
  })

  const p5 = await prisma.product.create({
    data: {
      name: 'Raghba Intense',
      brand: 'Lattafa',
      price: 42000,
      salePrice: 30000,
      badge: 'SALE',
      categoryId: catOud.id,
      volume: '100ml EDP',
      notes: 'Oud · Vanilla · Amber',
      topNotes: 'Cedarwood, Guaiac Wood, Licorice',
      middleNotes: 'Agarwood (Oud), Sugar, Cashmere Wood',
      baseNotes: 'Vanilla, Amber, Musk, Incense',
      description: 'A dark, rich Arabian gem featuring smokey incense, sweet caramelized vanilla, and deep golden agarwood.',
      tone: 'oud',
      stock: 6,
      featured: false,
    },
  })

  const p6 = await prisma.product.create({
    data: {
      name: 'The Signature Gift Set',
      brand: 'Jessy Curated',
      price: 68000,
      badge: 'BEST',
      categoryId: catGifts.id,
      volume: 'Luxury Gift Box',
      notes: 'EDP + Oil + Travel Spray',
      topNotes: 'Curated blend of Amber, Rose & Oud',
      middleNotes: 'Hand-picked luxury miniature scents',
      baseNotes: 'Satin lined keepsake gift box',
      description: 'The ultimate luxury gift set. Comes complete with a 100ml EDP bottle, 12ml perfume oil roll-on, and a portable travel spray.',
      tone: 'amber',
      stock: 4,
      featured: true,
      gift: true,
      images: [
        'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
      ],
    },
  })

  // 5. Seed Reviews
  await prisma.review.create({
    data: {
      productId: p1.id,
      customerName: 'Adaeze O.',
      rating: 5,
      comment: 'Smells exactly like high-end pistachio gelato! Lasts all day on clothes.',
    },
  })
  await prisma.review.create({
    data: {
      productId: p2.id,
      customerName: 'Chinedu K.',
      rating: 5,
      comment: 'Top tier fragrance for gents. Compliments nonstop at the office.',
    },
  })

  // 6. Seed Customers & Sample Orders for CRM Demonstration
  const cust1 = await prisma.customer.create({
    data: {
      name: 'Adaeze Okonkwo',
      phone: '+2348031234567',
      whatsapp: '2348031234567',
      email: 'adaeze.o@gmail.com',
      city: 'Owerri',
      address: '14 Ikenegbu Layout, Owerri',
      totalSpent: 94000,
      ordersCount: 2,
    },
  })

  const cust2 = await prisma.customer.create({
    data: {
      name: 'Chinedu Kalu',
      phone: '+2348149876543',
      whatsapp: '2348149876543',
      email: 'chinedukalu@yahoo.com',
      city: 'Lagos',
      address: 'Block B, Lekki Phase 1, Lagos',
      totalSpent: 62000,
      ordersCount: 1,
    },
  })

  const cust3 = await prisma.customer.create({
    data: {
      name: 'Amaka Eze',
      phone: '+2349023456789',
      whatsapp: '2349023456789',
      email: 'amaka.eze@outlook.com',
      city: 'Port Harcourt',
      address: '22 GRA Phase 2, Port Harcourt',
      totalSpent: 68000,
      ordersCount: 1,
    },
  })

  // Create sample orders
  await prisma.order.create({
    data: {
      orderNumber: 'JL-849201',
      customerId: cust1.id,
      customerName: cust1.name,
      customerPhone: cust1.phone,
      customerWhatsapp: cust1.whatsapp,
      shippingAddress: cust1.address,
      shippingZoneId: zone2.id,
      shippingFee: 3000,
      subtotal: 32000,
      discountAmount: 0,
      total: 35000,
      status: 'SHIPPED',
      trackingNumber: 'OWR-RIDER-88',
      courierName: 'Kwik Rider Emeka',
      courierPhone: '+2348099887766',
      waybillNotes: 'Package handed over to rider at 10:30 AM',
      items: {
        create: [{ productId: p1.id, quantity: 1, price: 32000 }],
      },
    },
  })

  await prisma.order.create({
    data: {
      orderNumber: 'JL-773104',
      customerId: cust2.id,
      customerName: cust2.name,
      customerPhone: cust2.phone,
      customerWhatsapp: cust2.whatsapp,
      shippingAddress: cust2.address,
      shippingZoneId: zone4.id,
      shippingFee: 2500,
      subtotal: 62000,
      discountAmount: 2000,
      couponCode: 'LUXURY2000',
      total: 62500,
      status: 'PROCESSING',
      trackingNumber: 'PARK-WB-9042',
      courierName: 'Peace Mass Transit Park (Owerri to PH)',
      courierPhone: '+2348033322110',
      waybillNotes: 'Dispatched via bus no. 42 at relief market park',
      items: {
        create: [{ productId: p2.id, quantity: 1, price: 62000 }],
      },
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
