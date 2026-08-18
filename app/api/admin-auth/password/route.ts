import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth, verifyPassword, hashPassword, clearAdminCookie } from '@/lib/auth'

export async function POST(request: Request) {
  const authErr = await requireAdminAuth(request)
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
    let isMatch = false
    const currentHash = config.adminPasswordHash
    const envAdminPassword = process.env.ADMIN_PASSWORD || 'jessyluxuryadmin2024'

    if (currentHash) {
      isMatch = verifyPassword(currentPassword, currentHash)
    } else {
      // Fallback if password hasn't been seeded yet
      isMatch = currentPassword === envAdminPassword
    }

    if (!isMatch) {
      // Generic error response to prevent enumeration
      return NextResponse.json({ error: 'Invalid authentication credentials' }, { status: 401 })
    }

    // 4. Hash new password and increment version
    const newHash = hashPassword(newPassword)
    const nextVersion = config.sessionVersion + 1

    await prisma.systemConfig.update({
      where: { id: 1 },
      data: {
        adminPasswordHash: newHash,
        sessionVersion: nextVersion,
      }
    })

    // 5. Invalidate current user session
    const response = NextResponse.json({ success: true, message: 'Password updated successfully' })
    clearAdminCookie(response)
    return response

  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
