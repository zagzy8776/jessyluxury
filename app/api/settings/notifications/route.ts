import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { maskSecret } from '@/lib/secret-masking';
import { createAuditLog } from '@/lib/audit';
import { requireAdminAuth } from '@/lib/auth';
import { requireStaffAuth } from '@/lib/staff-auth';

/**
 * GET /api/settings/notifications
 * Retrieves notification settings with masked secret values
 * Requires Admin authorization OR Staff with 'settings' permission
 */
export async function GET(request: Request) {
  // Check Admin authentication first (master admin access)
  const adminAuthError = await requireAdminAuth(request);
  
  // If not admin, check staff auth with settings permission
  if (adminAuthError) {
    const staffAuthError = await requireStaffAuth(request, 'settings');
    if (staffAuthError) {
      return staffAuthError;
    }
  }

  try {
    // Retrieve NotificationSettings (singleton with id=1)
    const notificationSettings = await prisma.notificationSettings.findUnique({
      where: { id: 1 },
    });

    // If no settings exist, return default empty structure
    if (!notificationSettings) {
      return NextResponse.json({
        id: 1,
        emailEnabled: true,
        pushEnabled: true,
        resendApiKey: '',
        oneSignalAppId: '',
        oneSignalApiKey: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Mask all secret fields before returning
    const maskedSettings = {
      id: notificationSettings.id,
      emailEnabled: notificationSettings.emailEnabled,
      pushEnabled: notificationSettings.pushEnabled,
      resendApiKey: maskSecret(notificationSettings.resendApiKey),
      oneSignalAppId: maskSecret(notificationSettings.oneSignalAppId),
      oneSignalApiKey: maskSecret(notificationSettings.oneSignalApiKey),
      createdAt: notificationSettings.createdAt.toISOString(),
      updatedAt: notificationSettings.updatedAt.toISOString(),
    };

    return NextResponse.json(maskedSettings);
  } catch (error) {
    console.error('[NOTIFICATION_SETTINGS] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/notifications
 * Updates notification settings and returns masked values in response
 * Requires Admin authorization OR Staff with 'settings' permission
 * Audit log created WITHOUT secret values
 */
export async function PUT(request: Request) {
  // Check Admin authentication first (master admin access)
  const adminAuthError = await requireAdminAuth(request);
  
  // If not admin, check staff auth with settings permission
  if (adminAuthError) {
    const staffAuthError = await requireStaffAuth(request, 'settings');
    if (staffAuthError) {
      return staffAuthError;
    }
  }

  try {
    const body = await request.json();

    const {
      emailEnabled,
      pushEnabled,
      resendApiKey,
      oneSignalAppId,
      oneSignalApiKey,
    } = body;

    // Update or create NotificationSettings (singleton with id=1)
    const updatedSettings = await prisma.notificationSettings.upsert({
      where: { id: 1 },
      update: {
        emailEnabled: emailEnabled !== undefined ? emailEnabled : undefined,
        pushEnabled: pushEnabled !== undefined ? pushEnabled : undefined,
        resendApiKey: resendApiKey !== undefined ? resendApiKey : undefined,
        oneSignalAppId: oneSignalAppId !== undefined ? oneSignalAppId : undefined,
        oneSignalApiKey: oneSignalApiKey !== undefined ? oneSignalApiKey : undefined,
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
        pushEnabled: pushEnabled !== undefined ? pushEnabled : true,
        resendApiKey,
        oneSignalAppId,
        oneSignalApiKey,
        updatedAt: new Date(),
      },
    });

    // Create audit log WITHOUT secret values
    // Only log non-sensitive fields
    const auditDetails: Record<string, unknown> = {
      updated: true,
    };

    // Include non-secret fields in audit
    if (emailEnabled !== undefined) {
      auditDetails.emailEnabled = emailEnabled;
    }
    if (pushEnabled !== undefined) {
      auditDetails.pushEnabled = pushEnabled;
    }

    await createAuditLog(
      'NOTIFICATION_SETTINGS_UPDATED',
      'NotificationSettings',
      '1',
      auditDetails,
      'Admin'
    );

    // Mask all secret fields before returning response
    const maskedResponse = {
      id: updatedSettings.id,
      emailEnabled: updatedSettings.emailEnabled,
      pushEnabled: updatedSettings.pushEnabled,
      resendApiKey: maskSecret(updatedSettings.resendApiKey),
      oneSignalAppId: maskSecret(updatedSettings.oneSignalAppId),
      oneSignalApiKey: maskSecret(updatedSettings.oneSignalApiKey),
      createdAt: updatedSettings.createdAt.toISOString(),
      updatedAt: updatedSettings.updatedAt.toISOString(),
    };

    return NextResponse.json(maskedResponse);
  } catch (error) {
    console.error('[NOTIFICATION_SETTINGS] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
