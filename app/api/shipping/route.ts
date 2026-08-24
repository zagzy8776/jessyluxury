import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

const TEST_ZONE_FILTER = {
  NOT: [
    { name: { contains: 'e2e', mode: 'insensitive' as const } },
    { name: { contains: 'test', mode: 'insensitive' as const } },
    { name: { contains: 'fixture', mode: 'insensitive' as const } },
    { name: { contains: 'smoke', mode: 'insensitive' as const } },
  ],
}

export async function GET(request: Request) {
  try {
    // Staff with fulfillment permission needs the full management view,
    // including inactive/test rows so they can clean, edit, or remove them.
    const authErr = await requireStaffAuth(request, 'fulfillment')
    if (!authErr) {
      const zones = await prisma.shippingZone.findMany({
        orderBy: { fee: 'asc' },
      })
      return NextResponse.json(zones)
    }

    // A valid staff session without fulfillment permission must not fall
    // through to the public data path.
    if (authErr.status === 403) return authErr

    // Public/storefront view: active, customer-facing zones only.
    const zones = await prisma.shippingZone.findMany({
      where: {
        active: true,
        ...TEST_ZONE_FILTER,
      },
      orderBy: { fee: 'asc' },
    })
    return NextResponse.json(zones)
  } catch (error) {
    console.error('Error fetching shipping zones:', error)
    return NextResponse.json({ error: 'Failed to fetch shipping zones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authErr = await requireStaffAuth(request, 'fulfillment')
  if (authErr) return authErr

  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    const fee = Number(body.fee)
    const estimatedDays = String(body.estimatedDays || '1-2 days').trim()

    if (!name) return NextResponse.json({ error: 'Shipping zone name is required' }, { status: 400 })
    if (!Number.isInteger(fee) || fee < 0) {
      return NextResponse.json({ error: 'Delivery fee must be a non-negative whole number' }, { status: 400 })
    }
    if (!estimatedDays) {
      return NextResponse.json({ error: 'Estimated delivery time is required' }, { status: 400 })
    }

    const zone = await prisma.shippingZone.create({
      data: {
        name,
        fee,
        estimatedDays,
        description: body.description ? String(body.description).trim() : null,
        active: body.active !== undefined ? Boolean(body.active) : true,
        isPickup: body.isPickup !== undefined ? Boolean(body.isPickup) : false,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json(zone, { status: 201 })
  } catch (error: any) {
    console.error('Error creating shipping zone:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A shipping zone with this name already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create shipping zone' }, { status: 500 })
  }
}
