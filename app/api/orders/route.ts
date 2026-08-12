import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
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
      paymentStatus = 'PAID',
      items,
    } = body

    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Customer name, phone and items are required' },
        { status: 400 }
      )
    }

    const cleanPhone = customerPhone.replace(/\D/g, '')
    const cleanWhatsapp = (customerWhatsapp || customerPhone).replace(/\D/g, '')
    const orderNumber = `JL-${Math.floor(100000 + Math.random() * 900000)}`
    const total = subtotal - discountAmount + shippingFee

    // 1. Create or update Customer profile
    let customer = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    })

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: customerName,
          whatsapp: cleanWhatsapp,
          address: shippingAddress || customer.address,
          totalSpent: customer.totalSpent + total,
          ordersCount: customer.ordersCount + 1,
        },
      })
    } else {
      customer = await prisma.customer.create({
        data: {
          name: customerName,
          phone: cleanPhone,
          whatsapp: cleanWhatsapp,
          address: shippingAddress || null,
          totalSpent: total,
          ordersCount: 1,
        },
      })
    }

    // 2. Create Order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        customerName,
        customerPhone: cleanPhone,
        customerWhatsapp: cleanWhatsapp,
        shippingAddress,
        shippingZoneId: shippingZoneId ? Number(shippingZoneId) : null,
        shippingFee: Number(shippingFee),
        subtotal: Number(subtotal),
        discountAmount: Number(discountAmount),
        couponCode: couponCode || null,
        total: Number(total),
        paymentStatus,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            price: Number(item.price),
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        shippingZone: true,
      },
    })

    // 3. Update coupon usage if code was used
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase().trim() },
      })
      if (coupon) {
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: coupon.usedCount + 1 },
        })
      }
    }

    // 4. Update stock levels for products
    for (const item of items) {
      try {
        await prisma.product.update({
          where: { id: Number(item.productId) },
          data: { stock: { decrement: Number(item.quantity) } },
        })
      } catch (e) {
        console.warn(`Could not update stock for product ${item.productId}`, e)
      }
    }

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (status && status !== 'ALL') {
      where.status = status
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
