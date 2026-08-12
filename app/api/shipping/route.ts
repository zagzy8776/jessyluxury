import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const zones = await prisma.shippingZone.findMany({
      orderBy: { fee: 'asc' },
    })
    return NextResponse.json(zones)
  } catch (error) {
    console.error('Error fetching shipping zones:', error)
    return NextResponse.json({ error: 'Failed to fetch shipping zones' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const zone = await prisma.shippingZone.create({
      data: {
        name: body.name,
        fee: Number(body.fee),
        estimatedDays: body.estimatedDays || '1-2 days',
        description: body.description || null,
        active: body.active !== undefined ? Boolean(body.active) : true,
      },
    })
    return NextResponse.json(zone, { status: 201 })
  } catch (error) {
    console.error('Error creating shipping zone:', error)
    return NextResponse.json({ error: 'Failed to create shipping zone' }, { status: 500 })
  }
}
