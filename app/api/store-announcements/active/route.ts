import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()

    // Query active announcements sorted by priority descending
    const announcements = await prisma.storeAnnouncement.findMany({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { endsAt: null },
              { endsAt: { gte: now } }
            ]
          }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Return the highest-priority active announcement, or null if none exist
    const activeAnnouncement = announcements[0] || null
    return NextResponse.json(activeAnnouncement)
  } catch (error: any) {
    console.error('Failed to fetch active announcement:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch active announcement' }, { status: 500 })
  }
}
