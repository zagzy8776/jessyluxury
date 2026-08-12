'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  Ticket,
  Truck,
  ArrowRight,
  MessageCircle,
  Phone,
  AlertTriangle,
  Plus,
  BarChart3,
  Flame,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    productsSold: 0,
    totalCustomers: 0,
    pendingOrdersCount: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [ordersRes, customersRes, productsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/customers'),
          fetch('/api/products'),
        ])
        const orders = await ordersRes.json()
        const customers = await customersRes.json()
        const products = await productsRes.json()

        if (Array.isArray(orders)) {
          const totalSales = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0)
          const pending = orders.filter((o: any) => o.status === 'PENDING').length
          const productsSold = orders.reduce((sum: number, o: any) => {
            if (Array.isArray(o.items)) {
              return sum + o.items.reduce((iSum: number, item: any) => iSum + (item.quantity || 0), 0)
            }
            return sum
          }, 0)

          setStats({
            totalSales,
            totalOrders: orders.length,
            productsSold,
            totalCustomers: Array.isArray(customers) ? customers.length : 0,
            pendingOrdersCount: pending,
          })
          setRecentOrders(orders.slice(0, 6))
        }

        if (Array.isArray(products)) {
          const lowStock = products.filter((p: any) => (p.stock || 0) <= 5)
          setLowStockProducts(lowStock)
        }
      } catch (e) {
        console.error('Failed loading admin dashboard data', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const statusColor = (s: string) => {
    if (s === 'DELIVERED') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
    if (s === 'SHIPPED') return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
    if (s === 'PROCESSING') return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
    if (s === 'CANCELLED') return 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
    return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
  }

  const paymentColor = (p: string) => {
    if (p === 'PAID') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
    if (p === 'PARTIALLY_PAID') return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
    return 'bg-stone-500/15 text-[var(--text-secondary)] border border-[var(--border)]'
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Executive Overview
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            Welcome back, Jessy! Real-time storefront performance & quick manager operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/store-portal-jl/dashboard/products/add"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10"
          >
            <Plus size={16} /> Add Product
          </Link>
          <Link
            href="/store-portal-jl/dashboard/orders/create"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2.5 text-xs font-bold text-[var(--text-primary)] hover:border-amber-500 hover:text-amber-500 transition shadow-sm"
          >
            <ShoppingBag size={16} /> Record Manual Order
          </Link>
        </div>
      </div>

      {/* Low-Stock Alerts Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-500 border border-amber-500/30 shrink-0 mt-0.5">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  Low Stock Alert ({lowStockProducts.length} Fragrance{lowStockProducts.length > 1 ? 's' : ''})
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                  The following catalog items are running low (5 or fewer units remaining):
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {lowStockProducts.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-2 rounded-lg bg-[var(--bg-primary)] px-3 py-1 text-xs font-mono border border-[var(--border)] shadow-xs"
                    >
                      <span className="text-[var(--text-primary)] font-semibold">{p.name}</span>
                      <span className={p.stock === 0 ? 'text-red-500 font-bold' : 'text-amber-500 font-semibold'}>
                        ({p.stock === 0 ? 'Out of Stock' : `${p.stock} left`})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/store-portal-jl/dashboard/products"
              className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-bold text-amber-500 hover:bg-amber-500 hover:text-stone-950 transition"
            >
              Restock Catalog <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Quick Access Summary Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl liquid-glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Total Sales</span>
            <span className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500 border border-amber-500/20">
              <TrendingUp size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            ₦{stats.totalSales.toLocaleString('en-NG')}
          </p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
            <Flame size={13} /> Gross lifetime sales revenue
          </p>
        </div>

        <div className="rounded-2xl liquid-glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Total Orders</span>
            <span className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500 border border-blue-500/20">
              <ShoppingBag size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {stats.totalOrders}
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400 font-semibold">
            {stats.pendingOrdersCount} pending fulfillment
          </p>
        </div>

        <div className="rounded-2xl liquid-glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Products Sold</span>
            <span className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500 border border-purple-500/20">
              <Package size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {stats.productsSold}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)] font-medium">Individual bottles & oils</p>
        </div>

        <div className="rounded-2xl liquid-glass-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Active Customers</span>
            <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500 border border-emerald-500/20">
              <Users size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {stats.totalCustomers}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)] font-medium">Saved contact directory</p>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/store-portal-jl/dashboard/products/add', icon: Plus, title: 'Add New Product', sub: 'Create fragrance listing' },
          { href: '/store-portal-jl/dashboard/orders/create', icon: ShoppingBag, title: 'Record Manual Order', sub: 'Walk-in & POS sales' },
          { href: '/store-portal-jl/dashboard/sales-marketing/discounts', icon: Ticket, title: 'Issue Discount', sub: 'Fixed ₦ or % coupons' },
          { href: '/store-portal-jl/dashboard/analytics', icon: BarChart3, title: 'Business Analytics', sub: 'Reports & revenue graphs' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 transition hover:border-amber-500/60 hover:shadow-md"
          >
            <div className="flex items-center gap-3.5">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-amber-500 group-hover:scale-105 transition-transform">
                <item.icon size={18} />
              </div>
              <div>
                <p className="font-bold text-xs text-[var(--text-primary)] group-hover:text-amber-500 transition">
                  {item.title}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] font-medium">{item.sub}</p>
              </div>
            </div>
            <ArrowRight size={15} className="text-[var(--text-muted)] group-hover:text-amber-500 group-hover:translate-x-1 transition" />
          </Link>
        ))}
      </div>

      {/* Recent Order Activity Stream */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--text-primary)]">Recent Activity Stream</h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
              Live feed of orders placed on storefront or manual POS
            </p>
          </div>
          <Link
            href="/store-portal-jl/dashboard/orders"
            className="text-xs font-bold tracking-wider text-amber-500 hover:text-amber-400 transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            ALL ORDERS <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">
            Loading stream…
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center text-xs font-medium text-[var(--text-muted)]">
            No recent orders recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full text-left text-xs text-[var(--text-primary)]">
              <thead className="border-b border-[var(--border)] bg-[var(--table-header-bg)] uppercase tracking-wider text-[var(--text-secondary)] text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Fulfillment</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4 text-right">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[var(--table-row-hover)] transition">
                    <td className="py-4 px-4 font-mono font-bold text-amber-500">{order.orderNumber}</td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-[var(--text-primary)]">{order.customerName}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">{order.customerPhone}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold tracking-wider ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold tracking-wider ${paymentColor(order.paymentStatus || 'PAID')}`}>
                        {order.paymentStatus || 'PAID'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-[var(--text-primary)]">
                      ₦{order.total?.toLocaleString('en-NG')}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] p-2 text-[var(--text-secondary)] hover:text-amber-500 hover:border-amber-500/40 transition"
                          title="Call Customer"
                        >
                          <Phone size={14} />
                        </a>
                        <a
                          href={`https://wa.me/${(order.customerWhatsapp || order.customerPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.customerName}! Re: Order #${order.orderNumber} at Jessy Luxury Fragrance.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-emerald-500 hover:bg-emerald-500 hover:text-white transition"
                          title="WhatsApp Customer"
                        >
                          <MessageCircle size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
