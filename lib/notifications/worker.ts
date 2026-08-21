import { prisma } from '@/lib/prisma'
import { sendResendEmail, sendOneSignalPush, sendOneSignalPushToSubscriptions } from './client'

export async function processPendingDeliveries(workerId?: string): Promise<{ processedCount: number; successCount: number; failedCount: number; skippedCount: number }> {
  const currentWorkerId = workerId || `worker_${Math.random().toString(36).slice(2)}`
  const now = new Date()

  // 1. Recover stale processing jobs (locked in PROCESSING for > 5 minutes)
  const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000)
  const staleJobs = await prisma.notificationDelivery.findMany({
    where: {
      status: 'PROCESSING',
      claimedAt: { lt: staleThreshold },
    },
  })

  for (const job of staleJobs) {
    if (job.attempts < 3) {
      await prisma.notificationDelivery.update({
        where: { id: job.id },
        data: {
          status: 'PENDING',
          nextAttemptAt: now,
          claimedAt: null,
          claimedBy: null,
        },
      })
    } else {
      await prisma.notificationDelivery.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          nextAttemptAt: null,
          claimedAt: null,
          claimedBy: null,
        },
      })
    }
  }

  // 2. Fetch candidates matching PENDING or FAILED retries
  const candidates = await prisma.notificationDelivery.findMany({
    where: {
      status: { in: ['PENDING', 'FAILED'] },
      attempts: { lt: 3 },
      nextAttemptAt: { lte: now },
    },
    include: {
      Notification: true,
    },
    take: 10,
  })

  let processedCount = 0
  let successCount = 0
  let failedCount = 0
  let skippedCount = 0

  for (const delivery of candidates) {
    // 3. Concurrency Lock: Claim job atomically
    const affected = await prisma.notificationDelivery.updateMany({
      where: {
        id: delivery.id,
        status: { in: ['PENDING', 'FAILED'] },
        attempts: { lt: 3 },
        nextAttemptAt: { lte: now },
      },
      data: {
        status: 'PROCESSING',
        claimedAt: now,
        claimedBy: currentWorkerId,
      },
    })

    // If another worker claimed it, skip
    if (affected.count === 0) continue

    processedCount++

    try {
      const channel = delivery.channel
      const notification = delivery.Notification

      if (channel === 'EMAIL') {
        const payload = notification.payload as any
        const emailTo = payload?.email || payload?.customerEmail
        if (!emailTo) {
          throw new Error('Missing recipient email in notification payload')
        }

        // Check Resend Key
        if (!process.env.RESEND_API_KEY) {
          // SKIPPED: Missing credentials (does not consume attempt)
          await prisma.notificationDelivery.updateMany({
            where: {
              id: delivery.id,
              status: 'PROCESSING',
              claimedBy: currentWorkerId,
            },
            data: {
              status: 'SKIPPED',
              errorMessage: 'RESEND_API_KEY is not configured',
              provider: 'RESEND',
            },
          })
          skippedCount++
          continue
        }

        const res = await sendResendEmail(emailTo, notification.title, notification.message)
        
        // Success completion (requires matching ownership)
        await prisma.notificationDelivery.updateMany({
          where: {
            id: delivery.id,
            status: 'PROCESSING',
            claimedBy: currentWorkerId,
          },
          data: {
            status: 'SENT',
            provider: 'RESEND',
            providerId: res.id,
            sentAt: new Date(),
            attempts: delivery.attempts + 1,
            errorMessage: null,
          },
        })
        successCount++

      } else if (channel === 'PUSH') {
        // Check OneSignal keys
        if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_API_KEY) {
          // SKIPPED: Missing credentials
          await prisma.notificationDelivery.updateMany({
            where: {
              id: delivery.id,
              status: 'PROCESSING',
              claimedBy: currentWorkerId,
            },
            data: {
              status: 'SKIPPED',
              errorMessage: 'ONESIGNAL_APP_ID or ONESIGNAL_API_KEY is not configured',
              provider: 'ONESIGNAL',
            },
          })
          skippedCount++
          continue
        }

        let res;
        if (notification.recipientType === 'CUSTOMER') {
          if (!notification.recipientId) {
            await prisma.notificationDelivery.updateMany({
              where: {
                id: delivery.id,
                status: 'PROCESSING',
                claimedBy: currentWorkerId,
              },
              data: {
                status: 'SKIPPED',
                errorMessage: 'NO_PUSH_SUBSCRIPTION',
                provider: 'ONESIGNAL',
              },
            })
            skippedCount++
            continue
          }

          // Fetch active customer push subscriptions
          const subs = await prisma.customerPushSubscription.findMany({
            where: {
              customerId: notification.recipientId,
              active: true
            }
          })

          if (subs.length === 0) {
            await prisma.notificationDelivery.updateMany({
              where: {
                id: delivery.id,
                status: 'PROCESSING',
                claimedBy: currentWorkerId,
              },
              data: {
                status: 'SKIPPED',
                errorMessage: 'NO_PUSH_SUBSCRIPTION',
                provider: 'ONESIGNAL',
              },
            })
            skippedCount++
            continue
          }

          const subscriptionTokens = subs.map(s => s.pushToken)
          res = await sendOneSignalPushToSubscriptions(subscriptionTokens, notification.title, notification.message, notification.payload)
        } else {
          // Admin recipient - legacy external ID route
          const recipientId = notification.recipientId || 1
          res = await sendOneSignalPush(String(recipientId), notification.title, notification.message, notification.payload)
        }

        // Success completion
        await prisma.notificationDelivery.updateMany({
          where: {
            id: delivery.id,
            status: 'PROCESSING',
            claimedBy: currentWorkerId,
          },
          data: {
            status: 'SENT',
            provider: 'ONESIGNAL',
            providerId: res.id,
            sentAt: new Date(),
            attempts: delivery.attempts + 1,
            errorMessage: null,
          },
        })
        successCount++
      } else {
        // Unexpected channel fallback
        await prisma.notificationDelivery.updateMany({
          where: {
            id: delivery.id,
            status: 'PROCESSING',
            claimedBy: currentWorkerId,
          },
          data: {
            status: 'SKIPPED',
            errorMessage: `Unsupported delivery channel: ${channel}`,
            provider: 'INTERNAL',
          },
        })
        skippedCount++
      }

    } catch (error: any) {
      // Failure Handling with Backoff
      failedCount++
      const nextAttempts = delivery.attempts + 1
      const isExhausted = nextAttempts >= 3

      let backoffMs = 0
      if (!isExhausted) {
        // Attempt 1 -> +1 minute (60s)
        // Attempt 2 -> +5 minutes (300s)
        backoffMs = nextAttempts === 1 ? 60 * 1000 : 5 * 60 * 1000
      }

      const nextAttemptAt = isExhausted ? null : new Date(Date.now() + backoffMs)
      const nextStatus = isExhausted ? 'FAILED' : 'FAILED' // Keep status as FAILED, query matches attempts < 3

      await prisma.notificationDelivery.updateMany({
        where: {
          id: delivery.id,
          status: 'PROCESSING',
          claimedBy: currentWorkerId,
        },
        data: {
          status: nextStatus,
          attempts: nextAttempts,
          nextAttemptAt,
          errorMessage: error?.message || 'Unknown delivery failure',
        },
      })
    }
  }

  return { processedCount, successCount, failedCount, skippedCount }
}
