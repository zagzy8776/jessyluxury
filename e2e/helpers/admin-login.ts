import type { Page } from '@playwright/test'

/**
 * Authenticates the browser context as the Owner test account by performing a
 * real login against /api/admin-auth.
 *
 * page.request shares the browser context's cookie jar, so the jl_staff_token
 * cookie set by the login response persists for subsequent page.goto() calls.
 * Used by UI specs (settings shell, POS flows) that need an authenticated
 * admin session. Does not weaken any authorization — it uses the real login
 * endpoint with the standard Owner test account provisioned by global-setup.
 */
export async function loginAsOwner(page: Page): Promise<void> {
  const response = await page.request.post('http://localhost:3000/api/admin-auth', {
    data: {
      email: 'owner@jessy.test',
      password: 'ownerpass123456',
    },
  })

  if (!response.ok()) {
    throw new Error(`Owner login failed with status ${response.status()}`)
  }
}
