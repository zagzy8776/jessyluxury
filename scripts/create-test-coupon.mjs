#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating RTVERIFY10 test coupon...\n')
  
  // Check if exists
  const existing = await prisma.coupon.findUnique({
    where: { code: 'RTVERIFY10' },
  })
  
  if (existing) {
    console.log('✅ Coupon already exists')
    console.log(JSON.stringify(existing, null, 2))
    await prisma.$disconnect()
    return
  }
  
  // Create it
  const coupon = await prisma.coupon.create({
    data: {
      code: 'RTVERIFY10',
      name: 'Runtime Verification Test Coupon',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 0,
      usageLimit: 100,
      customerLimit: 1,
      isActive: true,
      updatedAt: new Date(),
    },
  })
  
  console.log('✅ Coupon created:')
  console.log(JSON.stringify(coupon, null, 2))
  
  await prisma.$disconnect()
}

main().catch(console.error)
