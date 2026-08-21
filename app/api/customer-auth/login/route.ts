import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setCustomerCookie } from '@/lib/auth'
import { normalizePhoneNumber } from '@/lib/orders/phone'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, name, email } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    let normalizedPhone = phone
    try {
      normalizedPhone = normalizePhoneNumber(phone)
    } catch (err: any) {
      return NextResponse.json({ error: err.message || 'Invalid phone format' }, { status: 400 })
    }

    // Lookup customer by normalized phone number
    let customer = await prisma.customer.findUnique({
      where: { phone: normalizedPhone }
    })

    if (!customer) {
      // Create new customer
      customer = await prisma.customer.create({
        data: {
          phone: normalizedPhone,
          whatsapp: normalizedPhone,
          name: name || 'Guest Client',
          email: email || null,
          acquisitionSource: 'Storefront Opt-In',
          updatedAt: new Date(),
        }
      })
    }

    const response = NextResponse.json({ success: true, customerId: customer.id })
    await setCustomerCookie(response, customer.id)
    return response
  } catch (error: any) {
    console.error('Customer login error:', error)
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 })
  }
}
