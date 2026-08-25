import { redirect } from 'next/navigation'

/**
 * Legacy settings entry point.
 *
 * The full, current settings experience lives at
 * /store-portal-jl/dashboard/settings (Business Profile, Locations, Staff,
 * Payment, Notifications, System Defaults). This route previously hosted an
 * older, thinner settings shell that duplicated those forms; it now redirects
 * so there is a single source of truth and no half-populated Settings screen.
 */
export default function LegacyAdminSettingsPage() {
  redirect('/store-portal-jl/dashboard/settings')
}
