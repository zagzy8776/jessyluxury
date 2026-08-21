import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { maskSecret } from '@/lib/secret-masking';
import { createAuditLog } from '@/lib/audit';
import { requireAdminAuth } from '@/lib/auth';
import { requireStaffAuth } from '@/lib/staff-auth';

/**
 * GET /api/settings/payment
 * Retrieves payment settings with masked secret values
 * Requires Admin authorization
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
    // Retrieve PaymentSettings (singleton with id=1)
    const paymentSettings = await prisma.paymentSettings.findUnique({
      where: { id: 1 },
    });

    // If no settings exist, return default empty structure
    if (!paymentSettings) {
      return NextResponse.json({
        id: 1,
        bankAccountNumber: '',
        bankRoutingNumber: '',
        bankAccountName: '',
        paymentProviderApiKey: '',
        merchantId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Mask all secret fields before returning
    const maskedSettings = {
      id: paymentSettings.id,
      bankAccountNumber: maskSecret(paymentSettings.bankAccountNumber),
      bankRoutingNumber: maskSecret(paymentSettings.bankRoutingNumber),
      bankAccountName: paymentSettings.bankAccountName || '',
      paymentProviderApiKey: maskSecret(paymentSettings.paymentProviderApiKey),
      merchantId: paymentSettings.merchantId || '',
      createdAt: paymentSettings.createdAt.toISOString(),
      updatedAt: paymentSettings.updatedAt.toISOString(),
    };

    return NextResponse.json(maskedSettings);
  } catch (error) {
    console.error('[PAYMENT_SETTINGS] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings/payment
 * Updates payment settings and returns masked values in response
 * Requires Admin authorization
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
      bankAccountNumber,
      bankRoutingNumber,
      bankAccountName,
      paymentProviderApiKey,
      merchantId,
    } = body;

    // Update or create PaymentSettings (singleton with id=1)
    const updatedSettings = await prisma.paymentSettings.upsert({
      where: { id: 1 },
      update: {
        bankAccountNumber: bankAccountNumber !== undefined ? bankAccountNumber : undefined,
        bankRoutingNumber: bankRoutingNumber !== undefined ? bankRoutingNumber : undefined,
        bankAccountName: bankAccountName !== undefined ? bankAccountName : undefined,
        paymentProviderApiKey: paymentProviderApiKey !== undefined ? paymentProviderApiKey : undefined,
        merchantId: merchantId !== undefined ? merchantId : undefined,
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        bankAccountNumber,
        bankRoutingNumber,
        bankAccountName,
        paymentProviderApiKey,
        merchantId,
        updatedAt: new Date(),
      },
    });

    // Create audit log WITHOUT secret values
    // Only log non-sensitive fields
    const auditDetails: Record<string, unknown> = {
      updated: true,
    };

    // Include non-secret fields in audit
    if (bankAccountName !== undefined) {
      auditDetails.bankAccountName = bankAccountName;
    }
    if (merchantId !== undefined) {
      auditDetails.merchantId = merchantId;
    }

    await createAuditLog(
      'PAYMENT_SETTINGS_UPDATED',
      'PaymentSettings',
      '1',
      auditDetails,
      'Admin'
    );

    // Mask all secret fields before returning response
    const maskedResponse = {
      id: updatedSettings.id,
      bankAccountNumber: maskSecret(updatedSettings.bankAccountNumber),
      bankRoutingNumber: maskSecret(updatedSettings.bankRoutingNumber),
      bankAccountName: updatedSettings.bankAccountName || '',
      paymentProviderApiKey: maskSecret(updatedSettings.paymentProviderApiKey),
      merchantId: updatedSettings.merchantId || '',
      createdAt: updatedSettings.createdAt.toISOString(),
      updatedAt: updatedSettings.updatedAt.toISOString(),
    };

    return NextResponse.json(maskedResponse);
  } catch (error) {
    console.error('[PAYMENT_SETTINGS] PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
