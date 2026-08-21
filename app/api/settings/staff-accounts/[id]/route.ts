import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth, getStaffIdFromToken, getStaffEmailFromId } from '@/lib/staff-auth'
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
 * GET /api/settings/staff-accounts/[id]
 * Retrieve single staff account by ID
 * 
 * Authorization: Requires Admin authentication
 * 
 * Returns:
 * - 200: Staff account (without password hash)
 * - 401: Unauthorized
 * - 404: Staff account not found
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const staffId = parseInt(params.id, 10)

    if (isNaN(staffId)) {
      return NextResponse.json(
        { error: 'Invalid staff ID' },
        { status: 400 }
      )
    }

    // Fetch staff account, excluding sensitive auth data
    const staff = await prisma.staffAccount.findUnique({
      where: { id: staffId },
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

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(staff, { status: 200 })
  } catch (error) {
    console.error('[STAFF_ACCOUNTS] Error fetching staff account:', error)
    return NextResponse.json(
      { error: 'Failed to fetch staff account' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings/staff-accounts/[id]
 * Update staff account with self-escalation prevention
 * 
 * Authorization: Requires Admin authentication + self-escalation prevention
 * 
 * Body:
 * - name: string (optional)
 * - email: string (optional, must be unique and valid format)
 * - role: string (optional, must be one of: Owner, Manager, Fulfillment, Catalog)
 * - permissions: string[] (optional, must be subset of valid permissions)
 * - active: boolean (optional)
 * 
 * Self-Escalation Rules:
 * - Staff CANNOT modify their own role
 * - Staff CANNOT modify their own permissions
 * - Staff CANNOT modify their own active status
 * - Staff CAN modify their own name or email (non-security fields)
 * - Self-escalation attempts are logged with action "SELF_ESCALATION_ATTEMPT"
 * 
 * Returns:
 * - 200: Updated staff account (without password hash)
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Self-escalation attempt
 * - 404: Staff account not found
 * - 409: Duplicate email
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const targetStaffId = parseInt(params.id, 10)

    if (isNaN(targetStaffId)) {
      return NextResponse.json(
        { error: 'Invalid staff ID' },
        { status: 400 }
      )
    }

    // Check if target staff exists
    const existingStaff = await prisma.staffAccount.findUnique({
      where: { id: targetStaffId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        active: true,
      },
    })

    if (!existingStaff) {
      return NextResponse.json(
        { error: 'Staff account not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Get requesting staff ID for self-escalation prevention
    const requestingStaffId = await getStaffIdFromToken(request)

    // Detect self-modification attempt
    if (requestingStaffId === targetStaffId) {
      // Check if trying to modify restricted fields
      if (body.role !== undefined) {
        // Log self-escalation attempt
        const requestingStaffEmail = await getStaffEmailFromId(requestingStaffId)

        await createAuditLog(
          'SELF_ESCALATION_ATTEMPT',
          'StaffAccount',
          targetStaffId.toString(),
          {
            attemptedAction: 'modify_own_role',
            attemptedChanges: { role: body.role },
          },
          requestingStaffEmail
        )

        return NextResponse.json(
          { error: 'Cannot modify own role' },
          { status: 403 }
        )
      }

      if (body.permissions !== undefined) {
        // Log self-escalation attempt
        const requestingStaffEmail = await getStaffEmailFromId(requestingStaffId)

        await createAuditLog(
          'SELF_ESCALATION_ATTEMPT',
          'StaffAccount',
          targetStaffId.toString(),
          {
            attemptedAction: 'modify_own_permissions',
            attemptedChanges: { permissions: body.permissions },
          },
          requestingStaffEmail
        )

        return NextResponse.json(
          { error: 'Cannot modify own permissions' },
          { status: 403 }
        )
      }

      if (body.active !== undefined) {
        // Log self-escalation attempt
        const requestingStaffEmail = await getStaffEmailFromId(requestingStaffId)

        await createAuditLog(
          'SELF_ESCALATION_ATTEMPT',
          'StaffAccount',
          targetStaffId.toString(),
          {
            attemptedAction: 'modify_own_active_status',
            attemptedChanges: { active: body.active },
          },
          requestingStaffEmail
        )

        return NextResponse.json(
          { error: 'Cannot modify own active status' },
          { status: 403 }
        )
      }
    }

    // Validate name if provided
    if (body.name !== undefined) {
      const nameError = validateRequired(body.name, 'Staff name')
      if (nameError) {
        return NextResponse.json({ error: nameError }, { status: 400 })
      }
    }

    // Validate email if provided
    if (body.email !== undefined) {
      const emailError = validateRequired(body.email, 'Email')
      if (emailError) {
        return NextResponse.json({ error: emailError }, { status: 400 })
      }

      if (!validateEmail(body.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

      // Check email uniqueness (excluding current record)
      const existingEmail = await prisma.staffAccount.findUnique({
        where: { email: body.email },
      })

      if (existingEmail && existingEmail.id !== targetStaffId) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        )
      }
    }

    // Validate role if provided
    if (body.role !== undefined) {
      const roleError = validateEnum(body.role, VALID_ROLES as unknown as string[], 'role')
      if (roleError) {
        return NextResponse.json({ error: roleError }, { status: 400 })
      }
    }

    // Validate permissions if provided
    if (body.permissions !== undefined) {
      if (!Array.isArray(body.permissions)) {
        return NextResponse.json(
          { error: 'Permissions must be an array' },
          { status: 400 }
        )
      }

      for (const permission of body.permissions) {
        if (!VALID_PERMISSIONS.includes(permission)) {
          return NextResponse.json(
            { error: `Invalid permission: ${permission}` },
            { status: 400 }
          )
        }
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

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase()
    if (body.role !== undefined) updateData.role = body.role
    if (body.permissions !== undefined) updateData.permissions = body.permissions
    if (body.active !== undefined) updateData.active = body.active
    if (body.password !== undefined) updateData.passwordHash = hashPassword(body.password)

    // Update staff account
    const updatedStaff = await prisma.staffAccount.update({
      where: { id: targetStaffId },
      data: updateData,
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

    // Create audit log for permission/role changes
    if (body.role !== undefined || body.permissions !== undefined) {
      await createAuditLog(
        'STAFF_PERMISSIONS_CHANGED',
        'StaffAccount',
        targetStaffId.toString(),
        {
          oldRole: existingStaff.role,
          newRole: updatedStaff.role,
          oldPermissions: existingStaff.permissions,
          newPermissions: updatedStaff.permissions,
        },
        'Admin'
      )
    }

    if (body.password !== undefined) {
      await createAuditLog(
        'STAFF_PASSWORD_RESET',
        'StaffAccount',
        targetStaffId.toString(),
        { staffId: targetStaffId },
        'Admin'
      )
    }

    return NextResponse.json(updatedStaff, { status: 200 })
  } catch (error) {
    console.error('[STAFF_ACCOUNTS] Error updating staff account:', error)
    return NextResponse.json(
      { error: 'Failed to update staff account' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/settings/staff-accounts/[id]
 * Delete staff account by ID
 * 
 * Authorization: Requires Admin authentication
 * 
 * Behavior:
 * - Delete staff account by ID
 * - Create audit log with action "STAFF_ACCOUNT_DELETED"
 * - Preserve historical audit records (do not cascade delete)
 * - Prevent self-deletion
 * 
 * Returns:
 * - 200: Success message
 * - 401: Unauthorized
 * - 403: Cannot delete own account
 * - 404: Staff account not found
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'settings')
  if (authErr) return authErr

  try {
    const targetStaffId = parseInt(params.id, 10)

    if (isNaN(targetStaffId)) {
      return NextResponse.json(
        { error: 'Invalid staff ID' },
        { status: 400 }
      )
    }

    // Get requesting staff ID for self-deletion prevention
    const requestingStaffId = await getStaffIdFromToken(request)

    // Prevent self-deletion
    if (requestingStaffId === targetStaffId) {
      return NextResponse.json(
        { error: 'Cannot delete own account' },
        { status: 403 }
      )
    }

    // Check if staff exists
    const staff = await prisma.staffAccount.findUnique({
      where: { id: targetStaffId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    if (!staff) {
      return NextResponse.json(
        { error: 'Staff account not found' },
        { status: 404 }
      )
    }

    // Create audit log before deletion
    await createAuditLog(
      'STAFF_ACCOUNT_DELETED',
      'StaffAccount',
      targetStaffId.toString(),
      {
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
      'Admin'
    )

    // Delete staff account
    await prisma.staffAccount.delete({
      where: { id: targetStaffId },
    })

    return NextResponse.json(
      { message: 'Staff account deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[STAFF_ACCOUNTS] Error deleting staff account:', error)
    return NextResponse.json(
      { error: 'Failed to delete staff account' },
      { status: 500 }
    )
  }
}
