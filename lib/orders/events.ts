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
import { sendResendEmail, sendOneSignalPushToSubscriptions } from '../notifications/client'

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

    if (orderId) {
      const dbOrder = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        include: { Customer: true },
      })
      if (dbOrder) {
        if (!orderNumber) orderNumber = dbOrder.orderNumber
        if (total === undefined) total = dbOrder.total
        if (!email) email = dbOrder.Customer?.email || undefined
        if (!customerName) customerName = dbOrder.customerName || dbOrder.Customer?.name || undefined
        if (!customerId) customerId = dbOrder.customerId || undefined
      }
    }

    const dispatches: Array<{
      recipientType: 'ADMIN' | 'CUSTOMER'
      recipientId?: number
      eventKey: string
      title: string
      message: string
      channels: Array<{ channel: string; provider: string; payload: any }>
    }> = []

    const orderNum = orderNumber || `JL-${orderId}`
    const formattedTotal = total ? `₦${total.toLocaleString('en-NG')}` : '₦0'

    let isCustomerAuthed = !!payload.isAuthenticated
    if (customerId && !isCustomerAuthed) {
      const subCount = await prisma.customerPushSubscription.count({
        where: { customerId: Number(customerId), active: true },
      })
      if (subCount > 0) isCustomerAuthed = true
    }

    if (eventName === 'order.created') {
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
    } else if (eventName === 'order.paid') {
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:paid:ADMIN`,
        title: 'Order Paid',
        message: `Order #${orderNum} has been marked as paid.`,
        channels: [{ channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } }],
      })
    } else if (eventName === 'order.processing') {
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:processing:ADMIN`,
        title: 'Order In Processing',
        message: `Order #${orderNum} is now in processing state.`,
        channels: [{ channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } }],
      })
    } else if (eventName === 'order.shipped') {
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
    } else if (eventName === 'order.delivered') {
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:delivered:ADMIN`,
        title: 'Order Delivered',
        message: `Order #${orderNum} has been successfully delivered.`,
        channels: [{ channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } }],
      })
    } else if (eventName === 'order.cancelled') {
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:cancelled:ADMIN`,
        title: 'Order Cancelled',
        message: `Order #${orderNum} has been cancelled.`,
        channels: [{ channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } }],
      })
    } else if (eventName === 'order.returned') {
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `order:${orderNum}:returned:ADMIN`,
        title: 'Order Return Logged',
        message: `Order #${orderNum} return has been completed.`,
        channels: [{ channel: 'IN_APP', provider: 'INTERNAL', payload: { orderId } }],
      })
    } else if (eventName === 'inventory.low') {
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
    } else if (eventName === 'security.password_changed') {
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
    } else if (eventName === 'coupon.used') {
      dispatches.push({
        recipientType: 'ADMIN',
        eventKey: `coupon:${payload?.couponCode}:used:${payload?.orderId}:ADMIN`,
        title: 'Coupon Redeemed',
        message: `Coupon "${payload?.couponCode}" was redeemed on order #${payload?.orderNumber}.`,
        channels: [{ channel: 'IN_APP', provider: 'INTERNAL', payload }],
      })
    }

    const customerEvents = ['order.created', 'order.paid', 'order.processing', 'order.shipped', 'order.delivered', 'order.cancelled']
    if (customerEvents.includes(eventName) && (email || customerId)) {
      let customerTitle = ''
      let customerMessage = ''

      if (eventName === 'order.created') {
        customerTitle = 'Order Received - Jessy Luxury'
        customerMessage = `Dear customer, thank you for shopping with us! Your order #${orderNum} has been received and is currently being processed. Total: ${formattedTotal}.`
      } else if (eventName === 'order.paid') {
        customerTitle = 'Payment Confirmed - Jessy Luxury'
        customerMessage = `Dear customer, payment for your order #${orderNum} has been confirmed. Thank you!`
      } else if (eventName === 'order.processing') {
        customerTitle = 'Order in Processing - Jessy Luxury'
        customerMessage = `Dear customer, your order #${orderNum} is now being processed and prepared for shipping.`
      } else if (eventName === 'order.shipped') {
        customerTitle = 'Your Order Has Shipped!'
        customerMessage = `Great news! Your order #${orderNum} has been dispatched. Track your package on our live portal.`
      } else if (eventName === 'order.delivered') {
        customerTitle = 'Order Delivered - Jessy Luxury'
        customerMessage = `Your order #${orderNum} has been successfully delivered. Thank you for shopping with Jessy Luxury!`
      } else if (eventName === 'order.cancelled') {
        customerTitle = 'Order Cancelled - Jessy Luxury'
        customerMessage = `Your order #${orderNum} has been cancelled.`
      }

      if (customerTitle) {
        if (isCustomerAuthed) {
          const customerChannels: any[] = []
          if (email) customerChannels.push({ channel: 'EMAIL', provider: 'RESEND', payload: { email, orderId } })
          customerChannels.push({ channel: 'PUSH', provider: 'ONESIGNAL', payload: { orderId } })
          dispatches.push({
            recipientType: 'CUSTOMER',
            recipientId: customerId,
            eventKey: `order:${orderNum}:${eventName.split('.')[1]}:CUSTOMER`,
            title: customerTitle,
            message: customerMessage,
            channels: customerChannels,
          })
        } else {
          Promise.resolve().then(async () => {
            try {
              if (email && process.env.RESEND_API_KEY) {
                await sendResendEmail(email, customerTitle, customerMessage).catch(err => {
                  console.error('[Events] Guest email send error:', err)
                })
              }
              if (customerId) {
                const subs = await prisma.customerPushSubscription.findMany({
                  where: { customerId, active: true },
                })
                if (subs.length > 0) {
                  const tokens = subs.map(s => s.pushToken)
                  await sendOneSignalPushToSubscriptions(tokens, customerTitle, customerMessage, { orderId }).catch(err => {
                    console.error('[Events] Guest push send error:', err)
                  })
                }
              }
            } catch (gErr) {
              console.error('[Events] Guest notification dispatch error:', gErr)
            }
          })
        }
      }
    }

    for (const dispatch of dispatches) {
      try {
        const existing = await prisma.notification.findUnique({ where: { eventKey: dispatch.eventKey } })
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

    Promise.resolve().then(async () => {
      try {
        await processPendingDeliveries()
        const secret = process.env.WORKER_SECRET
        if (secret) {
          await fetch('http://localhost:3000/api/notifications/worker', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-worker-secret': secret,
            },
          }).catch(() => {})
        }
      } catch (wErr) {
        console.error('Failed to trigger immediate background worker:', wErr)
      }
    })
  } catch (error) {
    console.error('Error dispatching notifications:', error)
  }
}
