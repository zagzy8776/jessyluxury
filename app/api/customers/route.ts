import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'
import { normalizePhoneNumber } from '@/lib/orders/phone'

export async function GET(request: Request) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    // 1. Calculate CRM dashboard aggregates server-side.
    // Anonymized (deleted) accounts are excluded everywhere so the visible
    // list and the summary cards always describe the same population.
    const activeWhere = { acquisitionSource: { not: 'Deleted' } }

    const totalCustomers = await prisma.customer.count({ where: activeWhere })
    const spendAgg = await prisma.customer.aggregate({
      where: activeWhere,
      _sum: {
        totalSpent: true,
      },
    })
    const totalSpend = spendAgg._sum.totalSpent || 0

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // New Contacts/Customers registered in the last 30 days
    const newCustomers = await prisma.customer.count({
      where: {
        AND: [activeWhere, { createdAt: { gte: thirtyDaysAgo } }],
      },
    })

    // Returning Customers: profiles with 2 or more completed orders
    const returningCustomers = await prisma.customer.count({
      where: {
        AND: [activeWhere, { ordersCount: { gte: 2 } }],
      },
    })

    // 2. Build listing query
    const where: any = { acquisitionSource: { not: 'Deleted' } }
    if (search) {
      // Try to see if search matches phone number prefix
      let phoneSearch = search
      try {
        phoneSearch = normalizePhoneNumber(search)
      } catch {
        // ignore validation errors for partial search inputs
      }

      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { phone: { contains: phoneSearch } },
        { whatsapp: { contains: search } },
        { whatsapp: { contains: phoneSearch } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }

    const customers = await prisma.customer.findMany({
      where,
      include: {
        Order: {
          orderBy: { createdAt: 'desc' },
        },
        CustomerGroup: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Return structured payload matching dashboard requirements
    return NextResponse.json({
      summary: {
        totalCustomers,
        newCustomers,
        returningCustomers,
        totalSpend,
      },
      customers,
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}
