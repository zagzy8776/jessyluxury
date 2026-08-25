import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

function parseId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return Number.isNaN(id) ? null : id
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  try {
    const customerId = parseId(params.id)
    if (customerId === null) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        Order: { orderBy: { createdAt: 'desc' } },
        CustomerGroup: true,
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  try {
    const customerId = parseId(params.id)
    if (customerId === null) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
    }

    const currentCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!currentCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      notes,
      marketingEmail,
      marketingWhatsapp,
      marketingPush,
      customerGroupId,
    } = body

    const updated = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: { id: customerId },
        include: { CustomerGroup: true },
        data: {
          notes: notes !== undefined ? notes : undefined,
          marketingEmail: marketingEmail !== undefined ? Boolean(marketingEmail) : undefined,
          marketingWhatsapp: marketingWhatsapp !== undefined ? Boolean(marketingWhatsapp) : undefined,
          marketingPush: marketingPush !== undefined ? Boolean(marketingPush) : undefined,
          customerGroupId: customerGroupId === null
            ? null
            : customerGroupId !== undefined
              ? Number(customerGroupId)
              : undefined,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'CUSTOMER_PROFILE_UPDATED',
          entity: 'Customer',
          entityId: String(customerId),
          details: `Updated notes or notification preferences for customer "${customer.name}"`,
          changedBy: 'Admin',
        },
      })

      return customer
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating customer profile:', error)
    return NextResponse.json({ error: error.message || 'Failed to update customer profile' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  try {
    const customerId = parseId(params.id)
    if (customerId === null) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        name: true,
        phone: true,
        _count: { select: { Order: true } },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const orderCount = customer._count.Order

    // No historical orders — safe to hard delete. Clean up dependents
    // explicitly inside one atomic transaction.
    if (orderCount === 0) {
      await prisma.$transaction(async (tx) => {
        await tx.couponRedemption.deleteMany({ where: { customerId } })
        await tx.customerPushSubscription.deleteMany({ where: { customerId } })
        await tx.customer.delete({ where: { id: customerId } })
        await tx.auditLog.create({
          data: {
            action: 'CUSTOMER_DELETED',
            entity: 'Customer',
            entityId: String(customerId),
            details: `Deleted customer "${customer.name}" (${customer.phone}). No order history.`,
            changedBy: 'Admin',
          },
        })
      })

      return NextResponse.json({
        deleted: true,
        message: `Customer "${customer.name}" deleted.`,
      })
    }

    // Has historical orders — a hard delete would cascade their coupon
    // redemptions (destroying promotion history). Anonymize + deactivate
    // instead, leaving every historical order row and total untouched.
    const anonymized = await prisma.$transaction(async (tx) => {
      // phone is @unique, so the placeholder must be unique.
      const placeholderPhone = `deleted-customer-${customerId}-${Date.now()}`

      const updated = await tx.customer.update({
        where: { id: customerId },
        data: {
          name: 'Deleted Customer',
          phone: placeholderPhone,
          whatsapp: '',
          email: null,
          city: null,
          address: null,
          notes: `[Account deleted ${new Date().toISOString()}] Contact details removed. ${orderCount} historical order(s) preserved.`,
          acquisitionSource: 'Deleted',
          marketingEmail: false,
          marketingWhatsapp: false,
          marketingPush: false,
          customerGroupId: null,
          updatedAt: new Date(),
        },
      })

      await tx.customerPushSubscription.updateMany({
        where: { customerId },
        data: { active: false, updatedAt: new Date() },
      })

      await tx.auditLog.create({
        data: {
          action: 'CUSTOMER_ANONYMIZED',
          entity: 'Customer',
          entityId: String(customerId),
          details: `Anonymized customer "${customer.name}" (${customer.phone}) on delete request. ${orderCount} historical order(s) preserved with original totals.`,
          changedBy: 'Admin',
        },
      })

      return updated
    })

    return NextResponse.json({
      anonymized: true,
      message: `"${customer.name}" has ${orderCount} historical order${orderCount === 1 ? '' : 's'}, so the account was anonymized and deactivated instead of deleted. Sales history and totals are preserved.`,
      customer: anonymized,
    })
  } catch (error: any) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete customer' }, { status: 500 })
  }
}
