import './load-env'
import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { generateAdminToken } from '../lib/auth-crypto'
import { processPendingDeliveries } from '../lib/notifications/worker'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

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
      create: { id: 1, sessionVersion: 1 },
    })
    const sessionVersion = config.sessionVersion
    authToken = await generateAdminToken(sessionVersion)

    testCategory = await prisma.category.create({
      data: {
        name: `Notification Cat ${namespace}`,
        slug: `notif-cat-${namespace.toLowerCase()}`,
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
      },
    })

    testCustomer = await prisma.customer.create({
      data: {
        name: `Notif Cust ${namespace}`,
        phone: `+234805555${runId}`,
        whatsapp: `+234805555${runId}`,
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
        notification: {
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
})
