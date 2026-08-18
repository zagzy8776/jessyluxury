'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingBag, Search, Truck, Phone, MessageCircle, CheckCircle,
  X, MapPin, Plus, AlertCircle, Filter, Clock, FileText,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

const PAYMENT_FILTERS = ['ALL', 'PAID', 'PARTIALLY_PAID', 'PENDING', 'UNPAID', 'REFUNDED']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [activePaymentFilter, setActivePaymentFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [activeModalTab, setActiveModalTab] = useState<'form' | 'timeline'>('form')
  const [restockState, setRestockState] = useState<Record<number, boolean>>({})
  const { toast, showToast, clearToast } = useToast()

  const [statusForm, setStatusForm] = useState({
    status: 'PENDING',
    paymentStatus: 'PAID',
    trackingNumber: '',
    courierName: '',
    courierPhone: '',
    waybillNotes: '',
  })

  useEffect(() => {
    fetchOrders()
  }, [search, activePaymentFilter])

  // Direct Deep Link Resolver using window.location.search to prevent Suspense build warnings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const openIdParam = params.get('openId')
      if (openIdParam) {
        fetchOrderById(openIdParam)
      }
    }
  }, [])

  async function fetchOrderById(id: string) {
    try {
      const res = await fetch(`/api/orders/${id}`)
      if (res.ok) {
        const order = await res.json()
        handleOpenFulfill(order)
      } else {
        showToast('Requested order details not found', 'error')
      }
    } catch {
      showToast('Error loading requested order', 'error')
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(`/api/orders?search=${encodeURIComponent(search)}&paymentStatus=${activePaymentFilter}`)
      const data = await res.json()
      if (Array.isArray(data)) setOrders(data)
    } catch {
      showToast('Failed fetching order records', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Counters (unfiltered total counts)
  const totalOrdersCount = orders.length
  const completedOrdersCount = orders.filter((o) => o.status === 'DELIVERED').length
  const unpaidOrdersCount = orders.filter((o) => o.paymentStatus === 'UNPAID' || o.paymentStatus === 'PENDING').length

  function handleOpenFulfill(order: any) {
    setSelectedOrder(order)
    setActiveModalTab('form')
    
    // Default returned items to restockable = true
    const initialRestock: Record<number, boolean> = {}
    order.items?.forEach((item: any) => {
      initialRestock[item.productId] = true
    })
    setRestockState(initialRestock)

    setStatusForm({
      status: order.status,
      paymentStatus: order.paymentStatus || 'PAID',
      trackingNumber: order.trackingNumber || '',
      courierName: order.courierName || '',
      courierPhone: order.courierPhone || '',
      waybillNotes: order.waybillNotes || '',
    })
  }

  async function handleSaveFulfill(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrder) return

    try {
      const payload = {
        ...statusForm,
        restockItems: selectedOrder.items?.map((item: any) => ({
          productId: item.productId,
          isRestockable: restockState[item.productId] ?? false,
          reason: `Customer return restock choice - ${statusForm.waybillNotes || 'No notes'}`,
        })) || [],
      }

      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok) {
        showToast('Order status & dispatch info updated!')
        setSelectedOrder(null)
        fetchOrders()
      } else {
        showToast(data.error || 'Failed to update order', 'error')
      }
    } catch {
      showToast('Error updating order status', 'error')
    }
  }

  const paymentBadgeStyle = (st: string) => {
    if (st === 'PAID') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
    if (st === 'PARTIALLY_PAID') return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
    if (st === 'UNPAID' || st === 'PENDING') return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
    if (st === 'REFUNDED') return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
    return 'bg-stone-500/10 text-[var(--text-secondary)] border border-[var(--border)]'
  }

  const fulfillmentBadgeStyle = (st: string) => {
    if (st === 'DELIVERED') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
    if (st === 'SHIPPED') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
    if (st === 'PROCESSING') return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
    if (st === 'CANCELLED' || st === 'RETURNED') return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
  }

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Order Tracking & Dispatch
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            Live order processing, payment status tracking, and dispatch receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-3 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order #, phone, customer…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] py-2.5 pl-10 pr-4 text-xs font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 shadow-sm"
            />
          </div>

          <Link
            href="/store-portal-jl/dashboard/orders/create"
            className="inline-flex items-center gap-2 shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition hover:bg-amber-400 shadow-md shadow-amber-500/10"
          >
            <Plus size={16} /> RECORD ORDER
          </Link>
        </div>
      </div>

      {/* Summary Counter Widgets */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm transition hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Total Orders</span>
            <span className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500 border border-amber-500/20">
              <ShoppingBag size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">{totalOrdersCount}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)] font-medium">Recorded across store & POS</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm transition hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Completed Orders</span>
            <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500 border border-emerald-500/20">
              <CheckCircle size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">{completedOrdersCount}</p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Delivered to customers</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm transition hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Unpaid / Pending Orders</span>
            <span className="rounded-xl bg-red-500/10 p-2.5 text-red-500 border border-red-500/20">
              <AlertCircle size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">{unpaidOrdersCount}</p>
          <p className="mt-1 text-xs text-red-500 font-semibold">Requires payment verification</p>
        </div>
      </div>

      {/* Status Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--border)] pb-3">
        <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider flex items-center gap-1.5 mr-2 shrink-0">
          <Filter size={14} /> Filter Payment:
        </span>
        {PAYMENT_FILTERS.map((st) => (
          <button
            key={st}
            onClick={() => setActivePaymentFilter(st)}
            className={`rounded-xl border px-4 py-1.5 text-xs font-bold tracking-wider transition whitespace-nowrap ${
              activePaymentFilter === st
                ? 'border-amber-500 bg-amber-500/15 text-amber-500'
                : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-amber-500/40 hover:text-[var(--text-primary)]'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Orders List / Data Table */}
      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Loading orders list…</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] py-20 text-center text-xs font-medium text-[var(--text-muted)]">
          No orders found matching filter.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const cleanWa = (o.customerWhatsapp || o.customerPhone).replace(/\D/g, '')

            const waTrackingMsg = `Hello ${o.customerName}! Update on your Jessy Luxury order #${o.orderNumber}:\n\n• Payment: ${o.paymentStatus || 'PAID'}\n• Fulfillment Status: ${o.status}\n${
              o.trackingNumber ? `• Waybill / Tracking #: ${o.trackingNumber}\n` : ''
            }${o.courierName ? `• Courier/Park: ${o.courierName}\n` : ''}${
              o.courierPhone ? `• Driver Contact: ${o.courierPhone}\n` : ''
            }${o.waybillNotes ? `• Dispatch Notes: ${o.waybillNotes}\n` : ''}\nThank you for choosing Jessy Luxury Fragrance!`

            const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(waTrackingMsg)}`

            return (
              <div
                key={o.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 transition hover:border-amber-500/40 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[var(--border)] pb-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-lg font-bold text-amber-500">{o.orderNumber}</span>
                    <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wider ${fulfillmentBadgeStyle(o.status)}`}>
                      {o.status}
                    </span>
                    <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wider ${paymentBadgeStyle(o.paymentStatus || 'PAID')}`}>
                      {o.paymentStatus || 'PAID'}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono font-medium">
                      {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenFulfill(o)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-bold text-amber-500 hover:bg-amber-500 hover:text-stone-950 transition"
                    >
                      <Truck size={14} /> Update Dispatch / Status
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-sm"
                    >
                      <MessageCircle size={14} /> Receipt
                    </a>
                  </div>
                </div>

                <div className="grid gap-4 pt-4 sm:grid-cols-3 text-xs">
                  <div className="space-y-1">
                    <p className="font-bold text-[var(--text-primary)]">{o.customerName}</p>
                    <p className="text-[var(--text-muted)] font-mono font-medium">{o.customerPhone}</p>
                    {o.shippingAddress && (
                      <p className="text-[var(--text-secondary)] flex items-start gap-1 font-medium">
                        <MapPin size={13} className="shrink-0 text-amber-500 mt-0.5" />
                        {o.shippingAddress}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-[var(--text-secondary)] font-medium">
                      Zone: <strong className="text-[var(--text-primary)]">{o.shippingZone?.name || 'Standard'}</strong>
                    </p>
                    {o.trackingNumber && (
                      <p className="text-amber-500 font-mono font-bold">
                        Waybill #: <strong>{o.trackingNumber}</strong>
                      </p>
                    )}
                    {o.courierName && (
                      <p className="text-[var(--text-secondary)] font-medium">
                        Courier: <strong className="text-[var(--text-primary)]">{o.courierName}</strong> {o.courierPhone ? `(${o.courierPhone})` : ''}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 sm:text-right">
                    <p className="text-[var(--text-secondary)] font-medium">
                      Subtotal: <span className="font-mono text-[var(--text-primary)]">₦{o.subtotal?.toLocaleString('en-NG')}</span>
                    </p>
                    {o.discountAmount > 0 && (
                      <p className="text-emerald-500 font-semibold">
                        Discount ({o.couponCode}): -₦{o.discountAmount?.toLocaleString('en-NG')}
                      </p>
                    )}
                    <p className="font-display text-base font-bold text-[var(--text-primary)]">
                      Total: ₦{o.total?.toLocaleString('en-NG')}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-[var(--border)] pt-3 flex flex-wrap gap-2 text-[11px] text-[var(--text-secondary)]">
                  {o.items?.map((item: any) => (
                    <span key={item.id} className="rounded-lg bg-[var(--bg-primary)] px-2.5 py-1 border border-[var(--border)] font-mono font-semibold">
                      • {item.product?.name || 'Fragrance'} x{item.quantity} (₦{item.price?.toLocaleString('en-NG')})
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal for Fulfillment & Payment Updates */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">Order #{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Fulfillment tracking & payment validation</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[var(--border)] mb-2">
              <button
                type="button"
                onClick={() => setActiveModalTab('form')}
                className={`px-4 py-2 text-xs font-bold border-b-2 uppercase tracking-wider flex items-center gap-1.5 ${
                  activeModalTab === 'form' ? 'border-amber-500 text-amber-500' : 'border-transparent text-[var(--text-secondary)]'
                }`}
              >
                <Truck size={13} /> Update Status
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('timeline')}
                className={`px-4 py-2 text-xs font-bold border-b-2 uppercase tracking-wider flex items-center gap-1.5 ${
                  activeModalTab === 'timeline' ? 'border-amber-500 text-amber-500' : 'border-transparent text-[var(--text-secondary)]'
                }`}
              >
                <Clock size={13} /> Timeline & Audits
              </button>
            </div>

            {activeModalTab === 'form' ? (
              <form onSubmit={handleSaveFulfill} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-bold">Fulfillment Status</label>
                    <select
                      value={statusForm.status}
                      onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-amber-500 font-bold outline-none focus:border-amber-500"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                      <option value="RETURNED">RETURNED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-bold">Payment Status</label>
                    <select
                      value={statusForm.paymentStatus}
                      onChange={(e) => setStatusForm({ ...statusForm, paymentStatus: e.target.value })}
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-emerald-500 font-bold outline-none focus:border-emerald-500"
                    >
                      <option value="PAID">PAID</option>
                      <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                      <option value="UNPAID">UNPAID</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>
                </div>

                {/* Inspect Returned Stock Checklist if status is RETURNED */}
                {statusForm.status === 'RETURNED' && (
                  <div className="space-y-2 border border-dashed border-amber-500/30 rounded-xl p-3 bg-amber-500/5">
                    <p className="font-bold text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider">Inspect Returned Items</p>
                    <p className="text-[9px] text-[var(--text-muted)] mb-2 font-medium">Toggle restockable items. Unchecked items are logged as damaged stock.</p>
                    {selectedOrder.items?.map((item: any) => {
                      const prodId = item.productId
                      const isChecked = restockState[prodId] ?? false
                      return (
                        <label key={item.id} className="flex items-center gap-2.5 cursor-pointer py-0.5 select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setRestockState({ ...restockState, [prodId]: e.target.checked })}
                            className="h-3.5 w-3.5 rounded border-[var(--border)] text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                          />
                          <span className="text-[11px] text-[var(--text-primary)] font-bold">
                            {item.product?.name || 'Fragrance'} x{item.quantity} (Mark Restockable)
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-bold">Tracking Number / Waybill Receipt #</label>
                  <input
                    value={statusForm.trackingNumber}
                    onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                    placeholder="e.g. OWR-PARK-8849"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-bold">Courier / Transport Park</label>
                    <input
                      value={statusForm.courierName}
                      onChange={(e) => setStatusForm({ ...statusForm, courierName: e.target.value })}
                      placeholder="e.g. Peace Park or Kwik Rider"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-secondary)] mb-1 font-bold">Driver / Rider Phone</label>
                    <input
                      value={statusForm.courierPhone}
                      onChange={(e) => setStatusForm({ ...statusForm, courierPhone: e.target.value })}
                      placeholder="e.g. +2348012345678"
                      className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 font-mono"
                  />
                  </div>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-bold">Dispatch / Waybill Notes</label>
                  <textarea
                    value={statusForm.waybillNotes}
                    onChange={(e) => setStatusForm({ ...statusForm, waybillNotes: e.target.value })}
                    placeholder="Instructions for customer when picking up from park or rider..."
                    rows={2}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 resize-none font-medium"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-xl border border-[var(--border)] px-5 py-2.5 font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-amber-500 px-6 py-2.5 font-bold text-stone-950 hover:bg-amber-400 transition"
                  >
                    Save Dispatch Info
                  </button>
                </div>
              </form>
            ) : (
              /* Timeline Tab */
              <div className="space-y-4 text-xs max-h-96 overflow-y-auto">
                {/* Custom price adjustment overrides */}
                {selectedOrder.priceAdjustments && selectedOrder.priceAdjustments.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-bold text-[10px] text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <FileText size={13} className="text-amber-500" /> Price Override Audit Logs
                    </p>
                    <div className="space-y-1.5">
                      {selectedOrder.priceAdjustments.map((adj: any) => (
                        <div key={adj.id} className="rounded-xl bg-[var(--bg-primary)] p-2.5 border border-[var(--border)] font-mono text-[10px] text-[var(--text-secondary)]">
                          <strong className="text-[var(--text-primary)]">{adj.productName}</strong>: Original ₦{adj.originalPrice?.toLocaleString()} → Custom ₦{adj.customPrice?.toLocaleString()} (Diff: {adj.difference >= 0 ? '+' : ''}₦{adj.difference?.toLocaleString()})
                          <p className="text-[9px] text-[var(--text-muted)] mt-0.5 font-sans">Reason: {adj.reason || 'Manual POS Override'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timeline activity stream */}
                <div className="space-y-3">
                  <p className="font-bold text-[10px] text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={13} className="text-amber-500" /> Activity Timeline Logs
                  </p>
                  
                  {selectedOrder.timeline && selectedOrder.timeline.length > 0 ? (
                    <div className="space-y-3 pl-1">
                      {selectedOrder.timeline.map((item: any) => (
                        <div key={item.id} className="border-l-2 border-amber-500/25 pl-3 py-0.5 space-y-0.5">
                          <div className="flex justify-between items-baseline font-bold text-[11px] text-[var(--text-primary)]">
                            <span>{item.eventType}</span>
                            <span className="text-[9px] font-mono text-[var(--text-muted)]">
                              {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--text-secondary)] font-medium">{item.message}</p>
                          <p className="text-[9px] text-[var(--text-muted)]">By: {item.actorId}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] py-4 text-center">No timeline records registered.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
