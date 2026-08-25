'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  MessageCircle,
  Phone,
  Plus,
  BarChart3,
  Ticket,
  Banknote,
  ShoppingBag,
  Users,
  Percent,
  AlertTriangle,
  TrendingUp,
  Eye,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'lifetime'>('lifetime')

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, customersRes, productsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/customers'),
          fetch('/api/products'),
        ])
        const ordersData = await ordersRes.json()
        const customersData = await customersRes.json()
        const productsData = await productsRes.json()

        if (Array.isArray(ordersData)) setOrders(ordersData)
        if (Array.isArray(customersData)) setCustomers(customersData)
        if (Array.isArray(productsData)) setProducts(productsData)
      } catch (e) {
        console.error('Failed loading admin dashboard data', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Client-side date range filter
  const filteredOrders = useMemo(() => {
    const now = new Date()
    return orders.filter((o) => {
      const date = new Date(o.createdAt)
      if (dateRange === 'today') {
        return date.toDateString() === now.toDateString()
      }
      if (dateRange === 'yesterday') {
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        return date.toDateString() === yesterday.toDateString()
      }
      if (dateRange === 'week') {
        const oneWeekAgo = new Date(now)
        oneWeekAgo.setDate(now.getDate() - 7)
        return date >= oneWeekAgo
      }
      if (dateRange === 'month') {
        const oneMonthAgo = new Date(now)
        oneMonthAgo.setDate(now.getDate() - 30)
        return date >= oneMonthAgo
      }
      return true // lifetime
    })
  }, [orders, dateRange])

  // Derive metrics from filtered data
  const metrics = useMemo(() => {
    const totalSales = filteredOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
    const pendingOrdersCount = filteredOrders.filter((o: any) => o.status === 'PENDING').length
    const productsSold = filteredOrders.reduce((sum: number, o: any) => {
      if (Array.isArray(o.items)) {
        return sum + o.items.reduce((iSum: number, item: any) => iSum + (item.quantity || 0), 0)
      }
      return sum
    }, 0)

    const now = new Date()
    const oneWeekAgo = new Date(now)
    oneWeekAgo.setDate(now.getDate() - 7)
    const newCustomersThisWeek = customers.filter((c: any) => new Date(c.createdAt) >= oneWeekAgo).length

    const aov = metrics_aov(totalSales, filteredOrders.length)

    return {
      totalSales,
      totalOrders: filteredOrders.length,
      productsSold,
      pendingOrdersCount,
      totalCustomers: customers.length,
      newCustomersThisWeek,
      aov,
    }
  }, [filteredOrders, customers])

  // Low stock products filter
  const lowStockProducts = useMemo(() => {
    return products.filter((p: any) => (p.stock || 0) <= 5)
  }, [products])

  // Top products derived from order items in range
  const topProducts = useMemo(() => {
    const tally = new Map<string, { name: string; units: number; revenue: number }>()
    for (const o of filteredOrders) {
      if (!Array.isArray(o.items)) continue
      for (const item of o.items) {
        const key = item.productName || item.name || `#${item.productId}`
        const prev = tally.get(key) || { name: key, units: 0, revenue: 0 }
        prev.units += item.quantity || 0
        prev.revenue += (item.price || 0) * (item.quantity || 0)
        tally.set(key, prev)
      }
    }
    return Array.from(tally.values()).sort((a, b) => b.units - a.units).slice(0, 5)
  }, [filteredOrders])

  // Calculate last 7 days sales for trend chart
  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d
    }).reverse()

    const list = days.map((day) => {
      const dateStr = day.toDateString()
      const daySales = orders
        .filter((o) => new Date(o.createdAt).toDateString() === dateStr)
        .reduce((sum: number, o: any) => sum + (o.total || 0), 0)
      return {
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: daySales,
      }
    })

    const maxSales = Math.max(...list.map((d) => d.sales), 10000)
    const points = list.map((item, idx) => {
      const x = idx * (500 / 6)
      const y = 100 - (item.sales / maxSales) * 80 // pad top/bottom
      return { x, y }
    })

    const path = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    const fill = points.length > 0 ? `${path} L 500 120 L 0 120 Z` : ''

    return { list, maxSales, points, path, fill }
  }, [orders])

  const statusColor = (s: string) => {
    if (s === 'DELIVERED') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
    if (s === 'SHIPPED') return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
    if (s === 'PROCESSING') return 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20'
    if (s === 'CANCELLED') return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
    return 'bg-[var(--champagne-soft)] text-[#7a5c22] border border-[var(--champagne)]/30'
  }

  const paymentColor = (p: string) => {
    if (p === 'PAID') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
    if (p === 'PARTIALLY_PAID') return 'bg-[var(--champagne-soft)] text-[#7a5c22] border border-[var(--champagne)]/30'
    return 'bg-stone-500/10 text-[var(--admin-text-secondary)] border border-[var(--admin-border)]'
  }

  const recentOrdersSlice = useMemo(() => {
    return orders.slice(0, 6)
  }, [orders])

  const kpis = [
    {
      label: 'Revenue',
      value: `₦${metrics.totalSales.toLocaleString('en-NG')}`,
      sub: dateRange === 'lifetime' ? 'Gross lifetime revenue' : `${dateRange} period revenue`,
      icon: Banknote,
      tint: 'bg-[var(--accent-soft)] text-[var(--accent)]',
    },
    {
      label: 'Orders',
      value: String(metrics.totalOrders),
      sub: `${metrics.pendingOrdersCount} pending fulfillment`,
      icon: ShoppingBag,
      tint: 'bg-blue-500/10 text-blue-600',
    },
    {
      label: 'Customers',
      value: String(metrics.totalCustomers),
      sub: metrics.newCustomersThisWeek > 0 ? `+${metrics.newCustomersThisWeek} this week` : 'No new this week',
      icon: Users,
      tint: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      label: 'Avg Order Value',
      value: metrics.aov,
      sub: `${metrics.productsSold} units sold`,
      icon: Percent,
      tint: 'bg-[var(--champagne-soft)] text-[#7a5c22]',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            Business overview
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {dateRange === 'today' ? 'Today at Jessy Luxury' : 
             dateRange === 'yesterday' ? 'Yesterday at Jessy Luxury' :
             dateRange === 'week' ? 'This Week at Jessy Luxury' :
             dateRange === 'month' ? 'This Month at Jessy Luxury' :
             'Jessy Luxury Overview'}
          </h1>
        </div>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="admin-input w-full cursor-pointer appearance-none font-bold sm:w-44"
          aria-label="Date range"
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="lifetime">Lifetime</option>
        </select>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/store-portal-jl/dashboard/orders/create"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--accent-strong)]"
        >
          <Plus size={14} /> New Sale (POS)
        </Link>
        <Link
          href="/store-portal-jl/dashboard/products/add"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] px-4 py-2.5 text-xs font-bold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <Plus size={14} /> Add Product
        </Link>
        <Link
          href="/store-portal-jl/dashboard/coupons"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] px-4 py-2.5 text-xs font-bold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <Ticket size={14} /> Coupons
        </Link>
        <Link
          href="/store-portal-jl/dashboard/analytics"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] px-4 py-2.5 text-xs font-bold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          <BarChart3 size={14} /> Analytics
        </Link>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="admin-card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">
                {k.label}
              </p>
              <span className={`rounded-lg p-2 ${k.tint}`}>
                <k.icon size={15} />
              </span>
            </div>
            <p className="mt-3 font-display text-xl font-bold tabular-nums tracking-tight sm:text-2xl">
              {loading ? <span className="skeleton inline-block h-7 w-24" /> : k.value}
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-[var(--admin-text-muted)]">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart + Needs attention */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Sales trend */}
        <div className="admin-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em]">Sales trend</h3>
              <p className="mt-0.5 text-[11px] text-[var(--admin-text-muted)]">Daily revenue · last 7 days</p>
            </div>
            <TrendingUp size={16} className="text-[var(--champagne)]" />
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="skeleton h-full w-full" />
            </div>
          ) : (
            <div className="pt-4">
              <svg className="w-full overflow-visible" height="140" viewBox="0 0 500 120" preserveAspectRatio="none" role="img" aria-label="Sales trend chart">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F2D7F" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#4F2D7F" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <line x1="0" y1="20" x2="500" y2="20" stroke="var(--admin-border)" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="var(--admin-border)" strokeWidth="0.5" strokeDasharray="3,3" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="var(--admin-border)" strokeWidth="0.5" strokeDasharray="3,3" />

                {chartData.fill && <path d={chartData.fill} fill="url(#chartGrad)" />}
                {chartData.path && <path d={chartData.path} fill="none" stroke="#4F2D7F" strokeWidth="1.5" />}

                {chartData.points.map((p, i) => (
                  <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--admin-card-bg)" stroke="#4F2D7F" strokeWidth="1.5" />
                ))}
              </svg>

              <div className="mt-2 flex justify-between px-1 text-[9px] font-bold uppercase text-[var(--admin-text-muted)]">
                {chartData.list.map((d, i) => (
                  <span key={i} className="w-[70px] text-center first:text-left last:text-right">
                    {d.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Needs attention */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-[0.16em]">Needs attention</h3>
            <AlertTriangle size={15} className="text-[#b3372f]" />
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="py-8 text-center text-xs font-medium text-[var(--admin-text-muted)]">
              All stock levels healthy.
            </p>
          ) : (
            <>
              <p className="mt-1 text-[11px] font-medium text-[var(--admin-text-muted)]">
                {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} low or out of stock
              </p>
              <div className="mt-3 space-y-2">
                {lowStockProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-[var(--admin-bg)] px-3 py-2.5">
                    <span className="truncate text-xs font-semibold">{p.name}</span>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                      (p.stock || 0) === 0
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-[var(--champagne-soft)] text-[#7a5c22]'
                    }`}>
                      {p.stock === 0 ? 'OUT' : `${p.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/store-portal-jl/dashboard/products"
                className="mt-3 flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
              >
                Restock catalog <ArrowRight size={13} />
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Recent orders + top products */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-lg font-bold">Recent Orders</h2>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--admin-text-muted)]">
                Live <span className="live-dot" aria-hidden="true" />
              </span>
            </div>
            <Link
              href="/store-portal-jl/dashboard/orders"
              className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
            >
              All orders <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-16 w-full" />
              ))}
            </div>
          ) : recentOrdersSlice.length === 0 ? (
            <div className="admin-card py-12 text-center text-xs font-medium text-[var(--admin-text-muted)]">
              No recent orders recorded yet.
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {recentOrdersSlice.map((order) => (
                  <Link
                    key={order.id}
                    href={`/store-portal-jl/dashboard/orders?openId=${order.id}`}
                    className="admin-card block p-4"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono text-xs font-bold text-[var(--accent)]">{order.orderNumber}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-bold">{order.customerName}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--admin-text-muted)]">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} · ₦{order.total?.toLocaleString('en-NG')}
                    </p>
                    <div className="mt-2 flex items-center justify-between border-t border-[var(--admin-border)] pt-2 text-[10px]">
                      <span className="font-medium text-[var(--admin-text-muted)]">
                        {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ·{' '}
                        {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${paymentColor(order.paymentStatus || 'PAID')}`}>
                        {order.paymentStatus || 'PAID'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] shadow-sm md:block">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-table-header)] text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
                    <tr>
                      <th className="px-4 py-3">Order #</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Payment</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--admin-border)]">
                    {recentOrdersSlice.map((order) => (
                      <tr key={order.id} className="transition hover:bg-[var(--admin-table-row-hover)]">
                        <td className="px-4 py-3">
                          <Link
                            href={`/store-portal-jl/dashboard/orders?openId=${order.id}`}
                            className="font-mono font-bold text-[var(--accent)] hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold">{order.customerName}</p>
                          <p className="font-mono text-[10px] text-[var(--admin-text-muted)]">{order.customerPhone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${statusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${paymentColor(order.paymentStatus || 'PAID')}`}>
                            {order.paymentStatus || 'PAID'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">
                          ₦{order.total?.toLocaleString('en-NG')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] p-1.5 text-[var(--admin-text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                              title="Call customer"
                            >
                              <Phone size={12} />
                            </a>
                            <a
                              href={`https://wa.me/${(order.customerWhatsapp || order.customerPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.customerName}! Re: Order #${order.orderNumber} at Jessy Luxury Fragrance.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-1.5 text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
                              title="WhatsApp customer"
                            >
                              <MessageCircle size={12} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Top products */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Top Products</h2>
            <Eye size={15} className="text-[var(--admin-text-muted)]" />
          </div>
          <div className="admin-card p-4">
            {topProducts.length === 0 ? (
              <p className="py-8 text-center text-xs font-medium text-[var(--admin-text-muted)]">
                No sales in this period yet.
              </p>
            ) : (
              <ol className="space-y-2.5">
                {topProducts.map((p, idx) => (
                  <li key={p.name} className="flex items-center gap-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${
                      idx === 0
                        ? 'bg-[var(--champagne)] text-white'
                        : 'bg-[var(--admin-bg)] text-[var(--admin-text-secondary)]'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">{p.name}</span>
                    <span className="shrink-0 text-right">
                      <span className="block text-xs font-bold tabular-nums">{p.units}u</span>
                      <span className="block text-[10px] tabular-nums text-emerald-600">₦{Math.round(p.revenue).toLocaleString('en-NG')}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function metrics_aov(totalSales: number, count: number): string {
  if (count === 0) return '—'
  return `₦${Math.round(totalSales / count).toLocaleString('en-NG')}`
}
