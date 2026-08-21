import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCustomerAuthenticated } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { pushToken, deviceType } = body

    if (!pushToken) {
      return NextResponse.json({ error: 'pushToken is required' }, { status: 400 })
    }

    // Try to get authenticated customer
    const customerId = await isCustomerAuthenticated(request)

    // Upsert subscription based on pushToken
    const subscription = await prisma.customerPushSubscription.upsert({
      where: { pushToken },
      update: {
        customerId: customerId || null,
        deviceType: deviceType || null,
        active: true
      },
      create: {
        pushToken,
        customerId: customerId || null,
        deviceType: deviceType || null,
        active: true,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true, subscription }, { status: 201 })
  } catch (error: any) {
    console.error('Push subscription save error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save subscription' }, { status: 500 })
  }
}
