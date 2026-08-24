# Phase 12 Hardening — Status

**Date:** 2026-08-22
**Context:** Follow-up to `P11-T060-RUNTIME-CLASSIFICATION.md` (defects B1, C1) and the Phase 12 checklist.

---

## ✅ Completed & Runtime-Verified (2026-08-22)

### 1. B1 — Import/export round-trip defect: FIXED
- Export (`app/api/settings/config/export/route.ts`) now normalizes store
  locations so exported payloads ALWAYS contain exactly one default
  (oldest location promoted if DB has none) → every export is restorable.
- Verified live: export → import round-trip returns 200.
  `e2e/settings/import-export.spec.ts` — **11/11 passed**, including
  "should import valid configuration successfully" (:140) and the
  round-trip property test (:222).

### 2. C1 — Store Location single-default concurrency: FIXED
- Partial unique index `StoreLocation_isDefault_key` (WHERE isDefault = true)
  exists in the database and enforces at-most-one-default at the DB level.
- Migration bookkeeping repaired: the migration file
  `20260821190000_single_default_location` existed but was never recorded;
  `prisma migrate deploy` failed with "relation already exists" (the index
  had been created manually). Resolved via
  `npx prisma migrate resolve --applied 20260821190000_single_default_location`.
  `prisma migrate status` now reports "Database schema is up to date!"
- PUT handler (`app/api/settings/locations/[id]/route.ts`) performs the
  default switch inside a transaction and retries on P2002 (3 attempts).
- Verified live: `e2e/settings-locations.spec.ts:1170` concurrency test
  ("simultaneous default-switch requests leave exactly one default") **PASSED**.

### 3. Regression suite fixture fixes
- **Root cause of new cross-suite pollution found & fixed:** the audit-log
  test in `import-export.spec.ts` performed a destructive import (full store
  location replace) that left its fixture ("Store for Audit Test") as the
  permanent default. It now snapshots config before import and restores it after.
- `settings-locations.spec.ts` beforeAll now demotes pre-existing defaults
  before seeding (required by the new unique index), and afterAll guarantees
  the exactly-one-default invariant still holds for remaining data.
- A2 (wholesale spec Prisma relation `items` → `OrderItem`) already applied.
- Post-fix run: import-export + settings-locations = 44 passed / 2 transient
  auth failures on first two tests (dev-server recompile warm-up; NOT
  reproducible — full spec passed 11/11 immediately after).

### DB invariant check
`scripts/verify-default-index.mjs`: index present, DEFAULT_COUNT = 1. ✓

---

## ⏳ Remaining Phase 12 checklist

| Item | Status / Notes |
|---|---|
| Clean regression suite | Partially done; A1 auth fixtures for shell/shell-integration/analytics/smoke specs remain |
| P11-T060 security | Pending |
| P11-T061 sign-off | Pending |
| Real Resend test | Needs real API key + verified sender domain |
| Real OneSignal test | Needs real app id/key + HTTPS domain |
| SEO / Google visibility | Pending |
| Social sharing previews | Pending |
| Favicon / metadata / sitemap / robots | Pending |
| Trust/legal pages | Pending |
| Production/domain verification | Needs domain access |
| Backup/restore verification | Import/export side now proven; full DB backup/restore drill pending |
| Performance review | Pending |
| Accessibility review | Pending |
| Final customer journey test | Pending |
