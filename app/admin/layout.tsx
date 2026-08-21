import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { isValidTokenSignature } from '@/lib/auth-crypto'

/**
 * Admin section guard.
 *
 * Restores access control for the /admin section (including the Phase 11
 * settings shell at /admin/settings) which was previously killed outright by an
 * unconditional redirect('/'). Unauthenticated visitors are sent to the admin
 * portal login, mirroring middleware.ts token validation.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const adminToken = cookieStore.get('jl_admin_token')?.value
  const staffToken = cookieStore.get('jl_staff_token')?.value

  let isValidAdmin = false
  let isValidStaff = false

  if (adminToken) {
    isValidAdmin = (await isValidTokenSignature(adminToken)).isValid
  }
  if (staffToken) {
    isValidStaff = (await isValidTokenSignature(staffToken)).isValid
  }

  if (!isValidAdmin && !isValidStaff) {
    redirect('/store-portal-jl')
  }

  return <>{children}</>
}
