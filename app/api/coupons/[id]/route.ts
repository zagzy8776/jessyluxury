import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'marketing')
  if (authErr) return authErr

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: Number(params.id) },
      include: { Campaign: true },
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    return NextResponse.json(coupon)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch coupon' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'marketing')
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
      wholesaleEligible,
    } = body

    const existingCoupon = await prisma.coupon.findUnique({
      where: { id: Number(params.id) },
    })

    if (!existingCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    const uppercaseCode = code ? code.trim().toUpperCase() : existingCoupon.code

    // If changing code, verify uniqueness
    if (code && uppercaseCode !== existingCoupon.code) {
      const codeDuplicate = await prisma.coupon.findUnique({
        where: { code: uppercaseCode },
      })
      if (codeDuplicate) {
        return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 409 })
      }
    }

    const updated = await prisma.coupon.update({
      where: { id: Number(params.id) },
      data: {
        code: uppercaseCode,
        name,
        storeLocation,
        discountType,
        discountValue: discountValue !== undefined ? Number(discountValue) : undefined,
        minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : undefined,
        usageLimit: usageLimit !== undefined ? Number(usageLimit) : undefined,
        customerLimit: customerLimit !== undefined ? Number(customerLimit) : undefined,
        maxDiscountAmount: maxDiscountAmount !== undefined ? (maxDiscountAmount !== null ? Number(maxDiscountAmount) : null) : undefined,
        startDate: startDate ? new Date(startDate) : startDate === null ? null : undefined,
        endDate: endDate ? new Date(endDate) : endDate === null ? null : undefined,
        productIds: Array.isArray(productIds) ? productIds.map(Number) : undefined,
        categoryIds: Array.isArray(categoryIds) ? categoryIds.map(Number) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        wholesaleEligible: wholesaleEligible !== undefined ? Boolean(wholesaleEligible) : undefined,
      },
    })

    // Log action to AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'COUPON_UPDATED',
        entity: 'Coupon',
        entityId: String(updated.id),
        details: `Updated coupon properties for ${uppercaseCode}. Status: ${isActive ? 'Active' : 'Deactivated'}`,
        changedBy: 'Admin',
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update coupon' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'marketing')
  if (authErr) return authErr

  try {
    const couponId = Number(params.id)

    // Check for campaigns or redemptions
    const campaignsCount = await prisma.campaign.count({ where: { couponId } })
    const redemptionsCount = await prisma.couponRedemption.count({ where: { couponId } })

    if (campaignsCount > 0 || redemptionsCount > 0) {
      // Soft-deactivate instead of full database delete to preserve historical integrity
      const deactivated = await prisma.coupon.update({
        where: { id: couponId },
        data: { isActive: false },
      })
      await prisma.auditLog.create({
        data: {
          action: 'COUPON_DEACTIVATED',
          entity: 'Coupon',
          entityId: String(deactivated.id),
          details: `Soft-deactivated coupon ${deactivated.code} due to active historical campaigns/redemptions`,
          changedBy: 'Admin',
        },
      })
      return NextResponse.json({ message: 'Coupon soft-deactivated to protect historical references', coupon: deactivated })
    }

    const deleted = await prisma.coupon.delete({
      where: { id: couponId },
    })

    await prisma.auditLog.create({
      data: {
        action: 'COUPON_DELETED',
        entity: 'Coupon',
        entityId: String(deleted.id),
        details: `Hard deleted coupon code ${deleted.code}`,
        changedBy: 'Admin',
      },
    })

    return NextResponse.json({ message: 'Coupon hard deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete coupon' }, { status: 500 })
  }
}
