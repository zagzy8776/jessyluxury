import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Public endpoint — no auth required, customers need this to make payment
export async function GET() {
  try {
    const settings = await prisma.paymentSettings.findUnique({ where: { id: 1 } })

    return NextResponse.json({
      bankAccountNumber: settings?.bankAccountNumber || '',
      bankAccountName: settings?.bankAccountName || '',
      bankName: settings?.bankName || '',
    })
  } catch (error) {
    console.error('[PAYMENT_INFO] GET error:', error)
    return NextResponse.json({ error: 'Failed to load payment info' }, { status: 500 })
  }
}
