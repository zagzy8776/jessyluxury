import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'marketing')
  if (authErr) return authErr

  try {
    const couponId = parseInt(params.id, 10)
    if (isNaN(couponId)) {
      return NextResponse.json({ error: 'Invalid coupon ID' }, { status: 400 })
    }

    const currentCoupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    })

    if (!currentCoupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      code,
      name,
      storeLocation,
      discountType,
      discountValue,
      minOrderAmount,
      usageLimit,
      customerLimit,
      maxDiscountAmount,
      startDate,
      endDate,
      productIds,
      categoryIds,
      isActive,
      wholesaleEligible,
      autoReactivate,
      usedCount, // Allow manual reset
    } = body

    // If code is being changed, check uniqueness
    if (code && code.trim().toUpperCase() !== currentCoupon.code) {
      const uppercaseCode = code.trim().toUpperCase()
      const existing = await prisma.coupon.findUnique({
        where: { code: uppercaseCode },
      })
      if (existing) {
        return NextResponse.json(
          { error: 'A coupon with this code already exists' },
          { status: 409 }
        )
      }
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id: couponId },
      data: {
        code: code ? code.trim().toUpperCase() : undefined,
        name: name !== undefined ? name : undefined,
        storeLocation: storeLocation !== undefined ? storeLocation : undefined,
        discountType: discountType || undefined,
        discountValue: discountValue !== undefined ? Number(discountValue) : undefined,
        minOrderAmount: minOrderAmount !== undefined ? Number(minOrderAmount) : undefined,
        usageLimit: usageLimit !== undefined ? Number(usageLimit) : undefined,
        customerLimit: customerLimit !== undefined ? Number(customerLimit) : undefined,
        maxDiscountAmount:
          maxDiscountAmount !== undefined && maxDiscountAmount !== null
            ? Number(maxDiscountAmount)
            : maxDiscountAmount === null
            ? null
            : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        productIds:
          productIds !== undefined
            ? Array.isArray(productIds)
              ? productIds.map(Number)
              : []
            : undefined,
        categoryIds:
          categoryIds !== undefined
            ? Array.isArray(categoryIds)
              ? categoryIds.map(Number)
              : []
            : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        wholesaleEligible: wholesaleEligible !== undefined ? Boolean(wholesaleEligible) : undefined,
        autoReactivate: autoReactivate !== undefined ? Boolean(autoReactivate) : undefined,
        usedCount: usedCount !== undefined ? Number(usedCount) : undefined,
        updatedAt: new Date(),
      },
    })

    // Log action to AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'COUPON_UPDATED',
        entity: 'Coupon',
        entityId: String(couponId),
        details: `Updated coupon ${updatedCoupon.code}`,
        changedBy: 'Admin',
      },
    })

    return NextResponse.json(updatedCoupon)
  } catch (error: any) {
    console.error('Error updating coupon:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update coupon' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'marketing')
  if (authErr) return authErr

  try {
    const couponId = parseInt(params.id, 10)
    if (isNaN(couponId)) {
      return NextResponse.json({ error: 'Invalid coupon ID' }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
      include: {
        // Historical promotion records must never be destroyed.
        CouponRedemption: { select: { id: true } },
        Campaign: { select: { id: true, name: true, isActive: true } },
      },
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 })
    }

    const redemptionCount = coupon.CouponRedemption.length
    const campaigns = coupon.Campaign

    // Campaigns hold a REQUIRED foreign key to the coupon, so a hard delete is
    // impossible without destroying campaign configuration.
    if (campaigns.length > 0) {
      return NextResponse.json(
        {
          error: `This coupon is linked to ${campaigns.length} marketing campaign${campaigns.length === 1 ? '' : 's'} (${campaigns
            .map((c) => c.name)
            .join(', ')}). Delete or reassign those campaigns first, or deactivate this coupon instead.`,
        },
        { status: 409 }
      )
    }

    // A coupon that has been redeemed carries historical financial/promotion
    // data. Never destroy it — deactivate instead so past orders stay valid.
    if (redemptionCount > 0) {
      const deactivated = await prisma.coupon.update({
        where: { id: couponId },
        data: { isActive: false, updatedAt: new Date() },
      })

      await prisma.auditLog.create({
        data: {
          action: 'COUPON_DEACTIVATED',
          entity: 'Coupon',
          entityId: String(couponId),
          details: `Coupon ${coupon.code} deactivated on delete request because it has ${redemptionCount} historical redemption${redemptionCount === 1 ? '' : 's'}. Redemption history preserved.`,
          changedBy: 'Admin',
        },
      })

      return NextResponse.json({
        deactivated: true,
        message: `Coupon ${coupon.code} has ${redemptionCount} historical redemption${redemptionCount === 1 ? '' : 's'}, so it was deactivated instead of deleted to preserve sales history.`,
        coupon: deactivated,
      })
    }

    // No protected history — safe to hard delete.
    await prisma.$transaction(async (tx) => {
      await tx.coupon.delete({ where: { id: couponId } })
      await tx.auditLog.create({
        data: {
          action: 'COUPON_DELETED',
          entity: 'Coupon',
          entityId: String(couponId),
          details: `Deleted unused coupon ${coupon.code}`,
          changedBy: 'Admin',
        },
      })
    })

    return NextResponse.json({
      message: `Coupon ${coupon.code} deleted successfully`,
      code: coupon.code,
    })
  } catch (error: any) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete coupon' },
      { status: 500 }
    )
  }
}
