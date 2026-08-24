# Security Hardening Recommendations
## Jessy Luxury E-Commerce Platform

**Priority:** 🟡 MEDIUM (No critical vulnerabilities found)  
**Timeline:** Implement within 1-2 weeks  
**Risk Level:** LOW (Preventative hardening, not urgent fixes)

---

## Summary

After comprehensive audit, **no critical authorization vulnerabilities** were found. The following recommendations are **preventative hardening measures** to eliminate potential security weaknesses.

---

## 1. Remove Hardcoded Secret Fallbacks

### Current Issue

**File:** `lib/auth-crypto.ts`

```typescript
export async function generateCustomerToken(customerId: number): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET || 'jessyluxurycustomersecret2026'  // ⚠️ Fallback
  // ...
}

export async function verifyCustomerToken(token: string): Promise<{ isValid: boolean; customerId?: number }> {
  const secret = process.env.ADMIN_SESSION_SECRET || 'jessyluxurycustomersecret2026'  // ⚠️ Fallback
  // ...
}
```

### Risk

If `ADMIN_SESSION_SECRET` is not set (misconfiguration), tokens are generated using a **predictable default secret**. An attacker knowing the source code could forge customer session tokens.

### Fix

**Remove fallback defaults and fail fast:**

```typescript
function getConfiguredCustomerSecret(): string | null {
  return process.env.CUSTOMER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || null
}

export async function generateCustomerToken(customerId: number): Promise<string> {
  const secret = getConfiguredCustomerSecret()
  
  if (!secret) {
    throw new Error('CUSTOMER_SESSION_SECRET or ADMIN_SESSION_SECRET is missing. Customer authentication is unavailable.')
  }
  
  const expiresAt = Date.now() + 1000 * 60 * 60 * 24 * 30 // 30 days
  const payload = `${expiresAt}.${customerId}`
  const key = await getHmacKey(secret)
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, ENCODER.encode(payload))
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${payload}.${signature}`
}

export async function verifyCustomerToken(token: string): Promise<{ isValid: boolean; customerId?: number }> {
  const secret = getConfiguredCustomerSecret()
  
  if (!token || !secret) return { isValid: false }
  
  // ... rest of verification logic
}
```

### Testing

```bash
# Verify that missing secret causes startup failure:
unset ADMIN_SESSION_SECRET
npm run build  # Should fail with clear error message
```

---

## 2. Add Rate Limiting to Coupon Validation

### Current Issue

**File:** `app/api/coupons/validate/route.ts`

Attackers could brute-force coupon codes:
```bash
# Enumerate common coupon patterns:
for code in SAVE10 SAVE20 WELCOME NEWYEAR2026 BLACKFRIDAY; do
  curl -X POST /api/coupons/validate -d "{\"code\":\"$code\"}"
done
```

No rate limiting prevents rapid enumeration.

### Fix

**Add IP-based rate limiting (similar to tracking endpoint):**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCompletedOrder } from '@/lib/analytics/domain'
import { couponAudienceError, getActiveWholesaleGroupId } from '@/lib/wholesale/pricing'

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function isRateLimited(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return false
  }
  
  userLimit.count++
  if (userLimit.count > limit) {
    return true
  }
  return false
}

export async function POST(request: Request) {
  // Rate limit: 10 requests per minute per IP
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  if (isRateLimited(ip, 10, 60000)) {
    return NextResponse.json(
      { error: 'Too many validation attempts. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { code, customerId, subtotal, items } = body

    // ... rest of existing validation logic
  } catch (error: any) {
    console.error('Coupon validation error:', error)
    return NextResponse.json({ error: error.message || 'Validation failed' }, { status: 500 })
  }
}
```

### Testing

```typescript
// e2e/coupons-rate-limit.spec.ts
test('Coupon validation rate limits excessive requests', async () => {
  // Make 11 requests (limit is 10/minute)
  const requests = Array(11).fill(null).map(() =>
    fetch('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({
        code: 'TESTCODE',
        subtotal: 10000,
        items: []
      })
    })
  )
  
  const responses = await Promise.all(requests)
  
  // 11th request should be rate limited
  expect(responses[10].status).toBe(429)
  expect(await responses[10].json()).toMatchObject({
    error: expect.stringContaining('Too many')
  })
})
```

---

## 3. Make Worker Secret Mandatory

### Current Issue

**File:** `app/api/notifications/worker/route.ts`

```typescript
function isAuthorized(request: Request): boolean {
  const incoming = request.headers.get('x-worker-secret') || ''
  const secret = process.env.WORKER_SECRET || 'secret'  // ⚠️ Weak default
  
  if (!secret) return false
  
  return timingSafeEqual(
    Buffer.from(incoming),
    Buffer.from(secret)
  )
}
```

If `WORKER_SECRET` is not configured, defaults to `'secret'` — easily guessable.

### Fix

**Fail fast if secret is missing:**

```typescript
export async function POST(request: Request) {
  // Fail fast if WORKER_SECRET is not configured
  if (!process.env.WORKER_SECRET) {
    console.error('[WORKER] WORKER_SECRET environment variable is not set')
    return NextResponse.json(
      { error: 'Worker authentication is not configured' },
      { status: 503 }
    )
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ... rest of worker logic
}

function isAuthorized(request: Request): boolean {
  const incoming = request.headers.get('x-worker-secret') || ''
  const secret = process.env.WORKER_SECRET
  
  if (!secret || !incoming) return false
  
  // Prevent timing attacks with constant-time comparison
  try {
    return timingSafeEqual(
      Buffer.from(incoming),
      Buffer.from(secret)
    )
  } catch {
    return false
  }
}
```

### Environment Variable Documentation

**Add to `.env.example`:**

```bash
# Worker authentication (required for background notification processing)
# Generate a secure random secret:
#   Linux/Mac: openssl rand -hex 32
#   PowerShell: [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
WORKER_SECRET="your-secure-random-secret-here"
```

---

## 4. Add Environment Variable Validation Startup Check

### Implementation

**Create:** `lib/env-validation.ts`

```typescript
/**
 * Environment Variable Validation
 * Run at application startup to ensure all required secrets are configured
 */

export function validateRequiredEnvVars() {
  const required = [
    'DATABASE_URL',
    'ADMIN_SESSION_SECRET',
    'WORKER_SECRET',
  ]

  const missing: string[] = []

  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }

  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:')
    missing.forEach(v => console.error(`   - ${v}`))
    console.error('\nApplication cannot start securely. Please configure these variables.')
    process.exit(1)
  }

  // Validate minimum lengths for secrets
  const secrets = ['ADMIN_SESSION_SECRET', 'WORKER_SECRET']
  for (const secret of secrets) {
    const value = process.env[secret]
    if (value && value.length < 32) {
      console.warn(`⚠️  WARNING: ${secret} is too short (minimum 32 characters recommended)`)
    }
  }

  console.log('✅ Environment variables validated successfully')
}
```

**Add to:** `app/layout.tsx` (or top-level entry point)

```typescript
import { validateRequiredEnvVars } from '@/lib/env-validation'

// Validate environment on server startup
if (typeof window === 'undefined') {
  validateRequiredEnvVars()
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

---

## 5. Add Comprehensive Authorization Tests

### Test Coverage Gaps

Currently missing E2E tests for:
- Customer A accessing Customer B's orders (IDOR)
- Customer A accessing Customer B's notifications (IDOR)
- Inactive staff attempting API access
- Staff self-privilege escalation
- Coupon validation rate limiting

### Implementation

**Create:** `e2e/authorization-security.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const API_BASE = process.env.API_BASE || 'http://localhost:3000'

test.describe('Authorization Security Tests', () => {
  let customerA: any
  let customerB: any
  let orderA: any
  let orderB: any

  test.beforeAll(async () => {
    // Create two test customers
    customerA = await prisma.customer.create({
      data: {
        name: 'Customer A',
        phone: '+2348000000001',
        whatsapp: '+2348000000001',
        updatedAt: new Date(),
      },
    })

    customerB = await prisma.customer.create({
      data: {
        name: 'Customer B',
        phone: '+2348000000002',
        whatsapp: '+2348000000002',
        updatedAt: new Date(),
      },
    })

    // Create orders for each customer
    orderA = await prisma.order.create({
      data: {
        orderNumber: 'TEST-A-001',
        customerId: customerA.id,
        customerName: customerA.name,
        customerPhone: customerA.phone,
        customerWhatsapp: customerA.whatsapp,
        subtotal: 10000,
        total: 10000,
        paymentStatus: 'PAID',
        status: 'PENDING',
        trackingToken: 'token_a_' + Math.random().toString(36).substring(7),
        updatedAt: new Date(),
      },
    })

    orderB = await prisma.order.create({
      data: {
        orderNumber: 'TEST-B-001',
        customerId: customerB.id,
        customerName: customerB.name,
        customerPhone: customerB.phone,
        customerWhatsapp: customerB.whatsapp,
        subtotal: 15000,
        total: 15000,
        paymentStatus: 'PAID',
        status: 'PENDING',
        trackingToken: 'token_b_' + Math.random().toString(36).substring(7),
        updatedAt: new Date(),
      },
    })
  })

  test.afterAll(async () => {
    // Cleanup
    await prisma.order.deleteMany({ where: { customerId: { in: [customerA.id, customerB.id] } } })
    await prisma.customer.deleteMany({ where: { id: { in: [customerA.id, customerB.id] } } })
    await prisma.$disconnect()
  })

  test('Customer A cannot access Customer B notifications (IDOR prevention)', async () => {
    // Create notification for Customer B
    const notificationB = await prisma.notification.create({
      data: {
        type: 'ORDER_SHIPPED',
        title: 'Your order has shipped',
        message: 'Order #TEST-B-001 is on its way',
        recipientType: 'CUSTOMER',
        recipientId: customerB.id,
      },
    })

    // Authenticate as Customer A
    const loginResponse = await fetch(`${API_BASE}/api/customer-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: customerA.phone, name: customerA.name }),
    })
    const loginData = await loginResponse.json()
    expect(loginData.success).toBe(true)

    // Extract cookie
    const cookies = loginResponse.headers.getSetCookie()
    const customerACookie = cookies.find(c => c.startsWith('jl_customer_token='))

    // Attempt to fetch notifications as Customer A
    const notificationsResponse = await fetch(`${API_BASE}/api/notifications`, {
      headers: { Cookie: customerACookie || '' },
    })
    const notifications = await notificationsResponse.json()

    // Should NOT contain Customer B's notification
    expect(notifications.every((n: any) => n.recipientId !== customerB.id)).toBe(true)
    expect(notifications.find((n: any) => n.id === notificationB.id)).toBeUndefined()

    // Cleanup
    await prisma.notification.delete({ where: { id: notificationB.id } })
  })

  test('Inactive staff account cannot access orders', async () => {
    // Create inactive staff account
    const inactiveStaff = await prisma.staffAccount.create({
      data: {
        name: 'Inactive Staff',
        email: 'inactive@test.jessy.com',
        role: 'Manager',
        permissions: ['orders'],
        active: false,  // ⚠️ Inactive
        passwordHash: '$scrypt$16384$8$1$abc123$def456',
        updatedAt: new Date(),
      },
    })

    // Attempt to authenticate (should fail)
    const loginResponse = await fetch(`${API_BASE}/api/admin-auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inactiveStaff.email,
        password: 'test123',
      }),
    })

    expect(loginResponse.status).toBe(403)
    const loginData = await loginResponse.json()
    expect(loginData.error).toContain('inactive')

    // Cleanup
    await prisma.staffAccount.delete({ where: { id: inactiveStaff.id } })
  })

  test('Staff cannot escalate own permissions', async () => {
    // This test requires actual staff authentication flow
    // Placeholder for implementation
    expect(true).toBe(true)
  })

  test('Coupon validation is rate limited', async () => {
    const requests = Array(12).fill(null).map(() =>
      fetch(`${API_BASE}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: 'TESTCODE',
          subtotal: 5000,
          items: [],
        }),
      })
    )

    const responses = await Promise.all(requests)

    // After 10 requests, should start rate limiting
    const rateLimitedResponses = responses.filter(r => r.status === 429)
    expect(rateLimitedResponses.length).toBeGreaterThan(0)
  })
})
```

---

## 6. Add Security Monitoring and Alerting

### Audit Log Monitoring

**Create:** `scripts/monitor-security-events.mjs`

```javascript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function monitorSecurityEvents() {
  const oneDayAgo = new Date()
  oneDayAgo.setDate(oneDayAgo.getDate() - 1)

  // Check for suspicious patterns in last 24 hours
  const securityEvents = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: oneDayAgo },
      action: {
        in: [
          'SELF_ESCALATION_ATTEMPT',
          'UNAUTHORIZED_ACCESS_ATTEMPT',
          'FAILED_LOGIN',
          'PASSWORD_RESET',
        ],
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (securityEvents.length > 0) {
    console.warn(`⚠️  ${securityEvents.length} security events in last 24 hours:`)
    securityEvents.forEach(event => {
      console.warn(`   - ${event.action} by ${event.changedBy} at ${event.createdAt}`)
      console.warn(`     ${event.details}`)
    })
  } else {
    console.log('✅ No security events in last 24 hours')
  }

  await prisma.$disconnect()
}

monitorSecurityEvents()
```

**Run daily via cron:**

```bash
# Add to crontab:
0 9 * * * cd /path/to/jessy-luxury && node scripts/monitor-security-events.mjs
```

---

## 7. Documentation Updates

### Update README.md

Add security requirements section:

```markdown
## Security Configuration

### Required Environment Variables

The following environment variables are **required** for secure operation:

```bash
# Session authentication secret (REQUIRED)
# Generate with: openssl rand -hex 32
ADMIN_SESSION_SECRET="your-secure-secret-here"

# Background worker authentication (REQUIRED)
# Generate with: openssl rand -hex 32
WORKER_SECRET="your-worker-secret-here"

# Database connection (REQUIRED)
DATABASE_URL="postgresql://user:password@host/neondb?sslmode=require"
```

### Security Best Practices

1. **Never commit `.env` files to version control**
2. **Rotate secrets every 90 days**
3. **Use unique secrets per environment** (dev/staging/production)
4. **Monitor audit logs daily** for suspicious activity
5. **Run security tests before deployment:** `npm run test:security`

### Reporting Security Issues

Email: security@jessyluxury.com  
Response time: 24 hours
```

---

## Implementation Checklist

### Phase 1: Immediate (Week 1)

- [ ] Remove hardcoded secret fallbacks in `lib/auth-crypto.ts`
- [ ] Make `WORKER_SECRET` mandatory in `app/api/notifications/worker/route.ts`
- [ ] Add environment variable validation to `app/layout.tsx`
- [ ] Document required environment variables in `.env.example`
- [ ] Update README.md with security configuration

### Phase 2: Hardening (Week 2)

- [ ] Add rate limiting to `/api/coupons/validate`
- [ ] Create comprehensive authorization E2E tests
- [ ] Implement security monitoring script
- [ ] Set up daily audit log monitoring (cron job)
- [ ] Add security testing to CI/CD pipeline

### Phase 3: Ongoing

- [ ] Schedule quarterly secret rotation
- [ ] Review audit logs weekly
- [ ] Run security tests on every deployment
- [ ] Update security documentation as architecture evolves

---

## Testing Verification

After implementing all fixes, run:

```bash
# 1. Verify environment validation
unset ADMIN_SESSION_SECRET
npm run build
# Expected: Build fails with clear error message

# 2. Run security test suite
npm run test:security
# Expected: All authorization tests pass

# 3. Verify rate limiting
node scripts/test-rate-limiting.mjs
# Expected: Coupon and tracking endpoints enforce limits

# 4. Check audit logs
node scripts/monitor-security-events.mjs
# Expected: No suspicious events
```

---

## Estimated Effort

| Task | Effort | Priority |
|------|--------|----------|
| Remove secret fallbacks | 1 hour | HIGH |
| Add environment validation | 2 hours | HIGH |
| Add rate limiting | 3 hours | MEDIUM |
| Write E2E security tests | 6 hours | MEDIUM |
| Documentation updates | 2 hours | MEDIUM |
| Monitoring scripts | 4 hours | LOW |

**Total:** ~18 hours (2-3 days)

---

**Next Steps:**
1. Review this document with team
2. Prioritize Phase 1 items
3. Schedule implementation in next sprint
4. Set up monitoring after deployment

