import type { Page } from '@playwright/test'
import { request as newRequestContext } from '@playwright/test'

/** Owner credentials — provisioned idempotently by e2e/global-setup.ts. */
export const OWNER_CREDENTIALS = {
  email: 'owner@jessy.test',
  password: 'ownerpass123456',
}

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
    data: OWNER_CREDENTIALS,
  })

  if (!response.ok()) {
    throw new Error(`Owner login failed with status ${response.status()}`)
  }
}

/**
 * Performs a real login against /api/admin-auth on a standalone API request
 * context and returns the session cookie EXACTLY as the server set it in the
 * Set-Cookie response header (name + value).
 *
 * Use this where no browser Page exists yet (e.g., beforeAll warm-up fetches).
 * Tokens are never generated client-side — authentication always flows through
 * the application's own login endpoint, so middleware/authorization behavior
 * is exercised unmodified.
 */
export async function getOwnerSessionCookie(): Promise<{ name: string; value: string }> {
  const ctx = await newRequestContext.newContext()
  try {
    const response = await ctx.post('http://localhost:3000/api/admin-auth', {
      data: OWNER_CREDENTIALS,
    })

    if (!response.ok()) {
      throw new Error(`Owner login failed with status ${response.status()}`)
    }

    const setCookies = response
      .headersArray()
      .filter((h) => h.name.toLowerCase() === 'set-cookie')
      .map((h) => h.value)

    const cookieHeader = setCookies.find((c) => c.startsWith('jl_staff_token='))
    if (!cookieHeader) {
      throw new Error('Login response did not set jl_staff_token cookie')
    }

    const value = cookieHeader.split(';')[0].split('=').slice(1).join('=')
    return { name: 'jl_staff_token', value }
  } finally {
    await ctx.dispose()
  }
}
