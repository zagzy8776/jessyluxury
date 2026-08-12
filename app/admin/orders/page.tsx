'use client'
import { useEffect, useState } from 'react'
import {
  ShoppingBag,
  Search,
  Truck,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle,
  Edit2,
  X,
  Send,
  MapPin,
} from 'lucide-react'

const STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [statusForm, setStatusForm] = useState({
    status: 'PENDING',
    trackingNumber: '',
    courierName: '',
    courierPhone: '',
    waybillNotes: '',
  })

  useEffect(() => {
    fetchOrders()
  }, [activeStatus, search])

  async function fetchOrders() {
    try {
      const res = await fetch(`/api/orders?status=${activeStatus}&search=${encodeURIComponent(search)}`)
      const data = await res.json()
      if (Array.isArray(data)) setOrders(data)
    } catch (e) {
      console.error('Failed fetching orders', e)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenFulfill(order: any) {
    setSelectedOrder(order)
    setStatusForm({
      status: order.status,
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
      await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(statusForm),
      })
      setSelectedOrder(null)
      fetchOrders()
    } catch (err) {
      console.error('Error updating order fulfillment', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-50">Orders &amp; Dispatch Manager</h1>
          <p className="mt-1 text-sm text-stone-400">
            Fulfill orders, log rider &amp; park waybill tracking details, and notify customers on WhatsApp.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-3 text-stone-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Order #, phone, customer..."
            className="w-full rounded-xl border border-stone-800 bg-stone-900 py-2.5 pl-9 pr-4 text-xs text-stone-200 outline-none transition placeholder:text-stone-600 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-stone-800 pb-3">
        {STATUSES.map((st) => (
          <button
            key={st}
            onClick={() => setActiveStatus(st)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wider transition whitespace-nowrap ${
              activeStatus === st
                ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                : 'border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-stone-500">Loading orders list…</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/40 py-20 text-center text-stone-500 text-sm">
          No orders found matching status "{activeStatus}".
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const cleanPhone = o.customerPhone.replace(/\D/g, '')
            const cleanWa = (o.customerWhatsapp || o.customerPhone).replace(/\D/g, '')

            const waTrackingMsg = `Hello ${o.customerName}! Update on your Jessy Luxury order #${o.orderNumber}:\n\n• Status: ${o.status}\n${
              o.trackingNumber ? `• Tracking/Waybill #: ${o.trackingNumber}\n` : ''
            }${o.courierName ? `• Courier/Park: ${o.courierName}\n` : ''}${
              o.courierPhone ? `• Driver/Courier Contact: ${o.courierPhone}\n` : ''
            }${o.waybillNotes ? `• Dispatch Notes: ${o.waybillNotes}\n` : ''}\nThank you for choosing Jessy Luxury Fragrance!`

            const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(waTrackingMsg)}`

            return (
              <div
                key={o.id}
                className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 transition hover:border-amber-500/40"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-stone-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-amber-400">{o.orderNumber}</span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${
                        o.status === 'DELIVERED'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : o.status === 'SHIPPED'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : o.status === 'PROCESSING'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {o.status}
                    </span>
                    <span className="text-xs text-stone-500 font-mono">
                      {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenFulfill(o)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                    >
                      <Truck size={14} /> Update Dispatch / Status
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-500 transition shadow-sm"
                    >
                      <MessageCircle size={14} /> WhatsApp Info
                    </a>
                  </div>
                </div>

                <div className="grid gap-4 pt-4 sm:grid-cols-3 text-xs">
                  {/* Customer Info */}
                  <div className="space-y-1">
                    <p className="font-semibold text-stone-200">{o.customerName}</p>
                    <p className="text-stone-400 font-mono">{o.customerPhone}</p>
                    {o.shippingAddress && (
                      <p className="text-stone-500 flex items-start gap-1">
                        <MapPin size={13} className="shrink-0 text-amber-400 mt-0.5" />
                        {o.shippingAddress}
                      </p>
                    )}
                  </div>

                  {/* Shipping Zone & Tracking */}
                  <div className="space-y-1">
                    <p className="text-stone-400">
                      Destination: <strong className="text-stone-200">{o.shippingZone?.name || 'Standard'}</strong>
                    </p>
                    {o.trackingNumber && (
                      <p className="text-amber-300 font-mono">
                        Waybill #: <strong>{o.trackingNumber}</strong>
                      </p>
                    )}
                    {o.courierName && (
                      <p className="text-stone-400">
                        Courier: <strong className="text-stone-200">{o.courierName}</strong> {o.courierPhone ? `(${o.courierPhone})` : ''}
                      </p>
                    )}
                  </div>

                  {/* Total & Items */}
                  <div className="space-y-1 text-right sm:text-right">
                    <p className="text-stone-400">
                      Items Total: <span className="font-mono text-stone-200">₦{o.subtotal?.toLocaleString('en-NG')}</span>
                    </p>
                    {o.discountAmount > 0 && (
                      <p className="text-green-400">
                        Discount ({o.couponCode}): -₦{o.discountAmount?.toLocaleString('en-NG')}
                      </p>
                    )}
                    <p className="font-display text-base font-bold text-stone-50">
                      Total: ₦{o.total?.toLocaleString('en-NG')}
                    </p>
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="mt-4 border-t border-stone-800/60 pt-3 flex flex-wrap gap-3 text-[11px] text-stone-400">
                  {o.items?.map((item: any) => (
                    <span key={item.id} className="rounded-lg bg-stone-950 px-2.5 py-1 border border-stone-800">
                      • {item.product?.name || 'Product'} x{item.quantity} (₦{item.price?.toLocaleString('en-NG')})
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal for Order Fulfillment & Tracking Info */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-stone-800 bg-stone-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <h3 className="font-display text-xl text-stone-100">Order #{selectedOrder.orderNumber}</h3>
                <p className="text-xs text-stone-400">Update order status and courier tracking info</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveFulfill} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-medium">Order Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-amber-300 font-bold outline-none focus:border-amber-500"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">Tracking Number / Waybill Receipt #</label>
                <input
                  value={statusForm.trackingNumber}
                  onChange={(e) => setStatusForm({ ...statusForm, trackingNumber: e.target.value })}
                  placeholder="e.g. OWR-PARK-8849"
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Courier / Transport Park</label>
                  <input
                    value={statusForm.courierName}
                    onChange={(e) => setStatusForm({ ...statusForm, courierName: e.target.value })}
                    placeholder="e.g. Peace Park or Kwik Rider"
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Driver / Rider Phone</label>
                  <input
                    value={statusForm.courierPhone}
                    onChange={(e) => setStatusForm({ ...statusForm, courierPhone: e.target.value })}
                    placeholder="e.g. +2348012345678"
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">Dispatch / Waybill Notes</label>
                <textarea
                  value={statusForm.waybillNotes}
                  onChange={(e) => setStatusForm({ ...statusForm, waybillNotes: e.target.value })}
                  placeholder="Instructions for customer when pickup up from park or rider..."
                  rows={3}
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-stone-800 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl border border-stone-800 px-5 py-2.5 font-semibold text-stone-400 hover:text-white"
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
          </div>
        </div>
      )}
    </div>
  )
}
