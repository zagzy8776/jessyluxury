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

function maskSecret(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.length <= 4) return '••••'
  if (value.length <= 8) return `${value.slice(0, 1)}••••${value.slice(-2)}`
  return `${value.slice(0, 2)}••••••••${value.slice(-4)}`
}

function toSafeResponse(settings: {
  id: number
  bankAccountNumber: string | null
  bankAccountName: string | null
  bankName: string | null
  bankRoutingNumber: string | null
  paymentProviderApiKey: string | null
  merchantId: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: settings.id,
    bankAccountNumber: maskSecret(settings.bankAccountNumber),
    bankAccountName: settings.bankAccountName,
    bankName: settings.bankName,
    bankRoutingNumber: maskSecret(settings.bankRoutingNumber),
    paymentProviderApiKey: maskSecret(settings.paymentProviderApiKey),
    merchantId: settings.merchantId,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  }
}

export async function GET(request: Request) {
  const authErr = await checkAuth(request)
  if (authErr) return authErr

  try {
    const settings = await prisma.paymentSettings.findUnique({ where: { id: 1 } })

    if (!settings) {
      return NextResponse.json({
        id: 1,
        bankAccountNumber: null,
        bankAccountName: null,
        bankName: null,
        bankRoutingNumber: null,
        paymentProviderApiKey: null,
        merchantId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json(toSafeResponse(settings))
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
    const {
      bankAccountNumber,
      bankAccountName,
      bankName,
      bankRoutingNumber,
      paymentProviderApiKey,
      merchantId,
    } = body

    const existing = await prisma.paymentSettings.findUnique({ where: { id: 1 } })

    const updated = await prisma.paymentSettings.upsert({
      where: { id: 1 },
      update: {
        ...(bankAccountNumber !== undefined && { bankAccountNumber: bankAccountNumber || null }),
        ...(bankAccountName !== undefined && { bankAccountName: bankAccountName || null }),
        ...(bankName !== undefined && { bankName: bankName || null }),
        ...(bankRoutingNumber !== undefined && { bankRoutingNumber: bankRoutingNumber || null }),
        ...(paymentProviderApiKey !== undefined && { paymentProviderApiKey: paymentProviderApiKey || null }),
        ...(merchantId !== undefined && { merchantId: merchantId || null }),
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        bankAccountNumber: bankAccountNumber || null,
        bankAccountName: bankAccountName || null,
        bankName: bankName || null,
        bankRoutingNumber: bankRoutingNumber || null,
        paymentProviderApiKey: paymentProviderApiKey || null,
        merchantId: merchantId || null,
        updatedAt: new Date(),
      },
    })

    const changedFields = {
      ...(bankAccountName !== undefined && { bankAccountName: updated.bankAccountName }),
      ...(bankName !== undefined && { bankName: updated.bankName }),
      ...(merchantId !== undefined && { merchantId: updated.merchantId }),
      ...(bankAccountNumber !== undefined && { bankAccountNumber: '[REDACTED]' }),
      ...(bankRoutingNumber !== undefined && { bankRoutingNumber: '[REDACTED]' }),
      ...(paymentProviderApiKey !== undefined && { paymentProviderApiKey: '[REDACTED]' }),
      previousConfigured: Boolean(existing),
    }

    await createAuditLog(
      'PAYMENT_SETTINGS_UPDATED',
      'PaymentSettings',
      '1',
      changedFields,
      'Admin'
    )

    return NextResponse.json(toSafeResponse(updated))
  } catch (error) {
    console.error('[PAYMENT_SETTINGS] PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
