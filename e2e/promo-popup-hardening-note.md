# Promo E2E Suite Test-Hardening Note

**File:** `e2e/promo-popup-hardening-note.md`
**Purpose:** Document shared state, storage cleanup, coupon contamination, and timing sensitivity for the promotional reward popup test suite.

## Shared State Between Tests

The promo popup tests rely on several forms of shared state that can cause test contamination if not properly managed:

### Database State (shared via global setup)
- **PromoPopupConfig record** (singleton, id=1): Created/updated by admin configuration tests. Tests that enable/disable the popup or change its config will modify this shared record.
- **Test coupon code** (Coupon table): Created once by the global setup or first test that runs. All subsequent tests that reference `TEST_COUPON.code` (`'RTVERIFY10'` in manual verification, `'E2EPROMO10'` in runtime verification) assume this coupon exists and is active.
- **Staff accounts** (StaffAccount table): 5 global test accounts (`owner@jessy.test`, `manager@jessy.test`, etc.) provisioned by `global-setup.ts`. These are shared across ALL e2e tests.

### Runtime State (per-test context)
- **Cookies**: Each test/new context clears cookies via `await context.clearCookies()`. However, some tests (`shell.spec.ts`, `shell-integration.spec.ts`) do NOT clear cookies, relying on the global staff auth cookie instead.
- **LocalStorage / SessionStorage**: Each test that creates a new browser context should clear `jl_promo_dismissed`, `jl_promo_seen`, and `jl_pending_coupon` from storage. Tests that fail to do this may interfere with subsequent tests that check frequency suppression or "do not show again" behavior.

## Storage Cleanup Requirements

### Per-Test Cleanup (required)
Each test that creates or modifies promo config must restore the state it changed. Specifically:

1. **After enabling the promo**: If a test enables the popup checkbox and saves, it must either:
   - Disable it again before exiting, OR
   - Ensure the next test that checks "disabled state" starts from a known state

2. **After setting an expiry date**: If a test sets a past expiry date, it must clear the expiry before the test ends (the final `remove expiry` step in test `should not show with expired date` does this, but individual tests must not leave past expiries running).

3. **After deactivating coupon**: Test `should not show when disabled in admin` re-enables the coupon at the end. Test `should not show with inactive coupon` re-activates the coupon after checking it off.

### Global Cleanup (runs once)
- `global-setup.ts` provisions the 5 staff accounts and the test coupon once before all tests.
- Tests must NOT call `deleteMany()` on staff accounts or any shared table (see `test-isolation-strategy.md`).
- Tests that create test-specific promo data should clean it up in `afterEach` or `afterAll`.

## Invalid-Coupon Test Contamination

### Problem
The invalid-coupon test (test `should reject invalid coupon code` at line 149 in `promo-popup.spec.ts`, and test `4` at line 107 in `promo-popup-manual-verification.spec.ts`) has the following contamination pattern:

1. Test enables the promo popup with an **invalid** coupon code (e.g., `INVALIDCODE999` or `FAKECODE123`)
2. Test expects and verifies the **error**: `text=Coupon code "INVALIDCODE999" does not exist` (or `text=does not exist`)
3. **CRITICAL**: After the error, the test **MUST restore the valid coupon code** before saving, otherwise the promo config will have an invalid coupon code stored
4. If the valid code is not restored, subsequent tests that check for popup visibility, customer experience, or coupon validity will fail because the config now references a non-existent coupon

### Evidence of Contamination
- In `promo-popup.spec.ts:149-166`, test `should reject invalid coupon code` has a restoration step (lines 128-132) that clears the invalid code and re-enters the valid `TEST_COUPON.code`, then saves again to restore the valid config.
- In `promo-popup-manual-verification.spec.ts:107-133`, test `4` has a critical restoration step at lines 128-133 that clears and re-fills `TEST_COUPON_CODE`, then saves to restore the valid config for subsequent tests.
- **Without this restoration**, the next test that loads the promo config page will see the invalid coupon code, and API calls `/api/settings/promo-popup` will return config with `couponCode: 'INVALIDCODE999'`, causing downstream tests to fail their coupon existence checks.

### Recommended Fix
Always restore the valid coupon code in an `afterAll` or `afterEach` hook at the describe level, or ensure every test that sets an invalid coupon has a complementary restore step. Consider adding a test-level `await page.click('button:has-text("Save Configuration")')` after the invalid-coupon error to ensure the invalid state is not persisted.

## Timing Sensitivity

### Display Delay
- The promo popup has a configurable `displayDelay` (default: 4000ms in production, 1000ms or 2000ms in test configs).
- Tests that wait for the popup to appear must use `await page.waitForTimeout(TEST_PROMO_CONFIG.displayDelay + buffer)` or `await page.waitForSelector(...)` with appropriate timeouts.
- **Too-short timeouts** will cause false negatives (popup not yet rendered).
- **Too-long timeouts** will slow down the test suite unnecessarily.

### Frequency Suppression
- The promo popup uses `displayFreqHrs` (default: 24h) to suppress re-display within the frequency period.
- Tests that check "should not show again within frequency period" (line 310 in `promo-popup.spec.ts`) navigate to `/shop` and wait `displayDelay + 1000ms` to verify suppression.
- If the navigation or wait is too fast, the cookie/localStorage state may not have been fully persisted, causing the popup to re-appear falsely.

### Recommended Fixes for Timing Sensitivity
1. **Use configured delay + buffer**: Always add a small buffer (500ms) to `TEST_PROMO_CONFIG.displayDelay` when waiting for the popup to appear or dismiss.
2. **Wait for network/idle after state changes**: After clicking Save Configuration, wait for the success message AND wait an additional `displayDelay + 500ms` before proceeding to customer-facing tests, to ensure the server-side config propagates to the browser.
3. **Cookie/localStorage explicit clearance**: Before tests that check "fresh visitor" behavior, explicitly clear both cookies AND the relevant storage keys (`localStorage.removeItem('jl_promo_dismissed')`, `sessionStorage.removeItem('jl_promo_seen')`) to ensure a clean state.
4. **Do not rely on test execution order**: Each promo test should be self-contained and set up its own config state. Tests that depend on prior tests having run and set up config should explicitly set up the config at the start.

## Test Execution Order Independence

Tests should pass in ANY order. Currently, several tests depend on the promo config being already enabled and the test coupon being already created. The `test.describe('Admin Configuration')` group creates the coupon and config, but if tests from other groups run first, they may fail.

### Recommended Approach
1. Move all "Admin Configuration" tests into a single `test.describe` block that sets up the coupon and config at the top.
2. Mark tests that check customer experience as `test.only` or in a separate file that runs after admin config is established.
3. Or, use `test.beforeAll` in each `test.describe` block to ensure the config is set up before any test in that group runs.

## Summary of Action Items

- [ ] Add `afterEach` cleanup in promo popup tests to restore valid coupon code after invalid-coupon tests
- [ ] Ensure all tests that create new browser contexts clear promo-related storage keys
- [ ] Add timing buffers (`displayDelay + 500ms`) to all popup appearance/wait assertions
- [ ] Verify test order independence - run promo tests in reverse order to check for contamination
- [ ] Do NOT redesign the promo UI or backend; only add test hardening observations
- [ ] Do NOT block the overall project on the promo suite if a focused runtime test reveals no real product defect