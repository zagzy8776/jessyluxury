import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  try {
    const customerId = parseInt(params.id, 10)
    if (isNaN(customerId)) {
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
      const actor = 'Admin'

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

      // Log CRM preference adjustment to global Audit Log
      await tx.auditLog.create({
        data: {
          action: 'CUSTOMER_PROFILE_UPDATED',
          entity: 'Customer',
          entityId: String(customerId),
          details: `Updated notes or notification preferences for customer "${customer.name}"`,
          changedBy: actor,
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
