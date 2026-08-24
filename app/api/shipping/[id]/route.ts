import { NextResponse } from 'next/server'
import { requireStaffAuth } from '@/lib/staff-auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'fulfillment')
  if (authErr) return authErr

  try {
    const id = parseInt(params.id, 10)
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid shipping zone ID' }, { status: 400 })

    const body = await request.json()
    const name = String(body.name || '').trim()
    const fee = Number(body.fee)
    const estimatedDays = String(body.estimatedDays || '').trim()

    if (!name) return NextResponse.json({ error: 'Shipping zone name is required' }, { status: 400 })
    if (!Number.isInteger(fee) || fee < 0) return NextResponse.json({ error: 'Delivery fee must be a non-negative whole number' }, { status: 400 })
    if (!estimatedDays) return NextResponse.json({ error: 'Estimated delivery time is required' }, { status: 400 })

    const duplicate = await prisma.shippingZone.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, NOT: { id } },
      select: { id: true },
    })
    if (duplicate) return NextResponse.json({ error: 'A shipping zone with this name already exists' }, { status: 409 })

    const zone = await prisma.shippingZone.update({
      where: { id },
      data: {
        name,
        fee,
        estimatedDays,
        description: body.description ? String(body.description).trim() : null,
        active: Boolean(body.active),
        isPickup: body.isPickup !== undefined ? Boolean(body.isPickup) : false,
      },
    })
    return NextResponse.json(zone)
  } catch (error: any) {
    console.error('Error updating shipping zone:', error)
    if (error?.code === 'P2002') return NextResponse.json({ error: 'A shipping zone with this name already exists' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to update shipping zone' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'fulfillment')
  if (authErr) return authErr

  try {
    const id = parseInt(params.id, 10)
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Invalid shipping zone ID' }, { status: 400 })

    const systemDefaults = await prisma.systemDefaults.findUnique({
      where: { id: 1 },
      select: { defaultShippingZoneId: true },
    })

    if (systemDefaults?.defaultShippingZoneId === id) {
      return NextResponse.json({ error: 'Cannot delete the shipping zone currently used as the system default' }, { status: 409 })
    }

    await prisma.shippingZone.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting shipping zone:', error)
    if (error?.code === 'P2025') return NextResponse.json({ error: 'Shipping zone not found' }, { status: 404 })
    if (error?.code === 'P2003') return NextResponse.json({ error: 'This shipping zone is referenced by existing orders and cannot be deleted. Deactivate it instead.' }, { status: 409 })
    return NextResponse.json({ error: 'Failed to delete shipping zone' }, { status: 500 })
  }
}
