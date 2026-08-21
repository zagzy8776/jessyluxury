import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// In-memory rate limiting map for demo/safety (simple IP-based counter resets every minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const limit = 30 // max 30 requests per minute
  const windowMs = 60 * 1000

  const userLimit = rateLimitMap.get(ip)
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return false
  }

  userLimit.count++
  if (userLimit.count > limit) {
    return true
  }
  return false
}

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const ip = request.headers.get('x-forwarded-for') || 'global'
  if (isRateLimited(ip)) {
    return new Response('Too Many Requests', { status: 429 })
  }

  const { token } = params
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  try {
    const order = await prisma.order.findUnique({
      where: { trackingToken: token },
      include: {
        OrderItem: true,
        OrderTimeline: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!order) {
      // Keep response generic to prevent token enumeration discovery
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Explicit allowlist filtering for security & privacy
    const publicItems = order.OrderItem.map((item) => ({
      productName: item.productNameSnapshot || 'Product Item',
      brand: item.brandSnapshot || 'Jessy Luxury',
      quantity: item.quantity,
      price: item.price,
    }))

    // Allowlist timeline events that are safe for customers
    const publicTimeline = order.OrderTimeline
      .filter((evt) =>
        ['ORDER_CREATED', 'PAYMENT_UPDATED', 'ORDER_CANCELLED', 'STATUS_CHANGED', 'ORDER_SHIPPED', 'ORDER_DELIVERED'].includes(
          evt.eventType
        )
      )
      .map((evt) => ({
        eventType: evt.eventType,
        message: evt.message,
        createdAt: evt.createdAt,
      }))

    const publicOrder = {
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,
      courierName: order.courierName,
      shippingZone: order.shippingZoneNameSnapshot || 'Standard Dispatch',
      estimatedDays: order.estimatedDaysSnapshot || '1-2 Days',
      items: publicItems,
      timeline: publicTimeline,
      total: order.total,
    }

    return NextResponse.json(publicOrder)
  } catch (error) {
    console.error('Error in public tracking endpoint:', error)
    return NextResponse.json({ error: 'Failed to query tracking' }, { status: 500 })
  }
}
