import { test, expect } from '@playwright/test'
import { loginAsOwner } from '../helpers/admin-login'

test.describe('Settings Shell Integration - P11-T054 Checkpoint', () => {
  test.setTimeout(30000)

  // The settings shell is admin-only; establish an authenticated session first.
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page)
  })

  test('Settings page is accessible and displays main UI', async ({ page }) => {
    page.setDefaultTimeout(10000)
    
    await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' })

    // Check that the settings page title is visible
    const title = page.locator('h1')
    await expect(title).toContainText('Settings')
  })

  test('All 7 settings tabs are present on the page', async ({ page }) => {
    page.setDefaultTimeout(10000)
    
    await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' })

    // Check that tab button elements exist
    const tabButtons = page.locator('[role="tab"]')
    const count = await tabButtons.count()
    
    // Should have at least 7 tabs
    expect(count).toBeGreaterThanOrEqual(7)
  })

  test('Tab navigation structure is intact', async ({ page }) => {
    page.setDefaultTimeout(10000)
    
    await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' })

    // Check for tab list and panels
    const tabList = page.locator('[role="tablist"]')
    const tabPanels = page.locator('[role="tabpanel"]')
    
    await expect(tabList).toBeVisible()
    const panelCount = await tabPanels.count()
    expect(panelCount).toBeGreaterThan(0)
  })

  test('Settings link is present in admin dashboard navigation', async ({ page }) => {
    page.setDefaultTimeout(10000)
    
    await page.goto('/store-portal-jl/dashboard', { waitUntil: 'domcontentloaded' })

    // Look for settings link
    const settingsLink = page.locator('a[href="/admin/settings"], button:has-text("Settings")')
    
    // It should exist in the page
    const exists = await settingsLink.count().then(c => c > 0)
    expect(exists).toBe(true)
  })

  test('P11-T054: Settings shell integration is complete and functional', async ({ page }) => {
    page.setDefaultTimeout(10000)
    
    // Navigate to settings
    await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' })

    // Verify the page structure
    const mainContent = page.locator('div.min-h-screen')
    await expect(mainContent).toBeVisible()
    
    // Verify title exists
    const title = page.locator('h1:has-text("Settings")')
    await expect(title).toBeVisible()
    
    // Verify tab list exists
    const tabList = page.locator('[role="tablist"]')
    await expect(tabList).toBeVisible()
    
    // Verify content area exists
    const contentArea = page.locator('[role="tabpanel"]')
    await expect(contentArea).toBeVisible()
    
    // Checkpoint passes: Settings shell integration is working
    console.log('✓ Settings shell integration checkpoint complete')
  })
})
