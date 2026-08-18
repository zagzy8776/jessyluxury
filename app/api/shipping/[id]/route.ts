import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireAdminAuth(request)
  if (authErr) return authErr

  try {
    const id = parseInt(params.id, 10)
    const body = await request.json()

    const zone = await prisma.shippingZone.update({
      where: { id },
      data: {
        name: body.name,
        fee: Number(body.fee),
        estimatedDays: body.estimatedDays,
        description: body.description,
        active: Boolean(body.active),
        isPickup: body.isPickup !== undefined ? Boolean(body.isPickup) : undefined,
      },
    })
    return NextResponse.json(zone)
  } catch (error) {
    console.error('Error updating shipping zone:', error)
    return NextResponse.json({ error: 'Failed to update shipping zone' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireAdminAuth(request)
  if (authErr) return authErr

  try {
    const id = parseInt(params.id, 10)
    await prisma.shippingZone.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shipping zone:', error)
    return NextResponse.json({ error: 'Failed to delete shipping zone' }, { status: 500 })
  }
}
