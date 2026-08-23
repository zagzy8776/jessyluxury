import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit'
import { requireAdminAuth } from '@/lib/auth'
import { requireStaffAuth } from '@/lib/staff-auth'

async function requireSettingsAccess(request: Request) {
  const adminAuthError = await requireAdminAuth(request)
  if (!adminAuthError) return null
  return requireStaffAuth(request, 'settings')
}

function toBusinessResponse(settings: {
  id: number
  emailEnabled: boolean
  pushEnabled: boolean
  updatedAt: Date
}) {
  return {
    id: settings.id,
    emailEnabled: settings.emailEnabled,
    pushEnabled: settings.pushEnabled,
    updatedAt: settings.updatedAt.toISOString(),
  }
}

export async function GET(request: Request) {
  const authError = await requireSettingsAccess(request)
  if (authError) return authError

  try {
    const settings = await prisma.notificationSettings.findUnique({ where: { id: 1 } })

    if (!settings) {
      return NextResponse.json({
        id: 1,
        emailEnabled: true,
        pushEnabled: true,
        updatedAt: new Date().toISOString(),
      })
    }

    // Provider credentials remain server-side only and are deliberately omitted.
    return NextResponse.json(toBusinessResponse(settings))
  } catch (error) {
    console.error('[NOTIFICATION_SETTINGS] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const authError = await requireSettingsAccess(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const emailEnabled = body.emailEnabled === undefined ? undefined : Boolean(body.emailEnabled)
    const pushEnabled = body.pushEnabled === undefined ? undefined : Boolean(body.pushEnabled)

    // Keep provider credentials available to the existing notification worker when
    // explicitly supplied by trusted server-side configuration, but never expose them
    // through this business-facing settings response.
    const existing = await prisma.notificationSettings.findUnique({ where: { id: 1 } })
    const updated = await prisma.notificationSettings.upsert({
      where: { id: 1 },
      update: {
        ...(emailEnabled !== undefined ? { emailEnabled } : {}),
        ...(pushEnabled !== undefined ? { pushEnabled } : {}),
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        emailEnabled: emailEnabled ?? true,
        pushEnabled: pushEnabled ?? true,
        resendApiKey: existing?.resendApiKey ?? null,
        oneSignalAppId: existing?.oneSignalAppId ?? null,
        oneSignalApiKey: existing?.oneSignalApiKey ?? null,
        updatedAt: new Date(),
      },
    })

    await createAuditLog(
      'NOTIFICATION_SETTINGS_UPDATED',
      'NotificationSettings',
      '1',
      {
        ...(emailEnabled !== undefined ? { emailEnabled } : {}),
        ...(pushEnabled !== undefined ? { pushEnabled } : {}),
      },
      'Admin'
    )

    return NextResponse.json(toBusinessResponse(updated))
  } catch (error) {
    console.error('[NOTIFICATION_SETTINGS] PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
