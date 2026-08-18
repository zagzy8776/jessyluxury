import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const authError = await requireAdminAuth(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: any = {
      recipientType: 'ADMIN',
      archivedAt: null,
    }

    if (unreadOnly) {
      where.readAt = null
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        deliveries: {
          select: {
            channel: true,
            provider: true,
            status: true,
            attempts: true,
            errorMessage: true,
            sentAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching admin notifications:', error)
    return NextResponse.json({ error: 'Failed to retrieve notifications' }, { status: 500 })
  }
}

// Bulk action: Mark all as read
export async function PUT(request: Request) {
  try {
    const authError = await requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { action } = body

    if (action === 'READ_ALL') {
      await prisma.notification.updateMany({
        where: {
          recipientType: 'ADMIN',
          readAt: null,
          archivedAt: null,
        },
        data: {
          readAt: new Date(),
        },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error) {
    console.error('Error modifying admin notifications:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}
