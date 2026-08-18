export type BusinessEventName =
  | 'order.created'
  | 'order.paid'
  | 'order.payment_updated'
  | 'order.processing'
  | 'order.shipped'
  | 'order.delivered'
  | 'order.cancelled'
  | 'order.returned'
  | 'inventory.low'
  | 'inventory.out_of_stock'
  | 'inventory.adjusted'
  | 'customer.created'
  | 'product.created'
  | 'product.updated'
  | 'coupon.created'
  | 'coupon.used'
  | 'security.password_changed'

import { prisma } from '@/lib/prisma'
import { processPendingDeliveries } from '../notifications/worker'

/**
 * Centrally dispatches business events AFTER the database transaction commits successfully.
 * Isolated from route handlers to enable modular notification triggers (Resend/OneSignal).
 */
export async function publishBusinessEvent(eventName: BusinessEventName, payload: any) {
  console.log(`[Event Dispatcher] Emitting event: "${eventName}"`, {
    timestamp: new Date().toISOString(),
    payload,
  })

  try {
    const { orderId, productName, quantity } = payload || {}
    let orderNumber = payload?.orderNumber
    let total = payload?.total
    let email = payload?.email || payload?.customerEmail
    let customerName = payload?.customerName
    let customerId = payload?.customerId

    // If orderId is provided, enrich missing fields dynamically from the database to guarantee customer alerts succeed.
    if (orderId) {
      const dbOrder = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        include: { customer: true },
      })
      if (dbOrder) {
        if (!orderNumber) orderNumber = dbOrder.orderNumber
        if (total === undefined) total = dbOrder.total
        if (!email) email = dbOrder.customer?.email || undefined
        if (!customerName) customerName = dbOrder.customerName || dbOrder.customer?.name || undefined
        if (!customerId) customerId = dbOrder.customerId || undefined
      }
    }

    // Define policies mapping Event -> Channels/Content
    const dispatches: Array<{
      recipientType: 'ADMIN' | 'CUSTOMER'
      recipientId?: number
      eventKey: string
      title: string
      message: string
      channels: Array<{ channel: string; provider: string; payload: any }>
    }> = []

    if (eventName === 'order.created') {
      const orderNum = orderNumber || `JL-${orderId}`
      const formattedTotal = total ? `₦${total.toLocaleString('en-NG')}` : '₦0'
      
      // 1. Admin Alert
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:created:ADMIN`,
        title: 'New Order Received',
        message: `Order #${orderNum} created for ${customerName || 'Customer'} (Total: ${formattedTotal})`,
        channels: [
          { channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } },
          { channel: 'PUSH', provider: 'ONESIGNAL', payload: { orderId } },
        ],
      })

      // 2. Customer Email
      const customerEmail = email || payload?.customerEmail
      if (customerEmail) {
        dispatches.push({
          recipientType: 'CUSTOMER',
          recipientId: customerId,
          eventKey: `order:${orderNum}:created:CUSTOMER`,
          title: 'Order Confirmed - Jessy Luxury',
          message: `Dear customer, thank you for shopping with us! Your order #${orderNum} has been received and is currently being processed. Total: ${formattedTotal}.`,
          channels: [
            { channel: 'EMAIL', provider: 'RESEND', payload: { email: customerEmail, orderId } },
          ],
        })
      }
    }

    else if (eventName === 'order.paid') {
      const orderNum = orderNumber || `JL-${orderId}`
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:paid:ADMIN`,
        title: 'Order Paid',
        message: `Order #${orderNum} has been marked as paid.`,
        channels: [
          { channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } },
        ],
      })
    }

    else if (eventName === 'order.processing') {
      const orderNum = orderNumber || `JL-${orderId}`
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:processing:ADMIN`,
        title: 'Order In Processing',
        message: `Order #${orderNum} is now in processing state.`,
        channels: [
          { channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } },
        ],
      })
    }

    else if (eventName === 'order.shipped') {
      const orderNum = orderNumber || `JL-${orderId}`
      
      // 1. Admin Alert
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:shipped:ADMIN`,
        title: 'Order Shipped',
        message: `Order #${orderNum} has been shipped via courier.`,
        channels: [
          { channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } },
          { channel: 'PUSH', provider: 'ONESIGNAL', payload: { orderId } },
        ],
      })

      // 2. Customer Email
      const customerEmail = email || payload?.customerEmail
      if (customerEmail) {
        dispatches.push({
          recipientType: 'CUSTOMER',
          recipientId: customerId,
          eventKey: `order:${orderNum}:shipped:CUSTOMER`,
          title: 'Your Order Has Shipped!',
          message: `Great news! Your order #${orderNum} has been dispatched. Track your package on our live portal.`,
          channels: [
            { channel: 'EMAIL', provider: 'RESEND', payload: { email: customerEmail, orderId } },
          ],
        })
      }
    }

    else if (eventName === 'order.delivered') {
      const orderNum = orderNumber || `JL-${orderId}`
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:delivered:ADMIN`,
        title: 'Order Delivered',
        message: `Order #${orderNum} has been successfully delivered.`,
        channels: [
          { channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } },
        ],
      })
    }

    else if (eventName === 'order.cancelled') {
      const orderNum = orderNumber || `JL-${orderId}`
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:cancelled:ADMIN`,
        title: 'Order Cancelled',
        message: `Order #${orderNum} has been cancelled.`,
        channels: [
          { channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } },
        ],
      })
    }

    else if (eventName === 'order.returned') {
      const orderNum = orderNumber || `JL-${orderId}`
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:returned:ADMIN`,
        title: 'Order Return Logged',
        message: `Order #${orderNum} return has been completed.`,
        channels: [
          { channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } },
        ],
      })
    }

    else if (eventName === 'inventory.low') {
      const keyName = productName || `Product ${payload?.productId}`
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `inventory:${payload?.productId}:low:ADMIN`,
        title: 'Low Stock Warning',
        message: `Product "${keyName}" is low on stock (${quantity || 0} remaining)`,
        channels: [
          { channel: 'IN_APP', provider: 'INTERNAL', payload },
          { channel: 'PUSH', provider: 'ONESIGNAL', payload },
        ],
      })
    }

    else if (eventName === 'security.password_changed') {
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `security:password_change:${new Date().toISOString().slice(0, 13)}:ADMIN`,
        title: 'Security Alert: Password Updated',
        message: 'The administrative account password was successfully updated.',
        channels: [
          { channel: 'IN_APP', provider: 'INTERNAL', payload },
          { channel: 'EMAIL', provider: 'RESEND', payload: { email: payload?.email || 'admin@jessyluxury.com' } },
        ],
      })
    }

    else if (eventName === 'coupon.used') {
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `coupon:${payload?.couponCode}:used:${payload?.orderId}:ADMIN`,
        title: 'Coupon Redeemed',
        message: `Coupon "${payload?.couponCode}" was redeemed on order #${payload?.orderNumber}.`,
        channels: [
          { channel: 'IN_APP', provider: 'INTERNAL', payload },
        ],
      })
    }

    // Persist notifications and queue delivery outbox records
    for (const dispatch of dispatches) {
      try {
        // Enforce idempotency: upsert or skip duplicate eventKey
        const existing = await prisma.notification.findUnique({
          where: { eventKey: dispatch.eventKey },
        })

        if (existing) continue

        const notification = await prisma.notification.create({
          data: {
            eventKey: dispatch.eventKey,
            type: eventName,
            title: dispatch.title,
            message: dispatch.message,
            payload: dispatch.channels.find(c => c.channel === 'IN_APP')?.payload || {},
            recipientType: dispatch.recipientType,
            recipientId: dispatch.recipientId || null,
          },
        })

        // Insert deliveries outbox mapping
        for (const channelItem of dispatch.channels) {
          const initialStatus = channelItem.channel === 'IN_APP' ? 'SENT' : 'PENDING'
          await prisma.notificationDelivery.create({
            data: {
              notificationId: notification.id,
              channel: channelItem.channel,
              provider: channelItem.provider,
              status: initialStatus,
              errorMessage: null,
              sentAt: channelItem.channel === 'IN_APP' ? new Date() : null,
            },
          })
        }
      } catch (err) {
        console.error('Error saving notification payload:', err)
      }
    }

    // Async trigger worker post-commit
    Promise.resolve().then(async () => {
      try {
        const secret = process.env.WORKER_SECRET || 'secret'
        // Internal direct execution
        await processPendingDeliveries()
        // Non-blocking loopback fetch trigger
        fetch('http://localhost:3000/api/notifications/worker', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-worker-secret': secret,
          },
        }).catch(() => {})
      } catch (wErr) {
        console.error('Failed to trigger immediate background worker:', wErr)
      }
    })

  } catch (error) {
    console.error('Error dispatching notifications:', error)
  }
}
