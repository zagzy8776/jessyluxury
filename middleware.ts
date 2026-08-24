import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isValidTokenSignature } from '@/lib/auth-crypto'

export async function middleware(request: NextRequest) {
  const adminToken = request.cookies.get('jl_admin_token')?.value
  const staffToken = request.cookies.get('jl_staff_token')?.value

  // Customer storefront checkout is public. Keep staff/POS order handling on
  // the existing protected endpoint and transparently route guest POSTs to the
  // hardened storefront checkout endpoint.
  if (request.nextUrl.pathname === '/api/orders' && request.method === 'POST' && !adminToken && !staffToken) {
    const storefrontUrl = request.nextUrl.clone()
    storefrontUrl.pathname = '/api/storefront/orders'
    return NextResponse.rewrite(storefrontUrl)
  }

  let isValidAdmin = false
  let isValidStaff = false

  if (adminToken) {
    const { isValid } = await isValidTokenSignature(adminToken)
    isValidAdmin = isValid
  }

  if (staffToken) {
    const { isValid } = await isValidTokenSignature(staffToken)
    isValidStaff = isValid
  }

  if (request.nextUrl.pathname.startsWith('/store-portal-jl/dashboard/') && !isValidAdmin && !isValidStaff) {
    const loginUrl = new URL('/store-portal-jl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/store-portal-jl/dashboard/:path*', '/api/orders'],
}
