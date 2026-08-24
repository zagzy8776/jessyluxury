import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/admin-login'

/**
 * Simplified runtime verification test
 * Each test is independent and reports clear PASS/FAIL
 */

const TEST_COUPON_CODE = 'RTVERIFY10'

test.describe('Promo Popup - Manual Runtime Verification', () => {
  
  test('0. Setup: Create test coupon', async ({ page }) => {
    await loginAsOwner(page)
    await page.goto('/store-portal-jl/dashboard/sales-marketing/discounts')
    await page.waitForLoadState('networkidle')
    
    // Check if coupon exists
    const existingCoupon = page.locator(`text=${TEST_COUPON_CODE}`)
    const exists = await existingCoupon.isVisible().catch(() => false)
    
    if (!exists) {
      console.log('Creating test coupon...')
      await page.click('button:has-text("CREATE")', { timeout: 10000 })
      await page.waitForTimeout(1000)
      
      // Find the modal input for coupon code
      const modal = page.locator('div[class*="fixed"]').filter({ hasText: 'Discount' })
      await modal.locator('input').first().fill(TEST_COUPON_CODE)
      
      // Fill discount value
      await modal.locator('input[type="number"]').first().fill('10')
      
      // Submit
      await modal.locator('button:has-text("Save")').click()
      await page.waitForTimeout(2000)
      console.log('✅ Test coupon created')
    } else {
      console.log('✅ Test coupon already exists')
    }
  })

  test('1. Admin can access promo popup config page', async ({ page }) => {
    await loginAsOwner(page)
    await page.goto('/store-portal-jl/dashboard/sales-marketing/promo-popup')
    await page.waitForLoadState('networkidle')
    
    // Check for key elements
    await expect(page.locator('text=Promotional Reward Popup')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Enable Promotional Popup')).toBeVisible()
    await expect(page.locator('text=Content & Appearance')).toBeVisible()
    
    console.log('✅ PASS: Admin config page accessible')
  })

  test('2. Admin can configure and enable promo with valid coupon', async ({ page }) => {
    await loginAsOwner(page)
    await page.goto('/store-portal-jl/dashboard/sales-marketing/promo-popup')
    await page.waitForLoadState('networkidle')
    
    // Enable popup
    const checkbox = page.locator('input[type="checkbox"]').first()
    await checkbox.check()
    
    // Fill config with 2s delay for testing
    await page.locator('input[placeholder*="Congratulations"]').fill('Runtime Test Reward ✨')
    await page.locator('textarea').first().fill('This is a runtime verification test.')
    await page.locator('input[placeholder*="10% OFF"]').fill('10% OFF')
    await page.locator('input[placeholder*="JESSY"]').fill(TEST_COUPON_CODE)
    await page.locator('input[placeholder*="Shop"]').fill('Verify Now')
    
    // Set delay to 2000ms for predictable testing
    const delayInput = page.locator('input[type="number"]').filter({ has: page.locator('.. >> text=/Display Delay/i') })
    await delayInput.fill('2000')
    
    // Save
    await page.click('button:has-text("Save Configuration")')
    
    // Wait for success message
    await expect(page.locator('text=saved')).toBeVisible({ timeout: 5000 })
    
    console.log('✅ PASS: Config saved successfully with valid coupon')
  })

  test('3. Admin can see live preview', async ({ page }) => {
    await loginAsOwner(page)
    await page.goto('/store-portal-jl/dashboard/sales-marketing/promo-popup')
    await page.waitForLoadState('networkidle')
    
    // Click preview
    await page.click('button:has-text("Preview")')
    
    // Wait for popup to appear
    await page.waitForTimeout(1000)
    
    // Check popup content
    await expect(page.locator('text=Runtime Test Reward')).toBeVisible({ timeout: 3000 })
    await expect(page.locator(`text=${TEST_COUPON_CODE}`)).toBeVisible()
    await expect(page.locator('button:has-text("Verify Now")')).toBeVisible()
    
    // Close preview
    await page.click('button:has-text("Close Preview")')
    
    console.log('✅ PASS: Preview displays correctly')
  })

  test('4. Admin gets error for invalid coupon code', async ({ page }) => {
    await loginAsOwner(page)
    await page.goto('/store-portal-jl/dashboard/sales-marketing/promo-popup')
    await page.waitForLoadState('networkidle')
    
    // Enable and set invalid coupon
    await page.locator('input[type="checkbox"]').first().check()
    
    // Clear existing coupon code and enter invalid one
    const couponInput = page.locator('input[placeholder*="JESSY"]')
    await couponInput.clear()
    await couponInput.fill('INVALIDCODE999')
    
    // Try to save
    await page.click('button:has-text("Save Configuration")')
    
    // Should see error
    await expect(page.locator('text=does not exist')).toBeVisible({ timeout: 5000 })
    
    console.log('✅ PASS: Invalid coupon rejected')
    
    // CRITICAL: Restore valid config for subsequent tests
    await couponInput.clear()
    await couponInput.fill(TEST_COUPON_CODE)
    await page.click('button:has-text("Save Configuration")')
    await expect(page.locator('text=saved')).toBeVisible({ timeout: 5000 })
  })

  test('5. Customer sees popup on fresh visit', async ({ browser }) => {
    // Create new incognito context
    const context = await browser.newContext()
    const page = await context.newPage()
    
    await page.goto('/')
    
    // Popup should NOT be visible immediately (2s delay configured)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500) // small buffer for React hydration
    
    const popupNotVisible = await page.locator('text=Runtime Test Reward').isVisible().catch(() => false)
    expect(popupNotVisible).toBe(false)
    
    console.log('⏳ Waiting for display delay (2s)...')
    
    // Wait for delay (2s in config + small buffer)
    await page.waitForTimeout(2500)
    
    // Now popup should be visible
    await expect(page.locator('text=Runtime Test Reward')).toBeVisible({ timeout: 3000 })
    await expect(page.locator(`text=${TEST_COUPON_CODE}`)).toBeVisible()
    
    console.log('✅ PASS: Popup appears after delay')
    
    await context.close()
  })

  test('6. Customer can copy coupon code', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2500) // Wait for 2s delay
    
    await expect(page.locator('text=Runtime Test Reward')).toBeVisible({ timeout: 3000 })
    
    // Click the copy button (button containing coupon code)
    await page.click(`button:has-text("${TEST_COUPON_CODE}")`)
    
    // Should show "Copied" feedback
    await expect(page.locator('text=Copied')).toBeVisible({ timeout: 2000 })
    
    console.log('✅ PASS: Copy button works')
    
    await context.close()
  })

  test('7. CTA navigates to shop with coupon in session', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2500) // Wait for 2s delay
    
    await expect(page.locator('text=Runtime Test Reward')).toBeVisible({ timeout: 3000 })
    
    // Click CTA
    await page.click('button:has-text("Verify Now")')
    
    // Should navigate to /shop
    await expect(page).toHaveURL(/\/shop/, { timeout: 5000 })
    
    // Check sessionStorage
    const pendingCoupon = await page.evaluate(() => sessionStorage.getItem('jl_pending_coupon'))
    expect(pendingCoupon).toBe(TEST_COUPON_CODE)
    
    console.log('✅ PASS: CTA navigates to shop, coupon stored in session')
    
    await context.close()
  })

  test('8. X button dismisses popup', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2500) // Wait for 2s delay
    
    await expect(page.locator('text=Runtime Test Reward')).toBeVisible({ timeout: 3000 })
    
    // Click X button
    await page.click('button[aria-label*="Close"]')
    
    // Popup should disappear
    await expect(page.locator('text=Runtime Test Reward')).not.toBeVisible()
    
    console.log('✅ PASS: X button dismisses popup')
    
    await context.close()
  })

  test('9. Frequency suppression prevents re-display', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    
    // Clear any previous dismissal state
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.removeItem('jl_promo_dismissed')
      sessionStorage.removeItem('jl_promo_seen')
    })
    
    // First visit - see and dismiss popup
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2500) // Wait for 2s delay
    await expect(page.locator('text=Runtime Test Reward')).toBeVisible({ timeout: 3000 })
    await page.click('button:has-text("Maybe later")')
    
    // Navigate to another page
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000) // Wait longer than delay
    
    // Popup should NOT appear again
    const visible = await page.locator('text=Runtime Test Reward').isVisible().catch(() => false)
    expect(visible).toBe(false)
    
    console.log('✅ PASS: Frequency suppression works')
    
    await context.close()
  })

  test('10. Mobile 375px - no overflow', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 } })
    const page = await context.newPage()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2500) // Wait for 2s delay
    
    await expect(page.locator('text=Runtime Test Reward')).toBeVisible({ timeout: 3000 })
    
    // Check for horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(376) // Allow 1px tolerance
    
    console.log(`✅ PASS: Mobile 375px OK (body width: ${bodyWidth}px)`)
    
    await context.close()
  })

  test('11. Mobile 390px - no overflow', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2500) // Wait for 2s delay
    
    await expect(page.locator('text=Runtime Test Reward')).toBeVisible({ timeout: 3000 })
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(391)
    
    console.log(`✅ PASS: Mobile 390px OK (body width: ${bodyWidth}px)`)
    
    await context.close()
  })

  test('12. Desktop 1440px - centered with max-width', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await context.newPage()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2500) // Wait for 2s delay
    
    await expect(page.locator('text=Runtime Test Reward')).toBeVisible({ timeout: 3000 })
    
    // Popup card should be constrained - select the inner card, not the backdrop
    const card = page.locator('div[role="dialog"]').locator('> div').nth(1) // Skip backdrop, get card
    const cardWidth = await card.evaluate(el => el.offsetWidth)
    expect(cardWidth).toBeLessThan(600) // Max-width constraint
    
    console.log(`✅ PASS: Desktop 1440px OK (card width: ${cardWidth}px)`)
    
    await context.close()
  })

  test('13. Disabled config hides popup', async ({ browser, page }) => {
    // Disable the popup
    await loginAsOwner(page)
    await page.goto('/store-portal-jl/dashboard/sales-marketing/promo-popup')
    await page.waitForLoadState('networkidle')
    
    await page.locator('input[type="checkbox"]').first().uncheck()
    await page.click('button:has-text("Save Configuration")')
    await expect(page.locator('text=saved')).toBeVisible({ timeout: 5000 })
    
    // Check storefront
    const context = await browser.newContext()
    const storefrontPage = await context.newPage()
    
    await storefrontPage.goto('/')
    await storefrontPage.waitForTimeout(3000)
    
    // Popup should NOT appear
    const visible = await storefrontPage.locator('text=Runtime Test Reward').isVisible().catch(() => false)
    expect(visible).toBe(false)
    
    console.log('✅ PASS: Disabled config hides popup')
    
    // Re-enable for other tests
    await page.goto('/store-portal-jl/dashboard/sales-marketing/promo-popup')
    await page.locator('input[type="checkbox"]').first().check()
    await page.click('button:has-text("Save Configuration")')
    await page.waitForTimeout(1000)
    
    await context.close()
  })

  test('14. Expired date hides popup', async ({ browser, page }) => {
    // Set expiry to past
    await loginAsOwner(page)
    await page.goto('/store-portal-jl/dashboard/sales-marketing/promo-popup')
    await page.waitForLoadState('networkidle')
    
    // First ensure config is enabled (in case previous test disabled it)
    const checkbox = page.locator('input[type="checkbox"]').first()
    await checkbox.check()
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const expiryValue = yesterday.toISOString().slice(0, 16)
    
    await page.locator('input[type="datetime-local"]').fill(expiryValue)
    await page.click('button:has-text("Save Configuration")')
    await expect(page.locator('text=saved')).toBeVisible({ timeout: 5000 })
    
    // Wait for config to propagate
    await page.waitForTimeout(2000) // Longer wait to ensure DB + cache updates
    
    // Check storefront in new context with cache disabled
    const context = await browser.newContext({ serviceWorkers: 'block' })
    const storefrontPage = await context.newPage()
    
    // Navigate with hard reload to bypass any caching
    await storefrontPage.goto('/', { waitUntil: 'networkidle' })
    await storefrontPage.reload({ waitUntil: 'networkidle' })
    
    // Wait longer than delay to ensure it would have appeared if not expired
    await storefrontPage.waitForTimeout(4000)
    
    // Popup should NOT appear (expired)
    const visible = await storefrontPage.locator('text=Runtime Test Reward').isVisible().catch(() => false)
    expect(visible).toBe(false)
    
    console.log('✅ PASS: Expired date hides popup')
    
    // Remove expiry for other tests
    await page.goto('/store-portal-jl/dashboard/sales-marketing/promo-popup')
    await page.waitForLoadState('networkidle')
    await page.locator('input[type="datetime-local"]').fill('')
    await page.click('button:has-text("Save Configuration")')
    await page.waitForTimeout(1000)
    
    await context.close()
  })
})
