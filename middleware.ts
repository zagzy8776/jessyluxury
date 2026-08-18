import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isValidTokenSignature } from '@/lib/auth-crypto'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('jl_admin_token')?.value
  
  const { isValid } = await isValidTokenSignature(token)
  
  if (!isValid) {
    // Redirect to login if token is invalid or missing
    const loginUrl = new URL('/store-portal-jl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/store-portal-jl/dashboard/:path*'],
}
