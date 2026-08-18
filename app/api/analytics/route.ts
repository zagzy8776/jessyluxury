import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth'
import {
  type AnalyticsRange,
  type AnalyticsPayload,
  completedOrderWhere,
  getDateBounds,
} from '@/lib/analytics/domain'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function dateFilter(start: Date | null, end: Date) {
  return start ? { gte: start, lte: end } : { lte: end }
}

// ─── Sales Metrics ───────────────────────────────────────────────────────────

async function getSalesMetrics(start: Date | null, end: Date, range: AnalyticsRange) {
  const createdAt = dateFilter(start, end)

  const orders = await prisma.order.findMany({
    where: { ...completedOrderWhere, createdAt },
    orderBy: { createdAt: 'asc' },
    select: {
      total: true,
      discountAmount: true,
      createdAt: true,
      items: {
        select: {
          price: true,
          unitCost: true,
          quantity: true,
        },
      },
    },
  })

  const grossRevenue = orders.reduce((s: number, o: any) => s + o.total, 0)
  const discountsGiven = orders.reduce((s: number, o: any) => s + (o.discountAmount || 0), 0)
  const completedOrders = orders.length
  const averageOrderValue = completedOrders > 0 ? Math.round(grossRevenue / completedOrders) : 0

  // Gross Product Profit — only calculable where unitCost is known
  let grossProductProfit: number | null = null
  let profitKnownCount = 0
  for (const o of orders) {
    for (const item of (o as any).items) {
      if (item.unitCost !== null && item.unitCost !== undefined) {
        if (grossProductProfit === null) grossProductProfit = 0
        grossProductProfit += (item.price - item.unitCost) * item.quantity
        profitKnownCount++
      }
    }
  }

  const profitAfterDiscounts =
    grossProductProfit !== null ? grossProductProfit - discountsGiven : null

  // Trend: group revenue & order count by day/week/month based on range
  const trendMap: Record<string, { revenue: number; orders: number }> = {}
  for (const o of orders) {
    const d = new Date((o as any).createdAt)
    // Africa/Lagos = UTC+1
    const lagosD = new Date(d.getTime() + 60 * 60 * 1000)
    let label: string
    if (range === 'Today') {
      label = lagosD.toISOString().slice(11, 13) + ':00' // hour
    } else if (range === 'Last 7 Days' || range === 'Last 30 Days') {
      label = lagosD.toISOString().slice(0, 10) // YYYY-MM-DD
    } else {
      // This Year / All Time — group by month
      label = lagosD.toISOString().slice(0, 7) // YYYY-MM
    }
    if (!trendMap[label]) trendMap[label] = { revenue: 0, orders: 0 }
    trendMap[label].revenue += (o as any).total
    trendMap[label].orders += 1
  }
  const trend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, v]) => ({ label, ...v }))

  return {
    grossRevenue,
    grossProductProfit,
    discountsGiven,
    profitAfterDiscounts,
    completedOrders,
    averageOrderValue,
    trend,
    profitCoverageNote:
      profitKnownCount === 0 && orders.length > 0
        ? 'Cost data unavailable for this period'
        : null,
  }
}

// ─── Product Metrics ─────────────────────────────────────────────────────────

async function getProductMetrics(start: Date | null, end: Date) {
  const createdAt = dateFilter(start, end)

  // Aggregate item-level data for completed orders in the period
  const items = await prisma.orderItem.findMany({
    where: {
      order: { ...completedOrderWhere, createdAt },
    },
    include: {
      product: { select: { id: true, name: true, brand: true, category: { select: { name: true } }, stock: true } },
    },
  })

  // Best sellers by product
  const productMap: Record<number, {
    productId: number; name: string; brand: string; category: string
    unitsSold: number; revenue: number; grossProfit: number | null; profitKnown: boolean
  }> = {}

  for (const item of items) {
    const pid = item.productId
    const name = item.productNameSnapshot ?? item.product?.name ?? `Product #${pid}`
    const brand = item.brandSnapshot ?? item.product?.brand ?? 'Unknown'
    const category = item.product?.category?.name ?? 'Uncategorised'
    if (!productMap[pid]) {
      productMap[pid] = { productId: pid, name, brand, category, unitsSold: 0, revenue: 0, grossProfit: null, profitKnown: false }
    }
    productMap[pid].unitsSold += item.quantity
    productMap[pid].revenue += item.price * item.quantity
    if (item.unitCost !== null && item.unitCost !== undefined) {
      if (productMap[pid].grossProfit === null) productMap[pid].grossProfit = 0
      productMap[pid].grossProfit! += (item.price - item.unitCost) * item.quantity
      productMap[pid].profitKnown = true
    }
  }

  const productList = Object.values(productMap)
  const bestSellers = [...productList]
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 20)
    .map(({ productId, name, brand, unitsSold, revenue, grossProfit }) => ({
      productId, name, brand, unitsSold, revenue, grossProfit,
    }))

  // Revenue by brand
  const brandMap: Record<string, { revenue: number; units: number }> = {}
  for (const p of productList) {
    if (!brandMap[p.brand]) brandMap[p.brand] = { revenue: 0, units: 0 }
    brandMap[p.brand].revenue += p.revenue
    brandMap[p.brand].units += p.unitsSold
  }
  const revenueByBrand = Object.entries(brandMap)
    .map(([brand, v]) => ({ brand, ...v }))
    .sort((a, b) => b.revenue - a.revenue)

  // Revenue by category
  const catMap: Record<string, { revenue: number; units: number }> = {}
  for (const p of productList) {
    if (!catMap[p.category]) catMap[p.category] = { revenue: 0, units: 0 }
    catMap[p.category].revenue += p.revenue
    catMap[p.category].units += p.unitsSold
  }
  const revenueByCategory = Object.entries(catMap)
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.revenue - a.revenue)

  // Low performers: products with 0 units sold OR in the bottom 10% by units
  const allProductIds = await prisma.product.findMany({
    select: { id: true, name: true, brand: true, stock: true },
  })
  const soldIds = new Set(productList.map((p) => p.productId))
  const unitCounts = productList.map((p) => p.unitsSold)
  const p10 = unitCounts.length > 0
    ? [...unitCounts].sort((a, b) => a - b)[Math.floor(unitCounts.length * 0.1)]
    : 0

  const lowPerformers = allProductIds
    .filter((p) => {
      const sold = productMap[p.id]?.unitsSold ?? 0
      return sold === 0 || sold <= p10
    })
    .map((p) => ({
      productId: p.id,
      name: p.name,
      brand: p.brand,
      stock: p.stock,
      unitsSold: productMap[p.id]?.unitsSold ?? 0,
    }))
    .sort((a, b) => a.unitsSold - b.unitsSold)
    .slice(0, 20)

  return { bestSellers, revenueByBrand, revenueByCategory, lowPerformers }
}

// ─── Customer Metrics ─────────────────────────────────────────────────────────

async function getCustomerMetrics(start: Date | null, end: Date) {
  const createdAt = dateFilter(start, end)

  // All completed orders in range (with customer id)
  const ordersInRange = await prisma.order.findMany({
    where: { ...completedOrderWhere, createdAt, customerId: { not: null } },
    select: { customerId: true, total: true, createdAt: true },
  })

    const customerIdsInRange = Array.from(new Set(ordersInRange.map((o) => o.customerId!)))

  // New customers: first completed order falls within range
  let newCustomers = 0
  let returningCustomers = 0
  let oneTimeCustomers = 0

  for (const cid of customerIdsInRange) {
    const allCompleted = await prisma.order.findMany({
      where: { ...completedOrderWhere, customerId: cid },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const firstOrder = allCompleted[0]
    const beforeRange = start
      ? allCompleted.filter((o) => o.createdAt < start)
      : []

    if (!firstOrder) continue

    const inRange = allCompleted.filter((o) =>
      (!start || o.createdAt >= start) && o.createdAt <= end
    )

    if (beforeRange.length === 0 && inRange.length >= 1) newCustomers++
    else if (beforeRange.length >= 1 && inRange.length >= 1) returningCustomers++

    if (allCompleted.length === 1) oneTimeCustomers++
  }

  // Top clients by spend in range
  const clientMap: Record<number, { spend: number; orders: number; lastOrder: Date }> = {}
  for (const o of ordersInRange) {
    const cid = o.customerId!
    if (!clientMap[cid]) clientMap[cid] = { spend: 0, orders: 0, lastOrder: new Date(o.createdAt) }
    clientMap[cid].spend += o.total
    clientMap[cid].orders += 1
    if (new Date(o.createdAt) > clientMap[cid].lastOrder) {
      clientMap[cid].lastOrder = new Date(o.createdAt)
    }
  }

  const topClientIds = Object.entries(clientMap)
    .sort(([, a], [, b]) => b.spend - a.spend)
    .slice(0, 10)
    .map(([cid]) => Number(cid))

  const customerProfiles = await prisma.customer.findMany({
    where: { id: { in: topClientIds } },
    select: { id: true, name: true, phone: true },
  })
  const profileMap = Object.fromEntries(customerProfiles.map((c) => [c.id, c]))

  const topClients = topClientIds.map((cid) => {
    const p = profileMap[cid]
    const m = clientMap[cid]
    return {
      customerId: cid,
      name: p?.name ?? 'Unknown',
      phone: p?.phone ?? '',
      orders: m.orders,
      spend: m.spend,
      aov: Math.round(m.spend / m.orders),
      lastOrder: m.lastOrder.toISOString().slice(0, 10),
    }
  })

  return { newCustomers, returningCustomers, oneTimeCustomers, topClients }
}

// ─── Channel Metrics ──────────────────────────────────────────────────────────

async function getChannelMetrics(start: Date | null, end: Date) {
  const createdAt = dateFilter(start, end)

  const orders = await prisma.order.findMany({
    where: { ...completedOrderWhere, createdAt },
    select: { salesChannel: true, total: true },
  })

  const channelMap: Record<string, { orders: number; revenue: number }> = {}
  let totalRevenue = 0

  for (const o of orders) {
    const ch = (o as any).salesChannel ?? 'Unknown'
    if (!channelMap[ch]) channelMap[ch] = { orders: 0, revenue: 0 }
    channelMap[ch].orders += 1
    channelMap[ch].revenue += o.total
    totalRevenue += o.total
  }

  const channels = Object.entries(channelMap)
    .map(([channel, v]) => ({
      channel,
      orders: v.orders,
      revenue: v.revenue,
      share: totalRevenue > 0 ? Math.round((v.revenue / totalRevenue) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return { channels }
}

// ─── Marketing Metrics ────────────────────────────────────────────────────────

async function getMarketingMetrics(start: Date | null, end: Date) {
  const createdAt = dateFilter(start, end)

  const orders = await prisma.order.findMany({
    where: { ...completedOrderWhere, createdAt, couponCode: { not: null } },
    select: { couponCode: true, total: true, discountAmount: true },
  })

  const couponMap: Record<string, { timesUsed: number; revenueInfluenced: number; totalDiscountGiven: number }> = {}

  for (const o of orders) {
    const code = (o as any).couponCode!
    if (!couponMap[code]) couponMap[code] = { timesUsed: 0, revenueInfluenced: 0, totalDiscountGiven: 0 }
    couponMap[code].timesUsed += 1
    couponMap[code].revenueInfluenced += o.total
    couponMap[code].totalDiscountGiven += (o as any).discountAmount ?? 0
  }

  const couponUsage = Object.entries(couponMap)
    .map(([code, v]) => ({ code, ...v }))
    .sort((a, b) => b.revenueInfluenced - a.revenueInfluenced)

  const totalDiscountGiven = couponUsage.reduce((s, c) => s + c.totalDiscountGiven, 0)
  const totalRevenueInfluenced = couponUsage.reduce((s, c) => s + c.revenueInfluenced, 0)

  return {
    couponUsage,
    totalDiscountGiven,
    totalRevenueInfluenced,
    ordersWithDiscount: orders.length,
  }
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const authErr = await requireAdminAuth(request)
  if (authErr) return authErr

  const { searchParams } = new URL(request.url)
  const range = (searchParams.get('range') ?? 'Last 30 Days') as AnalyticsRange

  const VALID_RANGES: AnalyticsRange[] = ['Today', 'Last 7 Days', 'Last 30 Days', 'This Year', 'All Time']
  if (!VALID_RANGES.includes(range)) {
    return NextResponse.json({ error: 'Invalid range parameter' }, { status: 400 })
  }

  try {
    const { start, end } = getDateBounds(range)

    // Warm up Neon connection before heavy aggregations
    await prisma.$queryRaw`SELECT 1`

    const [sales, products, customers, channels, marketing] = await Promise.all([
      getSalesMetrics(start, end, range),
      getProductMetrics(start, end),
      getCustomerMetrics(start, end),
      getChannelMetrics(start, end),
      getMarketingMetrics(start, end),
    ])

    const payload: AnalyticsPayload = {
      range,
      generatedAt: new Date().toISOString(),
      sales,
      products,
      customers,
      channels,
      marketing,
    }

    return NextResponse.json(payload)
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: error.message || 'Analytics aggregation failed' }, { status: 500 })
  }
}
