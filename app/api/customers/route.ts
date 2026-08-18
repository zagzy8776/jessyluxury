import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'
import { normalizePhoneNumber } from '@/lib/orders/phone'

export async function GET(request: Request) {
  const authErr = await requireAdminAuth(request)
  if (authErr) return authErr

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    // 1. Calculate CRM dashboard aggregates server-side
    const totalCustomers = await prisma.customer.count()
    const spendAgg = await prisma.customer.aggregate({
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
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    // Returning Customers: profiles with 2 or more completed orders
    const returningCustomers = await prisma.customer.count({
      where: {
        ordersCount: { gte: 2 },
      },
    })

    // 2. Build listing query
    const where: any = {}
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
        orders: {
          orderBy: { createdAt: 'desc' },
        },
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
