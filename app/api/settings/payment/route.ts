import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { requireAdminAuth } from '@/lib/auth'
import { requireStaffAuth } from '@/lib/staff-auth'
import { maskSecret } from '@/lib/secret-masking'

const SECRET_FIELDS = ['bankAccountNumber', 'bankRoutingNumber', 'paymentProviderApiKey']

async function checkAuth(request: Request) {
  const adminErr = await requireAdminAuth(request)
  if (!adminErr) return null
  return requireStaffAuth(request, 'settings')
}

function maskPaymentSettings(settings: any) {
  const masked: Record<string, any> = {}
  for (const [key, value] of Object.entries(settings)) {
    if (SECRET_FIELDS.includes(key)) {
      // Secret fields are always normalized: real strings are masked, and
      // null/empty values return '' (never a raw secret, never bare null).
      masked[key] = typeof value === 'string' ? maskSecret(value) : ''
    } else {
      masked[key] = value
    }
  }
  return masked
}

export async function GET(request: Request) {
  const authErr = await checkAuth(request)
  if (authErr) return authErr

  try {
    const settings = await prisma.paymentSettings.findUnique({ where: { id: 1 } })

    if (!settings) {
      return NextResponse.json({
        id: 1,
        bankAccountNumber: '',
        bankRoutingNumber: '',
        bankAccountName: '',
        bankName: '',
        paymentProviderApiKey: '',
        merchantId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json(maskPaymentSettings(settings))
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
    const { bankAccountNumber, bankRoutingNumber, bankAccountName, bankName, paymentProviderApiKey, merchantId } = body

    const updated = await prisma.paymentSettings.upsert({
      where: { id: 1 },
      update: {
        ...(bankAccountNumber !== undefined && { bankAccountNumber: bankAccountNumber || null }),
        ...(bankRoutingNumber !== undefined && { bankRoutingNumber: bankRoutingNumber || null }),
        ...(bankAccountName !== undefined && { bankAccountName: bankAccountName || null }),
        ...(bankName !== undefined && { bankName: bankName || null }),
        ...(paymentProviderApiKey !== undefined && { paymentProviderApiKey: paymentProviderApiKey || null }),
        ...(merchantId !== undefined && { merchantId: merchantId || null }),
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        bankAccountNumber: bankAccountNumber || null,
        bankRoutingNumber: bankRoutingNumber || null,
        bankAccountName: bankAccountName || null,
        bankName: bankName || null,
        paymentProviderApiKey: paymentProviderApiKey || null,
        merchantId: merchantId || null,
        updatedAt: new Date(),
      },
    })

    // Only non-secret fields are recorded. Secret fields (bankAccountNumber,
    // bankRoutingNumber, paymentProviderApiKey) are deliberately excluded so
    // raw secrets never appear in audit logs. createAuditLog also applies a
    // secondary sensitive-field filter as defense in depth.
    const auditDetails: Record<string, unknown> = { updated: true }
    if (bankAccountName !== undefined) {
      auditDetails.bankAccountName = bankAccountName || null
    }
    if (bankName !== undefined) {
      auditDetails.bankName = bankName || null
    }
    if (merchantId !== undefined) {
      auditDetails.merchantId = merchantId
    }

    await createAuditLog(
      'PAYMENT_SETTINGS_UPDATED',
      'PaymentSettings',
      '1',
      auditDetails,
      'Admin'
    )

    return NextResponse.json(maskPaymentSettings(updated))
  } catch (error) {
    console.error('[PAYMENT_SETTINGS] PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
