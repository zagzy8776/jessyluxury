import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

export async function GET(request: Request) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const announcements = await prisma.storeAnnouncement.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })
    return NextResponse.json(announcements)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch announcements' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const body = await request.json()
    const {
      type,
      title,
      message,
      imageUrl,
      actionLabel,
      actionUrl,
      audience = 'ALL',
      priority = 0,
      dismissible = true,
      isActive = false,
      startsAt,
      endsAt,
      campaignId,
    } = body

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Type, title, and message are required' }, { status: 400 })
    }

    const announcement = await prisma.storeAnnouncement.create({
      data: {
        type,
        title,
        message,
        imageUrl: imageUrl || null,
        actionLabel: actionLabel || null,
        actionUrl: actionUrl || null,
        audience,
        priority: Number(priority),
        dismissible: Boolean(dismissible),
        isActive: Boolean(isActive),
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
        campaignId: campaignId ? Number(campaignId) : null,
        updatedAt: new Date(),
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'ANNOUNCEMENT_CREATED',
        entity: 'StoreAnnouncement',
        entityId: String(announcement.id),
        details: `Created store announcement: "${title}" (${type}) targeting ${audience}`,
        changedBy: 'Admin',
      }
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create announcement' }, { status: 500 })
  }
}
