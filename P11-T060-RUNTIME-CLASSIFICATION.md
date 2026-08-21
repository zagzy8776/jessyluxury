# P11-T060: Sequential Regression Runtime Results & Failure Classification

**Run:** seq-run2 (corrected harness, `workers=1`, chromium, Next dev @ localhost:3000)
**Date:** 2026-08-21
**Duration:** 27.7m
**Results:** 285 total → **267 passed / 17 failed / 1 skipped (94.0% pass executed)**

> Note: An earlier attempt (seq-run.log) was invalidated when the dev server process died
> mid-run (~test 80 onward failed with connection-refused). Environment/tooling issue,
> not application. Run restarted clean after re-provisioning the server detached.

---

## Failure Classification (every failure inspected against actual error output)

### A. Test-fixture problem — 15 failures

**A1. Missing authenticated browser session (14 tests)**
- `e2e/settings/shell-integration.spec.ts` — 5 failures (:6, :19, :33, :48, :62)
- `e2e/settings/shell.spec.ts` — 7 failures (:6, :14, :24, :83, :115, :131, :151)
- `e2e/analytics.spec.ts:107` — POS create-order flow
- `e2e/smoke.spec.ts:116` — POS checkout flow

**Actual errors inspected:**
- Shell tests: `expect(locator('h1')).toContainText('Settings')` received
  **"Discover Your Signature Scent"** (storefront homepage).
- Analytics/smoke: `waitForSelector('input[placeholder="Search catalog to add..."]')`
  timeout 60s on `/store-portal-jl/dashboard/orders/create`.

**Verified root cause (runtime evidence):**
- `GET /admin/settings` unauthenticated → **307 redirect to `/`** (verified via curl).
- `GET /store-portal-jl/dashboard/orders/create` unauthenticated → **307 redirect to
  `/store-portal-jl`** (login gate) (verified via curl).
- The search input **does exist** in the POS page source — the page simply never renders
  for an unauthenticated browser context.
- None of these specs establish a staff cookie (`jl_staff_token`) in the browser context.
- The redirect behavior itself is CORRECT admin-only security (Req: P11-T054). The four
  shell tests that "pass" do so vacuously via `.catch(() => false)` soft-assert patterns.

**Classification: test-fixture problem. NOT an application regression.**

**A2. Wrong Prisma relation name (1 test)**
- `e2e/wholesale.spec.ts:186` — "should handle mixed carts and preserve historical prices"

**Actual error:** `PrismaClientValidationError: Unknown field 'items' for include statement
on model 'Order'. Available options: ... OrderItem?: true ...`
(`prisma.order.findUnique({ include: { items: true } })` at wholesale.spec.ts:223)

**Classification: test-fixture problem** — spec uses nonexistent relation name;
model relation is `OrderItem`.

### B. Genuine application defect — 1 failure

**B1. `e2e/settings/import-export.spec.ts:140` — "should import valid configuration successfully"**

**Actual error:** `Expected: 200, Received: 400`

**Reproduced live outside Playwright:** export (200) → immediate import of the identical
payload → `400 {"error":"Validation failed","details":["Exactly one location must be
marked as default"]}`.

**Root cause:** The export endpoint dumps raw `StoreLocation` rows and does not guarantee
exactly-one-default in its payload, while the import validator hard-requires exactly one
default. The export→import round-trip (Req 29-30 backup/restore) is therefore broken
whenever current DB state has ≠1 defaults. Matches the known limitation already recorded
in `.kiro/specs/phase-11-settings-configuration/EXECUTION_REPORT.md`
("Refine import transaction handling to support full configuration restore").

**Classification: genuine application defect (documented limitation). UI frozen — fix
belongs to Phase 12 hardening (API/import logic only, no settings controls).**

### C. Concurrency issue — 1 failure

**C1. `e2e/settings-locations.spec.ts:1170` — "35. Concurrency - simultaneous default-switch requests leave exactly one default"**

**Actual error:** `Expected: 1, Received: 2` — after two simultaneous API
`PUT /api/settings/locations/:id { isDefault: true }` requests (both returned 200),
two locations have `isDefault: true`.

**Analysis:** The test correctly exercises the public API (not direct DB writes). Two
concurrent default-switch transactions interleave (unset-all → unset-all → set-A → set-B),
leaving two defaults. `design.md` specifies mitigation via partial unique index
(`CREATE UNIQUE INDEX idx_unique_default ON StoreLocation (isDefault) WHERE isDefault = true`)
which is **not present** in the schema.

**Classification: concurrency issue — genuine application-level race. Phase 12 hardening item.**

### D. Environment/tooling issue — 0 failures in validated run

(1 invalidated run caused by dev-server process death — re-provisioned, see note above.)

---

## Disposition for Phase 11 gate
- No failure evidences a regression in Phase 11 settings functionality itself:
  all 12 shell failures are missing-auth fixtures; RBAC/auth/security/payment/system-defaults/
  business-profile/locations CRUD suites are green.
- Two real engineering items carried forward to Phase 12 hardening:
  1. Import/export round-trip invariant mismatch (B1)
  2. Default-switch atomicity across concurrent requests (C1)
