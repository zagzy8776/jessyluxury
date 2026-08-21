import { NextResponse } from 'next/server'
import { clearCustomerCookie } from '@/lib/auth'

export async function POST() {
  try {
    const response = NextResponse.json({ success: true })
    clearCustomerCookie(response)
    return response
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Logout failed' }, { status: 500 })
  }
}
