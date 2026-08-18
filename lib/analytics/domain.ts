/**
 * Analytics Domain Library
 *
 * Central source of truth for:
 *  1. The completed-order predicate (same definition used everywhere)
 *  2. Africa/Lagos timezone-aware date boundary resolution
 *  3. Shared types for analytics metric payloads
 */

// ─── Completed-Order Predicate ───────────────────────────────────────────────

/**
 * The single authoritative definition of a "completed" order for all analytics.
 * Used across: Sales, Products, Customers, Channels, Marketing, Dashboard, Exports.
 *
 * An order is completed when:
 *  - paymentStatus === 'PAID'
 *  - status is not 'CANCELLED' or 'RETURNED'
 */
export function isCompletedOrder(order: {
  paymentStatus: string
  status: string
}): boolean {
  return (
    order.paymentStatus === 'PAID' &&
    order.status !== 'CANCELLED' &&
    order.status !== 'RETURNED'
  )
}

export const completedOrderWhere = {
  paymentStatus: 'PAID',
  status: {
    notIn: ['CANCELLED', 'RETURNED'],
  },
}

// ─── Date Boundary Resolution ─────────────────────────────────────────────────

export type AnalyticsRange =
  | 'Today'
  | 'Last 7 Days'
  | 'Last 30 Days'
  | 'This Year'
  | 'All Time'

/**
 * Returns UTC-equivalent Date boundaries for a named range, calculated
 * relative to the current time in Africa/Lagos (UTC+1, no DST).
 *
 * Africa/Lagos is permanently UTC+1. We apply the offset manually to avoid
 * a runtime dependency on the full Intl timezone database on all environments.
 */
export function getDateBounds(range: AnalyticsRange): {
  start: Date | null
  end: Date
  label: string
} {
  const LAGOS_OFFSET_MS = 1 * 60 * 60 * 1000 // UTC+1 in milliseconds

  // Current UTC time
  const nowUtc = new Date()

  // Equivalent wall-clock time in Lagos
  const nowLagos = new Date(nowUtc.getTime() + LAGOS_OFFSET_MS)

  // Start of today in Lagos as a UTC instant
  const todayStartLagos = new Date(
    Date.UTC(nowLagos.getUTCFullYear(), nowLagos.getUTCMonth(), nowLagos.getUTCDate(), 0, 0, 0, 0)
  )
  const todayStartUtc = new Date(todayStartLagos.getTime() - LAGOS_OFFSET_MS)

  // Start of current year in Lagos
  const yearStartLagos = new Date(Date.UTC(nowLagos.getUTCFullYear(), 0, 1, 0, 0, 0, 0))
  const yearStartUtc = new Date(yearStartLagos.getTime() - LAGOS_OFFSET_MS)

  switch (range) {
    case 'Today':
      return { start: todayStartUtc, end: nowUtc, label: 'Today' }

    case 'Last 7 Days':
      return {
        start: new Date(todayStartUtc.getTime() - 6 * 24 * 60 * 60 * 1000),
        end: nowUtc,
        label: 'Last 7 Days',
      }

    case 'Last 30 Days':
      return {
        start: new Date(todayStartUtc.getTime() - 29 * 24 * 60 * 60 * 1000),
        end: nowUtc,
        label: 'Last 30 Days',
      }

    case 'This Year':
      return { start: yearStartUtc, end: nowUtc, label: 'This Year' }

    case 'All Time':
    default:
      return { start: null, end: nowUtc, label: 'All Time' }
  }
}

// ─── Metric Types ─────────────────────────────────────────────────────────────

export interface SalesMetrics {
  grossRevenue: number
  grossProductProfit: number | null // null when unitCost data unavailable
  discountsGiven: number
  profitAfterDiscounts: number | null
  completedOrders: number
  averageOrderValue: number
  trend: Array<{ label: string; revenue: number; orders: number }>
}

export interface ProductMetrics {
  bestSellers: Array<{
    productId: number
    name: string
    brand: string
    unitsSold: number
    revenue: number
    grossProfit: number | null
  }>
  revenueByBrand: Array<{ brand: string; revenue: number; units: number }>
  revenueByCategory: Array<{ category: string; revenue: number; units: number }>
  lowPerformers: Array<{
    productId: number
    name: string
    brand: string
    stock: number
    unitsSold: number
  }>
}

export interface CustomerMetrics {
  newCustomers: number
  returningCustomers: number
  oneTimeCustomers: number
  topClients: Array<{
    customerId: number
    name: string
    phone: string
    orders: number
    spend: number
    aov: number
    lastOrder: string
  }>
}

export interface ChannelMetrics {
  channels: Array<{
    channel: string
    orders: number
    revenue: number
    share: number // percentage of total revenue
  }>
}

export interface MarketingMetrics {
  couponUsage: Array<{
    code: string
    timesUsed: number
    revenueInfluenced: number
    totalDiscountGiven: number
  }>
  totalDiscountGiven: number
  totalRevenueInfluenced: number
  ordersWithDiscount: number
}

export interface AnalyticsPayload {
  range: AnalyticsRange
  generatedAt: string
  sales: SalesMetrics
  products: ProductMetrics
  customers: CustomerMetrics
  channels: ChannelMetrics
  marketing: MarketingMetrics
}
