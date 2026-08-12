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
  Clock,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrdersCount: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
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
          setStats({
            totalSales,
            totalOrders: orders.length,
            totalCustomers: Array.isArray(customers) ? customers.length : 0,
            totalProducts: Array.isArray(products) ? products.length : 0,
            pendingOrdersCount: pending,
          })
          setRecentOrders(orders.slice(0, 5))
        }
      } catch (e) {
        console.error('Failed loading admin dashboard data', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-medium text-stone-50">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-stone-400">
          Welcome back, Jessy! Here is your live business summary.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Total Sales Revenue</span>
            <span className="rounded-full bg-amber-500/10 p-2 text-amber-400">
              <TrendingUp size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">
            ₦{stats.totalSales.toLocaleString('en-NG')}
          </p>
          <p className="mt-1 text-xs text-stone-500">Gross orders lifetime</p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Total Orders</span>
            <span className="rounded-full bg-blue-500/10 p-2 text-blue-400">
              <ShoppingBag size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">{stats.totalOrders}</p>
          <p className="mt-1 text-xs text-amber-400">{stats.pendingOrdersCount} pending fulfillment</p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Customers CRM</span>
            <span className="rounded-full bg-green-500/10 p-2 text-green-400">
              <Users size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">{stats.totalCustomers}</p>
          <p className="mt-1 text-xs text-stone-500">Saved contact directory</p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Products in Catalog</span>
            <span className="rounded-full bg-purple-500/10 p-2 text-purple-400">
              <Package size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">{stats.totalProducts}</p>
          <p className="mt-1 text-xs text-stone-500">Live fragrances & oils</p>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/customers"
          className="flex items-center justify-between rounded-2xl border border-stone-800 bg-gradient-to-r from-stone-900 to-stone-900/40 p-5 transition hover:border-amber-500/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-600/20 p-2.5 text-green-400">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-stone-100">Customer CRM</p>
              <p className="text-xs text-stone-500">1-click WhatsApp & Call customers</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-stone-500" />
        </Link>

        <Link
          href="/admin/shipping"
          className="flex items-center justify-between rounded-2xl border border-stone-800 bg-gradient-to-r from-stone-900 to-stone-900/40 p-5 transition hover:border-amber-500/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-600/20 p-2.5 text-blue-400">
              <Truck size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-stone-100">Shipping Manager</p>
              <p className="text-xs text-stone-500">Zones, fees & dispatch notes</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-stone-500" />
        </Link>

        <Link
          href="/admin/coupons"
          className="flex items-center justify-between rounded-2xl border border-stone-800 bg-gradient-to-r from-stone-900 to-stone-900/40 p-5 transition hover:border-amber-500/40"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-600/20 p-2.5 text-purple-400">
              <Ticket size={20} />
            </div>
            <div>
              <p className="font-semibold text-sm text-stone-100">6 Coupons Manager</p>
              <p className="text-xs text-stone-500">Auto-reactivation & discounts</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-stone-500" />
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl text-stone-100">Recent Customer Orders</h2>
            <p className="text-xs text-stone-400">Manage orders, update tracking, and confirm on WhatsApp</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold tracking-wider text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
          >
            VIEW ALL ORDERS <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-stone-500">Loading order records…</div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-stone-500">No orders recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="border-b border-stone-800 bg-stone-950/60 uppercase tracking-wider text-stone-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Delivery Zone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-900/60 transition">
                    <td className="py-4 px-4 font-mono font-medium text-amber-400">{order.orderNumber}</td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-stone-100">{order.customerName}</p>
                      <p className="text-[10px] text-stone-500">{order.customerPhone}</p>
                    </td>
                    <td className="py-4 px-4 text-stone-400">
                      {order.shippingZone?.name || 'Standard'}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${
                          order.status === 'DELIVERED'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : order.status === 'SHIPPED'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : order.status === 'PROCESSING'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {order.status}
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
                          href={`https://wa.me/${order.customerWhatsapp || order.customerPhone}?text=${encodeURIComponent(
                            `Hello ${order.customerName}! Re: Order #${order.orderNumber} at Jessy Luxury Fragrance.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-green-600/20 border border-green-600/30 p-2 text-green-400 hover:bg-green-600 hover:text-white transition"
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
