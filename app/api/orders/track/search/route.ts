import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizePhoneNumber } from '@/lib/orders/phone'

// In-memory rate limiting map for search endpoint (simple IP-based counter resets every minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const limit = 20 // max 20 requests per minute
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

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'global'
  if (isRateLimited(ip)) {
    return new Response('Too Many Requests', { status: 429 })
  }

  try {
    const body = await request.json()
    const { orderNumber, customerPhone } = body

    if (!orderNumber || !customerPhone) {
      return NextResponse.json({ error: 'Order number and phone number are required' }, { status: 400 })
    }

    const cleanPhone = normalizePhoneNumber(customerPhone)
    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: orderNumber.trim(), mode: 'insensitive' },
        customerPhone: cleanPhone,
      },
      select: {
        trackingToken: true,
      },
    })

    if (!order || !order.trackingToken) {
      return NextResponse.json({ error: 'Order not found. Please check details.' }, { status: 404 })
    }

    return NextResponse.json({ trackingToken: order.trackingToken })
  } catch (error) {
    console.error('Error in public tracking search:', error)
    return NextResponse.json({ error: 'Failed to process search' }, { status: 500 })
  }
}
