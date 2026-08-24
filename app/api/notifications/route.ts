import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated, isCustomerAuthenticated } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated(request)
    const customerId = await isCustomerAuthenticated(request)

    if (!isAdmin && !customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: any = {
      archivedAt: null,
    }

    if (isAdmin) {
      where.recipientType = 'ADMIN'
    } else {
      where.recipientType = 'CUSTOMER'
      where.recipientId = customerId
    }

    if (unreadOnly) {
      where.readAt = null
    }

    const notifications = await prisma.notification.findMany({
      where,
      ...(isAdmin
        ? {
            include: {
              NotificationDelivery: {
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
          }
        : {}),
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to retrieve notifications' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated(request)
    const customerId = await isCustomerAuthenticated(request)

    if (!isAdmin && !customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'READ_ALL') {
      const where: any = {
        readAt: null,
        archivedAt: null,
      }

      if (isAdmin) {
        where.recipientType = 'ADMIN'
      } else {
        where.recipientType = 'CUSTOMER'
        where.recipientId = customerId
      }

      await prisma.notification.updateMany({
        where,
        data: {
          readAt: new Date(),
        },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (error) {
    console.error('Error modifying notifications:', error)
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
  }
}
