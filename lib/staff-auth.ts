import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { isValidTokenSignature, generateStaffToken } from './auth-crypto';
import { isAdminAuthenticated } from './auth';

const STAFF_COOKIE_NAME = 'jl_staff_token';

/**
 * Staff Authorization Middleware
 * Provides role-based access control and self-escalation prevention for staff accounts
 */

/**
 * Extracts staff ID from the authentication token in the request
 * 
 * @param request - The incoming HTTP request
 * @returns Staff ID if valid token exists, null otherwise
 */
export async function getStaffIdFromToken(request: Request): Promise<number | null> {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${STAFF_COOKIE_NAME}=([^;]+)`));

    if (!match) return null;

    const token = match[1];
    const parts = token.split('.');

    if (parts.length !== 3) return null;

    const [payloadExpires, payloadStaffId, signature] = parts;
    const expiresAt = parseInt(payloadExpires, 10);
    const staffId = parseInt(payloadStaffId.includes('-') ? payloadStaffId.split('-')[0] : payloadStaffId, 10);

    if (isNaN(expiresAt) || expiresAt < Date.now() || isNaN(staffId)) {
      return null;
    }

    // Verify signature (reusing the same HMAC approach as admin/customer tokens)
    const { isValid } = await isValidTokenSignature(token);
    if (!isValid) return null;

    return staffId;
  } catch {
    return null;
  }
}

/**
 * Retrieves staff email from staff ID
 * 
 * @param staffId - The staff account ID
 * @returns Staff email address
 * @throws Error if staff account not found
 */
export async function getStaffEmailFromId(staffId: number): Promise<string> {
  const staff = await prisma.staffAccount.findUnique({
    where: { id: staffId },
    select: { email: true },
  });

  if (!staff) {
    throw new Error(`Staff account not found: ${staffId}`);
  }

  return staff.email;
}

/**
 * Validates staff authentication and optional permission requirements
 * Returns null on success, NextResponse with error on failure
 * 
 * @param request - The incoming HTTP request
 * @param requiredPermission - Optional permission to check (e.g., "settings", "orders")
 * @returns null if authorized, NextResponse with error otherwise
 */
export async function requireStaffAuth(
  request: Request,
  requiredPermission?: string
): Promise<NextResponse | null> {
  try {
    // Master admin / Owner role has implicit access to everything
    const isMaster = await isAdminAuthenticated(request);
    if (isMaster) {
      return null;
    }

    const staffId = await getStaffIdFromToken(request);

    if (!staffId) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff authentication required' },
        { status: 401 }
      );
    }

    // Fetch staff account with role and permissions
    const staff = await prisma.staffAccount.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        email: true,
        role: true,
        permissions: true,
        active: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff account not found' },
        { status: 401 }
      );
    }

    // Check if account is active
    if (!staff.active) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      );
    }

    // Validate session version
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 },
      select: { sessionVersion: true },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Unauthorized: Session validation failed' },
        { status: 401 }
      );
    }

    // Extract session version from token
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${STAFF_COOKIE_NAME}=([^;]+)`));

    if (match) {
      const token = match[1];
      const parts = token.split('.');

      if (parts.length === 3) {
        const payloadVersion = parts[1];
        const sessionVersionPart = payloadVersion.includes('-') ? payloadVersion.split('-')[1] : null;
        const tokenSessionVersion = sessionVersionPart ? parseInt(sessionVersionPart, 10) : parseInt(payloadVersion, 10);

        if (!isNaN(tokenSessionVersion) && tokenSessionVersion !== config.sessionVersion) {
          return NextResponse.json(
            { error: 'Unauthorized: Session expired' },
            { status: 401 }
          );
        }
      }
    }

    // Owner role has implicit access to everything
    if (staff.role === 'Owner') {
      return null;
    }

    // Check for required permission if specified
    if (requiredPermission) {
      if (!staff.permissions.includes(requiredPermission)) {
        return NextResponse.json(
          { error: `Forbidden: Requires "${requiredPermission}" permission` },
          { status: 403 }
        );
      }
    }

    return null;
  } catch (error) {
    console.error('[STAFF_AUTH] Authentication error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}

/**
 * Validates that the requesting user has Owner role
 * Returns null on success, NextResponse with error on failure
 * 
 * @param request - The incoming HTTP request
 * @returns null if authorized as Owner, NextResponse with error otherwise
 */
export async function requireOwnerRole(request: Request): Promise<NextResponse | null> {
  try {
    const isMaster = await isAdminAuthenticated(request);
    if (isMaster) {
      return null;
    }

    const staffId = await getStaffIdFromToken(request);

    if (!staffId) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff authentication required' },
        { status: 401 }
      );
    }

    const staff = await prisma.staffAccount.findUnique({
      where: { id: staffId },
      select: { role: true, active: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff account not found' },
        { status: 401 }
      );
    }

    if (!staff.active) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      );
    }

    // Validate session version
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 },
      select: { sessionVersion: true },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Unauthorized: Session validation failed' },
        { status: 401 }
      );
    }

    // Extract session version from token
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${STAFF_COOKIE_NAME}=([^;]+)`));

    if (match) {
      const token = match[1];
      const parts = token.split('.');

      if (parts.length === 3) {
        const payloadVersion = parts[1];
        const sessionVersionPart = payloadVersion.includes('-') ? payloadVersion.split('-')[1] : null;
        const tokenSessionVersion = sessionVersionPart ? parseInt(sessionVersionPart, 10) : parseInt(payloadVersion, 10);

        if (!isNaN(tokenSessionVersion) && tokenSessionVersion !== config.sessionVersion) {
          return NextResponse.json(
            { error: 'Unauthorized: Session expired' },
            { status: 401 }
          );
        }
      }
    }

    if (staff.role !== 'Owner') {
      return NextResponse.json(
        { error: 'Forbidden: Owner role required' },
        { status: 403 }
      );
    }

    return null;
  } catch (error) {
    console.error('[STAFF_AUTH] Owner role check error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authorization' },
      { status: 500 }
    );
  }
}

/**
 * Prevents staff from escalating their own privileges
 * Detects self-modification attempts and logs them
 * 
 * @param request - The incoming HTTP request
 * @param targetStaffId - The ID of the staff account being modified
 * @param body - The request body containing potential role/permission changes
 * @returns null if allowed, NextResponse with error if self-escalation detected
 */
export async function preventSelfEscalation(
  request: Request,
  targetStaffId: number,
  body: any
): Promise<NextResponse | null> {
  try {
    const requestingStaffId = await getStaffIdFromToken(request);

    if (!requestingStaffId) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff authentication required' },
        { status: 401 }
      );
    }

    // Check if staff is trying to modify their own account
    if (requestingStaffId === targetStaffId) {
      // Check if attempting to change role, permissions, or active status
      const sensitiveFields = ['role', 'permissions', 'active'];
      const attemptedChanges = sensitiveFields.filter(field => body[field] !== undefined);

      if (attemptedChanges.length > 0) {
        // Log self-escalation attempt
        const staffEmail = await getStaffEmailFromId(requestingStaffId);

        await createAuditLog(
          'SELF_ESCALATION_ATTEMPT',
          'StaffAccount',
          targetStaffId.toString(),
          {
            staffId: requestingStaffId,
            attemptedAction: 'modify_own_permissions',
            attemptedFields: attemptedChanges,
          },
          staffEmail
        );

        return NextResponse.json(
          { error: 'Cannot modify own permissions' },
          { status: 403 }
        );
      }
    }

    return null;
  } catch (error) {
    console.error('[STAFF_AUTH] Self-escalation check error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authorization' },
      { status: 500 }
    );
  }
}

/**
 * Validates that the requesting user has at least one of the specified permissions
 * Owner/Master Admin have implicit access to everything
 */
export async function requireStaffAuthOr(
  request: Request,
  permissions: string[]
): Promise<NextResponse | null> {
  try {
    const isMaster = await isAdminAuthenticated(request);
    if (isMaster) {
      return null;
    }

    const staffId = await getStaffIdFromToken(request);
    if (!staffId) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff authentication required' },
        { status: 401 }
      );
    }

    const staff = await prisma.staffAccount.findUnique({
      where: { id: staffId },
      select: { id: true, role: true, permissions: true, active: true }
    });

    if (!staff) {
      return NextResponse.json(
        { error: 'Unauthorized: Staff account not found' },
        { status: 401 }
      );
    }

    if (!staff.active) {
      return NextResponse.json(
        { error: 'Account is inactive' },
        { status: 403 }
      );
    }

    // Validate session version
    const config = await prisma.systemConfig.findUnique({
      where: { id: 1 },
      select: { sessionVersion: true },
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Unauthorized: Session validation failed' },
        { status: 401 }
      );
    }

    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`${STAFF_COOKIE_NAME}=([^;]+)`));

    if (match) {
      const token = match[1];
      const parts = token.split('.');

      if (parts.length === 3) {
        const payloadVersion = parts[1];
        const sessionVersionPart = payloadVersion.includes('-') ? payloadVersion.split('-')[1] : null;
        const tokenSessionVersion = sessionVersionPart ? parseInt(sessionVersionPart, 10) : parseInt(payloadVersion, 10);

        if (!isNaN(tokenSessionVersion) && tokenSessionVersion !== config.sessionVersion) {
          return NextResponse.json(
            { error: 'Unauthorized: Session expired' },
            { status: 401 }
          );
        }
      }
    }

    if (staff.role === 'Owner') {
      return null;
    }

    const hasPermission = permissions.some(p => staff.permissions.includes(p));
    if (!hasPermission) {
      return NextResponse.json(
        { error: `Forbidden: Requires one of the following permissions: ${permissions.join(', ')}` },
        { status: 403 }
      );
    }

    return null;
  } catch (error) {
    console.error('[STAFF_AUTH] requireStaffAuthOr error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authorization' },
      { status: 500 }
    );
  }
}

export async function setStaffCookie(response: NextResponse, staffId: number, sessionVersion: number) {
  const token = await generateStaffToken(staffId, sessionVersion)
  response.cookies.set({
    name: STAFF_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export function clearStaffCookie(response: NextResponse) {
  response.cookies.set({
    name: STAFF_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

