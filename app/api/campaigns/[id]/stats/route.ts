import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'
import { completedOrderWhere } from '@/lib/analytics/domain'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireAdminAuth(request)
  if (authErr) return authErr

  try {
    const campaignId = Number(params.id)

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { coupon: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // 1. Total coupon redemptions (historical coupon usage count)
    const redemptionsCount = await prisma.couponRedemption.count({
      where: { campaignId },
    })

    // 2. Completed orders using this campaign's redemptions
    // We join redemptions to completed orders
    const completedRedemptions = await prisma.couponRedemption.findMany({
      where: {
        campaignId,
        order: completedOrderWhere,
      },
      include: {
        order: {
          select: {
            total: true,
            discountAmount: true,
            items: {
              select: {
                price: true,
                unitCost: true,
                quantity: true,
              },
            },
          },
        },
      },
    })

    const completedOrdersCount = completedRedemptions.length
    const revenue = completedRedemptions.reduce((s, r) => s + r.order.total, 0)
    const discountCost = completedRedemptions.reduce((s, r) => s + r.order.discountAmount, 0)

    // Calculate Net Contribution = Revenue - COGS - DiscountCost
    let cogs = 0
    for (const r of completedRedemptions) {
      for (const item of r.order.items) {
        // If snapshot unitCost is not available, default to 0 for calculations
        const cost = item.unitCost ?? 0
        cogs += cost * item.quantity
      }
    }

    const netContribution = revenue - cogs // cogs already includes discount adjustments on item prices if overrides occurred

    return NextResponse.json({
      campaignId,
      name: campaign.name,
      couponCode: campaign.coupon.code,
      redemptionsCount,
      completedOrdersCount,
      revenue,
      discountCost,
      netContribution,
    })
  } catch (error: any) {
    console.error('Campaign stats aggregation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to aggregate stats' }, { status: 500 })
  }
}
