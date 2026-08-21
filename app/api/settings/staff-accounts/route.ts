import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'
import { validateRequired, validateEmail, validateEnum } from '@/lib/validation'
import { createAuditLog } from '@/lib/audit'
import { hashPassword } from '@/lib/auth'

/**
 * Valid staff roles
 */
const VALID_ROLES = ['Owner', 'Manager', 'Fulfillment', 'Catalog'] as const

/**
 * Valid staff permissions
 */
const VALID_PERMISSIONS = [
  'orders',
  'products',
  'customers',
  'analytics',
  'settings',
  'catalog',
  'fulfillment',
  'notifications',
  'marketing',
  'shipping'
] as const

/**
 * GET /api/settings/staff-accounts
 * List all staff accounts
 * 
 * Authorization: Requires Admin authentication
 * 
 * Returns:
 * - 200: Array of staff accounts (without password hashes)
 * - 401: Unauthorized
 */
export async function GET(request: Request) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    // Fetch all staff accounts, excluding sensitive auth data
    const staffAccounts = await prisma.staffAccount.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(staffAccounts, { status: 200 })
  } catch (error) {
    console.error('[STAFF_ACCOUNTS] Error fetching staff accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff accounts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/staff-accounts
 * Create new staff account
 * 
 * Authorization: Requires Admin authentication
 * 
 * Body:
 * - name: string (required)
 * - email: string (required, must be unique and valid format)
 * - role: string (required, must be one of: Owner, Manager, Fulfillment, Catalog)
 * - permissions: string[] (required, must be subset of valid permissions)
 * - active: boolean (optional, default: true)
 * - password: string (optional)
 * 
 * Returns:
 * - 200: Created staff account (without password hash)
 * - 400: Validation error
 * - 401: Unauthorized
 * - 409: Email already exists
 */
export async function POST(request: Request) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const body = await request.json()

    // Validate required fields
    const nameError = validateRequired(body.name, 'Staff name')
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 })
    }

    const emailError = validateRequired(body.email, 'Email')
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 })
    }

    // Validate email format
    if (!validateEmail(body.email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate role enum
    const roleError = validateEnum(body.role, VALID_ROLES as unknown as string[], 'role')
    if (roleError) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Validate permissions array
    if (!body.permissions || !Array.isArray(body.permissions)) {
      return NextResponse.json(
        { error: 'Permissions must be an array' },
        { status: 400 }
      )
    }

    // Validate each permission in the array
    for (const permission of body.permissions) {
      if (!VALID_PERMISSIONS.includes(permission)) {
        return NextResponse.json(
          { error: `Invalid permission: ${permission}` },
          { status: 400 }
        )
      }
    }

    // Validate password if provided
    if (body.password !== undefined && body.password !== null) {
      if (typeof body.password !== 'string' || body.password.length < 12) {
        return NextResponse.json(
          { error: 'Password must be at least 12 characters long' },
          { status: 400 }
        )
      }
    }

    // Check email uniqueness
    const existingStaff = await prisma.staffAccount.findUnique({
      where: { email: body.email.trim().toLowerCase() },
    })

    if (existingStaff) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      )
    }

    const passHash = body.password ? hashPassword(body.password) : null

    // Create staff account
    const newStaff = await prisma.staffAccount.create({
      data: {
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        role: body.role,
        permissions: body.permissions,
        active: body.active !== undefined ? body.active : true,
        passwordHash: passHash,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Create audit log
    await createAuditLog(
      'STAFF_ACCOUNT_CREATED',
      'StaffAccount',
      newStaff.id.toString(),
      {
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        permissions: newStaff.permissions,
      },
      'Admin'
    )

    return NextResponse.json(newStaff, { status: 200 })
  } catch (error) {
    console.error('[STAFF_ACCOUNTS] Error creating staff account:', error)
    return NextResponse.json(
      { error: 'Failed to create staff account' },
      { status: 500 }
    )
  }
}
