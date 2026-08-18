import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidTokenSignature, generateAdminToken } from './auth-crypto'

const COOKIE_NAME = 'jl_admin_token'

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }).toString('hex')
  return `scrypt$16384$8$1$${salt}$${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  
  try {
    const N = parseInt(parts[1], 10)
    const r = parseInt(parts[2], 10)
    const p = parseInt(parts[3], 10)
    const salt = parts[4]
    const storedHash = parts[5]
    
    if (isNaN(N) || isNaN(r) || isNaN(p) || !salt || !storedHash) return false
    
    const hash = scryptSync(password, salt, KEY_LEN, { N, r, p }).toString('hex')
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))
  } catch {
    return false
  }
}

export async function isAdminAuthenticated(request?: Request): Promise<boolean> {
  try {
    let token: string | undefined
    
    if (request) {
      const cookieHeader = request.headers.get('cookie') || ''
      const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
      if (match) token = match[1]
    }
    
    if (!token) {
      const cookieStore = cookies()
      token = cookieStore.get(COOKIE_NAME)?.value
    }
    
    if (!token) return false

    const { isValid, sessionVersion } = await isValidTokenSignature(token)
    if (!isValid || sessionVersion === undefined) return false

    // Verify sessionVersion against database
    const config = await prisma.systemConfig.findUnique({ where: { id: 1 } })
    if (!config) return false

    return config.sessionVersion === sessionVersion
  } catch {
    return false
  }
}

export async function requireAdminAuth(request: Request): Promise<NextResponse | null> {
  const isAuthed = await isAdminAuthenticated(request)
  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 })
  }
  return null
}

export async function setAdminCookie(response: NextResponse, sessionVersion: number) {
  const token = await generateAdminToken(sessionVersion)
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
