import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const id = Number(params.id)
    const body = await request.json()

    // Retrieve existing announcement
    const existing = await prisma.storeAnnouncement.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    const {
      type,
      title,
      message,
      imageUrl,
      actionLabel,
      actionUrl,
      audience,
      priority,
      dismissible,
      isActive,
      startsAt,
      endsAt,
      campaignId,
    } = body

    const updated = await prisma.storeAnnouncement.update({
      where: { id },
      data: {
        type: type !== undefined ? type : existing.type,
        title: title !== undefined ? title : existing.title,
        message: message !== undefined ? message : existing.message,
        imageUrl: imageUrl !== undefined ? (imageUrl || null) : existing.imageUrl,
        actionLabel: actionLabel !== undefined ? (actionLabel || null) : existing.actionLabel,
        actionUrl: actionUrl !== undefined ? (actionUrl || null) : existing.actionUrl,
        audience: audience !== undefined ? audience : existing.audience,
        priority: priority !== undefined ? Number(priority) : existing.priority,
        dismissible: dismissible !== undefined ? Boolean(dismissible) : existing.dismissible,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        startsAt: startsAt !== undefined ? (startsAt ? new Date(startsAt) : null) : existing.startsAt,
        endsAt: endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : existing.endsAt,
        campaignId: campaignId !== undefined ? (campaignId ? Number(campaignId) : null) : existing.campaignId,
      }
    })

    await prisma.auditLog.create({
      data: {
        action: 'ANNOUNCEMENT_UPDATED',
        entity: 'StoreAnnouncement',
        entityId: String(id),
        details: `Updated store announcement: "${updated.title}"`,
        changedBy: 'Admin',
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update announcement' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const id = Number(params.id)

    const existing = await prisma.storeAnnouncement.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    await prisma.storeAnnouncement.delete({
      where: { id }
    })

    await prisma.auditLog.create({
      data: {
        action: 'ANNOUNCEMENT_DELETED',
        entity: 'StoreAnnouncement',
        entityId: String(id),
        details: `Deleted store announcement: "${existing.title}"`,
        changedBy: 'Admin',
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete announcement' }, { status: 500 })
  }
}
