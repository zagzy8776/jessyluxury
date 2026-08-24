#!/usr/bin/env node
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for RTVERIFY10 coupon...\n')
  
  const coupon = await prisma.coupon.findUnique({
    where: { code: 'RTVERIFY10' },
  })
  
  if (coupon) {
    console.log('✅ Coupon exists:')
    console.log(JSON.stringify(coupon, null, 2))
  } else {
    console.log('❌ Coupon not found')
    console.log('\nSearching for similar coupons...')
    const allCoupons = await prisma.coupon.findMany({
      where: {
        code: {
          contains: 'RT',
        },
      },
    })
    console.log(`Found ${allCoupons.length} coupons with 'RT':`)
    allCoupons.forEach(c => console.log(`  - ${c.code} (active: ${c.isActive})`))
  }
  
  await prisma.$disconnect()
}

main().catch(console.error)
