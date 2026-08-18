import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'

export async function GET(request: Request) {
  const authErr = await requireAdminAuth(request)
  if (authErr) return authErr

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        campaigns: true,
      },
    })
    return NextResponse.json(coupons)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authErr = await requireAdminAuth(request)
  if (authErr) return authErr

  try {
    const body = await request.json()
    const {
      code,
      name,
      storeLocation,
      discountType,
      discountValue,
      minOrderAmount,
      usageLimit,
      customerLimit = 1,
      maxDiscountAmount,
      startDate,
      endDate,
      productIds = [],
      categoryIds = [],
      isActive = true,
    } = body

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: 'Code, discountType, and discountValue are required' }, { status: 400 })
    }

    const uppercaseCode = code.trim().toUpperCase()

    // Enforce uniqueness
    const existing = await prisma.coupon.findUnique({
      where: { code: uppercaseCode },
    })
    if (existing) {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: uppercaseCode,
        name,
        storeLocation,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        usageLimit: Number(usageLimit) || 100,
        customerLimit: Number(customerLimit) || 1,
        maxDiscountAmount: maxDiscountAmount !== undefined && maxDiscountAmount !== null ? Number(maxDiscountAmount) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        productIds: Array.isArray(productIds) ? productIds.map(Number) : [],
        categoryIds: Array.isArray(categoryIds) ? categoryIds.map(Number) : [],
        isActive,
      },
    })

    // Log action to AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'COUPON_CREATED',
        entity: 'Coupon',
        entityId: String(coupon.id),
        details: `Created coupon ${uppercaseCode} (${discountType}: ${discountValue})`,
        changedBy: 'Admin',
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create coupon' }, { status: 500 })
  }
}
