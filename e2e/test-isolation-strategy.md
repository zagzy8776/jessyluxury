# E2E Test Isolation Strategy

## Problem

Tests are failing due to shared database state:
1. `security.spec.ts` calls `deleteMany()` and wipes out ALL staff accounts
2. Other tests expect staff accounts to exist (from global setup)
3. Tests create records that might collide with other tests

## Solution: Deterministic Fixtures + Namespace Isolation

### Rule 1: Never Delete Global Test Accounts

**Global test accounts** (provisioned by `e2e/global-setup.ts`):
- `owner@jessy.test`
- `manager@jessy.test`
- `fulfillment@jessy.test`
- `catalog@jessy.test`
- `inactive@jessy.test`

**NEVER**:
- `await prisma.staffAccount.deleteMany()`  ❌
- `await prisma.staffAccount.delete({ where: { email: 'owner@jessy.test' } })`  ❌

**ALLOWED**:
- Creating test-specific staff with unique emails (e.g., `test-specific-user-${Date.now()}@jessy.test`)
- Deleting test-specific staff you created
- Modifying global account passwords (they get reset by global setup on next run)

### Rule 2: Use Unique Identifiers for Test Data

All test data should use unique identifiers to prevent collisions:

```typescript
// ❌ BAD: Can collide with other tests
const customer = await prisma.customer.create({
  data: {
    name: 'Test Customer',
    phone: '1234567890',
    email: 'test@example.com'
  }
})

// ✅ GOOD: Unique namespace per test
const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
const customer = await prisma.customer.create({
  data: {
    name: `Test Customer ${testId}`,
    phone: `555${testId.substr(-7)}`, // Unique phone
    email: `customer-${testId}@test.jessy.test`,
    whatsapp: `555${testId.substr(-7)}`
  }
})
```

### Rule 3: Clean Up Your Own Data

Each test should clean up the data IT created:

```typescript
test('My test', async () => {
  const testId = `test-${Date.now()}`
  let createdCustomerId: number | null = null
  let createdOrderId: number | null = null
  
  try {
    // Create test data
    const customer = await prisma.customer.create({
      data: { name: `Customer ${testId}`, ... }
    })
    createdCustomerId = customer.id
    
    // Test logic...
    
  } finally {
    // Clean up (order matters due to foreign keys)
    if (createdOrderId) {
      await prisma.orderItem.deleteMany({ where: { orderId: createdOrderId } })
      await prisma.order.delete({ where: { id: createdOrderId } })
    }
    if (createdCustomerId) {
      await prisma.customer.delete({ where: { id: createdCustomerId } })
    }
  }
})
```

### Rule 4: Shared Settings Are Acceptable

Some tables are singletons or shared state (e.g., `SystemConfig`, `SystemDefaults`, `BusinessProfile`). Tests can:
- Read shared settings
- Temporarily modify them
- **DO NOT** need to clean them up (they reset between full test runs)

This is acceptable because:
1. Global setup establishes baseline
2. Tests that modify settings should verify current state first
3. Settings don't cause unique constraint violations

### Rule 5: Use afterEach for Cleanup, Not beforeEach

```typescript
// ❌ BAD: beforeEach can fail if previous test didn't clean up
test.beforeEach(async () => {
  await prisma.staffAccount.deleteMany() // Dangerous!
  await createTestAccounts()
})

// ✅ GOOD: Rely on global setup + clean up after yourself
test.afterEach(async () => {
  if (testCustomerId) {
    await prisma.customer.delete({ where: { id: testCustomerId } })
  }
})
```

### Rule 6: Test Execution Order Independence

Tests should pass in ANY order:

```typescript
// Test A should not depend on Test B having run first
// Test B should not depend on Test A having cleaned up

// ✅ Each test is self-contained
test('Test A', async () => {
  const testDataA = await createUniqueTestData('A')
  // ... test logic ...
  await cleanupTestData(testDataA)
})

test('Test B', async () => {
  const testDataB = await createUniqueTestData('B')
  // ... test logic ...
  await cleanupTestData(testDataB)
})
```

## Implementation Plan

### Phase 1: Fix Critical Blocker (security.spec.ts)
1. Remove `await prisma.staffAccount.deleteMany()`
2. Use global test accounts from `TEST_ACCOUNTS`
3. Add test-specific cleanup only for accounts created in that test

### Phase 2: Audit All Tests
1. Review each `deleteMany()` call
2. Verify it only deletes test-specific data
3. Add unique identifiers where missing

### Phase 3: Create Helper Utilities
```typescript
// e2e/test-helpers.ts
export function generateTestId(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export async function createTestCustomer(testId: string) {
  return prisma.customer.create({
    data: {
      name: `Test Customer ${testId}`,
      email: `customer-${testId}@test.jessy.test`,
      phone: `555${testId.substr(-10)}`,
      whatsapp: `555${testId.substr(-10)}`
    }
  })
}

// ... more helpers
```

### Phase 4: Create Isolation Smoke Test
Verify two tests can run in either order without interfering.

## Success Criteria

- ✅ No test calls `deleteMany()` on staff accounts
- ✅ All test data uses unique identifiers
- ✅ Tests clean up their own data
- ✅ Tests pass in any execution order
- ✅ No "Unique constraint failed" errors
- ✅ No "Failed to authenticate" errors (except expected negative tests)
