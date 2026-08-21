import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'

export async function GET(request: Request) {
  const authErr = await requireStaffAuth(request, 'customers')
  if (authErr) return authErr

  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('groupId')

  if (!groupId) {
    return NextResponse.json({ error: 'groupId is required' }, { status: 400 })
  }

  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      include: {
        WholesalePriceRule: {
          where: {
            customerGroupId: Number(groupId),
          },
          orderBy: {
            minQuantity: 'asc',
          },
        },
      },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching pricing overview:', error)
    return NextResponse.json({ error: 'Failed to fetch pricing overview.' }, { status: 500 })
  }
}