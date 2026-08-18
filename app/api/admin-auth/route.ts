import { NextResponse } from 'next/server'
import { setAdminCookie, clearAdminCookie, isAdminAuthenticated, verifyPassword, hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const rateLimit = new Map<string, { count: number; resetTime: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimit.get(ip)

  if (!record || record.resetTime < now) {
    rateLimit.set(ip, { count: 1, resetTime: now + WINDOW_MS })
    return true
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false
  }

  record.count += 1
  return true
}

export async function GET(request: Request) {
  const authed = await isAdminAuthenticated(request)
  return NextResponse.json({ authenticated: authed })
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 })
    }

    const { password } = await request.json()
    const envAdminPassword = process.env.ADMIN_PASSWORD || 'jessyluxuryadmin2024'

    // Atomic / safe fetch or creation of SystemConfig
    let config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    if (!config) {
      try {
        config = await prisma.systemConfig.create({
          data: {
            id: 1,
            adminPasswordHash: null,
            sessionVersion: 1,
          }
        })
      } catch {
        // If created concurrently, fetch it
        config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
      }
    }

    if (!config) {
      return NextResponse.json({ error: 'Failed to authenticate: Server error' }, { status: 500 })
    }

    let isMatch = false
    let currentHash = config.adminPasswordHash

    if (currentHash) {
      isMatch = verifyPassword(password, currentHash)
    } else {
      // First-time migration fallback
      if (password === envAdminPassword) {
        isMatch = true
        const newHash = hashPassword(password)
        try {
          config = await prisma.systemConfig.update({
            where: { id: 1 },
            data: { adminPasswordHash: newHash }
          })
        } catch (e) {
          console.error('Failed to save migrated password hash:', e)
        }
      }
    }

    if (isMatch) {
      const response = NextResponse.json({ ok: true })
      await setAdminCookie(response, config.sessionVersion)
      
      rateLimit.delete(ip)
      return response
    }

    return NextResponse.json({ error: 'Incorrect password. Try again.' }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })
  clearAdminCookie(response)
  return response
}

