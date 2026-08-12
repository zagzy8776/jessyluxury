import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    const adminPassword = process.env.ADMIN_PASSWORD || 'jessyluxuryadmin2024'

    if (password === adminPassword) {
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
