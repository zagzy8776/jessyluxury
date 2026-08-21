import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { requireAdminAuth } from '@/lib/auth';
import { requireStaffAuth } from '@/lib/staff-auth';

/**
 * GET /api/settings/system-defaults
 * Retrieves system-wide default values
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
    // Retrieve SystemDefaults (singleton with id=1)
    const systemDefaults = await prisma.systemDefaults.findUnique({
      where: { id: 1 },
    });

    // If no settings exist, return default empty structure
    if (!systemDefaults) {
      return NextResponse.json({
        id: 1,
        defaultShippingZoneId: null,
        defaultStoreLocationId: null,
        defaultAcquisitionSource: 'Manual',
        orderNumberPrefix: 'JL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Return system defaults (no secrets to mask)
    const response = {
      id: systemDefaults.id,
      defaultShippingZoneId: systemDefaults.defaultShippingZoneId,
      defaultStoreLocationId: systemDefaults.defaultStoreLocationId,
      defaultAcquisitionSource: systemDefaults.defaultAcquisitionSource,
      orderNumberPrefix: systemDefaults.orderNumberPrefix,
      createdAt: systemDefaults.createdAt.toISOString(),
      updatedAt: systemDefaults.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SYSTEM_DEFAULTS] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/system-defaults
 * Updates system-wide default values
 * Requires Admin authorization OR Staff with 'settings' permission
 * Creates audit log with all changed fields (no secrets to filter)
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
      defaultShippingZoneId,
      defaultStoreLocationId,
      defaultAcquisitionSource,
      orderNumberPrefix,
    } = body;

    // Update or create SystemDefaults (singleton with id=1)
    const updatedDefaults = await prisma.systemDefaults.upsert({
      where: { id: 1 },
      update: {
        defaultShippingZoneId: defaultShippingZoneId !== undefined ? defaultShippingZoneId : undefined,
        defaultStoreLocationId: defaultStoreLocationId !== undefined ? defaultStoreLocationId : undefined,
        defaultAcquisitionSource: defaultAcquisitionSource !== undefined ? defaultAcquisitionSource : undefined,
        orderNumberPrefix: orderNumberPrefix !== undefined ? orderNumberPrefix : undefined,
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        defaultShippingZoneId,
        defaultStoreLocationId,
        defaultAcquisitionSource: defaultAcquisitionSource || 'Manual',
        orderNumberPrefix: orderNumberPrefix || 'JL',
        updatedAt: new Date(),
      },
    });

    // Create audit log with all changed fields (no secrets to filter)
    const auditDetails: Record<string, unknown> = {
      updated: true,
    };

    // Include all provided fields in audit (no secrets in SystemDefaults)
    if (defaultShippingZoneId !== undefined) {
      auditDetails.defaultShippingZoneId = defaultShippingZoneId;
    }
    if (defaultStoreLocationId !== undefined) {
      auditDetails.defaultStoreLocationId = defaultStoreLocationId;
    }
    if (defaultAcquisitionSource !== undefined) {
      auditDetails.defaultAcquisitionSource = defaultAcquisitionSource;
    }
    if (orderNumberPrefix !== undefined) {
      auditDetails.orderNumberPrefix = orderNumberPrefix;
    }

    await createAuditLog(
      'SYSTEM_DEFAULTS_UPDATED',
      'SystemDefaults',
      '1',
      auditDetails,
      'Admin'
    );

    // Return updated defaults
    const response = {
      id: updatedDefaults.id,
      defaultShippingZoneId: updatedDefaults.defaultShippingZoneId,
      defaultStoreLocationId: updatedDefaults.defaultStoreLocationId,
      defaultAcquisitionSource: updatedDefaults.defaultAcquisitionSource,
      orderNumberPrefix: updatedDefaults.orderNumberPrefix,
      createdAt: updatedDefaults.createdAt.toISOString(),
      updatedAt: updatedDefaults.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[SYSTEM_DEFAULTS] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
