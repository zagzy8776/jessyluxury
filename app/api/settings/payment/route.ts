import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { requireAdminAuth } from '@/lib/auth'
import { requireStaffAuth } from '@/lib/staff-auth'

async function checkAuth(request: Request) {
  const adminErr = await requireAdminAuth(request)
  if (!adminErr) return null
  return requireStaffAuth(request, 'settings')
}

export async function GET(request: Request) {
  const authErr = await checkAuth(request)
  if (authErr) return authErr

  try {
    const settings = await prisma.paymentSettings.findUnique({ where: { id: 1 } })

    return NextResponse.json(settings ?? {
      id: 1,
      bankAccountNumber: '',
      bankAccountName: '',
      bankName: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[PAYMENT_SETTINGS] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authErr = await checkAuth(request)
  if (authErr) return authErr

  try {
    const { bankAccountNumber, bankAccountName, bankName } = await request.json()

    const updated = await prisma.paymentSettings.upsert({
      where: { id: 1 },
      update: {
        ...(bankAccountNumber !== undefined && { bankAccountNumber: bankAccountNumber || null }),
        ...(bankAccountName !== undefined && { bankAccountName: bankAccountName || null }),
        ...(bankName !== undefined && { bankName: bankName || null }),
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        bankAccountNumber: bankAccountNumber || null,
        bankAccountName: bankAccountName || null,
        bankName: bankName || null,
        updatedAt: new Date(),
      },
    })

    await createAuditLog(
      'PAYMENT_SETTINGS_UPDATED',
      'PaymentSettings',
      '1',
      { bankAccountName: updated.bankAccountName, bankName: updated.bankName },
      'Admin'
    )

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[PAYMENT_SETTINGS] PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
