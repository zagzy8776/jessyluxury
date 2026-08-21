import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  try {
    const customerGroupId = Number(params.id)
    if (!Number.isInteger(customerGroupId) || customerGroupId <= 0) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 })
    }

    const group = await prisma.customerGroup.findUnique({ where: { id: customerGroupId } })
    if (!group) {
      return NextResponse.json({ error: 'Customer group not found' }, { status: 404 })
    }

    const body = await request.json()
    const productId = body.productId ? Number(body.productId) : null
    const categoryId = body.categoryId ? Number(body.categoryId) : null
    const minQuantity = body.minQuantity !== undefined ? Number(body.minQuantity) : 1
    const unitPrice = body.unitPrice !== undefined && body.unitPrice !== null && body.unitPrice !== ''
      ? Number(body.unitPrice)
      : null
    const discountPercent = body.discountPercent !== undefined && body.discountPercent !== null && body.discountPercent !== ''
      ? Number(body.discountPercent)
      : null

    if (productId && categoryId) {
      return NextResponse.json({ error: 'A rule can target a product or a category, not both' }, { status: 400 })
    }
    if (!Number.isInteger(minQuantity) || minQuantity < 1) {
      return NextResponse.json({ error: 'Minimum quantity must be a positive integer' }, { status: 400 })
    }
    if (unitPrice == null && discountPercent == null) {
      return NextResponse.json({ error: 'Provide either a unit price or a discount percent' }, { status: 400 })
    }
    if (unitPrice != null && (!Number.isInteger(unitPrice) || unitPrice < 0)) {
      return NextResponse.json({ error: 'Unit price must be a non-negative integer' }, { status: 400 })
    }
    if (discountPercent != null && (!Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 100)) {
      return NextResponse.json({ error: 'Discount percent must be an integer from 0 to 100' }, { status: 400 })
    }

    const rule = await prisma.wholesalePriceRule.create({
      data: {
        customerGroupId,
        productId,
        categoryId,
        minQuantity,
        unitPrice,
        discountPercent: unitPrice != null ? null : discountPercent,
        updatedAt: new Date(),
      },
      include: { Product: true, Category: true },
    })

    await prisma.auditLog.create({
      data: {
        action: 'WHOLESALE_RULE_CREATED',
        entity: 'WholesalePriceRule',
        entityId: String(rule.id),
        details: `Added price rule to group "${group.name}"`,
        changedBy: 'Admin',
      },
    })

    return NextResponse.json(rule, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create price rule' }, { status: 500 })
  }
}
