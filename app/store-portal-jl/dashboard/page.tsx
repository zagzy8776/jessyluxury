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

    return {
      totalSales,
      totalOrders: filteredOrders.length,
      productsSold,
      pendingOrdersCount,
      totalCustomers: customers.length,
      newCustomersThisWeek,
    }
  }, [filteredOrders, customers])

  // Low stock products filter
  const lowStockProducts = useMemo(() => {
    return products.filter((p: any) => (p.stock || 0) <= 5)
  }, [products])

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
    if (s === 'DELIVERED') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
    if (s === 'SHIPPED') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
    if (s === 'PROCESSING') return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
    if (s === 'CANCELLED') return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
  }

  const paymentColor = (p: string) => {
    if (p === 'PAID') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
    if (p === 'PARTIALLY_PAID') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
    return 'bg-stone-500/10 text-[var(--text-secondary)] border border-[var(--border)]'
  }

  const recentOrdersSlice = useMemo(() => {
    return orders.slice(0, 6)
  }, [orders])

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-1 sm:px-4">
      {/* Executive Command Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight text-[var(--text-primary)]">
            Business Overview
          </h1>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 tracking-wider uppercase font-bold">
            Jessy Luxury Atelier Control Center
          </p>
        </div>

        {/* Date Selector Dropdown */}
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="appearance-none rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 pr-8 text-xs font-bold text-[var(--text-primary)] hover:border-brand-gold outline-none transition cursor-pointer shadow-xs"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="lifetime">Lifetime</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)] pointer-events-none select-none">
            ▼
          </span>
        </div>
      </div>

      {/* Action Strip (Familiar Business Operations) */}
      <div className="flex flex-wrap gap-2.5">
        <Link
          href="/store-portal-jl/dashboard/orders/create"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-brand-gold hover:text-brand-gold transition duration-300 shadow-xs"
        >
          <Plus size={13} /> Create Order
        </Link>
        <Link
          href="/store-portal-jl/dashboard/products/add"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-brand-gold hover:text-brand-gold transition duration-300 shadow-xs"
        >
          <Plus size={13} /> Add Product
        </Link>
        <Link
          href="/store-portal-jl/dashboard/customers"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-brand-gold hover:text-brand-gold transition duration-300 shadow-xs"
        >
          <Plus size={13} /> Add Customer
        </Link>
        <Link
          href="/store-portal-jl/dashboard/coupons"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-brand-gold hover:text-brand-gold transition duration-300 shadow-xs"
        >
          <Ticket size={13} /> Create Coupon
        </Link>
        <Link
          href="/store-portal-jl/dashboard/analytics"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-brand-gold hover:text-brand-gold transition duration-300 shadow-xs"
        >
          <BarChart3 size={13} /> View Analytics
        </Link>
      </div>

      {/* Grid Metrics: 2x2 on Mobile, 1x4 on Desktop */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Metric 1: Sales */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-brand-gold transition-colors duration-300 shadow-xs">
          <p className="text-[9px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
            TOTAL SALES
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)] tabular-nums">
            ₦{metrics.totalSales.toLocaleString('en-NG')}
          </p>
          <p className="mt-1 text-[9px] text-[var(--text-muted)] font-medium">
            {dateRange === 'lifetime' ? 'Gross lifetime revenue' : `${dateRange} period revenue`}
          </p>
        </div>

        {/* Metric 2: Orders */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-brand-gold transition-colors duration-300 shadow-xs">
          <p className="text-[9px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
            ORDERS
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)] tabular-nums">
            {metrics.totalOrders}
          </p>
          <p className="mt-1 text-[9px] text-[var(--text-muted)] font-medium">
            {metrics.pendingOrdersCount} pending fulfillment
          </p>
        </div>

        {/* Metric 3: Products Sold */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-brand-gold transition-colors duration-300 shadow-xs">
          <p className="text-[9px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
            PRODUCTS SOLD
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)] tabular-nums">
            {metrics.productsSold}
          </p>
          <p className="mt-1 text-[9px] text-[var(--text-muted)] font-medium">
            Bottles & oils dispatched
          </p>
        </div>

        {/* Metric 4: Customers */}
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-brand-gold transition-colors duration-300 shadow-xs">
          <p className="text-[9px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
            CUSTOMERS
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-[var(--text-primary)] tabular-nums">
            {metrics.totalCustomers}
          </p>
          <p className="mt-1 text-[9px] text-[var(--text-muted)] font-medium">
            {metrics.newCustomersThisWeek > 0 ? `+${metrics.newCustomersThisWeek} this week` : '0 new this week'}
          </p>
        </div>
      </div>

      {/* Sales Overview Chart (Minimal Line Chart) */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-4 shadow-xs">
        <div>
          <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-primary)] uppercase">
            SALES OVERVIEW
          </h3>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Daily total sales trend for the last 7 days
          </p>
        </div>

        {loading ? (
          <div className="h-32 flex items-center justify-center text-xs text-[var(--text-muted)] animate-pulse">
            Loading sales trends…
          </div>
        ) : (
          <div className="pt-2">
            <svg className="w-full overflow-visible" height="140" viewBox="0 0 500 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A35D" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#C9A35D" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Horizontal Gridlines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="0" y1="60" x2="500" y2="60" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />

              {/* Area path */}
              {chartData.fill && <path d={chartData.fill} fill="url(#chartGrad)" />}

              {/* Line path */}
              {chartData.path && <path d={chartData.path} fill="none" stroke="#C9A35D" strokeWidth="1.5" />}

              {/* Data points */}
              {chartData.points.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3" fill="#fcfaf7" stroke="#C9A35D" strokeWidth="1.5" />
              ))}
            </svg>
            
            {/* X-Axis labels */}
            <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-bold uppercase mt-2 px-1">
              {chartData.list.map((d, i) => (
                <span key={i} className="w-[70px] text-center first:text-left last:text-right">
                  {d.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Low-Stock Section (Typography based) */}
      {lowStockProducts.length > 0 && (
        <div className="border-t border-[var(--border)] pt-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-primary)] uppercase">
                LOW STOCK
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">
                {lowStockProducts.length} fragrance{lowStockProducts.length > 1 ? 's' : ''} need attention
              </p>
            </div>
            <Link
              href="/store-portal-jl/dashboard/products"
              className="text-xs font-bold text-[var(--text-primary)] tracking-wider hover:text-brand-gold transition flex items-center gap-1 uppercase"
            >
              RESTOCK CATALOG <ArrowRight size={14} />
            </Link>
          </div>

          <div className="divide-y divide-[var(--border)] border-t border-b border-[var(--border)] py-1 max-w-xl">
            {lowStockProducts.slice(0, 3).map((p) => (
              <div key={p.id} className="flex justify-between items-center py-3 text-xs">
                <span className="font-semibold text-[var(--text-primary)]">{p.name}</span>
                <span className="font-bold text-brand-gold font-sans tracking-wide">
                  {p.stock === 0 ? 'Out of Stock' : `${p.stock} left`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Order Activity Stream */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--border)] pb-2">
          <div>
            <h2 className="font-display text-xl font-medium text-[var(--text-primary)]">
              Recent Activity
            </h2>
            <p className="text-[10px] text-[var(--text-muted)] font-medium tracking-wide mt-0.5">
              Orders placed across storefront & POS
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
              LIVE
              <span className="live-dot" aria-hidden="true" />
            </span>
            <span className="text-[var(--text-muted)] select-none">|</span>
            <Link
              href="/store-portal-jl/dashboard/orders"
              className="text-xs font-bold tracking-wider text-[var(--text-primary)] hover:text-brand-gold transition flex items-center gap-1 uppercase"
            >
              ALL ORDERS <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">
            Loading stream…
          </div>
        ) : recentOrdersSlice.length === 0 ? (
          <div className="py-12 text-center text-xs font-medium text-[var(--text-muted)]">
            No recent orders recorded yet.
          </div>
        ) : (
          <>
            {/* Mobile/Compact Layout (< 768px): Transaction Cards */}
            <div className="block md:hidden space-y-3">
              {recentOrdersSlice.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 space-y-3 hover:border-brand-gold transition-colors duration-300 shadow-xs"
                >
                  <div className="flex justify-between items-baseline">
                    <span className="font-mono font-bold text-xs text-brand-gold">
                      {order.orderNumber}
                    </span>
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${statusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-bold text-xs text-[var(--text-primary)]">
                      {order.customerName}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} <span className="font-light">·</span> ₦{order.total?.toLocaleString('en-NG')}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-[var(--border)] text-[10px]">
                    <span className="text-[var(--text-muted)] font-medium">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="rounded-md border border-[var(--border)] bg-[var(--bg-primary)] p-1.5 text-[var(--text-secondary)] hover:text-brand-gold hover:border-brand-gold/45 transition-colors"
                        title="Call Customer"
                      >
                        <Phone size={12} />
                      </a>
                      <a
                        href={`https://wa.me/${(order.customerWhatsapp || order.customerPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.customerName}! Re: Order #${order.orderNumber} at Jessy Luxury Fragrance.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-1.5 text-emerald-600 hover:bg-emerald-500 hover:text-white transition"
                        title="WhatsApp Customer"
                      >
                        <MessageCircle size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop/Tablet Layout (>= 768px): Detailed Analytics Table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--card-bg)] shadow-xs">
              <table className="w-full text-left text-xs text-[var(--text-primary)]">
                <thead className="border-b border-[var(--border)] bg-[var(--table-header-bg)] uppercase tracking-wider text-[var(--text-secondary)] text-[10px] font-bold">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Fulfillment</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4 text-right">Quick Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {recentOrdersSlice.map((order) => (
                    <tr key={order.id} className="hover:bg-[var(--table-row-hover)] transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-gold">{order.orderNumber}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[var(--text-primary)]">{order.customerName}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{order.customerPhone}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${statusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${paymentColor(order.paymentStatus || 'PAID')}`}>
                          {order.paymentStatus || 'PAID'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[var(--text-primary)] tabular-nums">
                        ₦{order.total?.toLocaleString('en-NG')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`tel:${order.customerPhone}`}
                            className="rounded-md bg-[var(--bg-primary)] border border-[var(--border)] p-2 text-[var(--text-secondary)] hover:text-brand-gold hover:border-brand-gold/45 transition-colors"
                            title="Call Customer"
                          >
                            <Phone size={13} />
                          </a>
                          <a
                            href={`https://wa.me/${(order.customerWhatsapp || order.customerPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.customerName}! Re: Order #${order.orderNumber} at Jessy Luxury Fragrance.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2 text-emerald-600 hover:bg-emerald-500 hover:text-white transition"
                            title="WhatsApp Customer"
                          >
                            <MessageCircle size={13} />
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
    </div>
  )
}
