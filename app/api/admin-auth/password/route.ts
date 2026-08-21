import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword, clearAdminCookie } from '@/lib/auth'
import { requireOwnerRole, getStaffIdFromToken } from '@/lib/staff-auth'

export async function POST(request: Request) {
  // CRITICAL: Password change requires Owner role ONLY
  const authErr = await requireOwnerRole(request)
  if (authErr) return authErr

  try {
    const { currentPassword, newPassword, confirmPassword } = await request.json()

    // 1. Policy checks
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    if (newPassword.trim().length < 12) {
      return NextResponse.json({ error: 'Password must be at least 12 characters long' }, { status: 400 })
    }

    // 2. Query SystemConfig
    let config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    if (!config) {
      // Create if it doesn't exist yet
      try {
        config = await prisma.systemConfig.create({
          data: {
            id: 1,
            adminPasswordHash: null,
            sessionVersion: 1,
            updatedAt: new Date(),
          }
        })
      } catch {
        config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
      }
    }

    if (!config) {
      return NextResponse.json({ error: 'System error' }, { status: 500 })
    }

    // 3. Verify current password
    // Check if this is a staff account (Owner role) or master admin
    const staffId = await getStaffIdFromToken(request)
    let isMatch = false
    let staffAccount = null

    if (staffId) {
      // This is a staff account with Owner role
      staffAccount = await prisma.staffAccount.findUnique({
        where: { id: staffId }
      })

      if (staffAccount && staffAccount.passwordHash) {
        isMatch = verifyPassword(currentPassword, staffAccount.passwordHash)
      }
    } else {
      // This is master admin - use system config password
      const currentHash = config.adminPasswordHash
      const envAdminPassword = process.env.ADMIN_PASSWORD || 'jessyluxuryadmin2024'

      if (currentHash) {
        isMatch = verifyPassword(currentPassword, currentHash)
      } else {
        // Fallback if password hasn't been seeded yet
        isMatch = currentPassword === envAdminPassword
      }
    }

    if (!isMatch) {
      // Generic error response to prevent enumeration
      return NextResponse.json({ error: 'Invalid authentication credentials' }, { status: 401 })
    }

    // 4. Hash new password and increment version
    const newHash = hashPassword(newPassword)
    const nextVersion = config.sessionVersion + 1

    // CRITICAL: Use transaction to atomically update password and session version
    if (staffId && staffAccount) {
      // Update both staff password and session version atomically
      await prisma.$transaction(async (tx) => {
        await tx.staffAccount.update({
          where: { id: staffId },
          data: { passwordHash: newHash }
        })

        await tx.systemConfig.update({
          where: { id: 1 },
          data: {
            sessionVersion: nextVersion,
            updatedAt: new Date(),
          }
        })
      })
    } else {
      // Update master admin password and session version atomically
      await prisma.$transaction(async (tx) => {
        await tx.systemConfig.update({
          where: { id: 1 },
          data: {
            adminPasswordHash: newHash,
            sessionVersion: nextVersion,
            updatedAt: new Date(),
          }
        })
      })
    }

    // 5. Create audit log
    const { createAuditLog } = await import('@/lib/audit')
    const staffEmail = staffAccount?.email || 'Master Admin'
    await createAuditLog(
      'ADMIN_PASSWORD_CHANGED',
      'SystemConfig',
      '1',
      { timestamp: new Date().toISOString() },
      staffEmail
    )

    // 6. Invalidate current user session
    const response = NextResponse.json({ success: true, message: 'Password updated successfully' })
    clearAdminCookie(response)
    return response

  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
