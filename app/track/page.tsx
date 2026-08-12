'use client'
import { useState } from 'react'
import { Search, PackageCheck, Truck, Clock, MapPin, Phone, AlertCircle, Sparkles } from 'lucide-react'

export default function TrackOrderPage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState('')

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(query.trim())}`)
      const data = await res.json()
      if (res.ok && data && !data.error) {
        setOrder(data)
      } else {
        setError(data.error || 'Order not found. Please check your Order Number or Phone Number.')
      }
    } catch (err) {
      console.error('Error tracking order', err)
      setError('Could not connect to tracking service. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-stone-950 min-h-[80vh]">
      <section className="relative overflow-hidden border-b border-stone-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[10px] font-semibold tracking-[0.2em] text-amber-300">
            <Truck size={12} /> LIVE ORDER TRACKING
          </p>
          <h1 className="mt-4 font-display text-5xl text-stone-50 sm:text-6xl">Track Your Order</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-400">
            Enter your Order Number (e.g. JL-849201) or Phone Number to check live courier, rider and waybill status.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-3.5 text-stone-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Order # or Phone..."
                required
                className="w-full rounded-full border border-stone-700 bg-stone-900 py-3 pl-11 pr-4 text-sm text-stone-200 outline-none transition placeholder:text-stone-600 focus:border-amber-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-amber-500 px-6 py-3 text-xs font-bold tracking-wider text-stone-950 transition hover:bg-amber-400 disabled:opacity-50 shrink-0"
            >
              {loading ? 'TRACKING…' : 'SEARCH'}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-300 text-sm">
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {order && (
          <div className="rounded-3xl border border-stone-800 bg-stone-900/60 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-800 pb-6 gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">Order Details</span>
                <h2 className="font-mono text-2xl font-bold text-stone-50">{order.orderNumber}</h2>
                <p className="text-xs text-stone-400 mt-1">Placed by {order.customerName}</p>
              </div>

              <div className="text-left sm:text-right">
                <span
                  className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold tracking-wider ${
                    order.status === 'DELIVERED'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : order.status === 'SHIPPED'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : order.status === 'PROCESSING'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  STATUS: {order.status}
                </span>
                <p className="text-xs text-stone-500 mt-2">
                  Total: <strong className="text-amber-300 font-mono text-sm">₦{order.total?.toLocaleString('en-NG')}</strong>
                </p>
              </div>
            </div>

            {/* Courier & Dispatch Tracking Information */}
            <div className="rounded-2xl border border-stone-800 bg-stone-950 p-5 space-y-4">
              <h3 className="font-display text-lg text-stone-100 flex items-center gap-2">
                <Truck size={18} className="text-amber-400" /> Courier &amp; Waybill Tracking
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 text-xs text-stone-300">
                <div className="space-y-1">
                  <span className="text-stone-500 block">Shipping Method / Zone:</span>
                  <p className="font-medium text-stone-200">{order.shippingZone?.name || 'Standard Dispatch'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-stone-500 block">Waybill / Tracking Receipt #:</span>
                  <p className="font-mono text-amber-300 font-bold">{order.trackingNumber || 'Pending Dispatch'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-stone-500 block">Courier / Transport Park:</span>
                  <p className="font-medium text-stone-200">{order.courierName || 'Assigned Rider'}</p>
                </div>

                {order.courierPhone && (
                  <div className="space-y-1">
                    <span className="text-stone-500 block">Driver / Courier Contact:</span>
                    <a href={`tel:${order.courierPhone}`} className="font-mono text-blue-400 flex items-center gap-1">
                      <Phone size={12} /> {order.courierPhone}
                    </a>
                  </div>
                )}
              </div>

              {order.waybillNotes && (
                <div className="border-t border-stone-800/80 pt-3 text-xs">
                  <span className="text-stone-500 block mb-1">Dispatch Notes:</span>
                  <p className="text-stone-300 bg-stone-900 p-3 rounded-xl border border-stone-800">{order.waybillNotes}</p>
                </div>
              )}
            </div>

            {/* Order Items Summary */}
            <div>
              <h4 className="text-xs font-bold tracking-wider text-stone-400 uppercase mb-3">Items in your package</h4>
              <div className="space-y-2">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-stone-900 p-3 text-xs">
                    <div>
                      <p className="font-semibold text-stone-100">{item.product?.name || 'Fragrance'}</p>
                      <p className="text-[10px] text-stone-500">{item.product?.brand} • x{item.quantity}</p>
                    </div>
                    <span className="font-mono font-semibold text-stone-200">
                      ₦{(item.price * item.quantity).toLocaleString('en-NG')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
