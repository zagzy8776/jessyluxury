import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isValidTokenSignature } from '@/lib/auth-crypto'

export async function middleware(request: NextRequest) {
  const adminToken = request.cookies.get('jl_admin_token')?.value
  const staffToken = request.cookies.get('jl_staff_token')?.value
  
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
  
  if (!isValidAdmin && !isValidStaff) {
    // Redirect to login if token is invalid or missing
    const loginUrl = new URL('/store-portal-jl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/store-portal-jl/dashboard/:path*'],
}
