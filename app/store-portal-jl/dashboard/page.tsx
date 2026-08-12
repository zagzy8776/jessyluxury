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
  DollarSign,
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
    if (s === 'DELIVERED') return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    if (s === 'SHIPPED') return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    if (s === 'PROCESSING') return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    if (s === 'CANCELLED') return 'bg-red-500/20 text-red-400 border border-red-500/30'
    return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  }

  const paymentColor = (p: string) => {
    if (p === 'PAID') return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
    if (p === 'PARTIALLY_PAID') return 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
    return 'bg-stone-800 text-stone-400 border border-stone-700'
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-50">Main Overview</h1>
          <p className="mt-1 text-xs text-stone-400">
            Welcome back, Jessy! Here is your Bumpa-style live store summary.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/store-portal-jl/dashboard/products/add"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md"
          >
            <Plus size={15} /> Add Product
          </Link>
          <Link
            href="/store-portal-jl/dashboard/orders/create"
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-xs font-bold text-stone-200 hover:border-amber-500/60 hover:text-amber-300 transition"
          >
            <ShoppingBag size={15} /> Record Manual Order
          </Link>
        </div>
      </div>

      {/* Low-Stock Alerts Warning Banner */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-stone-900/80 to-red-500/10 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400 border border-amber-500/30">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-200 flex items-center gap-2">
                  Low Stock Warning ({lowStockProducts.length} Fragrance{lowStockProducts.length > 1 ? 's' : ''})
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  The following items have 5 or fewer units left in inventory:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {lowStockProducts.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-stone-950/80 px-2.5 py-1 text-[11px] font-mono border border-stone-800"
                    >
                      <span className="text-stone-200 font-semibold">{p.name}</span>
                      <span className={p.stock === 0 ? 'text-red-400 font-bold' : 'text-amber-400'}>
                        ({p.stock === 0 ? 'Out of Stock' : `${p.stock} left`})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/store-portal-jl/dashboard/products"
              className="inline-flex items-center gap-1 shrink-0 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition"
            >
              Restock Catalog <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* Quick Access Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Total Sales</span>
            <span className="rounded-full bg-amber-500/10 p-2.5 text-amber-400 border border-amber-500/20">
              <TrendingUp size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">
            ₦{stats.totalSales.toLocaleString('en-NG')}
          </p>
          <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1 font-medium">
            <Flame size={13} /> Gross lifetime sales revenue
          </p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Total Orders</span>
            <span className="rounded-full bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20">
              <ShoppingBag size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">{stats.totalOrders}</p>
          <p className="mt-1 text-xs text-amber-400 font-medium">
            {stats.pendingOrdersCount} pending fulfillment
          </p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Products Sold</span>
            <span className="rounded-full bg-purple-500/10 p-2.5 text-purple-400 border border-purple-500/20">
              <Package size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">{stats.productsSold}</p>
          <p className="mt-1 text-xs text-stone-500">Individual bottles & oils</p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Active Customers</span>
            <span className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
              <Users size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">{stats.totalCustomers}</p>
          <p className="mt-1 text-xs text-stone-500">Saved contact directory</p>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { href: '/store-portal-jl/dashboard/products/add', icon: Plus, title: 'Add New Product', sub: 'Create fragrance listing', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { href: '/store-portal-jl/dashboard/orders/create', icon: ShoppingBag, title: 'Record Manual Order', sub: 'Walk-in & POS sales', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
          { href: '/store-portal-jl/dashboard/sales-marketing/discounts', icon: Ticket, title: 'Issue Discount', sub: 'Fixed ₦ or % coupons', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
          { href: '/store-portal-jl/dashboard/analytics', icon: BarChart3, title: 'Business Analytics', sub: 'Reports & revenue graphs', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between rounded-2xl border border-stone-800 bg-gradient-to-r from-stone-900 to-stone-900/40 p-4 transition hover:border-amber-500/40 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 border ${item.color}`}>
                <item.icon size={18} />
              </div>
              <div>
                <p className="font-semibold text-xs text-stone-100">{item.title}</p>
                <p className="text-[11px] text-stone-500">{item.sub}</p>
              </div>
            </div>
            <ArrowRight size={14} className="text-stone-600" />
          </Link>
        ))}
      </div>

      {/* Recent Order Activity Stream */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl text-stone-100">Recent Activity Stream</h2>
            <p className="text-xs text-stone-400">Live feed of orders placed on storefront or manual POS</p>
          </div>
          <Link
            href="/store-portal-jl/dashboard/orders"
            className="text-xs font-semibold tracking-wider text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
          >
            ALL ORDERS <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-stone-500 animate-pulse">Loading stream…</div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-stone-500">No recent orders recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="border-b border-stone-800 bg-stone-950/60 uppercase tracking-wider text-stone-400 font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Fulfillment</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4 text-right">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-900/60 transition">
                    <td className="py-4 px-4 font-mono font-medium text-amber-400">{order.orderNumber}</td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-stone-100">{order.customerName}</p>
                      <p className="text-[10px] text-stone-500 font-mono">{order.customerPhone}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${paymentColor(order.paymentStatus || 'PAID')}`}>
                        {order.paymentStatus || 'PAID'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-stone-100">
                      ₦{order.total?.toLocaleString('en-NG')}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="rounded-lg bg-stone-800 p-2 text-stone-300 hover:bg-stone-700 hover:text-white transition"
                          title="Call Customer"
                        >
                          <Phone size={14} />
                        </a>
                        <a
                          href={`https://wa.me/${(order.customerWhatsapp || order.customerPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.customerName}! Re: Order #${order.orderNumber} at Jessy Luxury Fragrance.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-emerald-600/20 border border-emerald-600/30 p-2 text-emerald-400 hover:bg-emerald-600 hover:text-white transition"
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
