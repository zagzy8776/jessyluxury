import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'
import { maskSecret } from '@/lib/secret-masking'

export async function GET(request: Request) {
  // Require Admin authorization
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    // Fetch all settings
    const [
      businessProfile,
      storeLocations,
      staffAccounts,
      paymentSettings,
      notificationSettings,
      systemDefaults
    ] = await Promise.all([
      prisma.businessProfile.findUnique({ where: { id: 1 } }),
      prisma.storeLocation.findMany({ orderBy: { id: 'asc' } }),
      prisma.staffAccount.findMany(),
      prisma.paymentSettings.findUnique({ where: { id: 1 } }),
      prisma.notificationSettings.findUnique({ where: { id: 1 } }),
      prisma.systemDefaults.findUnique({ where: { id: 1 } })
    ])

    // Apply secret masking to notification settings
    const maskedNotificationSettings = notificationSettings ? {
      ...notificationSettings,
      resendApiKey: maskSecret(notificationSettings.resendApiKey),
      oneSignalAppId: maskSecret(notificationSettings.oneSignalAppId),
      oneSignalApiKey: maskSecret(notificationSettings.oneSignalApiKey)
    } : null

    // Build complete config export.
    // Normalize store locations so the export is ALWAYS restorable by the import
    // endpoint (which validates that exactly one location is marked default).
    // With the single-default unique index the database can hold 0 or 1 defaults;
    // if none exists, the oldest location is promoted in the serialized payload.
    const locations = storeLocations || []
    const firstDefaultIndex = locations.findIndex((l) => l.isDefault)
    const normalizedLocations =
      locations.length > 0 && firstDefaultIndex === -1
        ? locations.map((l, idx) => ({ ...l, isDefault: idx === 0 }))
        : locations

    const config = {
      schemaVersion: 1,
      exportTimestamp: new Date().toISOString(),
      businessProfile: businessProfile || null,
      storeLocations: normalizedLocations,
      staffAccounts: staffAccounts || [],
      paymentSettings: paymentSettings || null,
      notificationSettings: maskedNotificationSettings,
      systemDefaults: systemDefaults || null
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Export config error:', error)
    return NextResponse.json({ error: 'Failed to export configuration' }, { status: 500 })
  }
}
