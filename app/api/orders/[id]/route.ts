import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const query = params.id

    // Search by numeric ID or Order Number
    let order = null
    const numericId = parseInt(query, 10)

    if (!isNaN(numericId)) {
      order = await prisma.order.findUnique({
        where: { id: numericId },
        include: {
          items: { include: { product: true } },
          shippingZone: true,
          customer: true,
        },
      })
    }

    if (!order) {
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { orderNumber: { equals: query, mode: 'insensitive' } },
            { customerPhone: { contains: query } },
          ],
        },
        include: {
          items: { include: { product: true } },
          shippingZone: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10)
    const body = await request.json()

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: body.status,
        trackingNumber: body.trackingNumber,
        courierName: body.courierName,
        courierPhone: body.courierPhone,
        waybillNotes: body.waybillNotes,
      },
      include: {
        items: { include: { product: true } },
        shippingZone: true,
        customer: true,
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
