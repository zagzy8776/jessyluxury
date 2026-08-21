# P11-T061: Test Infrastructure Fixes - Completion Report

**Status:** ✅ COMPLETE
**Based on:** P11-T060 Failure Classification

---

## Fixes Applied

### Fix 1: Wrong `baseURL` in `playwright.config.ts` ⭐ HIGHEST IMPACT

**Root Cause:** `baseURL` was set to `http://localhost:3001` but `next dev` runs on port 3000.

**Impact:** ALL UI/browser tests (shell.spec.ts, shell-integration.spec.ts, analytics.spec.ts, smoke.spec.ts) were navigating to the wrong port, causing 15-16s timeouts waiting for a server that wasn't there.

**Fix:** Changed `baseURL` from `http://localhost:3001` to `http://localhost:3000` in `playwright.config.ts`.

---

### Fix 2: `security.spec.ts` — Owner password not reset between tests

**Root Cause:** Tests P11-T045-01 through P11-T045-10 each change the owner's password but never restore it. Each subsequent test calls `getStaffToken(owner.email, owner.password)` with the original password, which fails after the first test changes it.

**Impact:** 12/12 security tests failing with cascading auth failures (404 on login).

**Fix:** Added password reset in `beforeEach` to restore `owner@jessy.test` to its known password before each test:
```typescript
await prisma.staffAccount.update({
  where: { email: testUsers.owner.email },
  data: { passwordHash: hashPassword(testUsers.owner.password) }
})
```

---

### Fix 3: `security.spec.ts` — Wrong API port

**Root Cause:** `API_BASE` was hardcoded to `http://localhost:3001/api`.

**Fix:** Changed to `http://localhost:3000/api`.

---

### Fix 4: `shell.spec.ts` and `shell-integration.spec.ts` — Hardcoded wrong port

**Root Cause:** Both files imported `load-env` and used `process.env.BASE_URL || 'http://localhost:3000'` — but since `BASE_URL` is not set in `.env`, they defaulted to 3000. However, they were also fighting with the Playwright `baseURL` config (which was 3001). Now that `baseURL` is fixed to 3000, these files have been updated to use relative paths (`/admin/settings`) so they correctly use the Playwright `baseURL`.

---

## Files Modified

| File | Change |
|------|--------|
| `playwright.config.ts` | `baseURL` 3001 → 3000 |
| `e2e/settings/security.spec.ts` | Added password reset in `beforeEach`; fixed `API_BASE` port |
| `e2e/settings/shell.spec.ts` | Removed `load-env` import + `BASE_URL` const; use relative paths |
| `e2e/settings/shell-integration.spec.ts` | Removed `load-env` import + `BASE_URL` const; use relative paths |

---

## Expected Impact on Test Results

| Category | Before | After |
|----------|--------|-------|
| UI/Navigation timeouts (40+ tests) | ❌ Timeout 15-16s | ✅ Should resolve — correct port |
| Security tests (12 tests) | ❌ All failing | ✅ Should resolve — password reset |
| Auth-dependent tests (80 skipped) | ⏭️ Skipped | ✅ Already fixed by global-setup.ts |

---

## Remaining Known Issues (Not Fixed Here)

1. **Parallel deadlock** — database connection pool exhaustion after ~3.5 hours. Requires connection pool tuning or per-worker DB isolation. Low priority since `workers: 1` is set in config.
2. **Async handle cleanup** — `UV_HANDLE_CLOSING` errors from Prisma connections not closed. The `global-setup.ts` already calls `prisma.$disconnect()`. Individual spec files that import `prisma` directly may need `afterAll(() => prisma.$disconnect())`.

---

## Next Steps

Run the sequential test suite to validate fixes:
```bash
npx playwright test e2e/
```

Expected improvement: from 2.17% → 70%+ pass rate.
