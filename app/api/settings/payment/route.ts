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

function maskAccountNumber(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.length <= 4) return '••••'
  return `••••••${value.slice(-4)}`
}

function toSafeResponse(settings: {
  id: number
  bankAccountNumber: string | null
  bankAccountName: string | null
  bankName: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: settings.id,
    bankAccountNumber: maskAccountNumber(settings.bankAccountNumber),
    bankAccountName: settings.bankAccountName,
    bankName: settings.bankName,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  }
}

export async function GET(request: Request) {
  const authErr = await checkAuth(request)
  if (authErr) return authErr

  try {
    const settings = await prisma.paymentSettings.findUnique({ where: { id: 1 } })
    return NextResponse.json(
      settings
        ? toSafeResponse(settings)
        : {
            id: 1,
            bankAccountNumber: null,
            bankAccountName: null,
            bankName: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
    )
  } catch (error) {
    console.error('[PAYMENT_SETTINGS] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authErr = await checkAuth(request)
  if (authErr) return authErr

  try {
    const body = await request.json()
    const bankAccountNumber = body.bankAccountNumber === undefined ? undefined : String(body.bankAccountNumber).trim()
    const bankAccountName = body.bankAccountName === undefined ? undefined : String(body.bankAccountName).trim()
    const bankName = body.bankName === undefined ? undefined : String(body.bankName).trim()

    if (bankAccountNumber !== undefined && bankAccountNumber !== '' && !/^\d{10}$/.test(bankAccountNumber)) {
      return NextResponse.json({ error: 'Account number must be exactly 10 digits' }, { status: 400 })
    }

    if (bankName !== undefined && bankName.length > 120) {
      return NextResponse.json({ error: 'Bank name is too long' }, { status: 400 })
    }

    if (bankAccountName !== undefined && (bankAccountName.length < 2 || bankAccountName.length > 160)) {
      return NextResponse.json({ error: 'Account name must be between 2 and 160 characters' }, { status: 400 })
    }

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
      {
        bankAccountName: updated.bankAccountName,
        bankName: updated.bankName,
        bankAccountNumberChanged: bankAccountNumber !== undefined,
      },
      'Admin'
    )

    return NextResponse.json(toSafeResponse(updated))
  } catch (error) {
    console.error('[PAYMENT_SETTINGS] PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
