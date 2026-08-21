import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  try {
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 })
    }

    const group = await prisma.customerGroup.findUnique({
      where: { id },
      include: {
        WholesalePriceRule: {
          include: { Product: true, Category: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { Customer: true } },
      },
    })

    if (!group) {
      return NextResponse.json({ error: 'Customer group not found' }, { status: 404 })
    }

    return NextResponse.json(group)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customer group' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  try {
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 })
    }

    const existing = await prisma.customerGroup.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Customer group not found' }, { status: 404 })
    }

    const body = await request.json()
    const data: any = {}
    if (body.name !== undefined) data.name = String(body.name).trim()
    if (body.slug !== undefined) data.slug = slugify(String(body.slug))
    else if (body.name !== undefined) data.slug = slugify(String(body.name))
    if (body.description !== undefined) data.description = body.description ? String(body.description) : null
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive)
    data.updatedAt = new Date()

    const group = await prisma.customerGroup.update({
      where: { id },
      data,
    })

    await prisma.auditLog.create({
      data: {
        action: 'CUSTOMER_GROUP_UPDATED',
        entity: 'CustomerGroup',
        entityId: String(group.id),
        details: `Updated wholesale group "${group.name}"`,
        changedBy: 'Admin',
      },
    })

    return NextResponse.json(group)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A group with this name or slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to update customer group' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  try {
    const id = Number(params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 })
    }

    const existing = await prisma.customerGroup.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Customer group not found' }, { status: 404 })
    }

    await prisma.customerGroup.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        action: 'CUSTOMER_GROUP_DELETED',
        entity: 'CustomerGroup',
        entityId: String(id),
        details: `Deleted wholesale group "${existing.name}"`,
        changedBy: 'Admin',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete customer group' }, { status: 500 })
  }
}
