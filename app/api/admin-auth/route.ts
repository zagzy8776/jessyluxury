import { NextResponse } from 'next/server'
import { setAdminCookie, clearAdminCookie, isAdminAuthenticated, verifyPassword, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { setStaffCookie, clearStaffCookie, getStaffIdFromToken } from '@/lib/staff-auth'

const rateLimit = new Map<string, { count: number; resetTime: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimit.get(ip)

  if (!record || record.resetTime < now) {
    rateLimit.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return true
  }

  if (record.count >= MAX_ATTEMPTS) return false

  record.count += 1
  return true
}

export async function GET(request: Request) {
  const adminAuthed = await isAdminAuthenticated(request)
  const staffId = await getStaffIdFromToken(request)

  let staffAuthed = false
  if (staffId) {
    const staff = await prisma.staffAccount.findUnique({ where: { id: staffId } })
    if (staff?.active) staffAuthed = true
  }

  return NextResponse.json({ authenticated: adminAuthed || staffAuthed })
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 })
    }

    const { email, password } = await request.json()

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    let config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    if (!config) {
      try {
        config = await prisma.systemConfig.create({
          data: { id: 1, adminPasswordHash: null, sessionVersion: 1, updatedAt: new Date() },
        })
      } catch {
        config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
      }
    }

    if (!config) {
      return NextResponse.json({ error: 'Failed to authenticate: Server error' }, { status: 500 })
    }

    if (email) {
      const staff = await prisma.staffAccount.findUnique({
        where: { email: email.trim().toLowerCase() },
      })

      if (!staff) return NextResponse.json({ error: 'Incorrect email or password. Try again.' }, { status: 401 })
      if (!staff.active) return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
      if (!staff.passwordHash) return NextResponse.json({ error: 'Staff account credentials not set' }, { status: 401 })

      if (verifyPassword(password, staff.passwordHash)) {
        const response = NextResponse.json({ ok: true, role: staff.role })
        await setStaffCookie(response, staff.id, config.sessionVersion)
        rateLimit.delete(ip)
        return response
      }

      return NextResponse.json({ error: 'Incorrect email or password. Try again.' }, { status: 401 })
    }

    let isMatch = false
    const currentHash = config.adminPasswordHash

    if (currentHash) {
      isMatch = verifyPassword(password, currentHash)
    } else {
      const envAdminPassword = process.env.ADMIN_PASSWORD
      if (!envAdminPassword) {
        return NextResponse.json({ error: 'Admin authentication is not configured on this server.' }, { status: 503 })
      }

      if (password === envAdminPassword) {
        isMatch = true
        const newHash = hashPassword(password)
        try {
          config = await prisma.systemConfig.update({
            where: { id: 1 },
            data: { adminPasswordHash: newHash },
          })
        } catch (error) {
          console.error('Failed to save migrated password hash:', error)
        }
      }
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect password. Try again.' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true, role: 'Owner' })
    try {
      await setAdminCookie(response, config.sessionVersion)
    } catch (cookieErr) {
      console.error('setAdminCookie failed:', cookieErr)
      return NextResponse.json({ error: 'Admin authentication is not configured on this server.' }, { status: 503 })
    }
    rateLimit.delete(ip)
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Unable to process login request.' }, { status: 400 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  clearAdminCookie(response)
  clearStaffCookie(response)
  return response
}
