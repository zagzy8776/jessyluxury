import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(coupons)
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.toUpperCase().trim(),
        discountType: body.discountType || 'PERCENTAGE',
        discountValue: Number(body.discountValue),
        minOrderAmount: Number(body.minOrderAmount) || 0,
        usageLimit: Number(body.usageLimit) || 100,
        autoReactivate: body.autoReactivate !== undefined ? Boolean(body.autoReactivate) : true,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    })
    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}
