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

  const statusColor = (s: string) => {
    if (s === 'DELIVERED') return 'bg-green-500/20 text-green-400 border border-green-500/30'
    if (s === 'SHIPPED') return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
    if (s === 'PROCESSING') return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
    return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-medium text-stone-50">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-stone-400">Welcome back, Jessy! Here is your live business summary.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: `₦${stats.totalSales.toLocaleString('en-NG')}`, sub: 'Gross lifetime', icon: TrendingUp, color: 'text-amber-400 bg-amber-500/10' },
          { label: 'Total Orders', value: stats.totalOrders, sub: `${stats.pendingOrdersCount} pending`, icon: ShoppingBag, color: 'text-blue-400 bg-blue-500/10' },
          { label: 'Customers', value: stats.totalCustomers, sub: 'Saved contacts', icon: Users, color: 'text-green-400 bg-green-500/10' },
          { label: 'Products', value: stats.totalProducts, sub: 'In catalog', icon: Package, color: 'text-purple-400 bg-purple-500/10' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">{card.label}</span>
              <span className={`rounded-full p-2 ${card.color}`}>
                <card.icon size={18} />
              </span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold text-stone-50">{card.value}</p>
            <p className="mt-1 text-xs text-stone-500">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { href: '/store-portal-jl/dashboard/customers', icon: MessageCircle, color: 'text-green-400 bg-green-600/20', title: 'Customer CRM', sub: '1-click WhatsApp & Call' },
          { href: '/store-portal-jl/dashboard/shipping', icon: Truck, color: 'text-blue-400 bg-blue-600/20', title: 'Shipping Manager', sub: 'Zones, fees & notes' },
          { href: '/store-portal-jl/dashboard/coupons', icon: Ticket, color: 'text-purple-400 bg-purple-600/20', title: '6 Coupons Manager', sub: 'Auto-reactivation & discounts' },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="flex items-center justify-between rounded-2xl border border-stone-800 bg-gradient-to-r from-stone-900 to-stone-900/40 p-5 transition hover:border-amber-500/40"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-2.5 ${a.color}`}>
                <a.icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm text-stone-100">{a.title}</p>
                <p className="text-xs text-stone-500">{a.sub}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-stone-500" />
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl text-stone-100">Recent Orders</h2>
            <p className="text-xs text-stone-400">Manage, update tracking, notify customers</p>
          </div>
          <Link
            href="/store-portal-jl/dashboard/orders"
            className="text-xs font-semibold tracking-wider text-amber-400 hover:text-amber-300 transition flex items-center gap-1"
          >
            VIEW ALL <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-stone-500 animate-pulse">Loading…</div>
        ) : recentOrders.length === 0 ? (
          <div className="py-12 text-center text-sm text-stone-500">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="border-b border-stone-800 bg-stone-950/60 uppercase tracking-wider text-stone-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right">Contact</th>
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
                    <td className="py-4 px-4 text-stone-400">{order.shippingZone?.name || '—'}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider ${statusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-stone-100">₦{order.total?.toLocaleString('en-NG')}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="rounded-lg bg-stone-800 p-2 text-stone-300 hover:bg-stone-700 hover:text-white transition"
                          title="Call"
                        >
                          <Phone size={14} />
                        </a>
                        <a
                          href={`https://wa.me/${(order.customerWhatsapp || order.customerPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.customerName}! Re: Order #${order.orderNumber} – Jessy Luxury.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-green-600/20 border border-green-600/30 p-2 text-green-400 hover:bg-green-600 hover:text-white transition"
                          title="WhatsApp"
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
