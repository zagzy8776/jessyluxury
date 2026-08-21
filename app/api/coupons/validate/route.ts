import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCompletedOrder } from '@/lib/analytics/domain'
import { couponAudienceError, getActiveWholesaleGroupId } from '@/lib/wholesale/pricing'

/**
 * Normalise phone number to raw digits for matching
 */
function normalisePhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, customerId, subtotal, items } = body

    if (!code || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Coupon code and cart items are required' }, { status: 400 })
    }

    // 1. Fetch Coupon from DB
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon code not found' }, { status: 404 })
    }

    // 2. Validate Active Status
    if (!coupon.isActive) {
      return NextResponse.json({ error: 'This coupon is currently disabled' }, { status: 400 })
    }

    const wholesaleGroupId = customerId ? await getActiveWholesaleGroupId(Number(customerId)) : null
    const audienceError = couponAudienceError(Boolean(coupon.wholesaleEligible), wholesaleGroupId != null)
    if (audienceError) {
      return NextResponse.json({ error: audienceError }, { status: 400 })
    }

    // 3. Validate Date Boundaries (Africa/Lagos = UTC+1)
    const nowUtc = new Date()
    const LAGOS_OFFSET = 1 * 60 * 60 * 1000
    const nowLagos = new Date(nowUtc.getTime() + LAGOS_OFFSET)

    if (coupon.startDate) {
      const startLagos = new Date(new Date(coupon.startDate).getTime() + LAGOS_OFFSET)
      if (nowLagos < startLagos) {
        return NextResponse.json({ error: 'This coupon promotion has not started yet' }, { status: 400 })
      }
    }

    if (coupon.endDate) {
      const endLagos = new Date(new Date(coupon.endDate).getTime() + LAGOS_OFFSET)
      if (nowLagos > endLagos) {
        return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
      }
    }

    // 4. Validate Global Usage Limits
    if (coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'This coupon limit has been fully redeemed' }, { status: 400 })
    }

    // 5. Validate Per-Customer Usage Limits
    if (customerId) {
      const redemptionsCount = await prisma.couponRedemption.count({
        where: {
          couponId: coupon.id,
          customerId: Number(customerId),
        },
      })

      if (redemptionsCount >= coupon.customerLimit) {
        return NextResponse.json({
          error: `You have reached the limit of ${coupon.customerLimit} use(s) for this coupon`,
        }, { status: 400 })
      }
    }

    // 6. Validate Minimum Spend against overall order subtotal
    if (subtotal < coupon.minOrderAmount) {
      return NextResponse.json({
        error: `Minimum order subtotal of ₦${coupon.minOrderAmount.toLocaleString('en-NG')} required to use this coupon`,
      }, { status: 400 })
    }

    // 7. Calculate Eligible Subtotal (Filter items based on category/product constraints)
    let eligibleSubtotal = 0
    let hasEligibleItems = false

    const hasProductRestrictions = coupon.productIds && coupon.productIds.length > 0
    const hasCategoryRestrictions = coupon.categoryIds && coupon.categoryIds.length > 0

    // Fetch product details for items to check category matching
    const itemIds = items.map((i: any) => Number(i.productId))
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, categoryId: true },
    })
    const productCategoryMap = Object.fromEntries(dbProducts.map((p) => [p.id, p.categoryId]))

    for (const item of items) {
      const productId = Number(item.productId)
      const categoryId = productCategoryMap[productId]

      const matchesProduct = !hasProductRestrictions || coupon.productIds.includes(productId)
      const matchesCategory = !hasCategoryRestrictions || (categoryId && coupon.categoryIds.includes(categoryId))

      // OR logic: eligible if satisfies product restriction OR category restriction
      // If no restrictions are specified, all products are eligible by default
      const isEligible = (!hasProductRestrictions && !hasCategoryRestrictions) || matchesProduct || matchesCategory

      if (isEligible) {
        eligibleSubtotal += Number(item.price) * Number(item.quantity)
        hasEligibleItems = true
      }
    }

    if (!hasEligibleItems) {
      return NextResponse.json({
        error: 'None of the items in your cart are eligible for this discount code',
      }, { status: 400 })
    }

    // 8. Calculate Discount Amount
    let discountAmount = 0
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((eligibleSubtotal * coupon.discountValue) / 100)
      if (coupon.maxDiscountAmount !== null && coupon.maxDiscountAmount !== undefined) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount)
      }
    } else {
      // FIXED DISCOUNT TYPE
      discountAmount = Math.min(coupon.discountValue, eligibleSubtotal)
    }

    return NextResponse.json({
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      calculatedDiscount: discountAmount,
      eligibleSubtotal,
    })
  } catch (error: any) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({ error: error.message || 'Validation failed' }, { status: 500 })
  }
}
