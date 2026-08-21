import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'
import { broadcastOneSignalPush } from '@/lib/notifications/client'

export async function GET(request: Request) {
  const authErr = await requireStaffAuth(request, 'marketing')
  if (authErr) return authErr

  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        Coupon: true,
      },
    })
    return NextResponse.json(campaigns)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authErr = await requireStaffAuth(request, 'marketing')
  if (authErr) return authErr

  try {
    const body = await request.json()
    const {
      name,
      description,
      couponId,
      audience = 'ALL',
      startDate,
      endDate,
      isActive = true,
      emailEnabled = false,
      pushEnabled = false,
      websiteEnabled = false,
    } = body

    if (!name || !couponId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Name, couponId, startDate, and endDate are required' }, { status: 400 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        couponId: Number(couponId),
        audience,
        channel: 'Multi-Channel', // Legacy support
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive,
        emailEnabled: Boolean(emailEnabled),
        pushEnabled: Boolean(pushEnabled),
        websiteEnabled: Boolean(websiteEnabled),
        updatedAt: new Date(),
      },
      include: {
        Coupon: true,
      },
    })

    const promoMsg = campaign.Coupon
      ? `${campaign.description || ''} Use code: ${campaign.Coupon.code}`
      : campaign.description || ''

    // 1. Website Announcement Channel
    if (campaign.isActive && campaign.websiteEnabled) {
      try {
        await prisma.storeAnnouncement.create({
          data: {
            type: 'PROMOTION',
            title: campaign.name,
            message: promoMsg,
            actionLabel: campaign.Coupon ? `USE CODE: ${campaign.Coupon.code}` : 'DISCOVER',
            actionUrl: '/',
            audience: campaign.audience,
            priority: 50,
            dismissible: true,
            isActive: true,
            startsAt: campaign.startDate,
            endsAt: campaign.endDate,
            campaignId: campaign.id,
            updatedAt: new Date(),
          }
        })
      } catch (annErr) {
        console.error('Failed to create store announcement for campaign:', annErr)
      }
    }

    // 2. Email & Push Broadcast Channels (Background batched queueing)
    if (campaign.isActive && (campaign.emailEnabled || campaign.pushEnabled)) {
      Promise.resolve().then(async () => {
        try {
          console.log(`[Campaign Worker] Starting background queueing for campaign: ${campaign.id}, audience: ${campaign.audience}`)
          // Resolve audience target filters
          let customerWhere: any = {}
          if (campaign.audience === 'VIP') {
            customerWhere = { totalSpent: { gte: 50000 } }
          } else if (campaign.audience === 'INSTAGRAM_ACQUIRED') {
            customerWhere = { acquisitionSource: { contains: 'Instagram', mode: 'insensitive' } }
          } else if (campaign.audience === 'WHATSAPP_ACQUIRED') {
            customerWhere = { acquisitionSource: { contains: 'WhatsApp', mode: 'insensitive' } }
          } else if (campaign.audience === 'INACTIVE') {
            customerWhere = { ordersCount: 0 }
          }

          console.log(`[Campaign Worker] customerWhere:`, JSON.stringify(customerWhere))

          let skip = 0
          const take = 100
          let hasMore = true

          while (hasMore) {
            const batchCustomers = await prisma.customer.findMany({
              where: customerWhere,
              select: { id: true, email: true, marketingEmail: true, marketingPush: true },
              skip,
              take
            })

            console.log(`[Campaign Worker] batchCustomers count:`, batchCustomers.length)

            if (batchCustomers.length === 0) {
              hasMore = false
              break
            }

            for (const cust of batchCustomers) {
              const eventKey = `campaign:${campaign.id}:cust:${cust.id}:MARKETING`
              console.log(`[Campaign Worker] Processing customer: ${cust.id}, eventKey: ${eventKey}`)

              const existing = await prisma.notification.findUnique({
                where: { eventKey }
              })
              if (existing) continue

              const notification = await prisma.notification.create({
                data: {
                  eventKey,
                  type: 'campaign.marketing',
                  title: campaign.name,
                  message: promoMsg,
                  payload: { campaignId: campaign.id, couponId: campaign.couponId },
                  recipientType: 'CUSTOMER',
                  recipientId: cust.id,
                }
              })

              // Email outbox delivery
              if (campaign.emailEnabled) {
                const initialStatus = (cust.marketingEmail && cust.email) ? 'PENDING' : 'SKIPPED'
                const errorMessage = !cust.email
                  ? 'NO_EMAIL'
                  : !cust.marketingEmail
                    ? 'MARKETING_EMAIL_DISABLED'
                    : null

                await prisma.notificationDelivery.create({
                  data: {
                    notificationId: notification.id,
                    channel: 'EMAIL',
                    provider: 'RESEND',
                    status: initialStatus,
                    errorMessage,
                    sentAt: null
                  }
                })
              }

              // Push outbox delivery
              if (campaign.pushEnabled) {
                let initialStatus = 'PENDING'
                let errorMessage = null

                if (!cust.marketingPush) {
                  initialStatus = 'SKIPPED'
                  errorMessage = 'MARKETING_PUSH_DISABLED'
                } else {
                  const subsCount = await prisma.customerPushSubscription.count({
                    where: { customerId: cust.id, active: true }
                  })
                  if (subsCount === 0) {
                    initialStatus = 'SKIPPED'
                    errorMessage = 'NO_PUSH_SUBSCRIPTION'
                  }
                }

                await prisma.notificationDelivery.create({
                  data: {
                    notificationId: notification.id,
                    channel: 'PUSH',
                    provider: 'ONESIGNAL',
                    status: initialStatus,
                    errorMessage,
                    sentAt: null
                  }
                })
              }
            }

            skip += take
          }

          // Trigger worker loopback execution
          const secret = process.env.WORKER_SECRET || 'secret'
          fetch('http://localhost:3000/api/notifications/worker', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-worker-secret': secret,
            },
          }).catch(() => { })

        } catch (err) {
          console.error('[Campaign Dispatcher] Background batch outbox error:', err)
        }
      })
    }

    await prisma.auditLog.create({
      data: {
        action: 'CAMPAIGN_CREATED',
        entity: 'Campaign',
        entityId: String(campaign.id),
        details: `Created campaign ${name} targeting ${audience} (Email: ${emailEnabled}, Push: ${pushEnabled}, Web: ${websiteEnabled})`,
        changedBy: 'Admin',
      },
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create campaign' }, { status: 500 })
  }
}
