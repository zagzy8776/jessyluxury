import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffAuth } from '@/lib/staff-auth'
import {
  canTransitionFulfillment,
  canTransitionPayment,
  FulfillmentStatus,
  PaymentStatus,
} from '@/lib/orders/state-machine'
import {
  consumeReservation,
  releaseReservation,
  cancelPaidSale,
  processReturnItem,
} from '@/lib/orders/inventory'
import { publishBusinessEvent, BusinessEventName } from '@/lib/orders/events'
import { updateCustomerStats } from '@/lib/orders/customer-stats'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireStaffAuth(request, 'orders')
    if (authError) return authError

    const orderId = parseInt(params.id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        OrderItem: {
          include: {
            Product: true,
          },
        },
        ShippingZone: true,
        Customer: true,
        OrderTimeline: {
          orderBy: { createdAt: 'desc' },
        },
        PriceAdjustmentLog: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order details:', error)
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'orders')
  if (authErr) return authErr

  try {
    const orderId = parseInt(params.id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { OrderItem: true },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      status, // FulfillmentStatus
      paymentStatus, // PaymentStatus
      trackingNumber,
      courierName,
      courierPhone,
      waybillNotes,
      restockItems, // Array of { productId: number, isRestockable: boolean, reason?: string }
      shippingZoneId, // Number | null | undefined
    } = body

    let cleanCourierPhone = courierPhone !== undefined ? courierPhone : undefined
    if (cleanCourierPhone) {
      cleanCourierPhone = cleanCourierPhone.trim().replace(/\s+/g, '')
    }

    // 1. Validate status machine transitions if requested
    const targetStatus = status as FulfillmentStatus | undefined
    if (targetStatus && !canTransitionFulfillment(currentOrder.status as FulfillmentStatus, targetStatus)) {
      return NextResponse.json(
        { error: `Invalid fulfillment transition: ${currentOrder.status} -> ${targetStatus}` },
        { status: 400 }
      )
    }

    const targetPaymentStatus = paymentStatus as PaymentStatus | undefined
    if (targetPaymentStatus && !canTransitionPayment(currentOrder.paymentStatus as PaymentStatus, targetPaymentStatus)) {
      return NextResponse.json(
        { error: `Invalid payment transition: ${currentOrder.paymentStatus} -> ${targetPaymentStatus}` },
        { status: 400 }
      )
    }

    // Pre-warm the database connection
    await prisma.$queryRaw`SELECT 1`

    // 2. Execute Transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const actor = 'Admin'

      let shippingFee = currentOrder.shippingFee
      let shippingZoneNameSnapshot = currentOrder.shippingZoneNameSnapshot
      let estimatedDaysSnapshot = currentOrder.estimatedDaysSnapshot
      let nextShippingZoneId = currentOrder.shippingZoneId

      if (shippingZoneId !== undefined) {
        if (shippingZoneId === null) {
          shippingFee = 0
          shippingZoneNameSnapshot = null
          estimatedDaysSnapshot = null
          nextShippingZoneId = null
        } else {
          const zoneId = Number(shippingZoneId)
          const zone = await tx.shippingZone.findUnique({
            where: { id: zoneId },
          })
          if (!zone) {
            throw new Error(`Shipping zone with ID ${zoneId} not found`)
          }
          if (!zone.active && currentOrder.shippingZoneId !== zoneId) {
            throw new Error('Cannot newly assign inactive shipping zone to this order')
          }
          shippingFee = zone.fee
          shippingZoneNameSnapshot = zone.name
          estimatedDaysSnapshot = zone.estimatedDays
          nextShippingZoneId = zoneId
        }
      }

      const finalTotal = currentOrder.subtotal - currentOrder.discountAmount + shippingFee

      // Check payment status updates
      if (targetPaymentStatus && targetPaymentStatus !== currentOrder.paymentStatus) {
        const oldPay = currentOrder.paymentStatus as PaymentStatus

        if ((oldPay === 'UNPAID' || oldPay === 'PARTIALLY_PAID') && targetPaymentStatus === 'PAID') {
          // Convert reserved stock -> sold
          for (const item of currentOrder.OrderItem) {
            await consumeReservation(tx, item.productId, item.quantity, actor)
          }
        } else if ((oldPay === 'UNPAID' || oldPay === 'PARTIALLY_PAID') && targetPaymentStatus === 'REFUNDED') {
          // Release reservation
          for (const item of currentOrder.OrderItem) {
            await releaseReservation(tx, item.productId, item.quantity, actor)
          }
        } else if (oldPay === 'PAID' && targetPaymentStatus === 'REFUNDED') {
          // Refund paid order - stock returned is explicitly managed on cancelled/returned fulfillment states.
        }

        // Log payment updated timeline
        await tx.orderTimeline.create({
          data: {
            orderId,
            eventType: 'PAYMENT_UPDATED',
            message: `Payment status updated from ${oldPay} to ${targetPaymentStatus}.`,
            actorId: actor,
          },
        })
      }

      // Check fulfillment status updates
      if (targetStatus && targetStatus !== currentOrder.status) {
        const oldFul = currentOrder.status as FulfillmentStatus

        if (targetStatus === 'CANCELLED') {
          // Revert stock allocations depending on payment status
          const isPaid = currentOrder.paymentStatus === 'PAID'
          for (const item of currentOrder.OrderItem) {
            if (isPaid) {
              await cancelPaidSale(tx, item.productId, item.quantity, actor)
            } else {
              await releaseReservation(tx, item.productId, item.quantity, actor)
            }
          }

          // Force payment status to REFUNDED if was PAID
          if (currentOrder.paymentStatus === 'PAID') {
            await tx.order.update({
              where: { id: orderId },
              data: { paymentStatus: 'REFUNDED' },
            })
          }

          await tx.orderTimeline.create({
            data: {
              orderId,
              eventType: 'ORDER_CANCELLED',
              message: `Order #${currentOrder.orderNumber} cancelled by admin. Stock restored.`,
              actorId: actor,
            },
          })
        } else if (targetStatus === 'RETURNED') {
          // Process restock choices for each item
          const restockMap = new Map<number, { isRestockable: boolean; reason?: string }>()
          if (Array.isArray(restockItems)) {
            for (const rItem of restockItems) {
              restockMap.set(Number(rItem.productId), {
                isRestockable: Boolean(rItem.isRestockable),
                reason: rItem.reason || 'Customer return restock',
              })
            }
          }

          for (const item of currentOrder.OrderItem) {
            const restockChoice = restockMap.get(item.productId) || { isRestockable: false, reason: 'Returned item (not restocked)' }
            await processReturnItem(tx, item.productId, item.quantity, restockChoice.isRestockable, actor, restockChoice.reason)
          }

          // Force payment status to REFUNDED
          await tx.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'REFUNDED' },
          })

          await tx.orderTimeline.create({
            data: {
              orderId,
              eventType: 'RETURN_COMPLETED',
              message: `Order returned. Restock policies applied for items.`,
              actorId: actor,
            },
          })
        } else {
          // Standard transitions (PROCESSING, SHIPPED, DELIVERED)
          let eventType = 'STATUS_CHANGED'
          let msg = `Order fulfillment status updated from ${oldFul} to ${targetStatus}.`

          if (targetStatus === 'SHIPPED') {
            eventType = 'SHIPPING_UPDATED'
            msg = `Order shipped via courier. Tracking: ${trackingNumber || 'N/A'}.`
          } else if (targetStatus === 'DELIVERED') {
            msg = `Order delivered successfully.`
          }

          await tx.orderTimeline.create({
            data: {
              orderId,
              eventType,
              message: msg,
              actorId: actor,
            },
          })
        }
      }

      // Update cached customer summary statistics using shared helper based on before/after states
      if (currentOrder.customerId) {
        const nextPaymentStatus = targetPaymentStatus || currentOrder.paymentStatus
        // Special override: status cancellation/return forces payment to REFUNDED
        const nextFulfillmentStatus = targetStatus || currentOrder.status
        const finalPaymentStatus = (nextFulfillmentStatus === 'CANCELLED' || nextFulfillmentStatus === 'RETURNED') ? 'REFUNDED' : nextPaymentStatus

        await updateCustomerStats(
          tx,
          currentOrder.customerId,
          {
            paymentStatus: currentOrder.paymentStatus,
            status: currentOrder.status,
            total: currentOrder.total,
          },
          {
            paymentStatus: finalPaymentStatus,
            status: nextFulfillmentStatus,
            total: currentOrder.total,
          }
        )
      }

      // Update Order fields in DB
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: targetStatus || undefined,
          paymentStatus: (targetStatus === 'CANCELLED' || targetStatus === 'RETURNED') ? 'REFUNDED' : (targetPaymentStatus || undefined),
          trackingNumber: trackingNumber !== undefined ? trackingNumber : undefined,
          courierName: courierName !== undefined ? courierName : undefined,
          courierPhone: cleanCourierPhone,
          waybillNotes: waybillNotes !== undefined ? waybillNotes : undefined,
          shippingZoneId: nextShippingZoneId,
          shippingFee,
          shippingZoneNameSnapshot,
          estimatedDaysSnapshot,
          total: finalTotal,
        },
        include: {
          OrderItem: true,
        },
      })

      // Log global audit trail
      await tx.auditLog.create({
        data: {
          action: 'ORDER_STATUS_CHANGED',
          entity: 'Order',
          entityId: String(orderId),
          details: `Order #${currentOrder.orderNumber} status updated. Fulfillment: ${updated.status}, Payment: ${updated.paymentStatus}`,
          changedBy: actor,
        },
      })

      return updated
    }, { timeout: 30000, maxWait: 15000 })

    // 3. Dispatch events POST-COMMIT
    if (targetStatus && targetStatus !== currentOrder.status) {
      let evt: BusinessEventName = 'order.processing'
      if (targetStatus === 'SHIPPED') evt = 'order.shipped'
      else if (targetStatus === 'DELIVERED') evt = 'order.delivered'
      else if (targetStatus === 'CANCELLED') evt = 'order.cancelled'
      else if (targetStatus === 'RETURNED') evt = 'order.returned'

      await publishBusinessEvent(evt, { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber })
    }

    if (targetPaymentStatus && targetPaymentStatus !== currentOrder.paymentStatus) {
      if (targetPaymentStatus === 'PAID') {
        await publishBusinessEvent('order.paid', { orderId: updatedOrder.id, orderNumber: updatedOrder.orderNumber })
      } else {
        await publishBusinessEvent('order.payment_updated', { orderId: updatedOrder.id, paymentStatus: targetPaymentStatus })
      }
    }

    return NextResponse.json(updatedOrder)
  } catch (error: any) {
    console.error('Error updating order transactionally:', error)
    return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const authErr = await requireStaffAuth(request, 'orders')
  if (authErr) return authErr

  try {
    const orderId = parseInt(params.id, 10)
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        customerId: true,
        total: true,
        OrderItem: {
          select: {
            productId: true,
            quantity: true,
          },
        },
      },
    })

    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Pre-warm the database connection
    await prisma.$queryRaw`SELECT 1`

    // Execute Transaction
    await prisma.$transaction(async (tx) => {
      const actor = 'Admin'

      // 1. Revert stock allocations depending on current state
      const isPaid = currentOrder.paymentStatus === 'PAID'
      const isCancelled = currentOrder.status === 'CANCELLED'
      const isReturned = currentOrder.status === 'RETURNED'

      if (!isCancelled && !isReturned) {
        // Only revert stock if not already cancelled/returned
        for (const item of currentOrder.OrderItem) {
          if (isPaid) {
            await cancelPaidSale(tx, item.productId, item.quantity, actor)
          } else if (currentOrder.paymentStatus === 'UNPAID' || currentOrder.paymentStatus === 'PARTIALLY_PAID') {
            await releaseReservation(tx, item.productId, item.quantity, actor)
          }
        }
      }

      // 2. Update customer stats (remove this order from their totals)
      if (currentOrder.customerId) {
        await updateCustomerStats(
          tx,
          currentOrder.customerId,
          {
            paymentStatus: currentOrder.paymentStatus,
            status: currentOrder.status,
            total: currentOrder.total,
          },
          // The order no longer exists, so represent its "after" state as a
          // non-completed order. This correctly decrements completed-order counts.
          { paymentStatus: 'UNPAID', status: 'CANCELLED', total: 0 }
        )
      }

      // 3. Delete related records (foreign key dependencies)
      await tx.orderTimeline.deleteMany({ where: { orderId } })
      await tx.priceAdjustmentLog.deleteMany({ where: { orderId } })
      await tx.couponRedemption.deleteMany({ where: { orderId } })
      await tx.orderItem.deleteMany({ where: { orderId } })

      // 4. Delete the order
      await tx.order.delete({ where: { id: orderId } })

      // 5. Log audit trail
      await tx.auditLog.create({
        data: {
          action: 'ORDER_DELETED',
          entity: 'Order',
          entityId: String(orderId),
          details: `Order #${currentOrder.orderNumber} permanently deleted. Stock restored.`,
          changedBy: actor,
        },
      })
    }, { timeout: 30000, maxWait: 15000 })

    // Dispatch event POST-COMMIT
    await publishBusinessEvent('order.deleted', { orderId: currentOrder.id, orderNumber: currentOrder.orderNumber })

    return NextResponse.json({
      message: 'Order deleted successfully',
      orderNumber: currentOrder.orderNumber,
    })
  } catch (error: any) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete order' }, { status: 500 })
  }
}
