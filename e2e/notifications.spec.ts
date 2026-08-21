import './load-env'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { generateAdminToken } from '../lib/auth-crypto'
import { processPendingDeliveries } from '../lib/notifications/worker'
import { publishBusinessEvent } from '../lib/orders/events'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Ensure cleanup even if test fails
process.on('beforeExit', async () => {
  await prisma.$disconnect().catch(() => {})
})

test.describe('Jessy Luxury Notifications outbox E2E Suite', () => {
  test.setTimeout(180000)

  const runId = Math.floor(1000 + Math.random() * 9000)
  const namespace = `NOTIF_E2E_${runId}`

  let testCategory: any
  let testProduct: any
  let testCustomer: any
  let authToken: string = ''
  let originalResendKey: string | undefined
  let originalOneSignalKey: string | undefined

  test.beforeAll(async () => {
    // Save original keys to restore after test
    originalResendKey = process.env.RESEND_API_KEY
    originalOneSignalKey = process.env.ONESIGNAL_API_KEY

    // Ensure SystemConfig record exists so requireAdminAuth doesn't fail
    const config = await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, sessionVersion: 1, updatedAt: new Date() },
    })
    const sessionVersion = config.sessionVersion
    authToken = await generateAdminToken(sessionVersion)

    testCategory = await prisma.category.create({
      data: {
        name: `Notification Cat ${namespace}`,
        slug: `notif-cat-${namespace.toLowerCase()}`,
        updatedAt: new Date()
      },
    })

    testProduct = await prisma.product.create({
      data: {
        name: `Fragrance Notif ${namespace}`,
        brand: 'Jessy Luxury',
        notes: 'Rose, Jasmin',
        price: 45000,
        costPrice: 20000,
        stock: 5, // Low stock triggers
        categoryId: testCategory.id,
        updatedAt: new Date()
      },
    })

    testCustomer = await prisma.customer.create({
      data: {
        name: `Notif Cust ${namespace}`,
        phone: `+234805555${runId}`,
        whatsapp: `+234805555${runId}`,
        acquisitionSource: 'Instagram',
        updatedAt: new Date()
      },
    })
  })

  test.afterAll(async () => {
    // Restore original keys
    if (originalResendKey !== undefined) process.env.RESEND_API_KEY = originalResendKey
    if (originalOneSignalKey !== undefined) process.env.ONESIGNAL_API_KEY = originalOneSignalKey

    // Clean up
    await prisma.notificationDelivery.deleteMany({
      where: {
        Notification: {
          eventKey: { startsWith: `notif_test:${namespace}` },
        },
      },
    })
    await prisma.notification.deleteMany({
      where: {
        eventKey: { startsWith: `notif_test:${namespace}` },
      },
    })
    await prisma.order.deleteMany({
      where: {
        customerPhone: `+234805555${runId}`,
      },
    })
    await prisma.product.delete({ where: { id: testProduct.id } })
    await prisma.category.delete({ where: { id: testCategory.id } })
    await prisma.customer.delete({ where: { id: testCustomer.id } })
    await prisma.$disconnect()
  })

  test('should enforce idempotency, outbox claim locking, and credentials fallback mapping', async ({ request }) => {
    // Temporarily unset Resend keys to test SKIPPED fallback logic
    process.env.RESEND_API_KEY = ''

    // 1. Idempotency Check: Create notifications with duplicate eventKeys
    const eventKey = `notif_test:${namespace}:order_paid`

    const notif1 = await prisma.notification.create({
      data: {
        eventKey,
        type: 'order.paid',
        title: 'Paid Notification',
        message: 'Order was paid',
        recipientType: 'ADMIN',
      },
    })

    // Expect second insertion to trigger unique constraint fail (handled gracefully by our code, here we verify it blocks)
    await expect(
      prisma.notification.create({
        data: {
          eventKey,
          type: 'order.paid',
          title: 'Paid Notification 2',
          message: 'Duplicate payment',
          recipientType: 'ADMIN',
        },
      })
    ).rejects.toThrow()

    // 2. Outbox Claim Lock: Simulate concurrent workers attempting to claim the same pending delivery
    const delivery = await prisma.notificationDelivery.create({
      data: {
        notificationId: notif1.id,
        channel: 'EMAIL',
        provider: 'RESEND',
        status: 'PENDING',
        nextAttemptAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes in the past
      },
    })

    const workerA = 'worker_a_test'
    const workerB = 'worker_b_test'

    // Try claiming in parallel
    const claimA = await prisma.notificationDelivery.updateMany({
      where: {
        id: delivery.id,
        status: 'PENDING',
        nextAttemptAt: { lte: new Date(Date.now() + 5 * 60 * 1000) },
      },
      data: {
        status: 'PROCESSING',
        claimedAt: new Date(),
        claimedBy: workerA,
      },
    })

    const claimB = await prisma.notificationDelivery.updateMany({
      where: {
        id: delivery.id,
        status: 'PENDING',
        nextAttemptAt: { lte: new Date(Date.now() + 5 * 60 * 1000) },
      },
      data: {
        status: 'PROCESSING',
        claimedAt: new Date(),
        claimedBy: workerB,
      },
    })

    // Exactly one worker must claim it
    expect(claimA.count + claimB.count).toBe(1)

    // 3. Trigger worker and verify credentials missing SKIPPED fallback mapping
    // Reset delivery back to PENDING so processPendingDeliveries can run it.
    // Also set payload with email so worker reaches the credential check (not early "missing email" throw).
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'PENDING',
        claimedAt: null,
        claimedBy: null,
      },
    })
    // Patch the notification with a customer email in the payload so RESEND_API_KEY check is reached
    await prisma.notification.update({
      where: { id: notif1.id },
      data: {
        payload: { email: 'test@example.com', customerEmail: 'test@example.com' },
      },
    })

    const workerStats = await processPendingDeliveries('worker_main_test')
    expect(workerStats.processedCount).toBeGreaterThan(0)
    expect(workerStats.skippedCount).toBeGreaterThan(0)

    const updatedDelivery = await prisma.notificationDelivery.findUnique({
      where: { id: delivery.id },
    })
    expect(updatedDelivery?.status).toBe('SKIPPED')
    expect(updatedDelivery?.errorMessage).toBe('RESEND_API_KEY is not configured')
    expect(updatedDelivery?.attempts).toBe(0) // SKIPPED does not consume attempt count

    // 4. Retry scheduling & Failure recovery path
    // Configure a FAILED retry delivery with attempts = 1 for the PUSH channel
    process.env.ONESIGNAL_APP_ID = ''
    process.env.ONESIGNAL_API_KEY = ''

    const failedDelivery = await prisma.notificationDelivery.create({
      data: {
        notificationId: notif1.id,
        channel: 'PUSH',
        provider: 'ONESIGNAL',
        status: 'FAILED',
        attempts: 1,
        nextAttemptAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    })

    await processPendingDeliveries('worker_retry_test')
    const postRetryDelivery = await prisma.notificationDelivery.findUnique({
      where: { id: failedDelivery.id },
    })

    // With both ONESIGNAL keys missing, worker transitions to SKIPPED
    expect(postRetryDelivery?.status).toBe('SKIPPED')

    // Clean up test deliveries
    await prisma.notificationDelivery.deleteMany({
      where: { id: { in: [delivery.id, failedDelivery.id] } },
    })
  })

  test('should enforce API session security checks', async ({ request }) => {
    // Querying notifications without authentication -> returns 401
    const unauthenticatedRes = await request.get('http://localhost:3000/api/notifications')
    expect(unauthenticatedRes.status()).toBe(401)

    // Querying with admin cookies -> returns 200
    const authenticatedRes = await request.get('http://localhost:3000/api/notifications', {
      headers: {
        'Cookie': `jl_admin_token=${authToken}`,
      },
    })
    expect(authenticatedRes.status()).toBe(200)

    // Querying worker cron without correct headers -> returns 401
    const workerCronUnauthorized = await request.post('http://localhost:3000/api/notifications/worker', {
      headers: {
        'x-worker-secret': 'wrong-secret-token',
      },
    })
    expect(workerCronUnauthorized.status()).toBe(401)
  })

  test('should verify Phase 9 customer notification portal and engagement features', async ({ request }) => {
    // 1. Create a public active store announcement
    const announcement = await prisma.storeAnnouncement.create({
      data: {
        type: 'PROMOTION',
        title: `E2E Promo ${namespace}`,
        message: 'Active announcement message',
        actionLabel: 'Click Me',
        actionUrl: '/',
        audience: 'ALL',
        priority: 80,
        dismissible: true,
        isActive: true,
        startsAt: new Date(Date.now() - 60000),
        endsAt: new Date(Date.now() + 600000),
        updatedAt: new Date(),
      }
    })

    const activeAnnRes = await request.get('http://localhost:3000/api/store-announcements/active')
    expect(activeAnnRes.status()).toBe(200)
    const activeAnn = await activeAnnRes.json()
    expect(activeAnn).not.toBeNull()
    expect(activeAnn.title).toBe(`E2E Promo ${namespace}`)

    // 2. Perform passwordless login for customer
    const loginRes = await request.post('http://localhost:3000/api/customer-auth/login', {
      data: {
        phone: testCustomer.phone,
        name: testCustomer.name
      }
    })
    expect(loginRes.status()).toBe(200)
    const loginData = await loginRes.json()
    expect(loginData.success).toBe(true)

    // Capture the cookie header
    const setCookieHeader = loginRes.headers()['set-cookie']
    expect(setCookieHeader).toBeDefined()
    const customerCookie = setCookieHeader.split(';')[0]

    // 3. Register a customer push subscription
    const pushSubRes = await request.post('http://localhost:3000/api/push-subscriptions', {
      data: {
        pushToken: `onesignal_e2e_sub_${runId}`
      },
      headers: {
        'Cookie': customerCookie
      }
    })
    expect(pushSubRes.status()).toBe(201)

    // Verify sub exists in DB
    const subRecord = await prisma.customerPushSubscription.findFirst({
      where: { pushToken: `onesignal_e2e_sub_${runId}` }
    })
    expect(subRecord).toBeDefined()
    expect(subRecord?.customerId).toBe(testCustomer.id)

    // 4. Test Customer Notification Center scoped fetching
    // Get notifications -> should be empty at first
    const initNotifRes = await request.get('http://localhost:3000/api/notifications', {
      headers: { 'Cookie': customerCookie }
    })
    expect(initNotifRes.status()).toBe(200)
    const initNotifs = await initNotifRes.json()
    expect(initNotifs.length).toBe(0)

    // 5. Create a Campaign with push and web enabled
    const promoCoupon = await prisma.coupon.create({
      data: {
        code: `COUPON_${runId}`,
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderAmount: 1000,
        isActive: true,
        updatedAt: new Date(),
      }
    })

    const campaignRes = await request.post('http://localhost:3000/api/campaigns', {
      data: {
        name: `E2E Campaign ${namespace}`,
        description: `Use discount code ${promoCoupon.code}`,
        couponId: promoCoupon.id,
        audience: 'INSTAGRAM_ACQUIRED',
        startDate: new Date(Date.now() - 5000).toISOString(),
        endDate: new Date(Date.now() + 50000).toISOString(),
        isActive: true,
        pushEnabled: true,
        websiteEnabled: true,
      },
      headers: {
        'Cookie': `jl_admin_token=${authToken}`
      }
    })
    expect(campaignRes.status()).toBe(201)

    // Poll notifications endpoint to allow async background execution to complete
    let checkNotifs: any[] = []
    for (let i = 0; i < 10; i++) {
      const checkNotifRes = await request.get('http://localhost:3000/api/notifications', {
        headers: { 'Cookie': customerCookie }
      })
      if (checkNotifRes.status() === 200) {
        checkNotifs = await checkNotifRes.json()
        if (Array.isArray(checkNotifs) && checkNotifs.length > 0) {
          break
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    expect(checkNotifs.length).toBeGreaterThan(0)
    expect(checkNotifs[0].title).toBe(`E2E Campaign ${namespace}`)

    // 6. Clean up Campaign, Coupon, Announcement, and Subscriptions
    const campaignData = await campaignRes.json()
    await prisma.storeAnnouncement.deleteMany({ where: { campaignId: campaignData.id } })
    await prisma.notificationDelivery.deleteMany({ where: { Notification: { recipientId: testCustomer.id } } })
    await prisma.notification.deleteMany({ where: { recipientId: testCustomer.id } })
    await prisma.campaign.delete({ where: { id: campaignData.id } })
    await prisma.coupon.delete({ where: { id: promoCoupon.id } })
    await prisma.storeAnnouncement.delete({ where: { id: announcement.id } })
    await prisma.customerPushSubscription.delete({ where: { id: subRecord?.id } })
  })

  test('should render an active StoreAnnouncement on the public storefront', async ({ page }) => {
    const title = `Storefront Banner ${namespace}`
    const message = `Homepage announcement ${namespace}`
    const announcement = await prisma.storeAnnouncement.create({
      data: {
        type: 'PROMOTION',
        title,
        message,
        actionLabel: 'Shop Now',
        actionUrl: '/',
        audience: 'ALL',
        priority: 999,
        dismissible: true,
        isActive: true,
        startsAt: new Date(Date.now() - 60000),
        endsAt: new Date(Date.now() + 600000),
        updatedAt: new Date(),
      },
    })

    try {
      await page.goto('http://localhost:3000/')
      await expect(page.getByText(title, { exact: true })).toBeVisible({ timeout: 15000 })
      await expect(page.getByText(message, { exact: true })).toBeVisible()
    } finally {
      await prisma.storeAnnouncement.delete({ where: { id: announcement.id } })
    }
  })

  test('should not suppress transactional order notifications when marketing is opted out', async () => {
    const localPhone = `0802${String(runId).padStart(7, '0').slice(-7)}`
    const canonicalPhone = `+234${localPhone.slice(1)}`
    const orderNumber = `JL-TXN${namespace}`

    const optedOutCustomer = await prisma.customer.create({
      data: {
        name: `OptOut Cust ${namespace}`,
        phone: canonicalPhone,
        whatsapp: canonicalPhone,
        email: `optout_${runId}@example.com`,
        acquisitionSource: 'Manual',
        marketingEmail: false,
        marketingPush: false,
        updatedAt: new Date(),
      },
    })

    const order = await prisma.order.create({
      data: {
        orderNumber,
        Customer: { connect: { id: optedOutCustomer.id } },
        customerName: optedOutCustomer.name,
        customerPhone: canonicalPhone,
        customerWhatsapp: canonicalPhone,
        subtotal: 10000,
        total: 10000,
        paymentStatus: 'PAID',
        status: 'SHIPPED',
        updatedAt: new Date(),
        OrderItem: {
          create: [{
            productId: testProduct.id,
            quantity: 1,
            price: 10000,
          }],
        },
      },
    })

    const previousResendKey = process.env.RESEND_API_KEY
    const previousOneSignalKey = process.env.ONESIGNAL_API_KEY
    const previousOneSignalAppId = process.env.ONESIGNAL_APP_ID
    process.env.RESEND_API_KEY = ''
    process.env.ONESIGNAL_API_KEY = ''
    process.env.ONESIGNAL_APP_ID = ''

    try {
      await publishBusinessEvent('order.shipped', {
        orderId: order.id,
        orderNumber,
        isAuthenticated: true,
      })

      const customerNotif = await prisma.notification.findFirst({
        where: {
          eventKey: `order:${orderNumber}:shipped:CUSTOMER`,
          recipientType: 'CUSTOMER',
          recipientId: optedOutCustomer.id,
        },
        include: { NotificationDelivery: true },
      })

      expect(customerNotif).toBeTruthy()
      expect(customerNotif?.title).toBe('Your Order Has Shipped!')

      const emailDelivery = customerNotif!.NotificationDelivery.find((d) => d.channel === 'EMAIL')
      const pushDelivery = customerNotif!.NotificationDelivery.find((d) => d.channel === 'PUSH')

      expect(emailDelivery).toBeDefined()
      expect(emailDelivery?.errorMessage).not.toBe('MARKETING_EMAIL_DISABLED')
      expect(pushDelivery).toBeDefined()
      expect(pushDelivery?.errorMessage).not.toBe('MARKETING_PUSH_DISABLED')
    } finally {
      if (previousResendKey !== undefined) process.env.RESEND_API_KEY = previousResendKey
      else delete process.env.RESEND_API_KEY
      if (previousOneSignalKey !== undefined) process.env.ONESIGNAL_API_KEY = previousOneSignalKey
      else delete process.env.ONESIGNAL_API_KEY
      if (previousOneSignalAppId !== undefined) process.env.ONESIGNAL_APP_ID = previousOneSignalAppId
      else delete process.env.ONESIGNAL_APP_ID

      await prisma.notificationDelivery.deleteMany({
        where: { Notification: { eventKey: { startsWith: `order:${orderNumber}:` } } },
      })
      await prisma.notification.deleteMany({
        where: { eventKey: { startsWith: `order:${orderNumber}:` } },
      })
      await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
      await prisma.order.delete({ where: { id: order.id } })
      await prisma.customer.delete({ where: { id: optedOutCustomer.id } })
    }
  })
})
