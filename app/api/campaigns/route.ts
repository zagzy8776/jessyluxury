import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'
import { broadcastOneSignalPush } from '@/lib/notifications/client'

export async function GET(request: Request) {
  const authErr = await requireAdminAuth(request)
  if (authErr) return authErr

  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        coupon: true,
      },
    })
    return NextResponse.json(campaigns)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authErr = await requireAdminAuth(request)
  if (authErr) return authErr

  try {
    const body = await request.json()
    const {
      name,
      description,
      couponId,
      audience = 'ALL',
      channel,
      startDate,
      endDate,
      isActive = true,
    } = body

    if (!name || !couponId || !channel || !startDate || !endDate) {
      return NextResponse.json({ error: 'Name, couponId, channel, startDate, and endDate are required' }, { status: 400 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        couponId: Number(couponId),
        audience,
        channel,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
      },
      include: {
        coupon: true,
      },
    })

    // Broadcast push notification to all subscribed customers if channel is push/all and campaign is active
    if (campaign.isActive && (campaign.channel === 'Push' || campaign.channel === 'All')) {
      try {
        const promoMsg = campaign.coupon
          ? `${campaign.description || ''} Use promo code: ${campaign.coupon.code}`
          : campaign.description || ''
        broadcastOneSignalPush(campaign.name, promoMsg, `/store-portal-jl/dashboard/sales-marketing/campaigns`).catch((err) => {
          console.error('Failed to broadcast campaign push notification:', err)
        })
      } catch (err) {
        console.error('Failed to initiate campaign push broadcast:', err)
      }
    }

    await prisma.auditLog.create({
      data: {
        action: 'CAMPAIGN_CREATED',
        entity: 'Campaign',
        entityId: String(campaign.id),
        details: `Created campaign ${name} targeting ${audience} via ${channel}`,
        changedBy: 'Admin',
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create campaign' }, { status: 500 })
  }
}
