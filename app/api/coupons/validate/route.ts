import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { code, subtotal } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    })

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive promo code' }, { status: 404 })
    }

    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json(
        {
          error: `Minimum order amount of ₦${coupon.minOrderAmount.toLocaleString()} required for this coupon`,
        },
        { status: 400 }
      )
    }

    // Auto-reactivate feature check: if reached limit but autoReactivate is enabled, reset usedCount
    if (coupon.usedCount >= coupon.usageLimit) {
      if (coupon.autoReactivate) {
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: 0 },
        })
      } else {
        return NextResponse.json({ error: 'This coupon usage limit has been reached' }, { status: 400 })
      }
    }

    let discountAmount = 0
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100)
    } else {
      discountAmount = coupon.discountValue
    }

    // Discount cannot exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal)

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 })
  }
}
