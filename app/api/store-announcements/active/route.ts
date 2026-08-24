import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCustomerAuthenticated } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function matchesAudience(audience: string, customer: { CustomerGroup: { code: string; slug: string; name: string; isActive: boolean } | null } | null) {
  const normalized = String(audience || 'ALL').toUpperCase()
  if (normalized === 'ALL') return true
  if (!customer) return false

  const group = customer.CustomerGroup
  if (!group || !group.isActive) return false

  const groupValues = `${group.code} ${group.slug} ${group.name}`.toUpperCase()
  if (normalized === 'WHOLESALE') return /WHOLESALE|B2B|TRADE/.test(groupValues)
  if (normalized === 'VIP') return /VIP|PREMIUM|PLATINUM|GOLD/.test(groupValues)
  return false
}

export async function GET(request: Request) {
  try {
    const now = new Date()
    const customerId = await isCustomerAuthenticated(request)
    const customer = customerId
      ? await prisma.customer.findUnique({
          where: { id: customerId },
          select: {
            id: true,
            CustomerGroup: {
              select: { code: true, slug: true, name: true, isActive: true },
            },
          },
        })
      : null

    const announcements = await prisma.storeAnnouncement.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    const activeAnnouncement = announcements.find((item) => matchesAudience(item.audience, customer)) || null
    return NextResponse.json(activeAnnouncement)
  } catch (error: any) {
    console.error('Failed to fetch active announcement:', error)
    return NextResponse.json({ error: 'Failed to fetch active announcement' }, { status: 500 })
  }
}
