import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'
import { InventoryConflictError, reserveStock, sellStockDirect } from '@/lib/orders/inventory'
import { validateAndLogPricing } from '@/lib/orders/pricing'
import { publishBusinessEvent } from '@/lib/orders/events'
import { normalizePhoneNumber } from '@/lib/orders/phone'
import { updateCustomerStats } from '@/lib/orders/customer-stats'

export async function POST(request: Request) {
  const authErr = await requireAdminAuth(request)
  if (authErr) return authErr

  try {
    const body = await request.json()
    const {
      customerName,
      customerPhone,
      customerWhatsapp,
      shippingAddress,
      shippingZoneId,
      shippingFee = 0,
      subtotal,
      discountAmount = 0,
      couponCode,
      paymentStatus = 'PAID', // PAID, PARTIALLY_PAID, UNPAID, PENDING
      items,
      source = 'Manual', // Optional acquisition source from POS
      salesChannel = 'Online Store', // Online Store, WhatsApp, Instagram, Physical, Other
    } = body

    // 1. Basic required fields validation
    if (!customerName || !customerPhone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer name, phone and order items are required' },
        { status: 400 }
      )
    }

    // 2. Numerical values validations
    if (!Number.isInteger(subtotal) || subtotal < 0) {
      return NextResponse.json({ error: 'Subtotal must be a non-negative integer' }, { status: 400 })
    }
    if (!Number.isInteger(discountAmount) || discountAmount < 0) {
      return NextResponse.json({ error: 'Discount amount must be a non-negative integer' }, { status: 400 })
    }
    if (!Number.isInteger(shippingFee) || shippingFee < 0) {
      return NextResponse.json({ error: 'Shipping fee must be a non-negative integer' }, { status: 400 })
    }

    // Validate each order item positive integers
    for (const item of items) {
      const pId = Number(item.productId)
      const qty = Number(item.quantity)
      const prc = Number(item.price)

      if (isNaN(pId) || !Number.isInteger(pId) || pId <= 0) {
        return NextResponse.json({ error: `Invalid product ID: ${item.productId}` }, { status: 400 })
      }
      if (isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
        return NextResponse.json({ error: `Quantity must be a positive integer: ${item.quantity}` }, { status: 400 })
      }
      if (isNaN(prc) || !Number.isInteger(prc) || prc < 0) {
        return NextResponse.json({ error: `Price must be a non-negative integer: ${item.price}` }, { status: 400 })
      }
    }

    // Pre-warm the Neon PostgreSQL serverless connection before opening a transaction
    // Without this, a cold-start DB can take 5-15s causing the interactive transaction to expire
    await prisma.$queryRaw`SELECT 1`

    // Fetch and validate shipping zone if provided
    let calculatedShippingFee = Number(shippingFee) || 0
    let shippingZoneNameSnapshot = null
    let estimatedDaysSnapshot = null
    let verifiedZoneId = null

    if (shippingZoneId) {
      const zone = await prisma.shippingZone.findUnique({
        where: { id: Number(shippingZoneId) },
      })
      if (!zone) {
        return NextResponse.json({ error: 'Shipping zone not found' }, { status: 400 })
      }
      if (!zone.active) {
        return NextResponse.json({ error: 'Shipping zone is inactive' }, { status: 400 })
      }
      calculatedShippingFee = zone.fee
      shippingZoneNameSnapshot = zone.name
      estimatedDaysSnapshot = zone.estimatedDays
      verifiedZoneId = zone.id
    }

    // Normalize phone and whatsapp numbers server-side
    const cleanPhone = normalizePhoneNumber(customerPhone)
    const cleanWhatsapp = normalizePhoneNumber(customerWhatsapp || customerPhone)
    const orderNumber = `JL-${Math.floor(100000 + Math.random() * 900000)}`

    // Pre-fetch product snapshot data (cost, name, brand) BEFORE the transaction
    // so we capture immutable historical values at the time of sale
            const productIds = Array.from(new Set(items.map((i: any) => Number(i.productId))))
    const productSnapshots = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, brand: true, costPrice: true, categoryId: true },
    })
    const snapshotMap = Object.fromEntries(productSnapshots.map((p) => [p.id, p]))

    // 2.5 Server-side recalculation of coupon if provided
    let verifiedCoupon: any = null
    let calculatedCouponDiscount = 0

    if (couponCode) {
      const codeUpper = couponCode.toUpperCase().trim()
      const dbCoupon = await prisma.coupon.findUnique({
        where: { code: codeUpper },
        include: { campaigns: { where: { isActive: true }, take: 1 } },
      })

      if (!dbCoupon) {
        return NextResponse.json({ error: 'Coupon code not found' }, { status: 404 })
      }
      if (!dbCoupon.isActive) {
        return NextResponse.json({ error: 'Coupon code is disabled' }, { status: 400 })
      }

      // Timezone boundary check (Africa/Lagos = UTC+1)
      const nowUtc = new Date()
      const LAGOS_OFFSET = 1 * 60 * 60 * 1000
      const nowLagos = new Date(nowUtc.getTime() + LAGOS_OFFSET)

      if (dbCoupon.startDate) {
        const startLagos = new Date(new Date(dbCoupon.startDate).getTime() + LAGOS_OFFSET)
        if (nowLagos < startLagos) {
          return NextResponse.json({ error: 'This coupon promotion has not started yet' }, { status: 400 })
        }
      }
      if (dbCoupon.endDate) {
        const endLagos = new Date(new Date(dbCoupon.endDate).getTime() + LAGOS_OFFSET)
        if (nowLagos > endLagos) {
          return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
        }
      }

      // Check global limit
      if (dbCoupon.usedCount >= dbCoupon.usageLimit) {
        return NextResponse.json({ error: 'This coupon limit has been fully redeemed' }, { status: 400 })
      }

      // Check minOrderAmount against the total subtotal
      if (Number(subtotal) < dbCoupon.minOrderAmount) {
        return NextResponse.json({
          error: `Minimum subtotal of ₦${dbCoupon.minOrderAmount.toLocaleString('en-NG')} required for coupon`,
        }, { status: 400 })
      }

      // Calculate eligible subtotal based on product/category restrictions (OR logic)
      let eligibleSubtotal = 0
      let hasEligibleItems = false
      const hasProdRestrictions = dbCoupon.productIds && dbCoupon.productIds.length > 0
      const hasCatRestrictions = dbCoupon.categoryIds && dbCoupon.categoryIds.length > 0

      for (const item of items) {
        const pid = Number(item.productId)
        const snap = snapshotMap[pid]
        const cid = snap?.categoryId

        const matchesProduct = !hasProdRestrictions || dbCoupon.productIds.includes(pid)
        const matchesCategory = !hasCatRestrictions || (cid && dbCoupon.categoryIds.includes(cid))
        const isEligible = (!hasProdRestrictions && !hasCatRestrictions) || matchesProduct || matchesCategory

        if (isEligible) {
          eligibleSubtotal += Number(item.price) * Number(item.quantity)
          hasEligibleItems = true
        }
      }

      if (!hasEligibleItems) {
        return NextResponse.json({ error: 'No items in the cart are eligible for this coupon' }, { status: 400 })
      }

      // Calculate discount amount
      if (dbCoupon.discountType === 'PERCENTAGE') {
        calculatedCouponDiscount = Math.round((eligibleSubtotal * dbCoupon.discountValue) / 100)
        if (dbCoupon.maxDiscountAmount !== null && dbCoupon.maxDiscountAmount !== undefined) {
          calculatedCouponDiscount = Math.min(calculatedCouponDiscount, dbCoupon.maxDiscountAmount)
        }
      } else {
        calculatedCouponDiscount = Math.min(dbCoupon.discountValue, eligibleSubtotal)
      }

      verifiedCoupon = dbCoupon
    }

    const finalDiscount = verifiedCoupon ? calculatedCouponDiscount : Number(discountAmount)
    const finalTotal = Number(subtotal) - finalDiscount + calculatedShippingFee

    // 3. Execute Transaction
    // timeout/maxWait extended for Neon serverless cold-start (can take 5-15s on free tier)
    const order = await prisma.$transaction(async (tx) => {
      // Create or update Customer profile
      let customer = await tx.customer.findUnique({
        where: { phone: cleanPhone },
      })

      if (customer) {
        customer = await tx.customer.update({
          where: { id: customer.id },
          data: {
            name: customerName,
            whatsapp: cleanWhatsapp,
            address: shippingAddress || customer.address,
          },
        })
      } else {
        customer = await tx.customer.create({
          data: {
            name: customerName,
            phone: cleanPhone,
            whatsapp: cleanWhatsapp,
            address: shippingAddress || null,
            acquisitionSource: source || 'Manual',
            totalSpent: 0,
            ordersCount: 0,
          },
        })
      }

      // Create Order record
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customer.id,
          customerName,
          customerPhone: cleanPhone,
          customerWhatsapp: cleanWhatsapp,
          shippingAddress,
          shippingZoneId: verifiedZoneId,
          shippingFee: calculatedShippingFee,
          shippingZoneNameSnapshot,
          estimatedDaysSnapshot,
          trackingToken: 'track_' + require('crypto').randomUUID().replace(/-/g, ''),
          subtotal: Number(subtotal),
          discountAmount: finalDiscount,
          couponCode: verifiedCoupon ? verifiedCoupon.code : null,
          couponDiscount: calculatedCouponDiscount,
          couponId: verifiedCoupon ? verifiedCoupon.id : null,
          total: finalTotal,
          paymentStatus,
          status: 'PENDING',
          salesChannel,
          items: {
            create: items.map((item: any) => {
              const snap = snapshotMap[Number(item.productId)]
              return {
                productId: Number(item.productId),
                quantity: Number(item.quantity),
                price: Number(item.price),
                // Historical snapshots — immutable at sale time
                unitCost: snap?.costPrice ?? null,
                productNameSnapshot: snap?.name ?? null,
                brandSnapshot: snap?.brand ?? null,
              }
            }),
          },
        },
        include: {
          items: true,
        },
      })

      // Update cached customer summary statistics using shared state machine transition
      await updateCustomerStats(
        tx,
        customer.id,
        null, // No previous order state exists
        { paymentStatus, status: 'PENDING', total: finalTotal }
      )

      // Validate pricing overrides and manage stock level allocations
      for (const item of items) {
        const productId = Number(item.productId)
        const quantity = Number(item.quantity)
        const price = Number(item.price)

        // Log manual POS override adjustments
        await validateAndLogPricing(tx, newOrder.id, productId, quantity, price, 'Admin')

        // Enforce stock adjustments
        if (paymentStatus === 'PAID') {
          // Decrement On Hand immediately
          await sellStockDirect(tx, productId, quantity, 'Admin')
        } else {
          // Unpaid / Partially Paid reserves available stock
          await reserveStock(tx, productId, quantity, 'Admin')
        }
      }

      // Update coupon usage if applicable
      if (verifiedCoupon) {
        // Enforce customer Limit inside the transaction (concurrency-safe checks)
        const redemptionsCount = await tx.couponRedemption.count({
          where: {
            couponId: verifiedCoupon.id,
            customerId: customer.id,
          },
        })

        if (redemptionsCount >= verifiedCoupon.customerLimit) {
          throw new Error(`You have reached the usage limit for this coupon code`)
        }

        // Atomic PostgreSQL update with condition checks (to prevent concurrency race over-redemption)
        const affectedRows = await tx.$executeRaw`
          UPDATE "Coupon"
          SET "usedCount" = "usedCount" + 1
          WHERE "id" = ${verifiedCoupon.id} AND "isActive" = true AND "usedCount" < "usageLimit"
        `

        if (affectedRows === 0) {
          throw new Error('Coupon limit has been reached by another user')
        }

        // Record singular CouponRedemption map (with campaign attribution)
        const activeCampaign = verifiedCoupon.campaigns?.[0]
        await tx.couponRedemption.create({
          data: {
            couponId: verifiedCoupon.id,
            customerId: customer.id,
            orderId: newOrder.id,
            campaignId: activeCampaign ? activeCampaign.id : null,
          },
        })

        await tx.orderTimeline.create({
          data: {
            orderId: newOrder.id,
            eventType: 'DISCOUNT_APPLIED',
            message: `Coupon ${verifiedCoupon.code} applied. Discount: ₦${calculatedCouponDiscount.toLocaleString('en-NG')}`,
            actorId: 'Admin',
          },
        })
      }

      // Log Order Timeline
      await tx.orderTimeline.create({
        data: {
          orderId: newOrder.id,
          eventType: 'ORDER_CREATED',
          message: `Order #${orderNumber} created successfully. Payment: ${paymentStatus}.`,
          actorId: 'Admin',
        },
      })

      // Log global audit trail
      await tx.auditLog.create({
        data: {
          action: 'ORDER_CREATED',
          entity: 'Order',
          entityId: String(newOrder.id),
          details: `Order #${orderNumber} created for customer ${customerName} (Total: ₦${finalTotal.toLocaleString()})`,
          changedBy: 'Admin',
        },
      })

      return newOrder
    }, {
      timeout: 30000, // 30s transaction timeout for Neon cold-start
      maxWait: 15000, // 15s max time waiting to acquire transaction connection
    })

    // 4. Publish business events POST-COMMIT
    await publishBusinessEvent('order.created', { orderId: order.id, orderNumber: order.orderNumber, total: order.total })
    if (order.paymentStatus === 'PAID') {
      await publishBusinessEvent('order.paid', { orderId: order.id, orderNumber: order.orderNumber, total: order.total })
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error: any) {
    console.error('Error creating transactional order:', error)
    if (error instanceof InventoryConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const authError = await requireAdminAuth(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const search = searchParams.get('search')

    const where: any = {}

    if (status && status !== 'ALL') {
      where.status = status
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      where.paymentStatus = paymentStatus
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingZone: true,
        customer: true,
        timeline: {
          orderBy: { createdAt: 'desc' },
        },
        priceAdjustments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
