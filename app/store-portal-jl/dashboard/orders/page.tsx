'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingBag, Search, Truck, Phone, MessageCircle, CheckCircle,
  X, MapPin, Plus, AlertCircle, Clock, FileText, ChevronRight, Trash2,
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
  const [deletingOrder, setDeletingOrder] = useState(false)
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

  async function handleDeleteOrder(orderId: number, orderNumber: string) {
    if (!confirm(`Are you sure you want to permanently delete order ${orderNumber}?\n\nThis will restore stock and cannot be undone.`)) {
      return
    }

    setDeletingOrder(true)
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (res.ok) {
        showToast(`Order ${orderNumber} deleted successfully`)
        setSelectedOrder(null)
        fetchOrders()
      } else {
        showToast(data.error || 'Failed to delete order', 'error')
      }
    } catch {
      showToast('Error deleting order', 'error')
    } finally {
      setDeletingOrder(false)
    }
  }

  const paymentBadgeStyle = (st: string) => {
    if (st === 'PAID') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
    if (st === 'PARTIALLY_PAID') return 'bg-[var(--champagne-soft)] text-[#7a5c22] border border-[var(--champagne)]/30'
    if (st === 'UNPAID' || st === 'PENDING') return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
    if (st === 'REFUNDED') return 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20'
    return 'bg-stone-500/10 text-[var(--admin-text-secondary)] border border-[var(--admin-border)]'
  }

  const fulfillmentBadgeStyle = (st: string) => {
    if (st === 'DELIVERED') return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
    if (st === 'SHIPPED') return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
    if (st === 'PROCESSING') return 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20'
    if (st === 'CANCELLED' || st === 'RETURNED') return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
    return 'bg-[var(--champagne-soft)] text-[#7a5c22] border border-[var(--champagne)]/30'
  }

  const inp = 'admin-input font-medium'
  const lbl = 'mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]'

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Fulfillment</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Orders & Dispatch</h1>
          <p className="mt-1 text-xs font-medium text-[var(--admin-text-secondary)]">
            Live order processing, payment verification and dispatch receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Order #, phone, customer…"
              className={`${inp} pl-9`}
            />
          </div>

          <Link
            href="/store-portal-jl/dashboard/orders/create"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)]"
          >
            <Plus size={15} /> New Sale
          </Link>
        </div>
      </div>

      {/* Counters */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="admin-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Total Orders</span>
            <span className="rounded-lg bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
              <ShoppingBag size={16} />
            </span>
          </div>
          <p className="mt-2.5 font-display text-2xl font-bold tabular-nums">{totalOrdersCount}</p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--admin-text-muted)]">Recorded across store & POS</p>
        </div>

        <div className="admin-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Completed</span>
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <CheckCircle size={16} />
            </span>
          </div>
          <p className="mt-2.5 font-display text-2xl font-bold tabular-nums">{completedOrdersCount}</p>
          <p className="mt-0.5 text-[11px] font-medium text-emerald-600">Delivered to customers</p>
        </div>

        <div className="admin-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Needs Payment</span>
            <span className="rounded-lg bg-red-500/10 p-2 text-red-500">
              <AlertCircle size={16} />
            </span>
          </div>
          <p className="mt-2.5 font-display text-2xl font-bold tabular-nums">{unpaidOrdersCount}</p>
          <p className="mt-0.5 text-[11px] font-medium text-red-500">Requires payment verification</p>
        </div>
      </div>

      {/* Filters */}
      <div className="hide-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {PAYMENT_FILTERS.map((st) => (
          <button
            key={st}
            onClick={() => setActivePaymentFilter(st)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-[11px] font-bold tracking-wider transition ${
              activePaymentFilter === st
                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                : 'border-[var(--admin-border)] bg-[var(--admin-card-bg)] text-[var(--admin-text-secondary)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]'
            }`}
          >
            {st.replaceAll('_', ' ')}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-28 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-card py-16 text-center">
          <ShoppingBag size={30} className="mx-auto text-[var(--admin-text-muted)]" />
          <p className="mt-3 font-display text-lg font-bold">No orders found</p>
          <p className="mt-1 text-xs text-[var(--admin-text-muted)]">Try a different filter or search term.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const cleanWa = (o.customerWhatsapp || o.customerPhone).replace(/\D/g, '')

            const waTrackingMsg = `Hello ${o.customerName}! Update on your Jessy Luxury order #${o.orderNumber}:\n\n• Payment: ${o.paymentStatus || 'PAID'}\n• Fulfillment Status: ${o.status}\n${
              o.trackingNumber ? `• Waybill / Tracking #: ${o.trackingNumber}\n` : ''
            }${o.courierName ? `• Courier/Park: ${o.courierName}\n` : ''}${
              o.courierPhone ? `• Driver Contact: ${o.courierPhone}\n` : ''
            }${o.waybillNotes ? `• Dispatch Notes: ${o.waybillNotes}\n` : ''}\nThank you for choosing Jessy Luxury Fragrance!`

            const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(waTrackingMsg)}`

            return (
              <article
                key={o.id}
                className="admin-card cursor-pointer p-4 sm:p-5"
                onClick={() => handleOpenFulfill(o)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handleOpenFulfill(o) }}
                aria-label={`Open order ${o.orderNumber}`}
              >
                {/* Row 1: id + badges + actions */}
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-base font-bold text-[var(--accent)]">{o.orderNumber}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${fulfillmentBadgeStyle(o.status)}`}>
                      {o.status}
                    </span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${paymentBadgeStyle(o.paymentStatus || 'PAID')}`}>
                      {o.paymentStatus || 'PAID'}
                    </span>
                    <span className="font-mono text-[11px] font-medium text-[var(--admin-text-muted)]">
                      {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenFulfill(o)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-2 text-[11px] font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
                    >
                      <Truck size={13} /> Dispatch
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-emerald-500"
                      title="Send receipt via WhatsApp"
                    >
                      <MessageCircle size={13} /> Receipt
                    </a>
                    <button
                      onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] font-bold text-red-600 transition hover:bg-red-500 hover:text-white"
                      title="Delete order"
                    >
                      <X size={13} /> Delete
                    </button>
                    <ChevronRight size={16} className="hidden text-[var(--admin-text-muted)] sm:block" />
                  </div>
                </div>

                {/* Row 2: details grid */}
                <div className="grid gap-4 pt-3.5 text-xs sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="font-bold">{o.customerName}</p>
                    <p className="font-mono font-medium text-[var(--admin-text-muted)]">{o.customerPhone}</p>
                    {o.shippingAddress && (
                      <p className="flex items-start gap-1 font-medium text-[var(--admin-text-secondary)]">
                        <MapPin size={13} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                        {o.shippingAddress}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="font-medium text-[var(--admin-text-secondary)]">
                      Zone: <strong className="text-[var(--admin-text-primary)]">{o.shippingZone?.name || 'Standard'}</strong>
                    </p>
                    {o.trackingNumber && (
                      <p className="font-mono font-bold text-[var(--accent)]">
                        Waybill #: <strong>{o.trackingNumber}</strong>
                      </p>
                    )}
                    {o.courierName && (
                      <p className="font-medium text-[var(--admin-text-secondary)]">
                        Courier: <strong className="text-[var(--admin-text-primary)]">{o.courierName}</strong> {o.courierPhone ? `(${o.courierPhone})` : ''}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 sm:text-right">
                    <p className="font-medium text-[var(--admin-text-secondary)]">
                      Subtotal: <span className="font-mono text-[var(--admin-text-primary)]">₦{o.subtotal?.toLocaleString('en-NG')}</span>
                    </p>
                    {o.discountAmount > 0 && (
                      <p className="font-semibold text-emerald-600">
                        Discount ({o.couponCode}): −₦{o.discountAmount?.toLocaleString('en-NG')}
                      </p>
                    )}
                    <p className="font-display text-base font-bold tabular-nums">
                      Total: ₦{o.total?.toLocaleString('en-NG')}
                    </p>
                  </div>
                </div>

                {/* Row 3: items */}
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--admin-border)] pt-3 text-[11px]">
                  {o.items?.map((item: any) => (
                    <span key={item.id} className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-2.5 py-1 font-mono font-semibold text-[var(--admin-text-secondary)]">
                      {item.product?.name || 'Fragrance'} ×{item.quantity} · ₦{item.price?.toLocaleString('en-NG')}
                    </span>
                  ))}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* ══ Fulfillment detail panel (slide-in) ══ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fade-in absolute inset-0 bg-stone-950/60 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />

          <aside
            className="animate-slide-up relative z-10 flex h-full w-full max-w-xl flex-col overflow-hidden border-l border-[var(--admin-border)] bg-[var(--admin-card-bg)] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={`Fulfill order ${selectedOrder.orderNumber}`}
          >
            {/* Panel header */}
            <div className="flex items-start justify-between gap-3 border-b border-[var(--admin-border)] px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Order detail</p>
                <h3 className="mt-0.5 font-mono text-lg font-bold">{selectedOrder.orderNumber}</h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${fulfillmentBadgeStyle(selectedOrder.status)}`}>
                    {selectedOrder.status}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${paymentBadgeStyle(selectedOrder.paymentStatus || 'PAID')}`}>
                    {selectedOrder.paymentStatus || 'PAID'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 text-[var(--admin-text-muted)] transition hover:bg-[var(--admin-table-row-hover)] hover:text-[var(--admin-text-primary)]"
                aria-label="Close panel"
              >
                <X size={19} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--admin-border)] px-6">
              <button
                type="button"
                onClick={() => setActiveModalTab('form')}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
                  activeModalTab === 'form'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                <Truck size={13} /> Update Status
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab('timeline')}
                className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition ${
                  activeModalTab === 'timeline'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
                }`}
              >
                <Clock size={13} /> Timeline & Audits
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {activeModalTab === 'form' ? (
                <form id="fulfill-form" onSubmit={handleSaveFulfill} className="space-y-4 text-xs">
                  {/* Customer summary */}
                  <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold">{selectedOrder.customerName}</p>
                        <p className="font-mono text-[11px] text-[var(--admin-text-muted)]">{selectedOrder.customerPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-base font-bold tabular-nums">₦{selectedOrder.total?.toLocaleString('en-NG')}</p>
                        {selectedOrder.discountAmount > 0 && (
                          <p className="text-[10px] font-semibold text-emerald-600">−₦{selectedOrder.discountAmount.toLocaleString('en-NG')} coupon</p>
                        )}
                      </div>
                    </div>
                    {selectedOrder.shippingAddress && (
                      <p className="mt-2 flex items-start gap-1.5 border-t border-[var(--admin-border)] pt-2 text-[11px] text-[var(--admin-text-secondary)]">
                        <MapPin size={12} className="mt-0.5 shrink-0 text-[var(--accent)]" /> {selectedOrder.shippingAddress}
                      </p>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5">
                    {selectedOrder.items?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] px-3 py-2 text-[11px]">
                        <span className="truncate font-semibold">{item.product?.name || 'Fragrance'} ×{item.quantity}</span>
                        <span className="shrink-0 font-mono tabular-nums text-[var(--admin-text-secondary)]">₦{(item.price * item.quantity)?.toLocaleString('en-NG')}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Fulfillment Status</label>
                      <select
                        value={statusForm.status}
                        onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                        className={`${inp} font-bold`}
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
                      <label className={lbl}>Payment Status</label>
                      <select
                        value={statusForm.paymentStatus}
                        onChange={(e) => setStatusForm({ ...statusForm, paymentStatus: e.target.value })}
                        className={`${inp} font-bold`}
                      >
                        <option value="PAID">PAID</option>
                        <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                        <option value="UNPAID">UNPAID</option>
                        <option value="REFUNDED">REFUNDED</option>
                      </select>
                    </div>
                  </div>

                  {/* Returned stock checklist */}
                  {statusForm.status === 'RETURNED' && (
                    <div className="space-y-2 rounded-lg border border-dashed border-[var(--champagne)]/40 bg-[var(--champagne-soft)]/40 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a5c22]">Inspect Returned Items</p>
                      <p className="mb-1 text-[10px] font-medium text-[var(--admin-text-muted)]">
                        Toggle restockable items. Unchecked items are logged as damaged stock.
                      </p>
                      {selectedOrder.items?.map((item: any) => {
                        const prodId = item.productId
                        const isChecked = restockState[prodId] ?? false
                        return (
                          <label key={item.id} className="flex cursor-pointer select-none items-center gap-2.5 py-0.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => setRestockState({ ...restockState, [prodId]: e.target.checked })}
                              className="h-3.5 w-3.5 cursor-pointer rounded border-[var(--admin-border)] accent-[var(--accent)]"
                            />
                            <span className="text-[11px] font-bold">
                              {item.product?.name || 'Fragrance'} ×{item.quantity} (Mark Restockable)
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  <div>
                    <label className={lbl}>Tracking Number / Waybill Receipt #</label>
                    <input
                      value={statusForm.trackingNumber}
                      onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                      placeholder="e.g. OWR-PARK-8849"
                      className={`${inp} font-mono`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Courier / Transport Park</label>
                      <input
                        value={statusForm.courierName}
                        onChange={(e) => setStatusForm({ ...statusForm, courierName: e.target.value })}
                        placeholder="e.g. Peace Park or Kwik Rider"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className={lbl}>Driver / Rider Phone</label>
                      <input
                        value={statusForm.courierPhone}
                        onChange={(e) => setStatusForm({ ...statusForm, courierPhone: e.target.value })}
                        placeholder="+2348012345678"
                        className={`${inp} font-mono`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Dispatch / Waybill Notes</label>
                    <textarea
                      value={statusForm.waybillNotes}
                      onChange={(e) => setStatusForm({ ...statusForm, waybillNotes: e.target.value })}
                      placeholder="Instructions for customer when picking up from park or rider…"
                      rows={2}
                      className={`${inp} resize-none`}
                    />
                  </div>
                </form>
              ) : (
                /* ── Timeline tab ── */
                <div className="space-y-5 text-xs">
                  {selectedOrder.priceAdjustments && selectedOrder.priceAdjustments.length > 0 && (
                    <div className="space-y-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
                        <FileText size={13} className="text-[var(--accent)]" /> Price Override Audit Logs
                      </p>
                      <div className="space-y-1.5">
                        {selectedOrder.priceAdjustments.map((adj: any) => (
                          <div key={adj.id} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-2.5 font-mono text-[10px] text-[var(--admin-text-secondary)]">
                            <strong className="text-[var(--admin-text-primary)]">{adj.productName}</strong>: Original ₦{adj.originalPrice?.toLocaleString()} → Custom ₦{adj.customPrice?.toLocaleString()} (Diff: {adj.difference >= 0 ? '+' : ''}₦{adj.difference?.toLocaleString()})
                            <p className="mt-0.5 font-sans text-[9px] text-[var(--admin-text-muted)]">Reason: {adj.reason || 'Manual POS Override'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
                      <Clock size={13} className="text-[var(--accent)]" /> Activity Timeline
                    </p>

                    {selectedOrder.timeline && selectedOrder.timeline.length > 0 ? (
                      <ol className="ml-2 space-y-4 border-l-2 border-[var(--admin-border)] pl-5">
                        {[...selectedOrder.timeline].reverse().map((item: any, idx: number) => (
                          <li key={item.id} className="relative">
                            <span className={`absolute -left-[27px] top-1 h-2.5 w-2.5 rounded-full ${
                              idx === 0 ? 'bg-[var(--accent)] ring-4 ring-[var(--accent-soft)]' : 'bg-[var(--champagne)]'
                            }`} />
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[11px] font-bold">{item.eventType}</span>
                              <span className="shrink-0 font-mono text-[9px] text-[var(--admin-text-muted)]">
                                {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[11px] font-medium text-[var(--admin-text-secondary)]">{item.message}</p>
                            <p className="text-[9px] text-[var(--admin-text-muted)]">By: {item.actorId}</p>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="py-6 text-center text-[11px] text-[var(--admin-text-muted)]">No timeline records registered.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Panel footer */}
            {activeModalTab === 'form' && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] px-6 py-4">
                <button
                  type="button"
                  onClick={() => selectedOrder && handleDeleteOrder(selectedOrder.id, selectedOrder.orderNumber)}
                  disabled={deletingOrder}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-500 hover:text-white disabled:opacity-60 dark:text-red-400"
                >
                  <Trash2 size={13} /> {deletingOrder ? 'Deleting…' : 'Delete Order'}
                </button>
                <div className="ml-auto flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-lg border border-[var(--admin-border)] px-5 py-2.5 text-xs font-bold text-[var(--admin-text-secondary)] transition hover:text-[var(--admin-text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="fulfill-form"
                    disabled={deletingOrder}
                    className="rounded-lg bg-[var(--accent)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
                  >
                    Save Dispatch Info
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
