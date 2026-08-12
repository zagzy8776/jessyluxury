import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    const body = await request.json()

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code: body.code.toUpperCase().trim(),
        discountType: body.discountType,
        discountValue: Number(body.discountValue),
        minOrderAmount: Number(body.minOrderAmount),
        usageLimit: Number(body.usageLimit),
        autoReactivate: Boolean(body.autoReactivate),
        isActive: Boolean(body.isActive),
      },
    })
    return NextResponse.json(coupon)
  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    await prisma.coupon.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}
