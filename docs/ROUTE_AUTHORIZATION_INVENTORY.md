# Route Authorization Inventory - P11-T021

**Last Updated:** $(date)
**Task:** P11-T021 - Add Permission Enforcement to Protected Resources
**Requirements Validated:** 6, 26

## Overview

This document provides a comprehensive inventory of all protected API routes and their permission requirements. All protected routes enforce permission checks using `requireStaffAuth(request, permission)` from `lib/staff-auth.ts`.

**Permission Model:**
- orders, products, customers, analytics, settings, catalog, fulfillment

**Role → Permission Mapping:**
- Owner: All (implicit)
- Manager: orders, products, customers, analytics (typically)
- Fulfillment: orders, fulfillment
- Catalog: products, catalog

---

## Protected Routes by Domain

### 1. Orders Routes

| Endpoint | Method | Required Permission | Handler | Auth Status | Notes |
|----------|--------|---------------------|---------|-------------|-------|
| /api/orders | GET | orders | requireStaffAuth(request, 'orders') | ✅ Protected | Fetch all orders |
| /api/orders | POST | orders | requireStaffAuth(request, 'orders') | ✅ Protected | Create new order |
| /api/orders/[id] | GET | orders | requireStaffAuth(request, 'orders') | ✅ Protected | Get order details |
| /api/orders/[id] | PUT | orders | requireStaffAuth(request, 'orders') | ✅ Protected | Update order status/payment |
| /api/orders/track/[token] | GET | (none) | PUBLIC | ✅ Correct | Public order tracking |
| /api/orders/track/search | POST | (none) | PUBLIC | ✅ Correct | Public order search |

### 2. Products Routes

| Endpoint | Method | Required Permission | Handler | Auth Status | Notes |
|----------|--------|---------------------|---------|-------------|-------|
| /api/products | GET | (none) | PUBLIC | ✅ Correct | Storefront product listing |
| /api/products | POST | products | requireStaffAuth(request, 'products') | ✅ Protected | Create new product |
| /api/products/[id] | GET | (none) | PUBLIC | ✅ Correct | Storefront product detail |
| /api/products/[id] | PUT | products | requireStaffAuth(request, 'products') | ✅ Protected | Update product |
| /api/products/[id] | DELETE | products | requireStaffAuth(request, 'products') | ✅ Protected | Delete product |

### 3. Customers Routes

| Endpoint | Method | Required Permission | Handler | Auth Status | Notes |
|----------|--------|---------------------|---------|-------------|-------|
| /api/customers | GET | customers | requireStaffAuth(request, 'customers') | ✅ Protected | List all customers |
| /api/customers/[id] | PUT | customers | requireStaffAuth(request, 'customers') | ✅ Protected | Update customer profile |
| /api/customer-auth/login | POST | (none) | PUBLIC | ✅ Correct | Customer self-login |
| /api/customer-auth/logout | POST | (none) | PUBLIC | ✅ Correct | Customer self-logout |
| /api/customer-auth/me | GET | (none) | PUBLIC | ✅ Correct | Current customer info |

### 4. Analytics Routes

| Endpoint | Method | Required Permission | Handler | Auth Status | Notes |
|----------|--------|---------------------|---------|-------------|-------|
| /api/analytics | GET | analytics | requireStaffAuth(request, 'analytics') | ✅ Protected | Fetch analytics data |

### 5. Settings Routes

| Endpoint | Method | Required Permission | Handler | Auth Status | Notes |
|----------|--------|---------------------|---------|-------------|-------|
| /api/settings/business-profile | GET | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Get business profile |
| /api/settings/business-profile | PUT | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Update business profile |
| /api/settings/locations | GET | settings | requireStaffAuth(request, 'settings') | ✅ Protected | List store locations |
| /api/settings/locations | POST | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Create store location |
| /api/settings/locations/[id] | GET | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Get location details |
| /api/settings/locations/[id] | PUT | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Update location |
| /api/settings/locations/[id] | DELETE | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Delete location |
| /api/settings/staff-accounts | GET | settings | requireStaffAuth(request, 'settings') | ✅ Protected | List staff accounts |
| /api/settings/staff-accounts | POST | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Create staff account |
| /api/settings/staff-accounts/[id] | GET | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Get staff account |
| /api/settings/staff-accounts/[id] | PUT | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Update staff account |
| /api/settings/staff-accounts/[id] | DELETE | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Delete staff account |

### 6. Shipping Routes

| Endpoint | Method | Required Permission | Handler | Auth Status | Notes |
|----------|--------|---------------------|---------|-------------|-------|
| /api/shipping | GET | (none) | PUBLIC | ✅ Correct | List shipping zones (for checkout) |
| /api/shipping | POST | fulfillment | requireStaffAuth(request, 'fulfillment') | ✅ Protected | Create shipping zone |
| /api/shipping/[id] | PUT | fulfillment | requireStaffAuth(request, 'fulfillment') | ✅ Protected | Update shipping zone |
| /api/shipping/[id] | DELETE | fulfillment | requireStaffAuth(request, 'fulfillment') | ✅ Protected | Delete shipping zone |

### 7. Additional Routes (Not in Approved Model)

**Note:** The following routes use permissions not in the approved P11-T021 model. They have existing permission enforcement but may need review:

| Endpoint | Method | Required Permission | Handler | Auth Status | Notes |
|----------|--------|---------------------|---------|-------------|-------|
| /api/coupons | GET | marketing | requireStaffAuth(request, 'marketing') | ✅ Protected | 'marketing' not in approved model |
| /api/coupons | POST | marketing | requireStaffAuth(request, 'marketing') | ✅ Protected | 'marketing' not in approved model |
| /api/coupons/[id] | GET | marketing | requireStaffAuth(request, 'marketing') | ✅ Protected | 'marketing' not in approved model |
| /api/coupons/[id] | PUT | marketing | requireStaffAuth(request, 'marketing') | ✅ Protected | 'marketing' not in approved model |
| /api/coupons/[id] | DELETE | marketing | requireStaffAuth(request, 'marketing') | ✅ Protected | 'marketing' not in approved model |
| /api/customer-groups | GET | customers | requireStaffAuth(request, 'customers') | ✅ Protected | Uses 'customers' permission |
| /api/customer-groups | POST | customers | requireStaffAuth(request, 'customers') | ✅ Protected | Uses 'customers' permission |
| /api/customer-groups/[id] | GET | customers | requireStaffAuth(request, 'customers') | ✅ Protected | Uses 'customers' permission |
| /api/customer-groups/[id] | PUT | customers | requireStaffAuth(request, 'customers') | ✅ Protected | Uses 'customers' permission |
| /api/store-locations | GET | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Duplicate of /api/settings/locations |
| /api/store-locations | POST | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Duplicate of /api/settings/locations |
| /api/store-announcements | GET | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Uses 'settings' permission |
| /api/store-announcements | POST | settings | requireStaffAuth(request, 'settings') | ✅ Protected | Uses 'settings' permission |
| /api/upload | POST | requireStaffAuthOr: ['products', 'catalog', 'settings', 'marketing'] | Multi-permission | ✅ Protected | File upload with OR logic |

---

## Authorization Validation

### Staff Permission Check Flow

1. **Request arrives at protected route** (e.g., POST /api/orders)
2. **requireStaffAuth middleware called** with required permission:
   ```typescript
   const authErr = await requireStaffAuth(request, 'orders')
   if (authErr) return authErr
   ```
3. **Middleware validates**:
   - Token exists and is valid
   - Session version matches system version
   - Staff account exists
   - Staff account is ACTIVE
   - Staff role is checked:
     - Owner role: implicit access to ALL permissions
     - Other roles: check if requiredPermission exists in staff.permissions array
4. **Response**:
   - ✅ Success: Continue to handler (returns null)
   - ❌ 401 Unauthorized: Missing/invalid token, expired session, inactive staff
   - ❌ 403 Forbidden: Permission missing

### Owner Role Privileges

Owner role grants implicit access to all protected resources without requiring specific permissions:

```typescript
// From lib/staff-auth.ts
if (staff.role === 'Owner') {
  return null  // Owner has implicit access to everything
}
```

---

## Inactive Staff Account Handling

Inactive staff accounts cannot authenticate to any protected resource:

```typescript
if (!staff.active) {
  return NextResponse.json(
    { error: 'Account is inactive' },
    { status: 403 }
  )
}
```

**Test Case**: Inactive staff attempting to access any protected route will receive:
- Status: 403 Forbidden
- Message: "Account is inactive"

---

## Session Version Validation

All staff authentication includes session version validation to support global session invalidation:

```typescript
// Extract session version from token
const tokenSessionVersion = // ... extracted from token
const config = await prisma.systemConfig.findUnique({ where: { id: 1 } })

// Reject if session version mismatch
if (tokenSessionVersion !== config.sessionVersion) {
  return NextResponse.json(
    { error: 'Unauthorized: Session expired' },
    { status: 401 }
  )
}
```

**Scenario**: When admin password is changed, sessionVersion is incremented, invalidating all existing staff tokens.

---

## Public Routes (No Authentication Required)

The following routes are correctly configured as PUBLIC and require NO authentication:

| Endpoint | Purpose | Rationale |
|----------|---------|-----------|
| GET /api/products | Storefront product listing | Customers need to browse |
| GET /api/products/[id] | Storefront product detail | Customers need product info |
| GET /api/shipping | Checkout shipping options | Customers need shipping zones |
| GET /api/orders/track/[token] | Public order tracking | Customers track their orders |
| POST /api/orders/track/search | Public order search | Customers search orders |
| POST /api/customer-auth/login | Customer self-login | Customers authenticate themselves |
| POST /api/customer-auth/logout | Customer self-logout | Customers end sessions |
| GET /api/customer-auth/me | Customer profile | Authenticated customers only |
| GET /api/store-announcements/active | Active announcements | Public storefront announcements |
| POST /api/reviews | Product reviews | Customers submit reviews |
| POST /api/push-subscriptions | Push notifications | Customers opt-in |

---

## Test Coverage

See `e2e/settings/authorization.spec.ts` for comprehensive authorization tests covering:

1. **Owner full access** (5 tests)
   - Owner can access orders
   - Owner can access products
   - Owner can access customers
   - Owner can access analytics
   - Owner can access settings

2. **Manager permissions** (5 tests)
   - Manager (orders perm) can access orders
   - Manager (products perm) can access products
   - Manager (customers perm) can access customers
   - Manager (analytics perm) can access analytics
   - Manager (no settings) cannot access settings

3. **Fulfillment permissions** (4 tests)
   - Fulfillment (orders perm) can access orders
   - Fulfillment (fulfillment perm) can create shipping zones
   - Fulfillment (no products) cannot access products
   - Fulfillment (no customers) cannot access customers

4. **Catalog permissions** (4 tests)
   - Catalog (products perm) can access products
   - Catalog (catalog perm) supported for future expansion
   - Catalog (no orders) cannot access orders
   - Catalog (no customers) cannot access customers

5. **Inactive staff** (3 tests)
   - Inactive staff cannot authenticate
   - Inactive staff rejected on protected resources
   - Inactive staff returns proper error

6. **Permission enforcement** (5 tests)
   - Manager permissions properly scoped
   - Fulfillment permissions properly scoped
   - Catalog permissions properly scoped
   - Multiple action validation
   - Cross-permission boundaries enforced

7. **Public routes** (3 tests)
   - Order tracking is public
   - Product storefront is public
   - Shipping zones list is public

---

## Compliance Summary

✅ **All protected routes require staff authentication**
✅ **All routes enforce specific permissions OR Owner role**
✅ **Public routes remain public (no auth gates)**
✅ **Inactive staff accounts cannot authenticate**
✅ **Session version invalidation works correctly**
✅ **Error responses are appropriate (401/403)**
✅ **Owner role has implicit access to all resources**

---

## Notes for Future Implementation

1. **Marketing Permission**: Several routes (coupons, campaigns) use 'marketing' permission which is not in P11-T021 approved model. Consider adding this as a future permission.

2. **OR Logic Routes**: Some routes (like /api/upload) use `requireStaffAuthOr` to accept multiple permissions. This is working correctly.

3. **Duplicate Endpoints**: /api/store-locations is a duplicate of /api/settings/locations. Both are protected identically. Consider consolidating in future refactor.

4. **Permission Model Extension**: To add new permissions in future:
   - Add to StaffAccount.permissions array in Prisma schema
   - Add permission-specific routes calling `requireStaffAuth(request, 'newPermission')`
   - Update role default permissions
   - Add test cases to authorization.spec.ts

---

## Implementation Status

- P11-T021 Status: **COMPLETE**
- All protected routes: **✅ Permission enforcement added**
- Authorization tests: **✅ Comprehensive suite created**
- TypeScript errors: **✅ Baseline maintained**
- Phase 1-10 E2E tests: **✅ Still passing**
