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

export async function GET(request: Request) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  try {
    const groups = await prisma.customerGroup.findMany({
      include: {
        _count: { select: { Customer: true, WholesalePriceRule: true } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(groups)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch customer groups' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 })
    }

    const slug = slugify(body.slug || name)
    if (!slug) {
      return NextResponse.json({ error: 'A valid slug is required' }, { status: 400 })
    }

    const group = await prisma.customerGroup.create({
      data: {
        name,
        slug,
        description: body.description ? String(body.description) : null,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
        updatedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'CUSTOMER_GROUP_CREATED',
        entity: 'CustomerGroup',
        entityId: String(group.id),
        details: `Created wholesale group "${group.name}"`,
        changedBy: 'Admin',
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A group with this name or slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create customer group' }, { status: 500 })
  }
}
