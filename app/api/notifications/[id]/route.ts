import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const authError = await requireAdminAuth(request)
    if (authError) return authError

    const notificationId = parseInt(params.id, 10)
    if (isNaN(notificationId)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 })
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    })

    if (!notification || notification.recipientType !== 'ADMIN') {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'READ') {
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      })
      return NextResponse.json(updated)
    }

    if (action === 'UNREAD') {
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: null },
      })
      return NextResponse.json(updated)
    }

    if (action === 'ARCHIVE') {
      const updated = await prisma.notification.update({
        where: { id: notificationId },
        data: { archivedAt: new Date() },
      })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notification details:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
