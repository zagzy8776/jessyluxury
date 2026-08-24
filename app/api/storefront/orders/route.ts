import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isCustomerAuthenticated } from '@/lib/auth'
import { reserveStock, InventoryConflictError } from '@/lib/orders/inventory'
import { normalizePhoneNumber } from '@/lib/orders/phone'
import { publishBusinessEvent } from '@/lib/orders/events'
import { resolveWholesaleUnitPrice } from '@/lib/wholesale/pricing'
import { couponAudienceError } from '@/lib/wholesale/pricing'

function isPublicShippingZone(name: string) {
  return !/e2e|test|fixture|smoke/i.test(name)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const customerName = String(body.customerName || '').trim()
    const customerPhone = String(body.customerPhone || '').trim()
    const customerWhatsapp = String(body.customerWhatsapp || body.customerPhone || '').trim()
    const shippingAddress = String(body.shippingAddress || '').trim()
    const shippingZoneId = Number(body.shippingZoneId)
    const couponCode = String(body.couponCode || '').trim().toUpperCase()
    const items = Array.isArray(body.items) ? body.items : []

    if (customerName.length < 2 || customerName.length > 160) {
      return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 })
    }

    if (!customerPhone) {
      return NextResponse.json({ error: 'Please enter your phone number' }, { status: 400 })
    }

    if (!Number.isInteger(shippingZoneId) || shippingZoneId <= 0) {
      return NextResponse.json({ error: 'Please select a delivery option' }, { status: 400 })
    }

    if (items.length === 0 || items.length > 30) {
      return NextResponse.json({ error: 'Your cart is empty or too large to process' }, { status: 400 })
    }

    const parsedItems = items.map((item: any) => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity),
    }))

    for (const item of parsedItems) {
      if (!Number.isInteger(item.productId) || item.productId <= 0) {
        return NextResponse.json({ error: 'Invalid product in cart' }, { status: 400 })
      }
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 50) {
        return NextResponse.json({ error: 'Invalid quantity in cart' }, { status: 400 })
      }
    }

    const cleanPhone = normalizePhoneNumber(customerPhone)
    const cleanWhatsapp = normalizePhoneNumber(customerWhatsapp || customerPhone)
    const productIds = Array.from(new Set(parsedItems.map((item) => item.productId)))

    await prisma.$queryRaw`SELECT 1`

    const zone = await prisma.shippingZone.findUnique({ where: { id: shippingZoneId } })
    if (!zone || !zone.active || !isPublicShippingZone(zone.name)) {
      return NextResponse.json({ error: 'That delivery option is no longer available' }, { status: 400 })
    }

    if (!zone.isPickup && !shippingAddress) {
      return NextResponse.json({ error: 'Please enter your delivery address' }, { status: 400 })
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        brand: true,
        price: true,
        salePrice: true,
        costPrice: true,
        categoryId: true,
        stock: true,
        reserved: true,
      },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more items are no longer available' }, { status: 409 })
    }

    const productMap = new Map(products.map((product) => [product.id, product]))
    const existingCustomer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
      include: { CustomerGroup: true },
    })

    const isWholesaleBuyer = Boolean(existingCustomer?.CustomerGroup?.isActive)
    const customerGroupId = isWholesaleBuyer ? existingCustomer?.customerGroupId ?? null : null

    const pricedItems = [] as Array<{
      productId: number
      quantity: number
      unitPrice: number
      name: string
      brand: string
      costPrice: number | null
      categoryId: number
    }>

    let subtotal = 0

    for (const item of parsedItems) {
      const product = productMap.get(item.productId)!
      const retailPrice = product.salePrice ?? product.price
      const unitPrice = await resolveWholesaleUnitPrice({
        customerGroupId,
        productId: product.id,
        categoryId: product.categoryId,
        quantity: item.quantity,
        retailPrice,
      })

      pricedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        name: product.name,
        brand: product.brand,
        costPrice: product.costPrice,
        categoryId: product.categoryId,
      })
      subtotal += unitPrice * item.quantity
    }

    let verifiedCoupon: any = null
    let calculatedCouponDiscount = 0

    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
        include: { Campaign: { where: { isActive: true }, take: 1 } },
      })

      if (!coupon || !coupon.isActive) {
        return NextResponse.json({ error: 'That coupon is not available' }, { status: 400 })
      }

      const audienceError = couponAudienceError(Boolean(coupon.wholesaleEligible), isWholesaleBuyer)
      if (audienceError) {
        return NextResponse.json({ error: audienceError }, { status: 400 })
      }

      const now = new Date()
      if (coupon.startDate && now < coupon.startDate) {
        return NextResponse.json({ error: 'This promotion has not started yet' }, { status: 400 })
      }
      if (coupon.endDate && now > coupon.endDate) {
        return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 })
      }
      if (coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json({ error: 'This coupon has reached its redemption limit' }, { status: 400 })
      }
      if (subtotal < coupon.minOrderAmount) {
        return NextResponse.json({
          error: `A minimum order of ₦${coupon.minOrderAmount.toLocaleString('en-NG')} is required for this coupon`,
        }, { status: 400 })
      }

      const hasProductRestrictions = coupon.productIds.length > 0
      const hasCategoryRestrictions = coupon.categoryIds.length > 0
      let eligibleSubtotal = 0

      for (const item of pricedItems) {
        const productMatch = !hasProductRestrictions || coupon.productIds.includes(item.productId)
        const categoryMatch = !hasCategoryRestrictions || coupon.categoryIds.includes(item.categoryId)
        const eligible = (!hasProductRestrictions && !hasCategoryRestrictions) || productMatch || categoryMatch
        if (eligible) eligibleSubtotal += item.unitPrice * item.quantity
      }

      if (eligibleSubtotal <= 0) {
        return NextResponse.json({ error: 'No items in your cart qualify for this coupon' }, { status: 400 })
      }

      if (coupon.discountType === 'PERCENTAGE') {
        calculatedCouponDiscount = Math.round((eligibleSubtotal * coupon.discountValue) / 100)
        if (coupon.maxDiscountAmount != null) {
          calculatedCouponDiscount = Math.min(calculatedCouponDiscount, coupon.maxDiscountAmount)
        }
      } else {
        calculatedCouponDiscount = Math.min(coupon.discountValue, eligibleSubtotal)
      }

      const customerIdForLimit = existingCustomer?.id
      if (customerIdForLimit) {
        const redemptionCount = await prisma.couponRedemption.count({
          where: { couponId: coupon.id, customerId: customerIdForLimit },
        })
        if (redemptionCount >= coupon.customerLimit) {
          return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 })
        }
      }

      verifiedCoupon = coupon
    }

    const shippingFee = zone.fee
    const total = Math.max(0, subtotal - calculatedCouponDiscount + shippingFee)
    const trackingToken = `track_${crypto.randomUUID().replace(/-/g, '')}`
    const orderNumber = `JL-${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 10)}`

    const customer = await prisma.$transaction(async (tx) => {
      let customerRecord = await tx.customer.findUnique({
        where: { phone: cleanPhone },
        include: { CustomerGroup: true },
      })

      if (customerRecord) {
        customerRecord = await tx.customer.update({
          where: { id: customerRecord.id },
          data: {
            name: customerName,
            whatsapp: cleanWhatsapp,
            address: shippingAddress || customerRecord.address,
          },
          include: { CustomerGroup: true },
        })
      } else {
        customerRecord = await tx.customer.create({
          data: {
            name: customerName,
            phone: cleanPhone,
            whatsapp: cleanWhatsapp,
            address: shippingAddress || null,
            acquisitionSource: 'Website',
            updatedAt: new Date(),
          },
          include: { CustomerGroup: true },
        })
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: customerRecord.id,
          customerName,
          customerPhone: cleanPhone,
          customerWhatsapp: cleanWhatsapp,
          shippingAddress: shippingAddress || null,
          shippingZoneId: zone.id,
          shippingFee,
          shippingZoneNameSnapshot: zone.name,
          estimatedDaysSnapshot: zone.estimatedDays,
          trackingNumber: null,
          trackingToken,
          subtotal,
          discountAmount: calculatedCouponDiscount,
          couponCode: verifiedCoupon?.code ?? null,
          couponDiscount: calculatedCouponDiscount,
          couponId: verifiedCoupon?.id ?? null,
          total,
          paymentStatus: 'PENDING',
          status: 'PENDING',
          salesChannel: 'Online Store',
          customerGroupIdSnapshot: customerRecord.customerGroupId,
          customerGroupCodeSnapshot: customerRecord.CustomerGroup?.code ?? null,
          customerGroupNameSnapshot: customerRecord.CustomerGroup?.name ?? null,
          isWholesaleOrderSnapshot: Boolean(customerRecord.CustomerGroup?.isActive),
          updatedAt: new Date(),
          OrderItem: {
            create: pricedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.unitPrice,
              unitCost: item.costPrice,
              productNameSnapshot: item.name,
              brandSnapshot: item.brand,
            })),
          },
        },
      })

      for (const item of pricedItems) {
        await reserveStock(tx, item.productId, item.quantity, 'Website')
      }

      if (verifiedCoupon) {
        const affectedRows = await tx.$executeRaw`
          UPDATE "Coupon"
          SET "usedCount" = "usedCount" + 1
          WHERE "id" = ${verifiedCoupon.id}
            AND "isActive" = true
            AND "usedCount" < "usageLimit"
        `

        if (affectedRows === 0) {
          throw new Error('Coupon limit has been reached')
        }

        const existingRedemption = await tx.couponRedemption.findFirst({
          where: { couponId: verifiedCoupon.id, customerId: customerRecord.id },
        })

        if (existingRedemption && verifiedCoupon.customerLimit <= 1) {
          throw new Error('You have already used this coupon')
        }

        await tx.couponRedemption.create({
          data: {
            couponId: verifiedCoupon.id,
            customerId: customerRecord.id,
            orderId: newOrder.id,
            campaignId: verifiedCoupon.Campaign?.[0]?.id ?? null,
          },
        })

        await tx.orderTimeline.create({
          data: {
            orderId: newOrder.id,
            eventType: 'DISCOUNT_APPLIED',
            message: `Coupon ${verifiedCoupon.code} applied. Discount: ₦${calculatedCouponDiscount.toLocaleString('en-NG')}`,
          },
        })
      }

      await tx.orderTimeline.create({
        data: {
          orderId: newOrder.id,
          eventType: 'ORDER_RECEIVED',
          message: 'Online order received from storefront',
          actorId: 'Website',
        },
      })

      return customerRecord
    }, {
      maxWait: 15000,
      timeout: 30000,
    })

    const createdOrder = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentStatus: true,
        status: true,
        trackingToken: true,
      },
    })

    if (!createdOrder) {
      return NextResponse.json({ error: 'Order could not be confirmed' }, { status: 500 })
    }

    await publishBusinessEvent('order.created', {
      orderId: createdOrder.id,
      orderNumber: createdOrder.orderNumber,
      total: createdOrder.total,
      customerName,
      customerId: customer.id,
      isAuthenticated: Boolean(await isCustomerAuthenticated(request)),
    })

    return NextResponse.json({
      success: true,
      orderNumber: createdOrder.orderNumber,
      orderId: createdOrder.id,
      total: createdOrder.total,
      paymentStatus: createdOrder.paymentStatus,
      trackingToken: createdOrder.trackingToken,
      payment: {
        message: 'Order received. Payment details will be shown after your order is confirmed.',
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof InventoryConflictError) {
      return NextResponse.json({ error: 'One or more items are no longer available in the requested quantity' }, { status: 409 })
    }
    const message = error instanceof Error ? error.message : 'Could not place your order'
    if (/coupon|already used|limit has been reached/i.test(message)) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    console.error('[STOREFRONT_ORDER] create error:', error)
    return NextResponse.json({ error: 'We could not place your order right now. Please try again.' }, { status: 500 })
  }
}
