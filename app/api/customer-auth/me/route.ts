import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCustomerAuthenticated } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const customerId = await isCustomerAuthenticated(request)

    if (!customerId) {
      return NextResponse.json({ authenticated: false })
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({ authenticated: true, customer })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Auth check failed' }, { status: 500 })
  }
}
