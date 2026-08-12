'use client'
import { useState } from 'react'
import { Search, Truck, Phone, AlertCircle } from 'lucide-react'

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
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-[80vh]">
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] text-amber-500">
            <Truck size={14} /> LIVE ORDER TRACKING
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold text-[var(--text-primary)] sm:text-6xl">Track Your Order</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)] font-medium">
            Enter your Order Number (e.g. JL-849201) or Phone Number to check live courier, rider and waybill status.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-md items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-3.5 text-[var(--text-muted)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter Order # or Phone..."
                required
                className="w-full rounded-full border border-[var(--border)] bg-[var(--bg-primary)] py-3 pl-11 pr-4 text-sm font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 font-mono shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-amber-500 px-6 py-3 text-xs font-bold tracking-wider text-stone-950 transition hover:bg-amber-400 disabled:opacity-50 shrink-0 shadow-md shadow-amber-500/10"
            >
              {loading ? 'TRACKING…' : 'SEARCH'}
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-600 dark:text-red-400 text-sm font-bold">
            <AlertCircle size={20} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {order && (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-6 gap-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">Order Details</span>
                <h2 className="font-mono text-2xl font-bold text-[var(--text-primary)]">{order.orderNumber}</h2>
                <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">Placed by {order.customerName}</p>
              </div>

              <div className="text-left sm:text-right">
                <span
                  className={`inline-block rounded-full px-4 py-1.5 text-xs font-bold tracking-wider ${
                    order.status === 'DELIVERED'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : order.status === 'SHIPPED'
                      ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                      : order.status === 'PROCESSING'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  }`}
                >
                  STATUS: {order.status}
                </span>
                <p className="text-xs text-[var(--text-muted)] font-medium mt-2">
                  Total: <strong className="text-amber-500 font-mono text-sm">₦{order.total?.toLocaleString('en-NG')}</strong>
                </p>
              </div>
            </div>

            {/* Courier & Dispatch Tracking Information */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-5 space-y-4">
              <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Truck size={18} className="text-amber-500" /> Courier &amp; Waybill Tracking
              </h3>

              <div className="grid gap-3 sm:grid-cols-2 text-xs text-[var(--text-secondary)] font-medium">
                <div className="space-y-1">
                  <span className="text-[var(--text-muted)] block font-bold">Shipping Method / Zone:</span>
                  <p className="font-bold text-[var(--text-primary)]">{order.shippingZone?.name || 'Standard Dispatch'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[var(--text-muted)] block font-bold">Waybill / Tracking Receipt #:</span>
                  <p className="font-mono text-amber-500 font-bold">{order.trackingNumber || 'Pending Dispatch'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[var(--text-muted)] block font-bold">Courier / Transport Park:</span>
                  <p className="font-bold text-[var(--text-primary)]">{order.courierName || 'Assigned Rider'}</p>
                </div>

                {order.courierPhone && (
                  <div className="space-y-1">
                    <span className="text-[var(--text-muted)] block font-bold">Driver / Courier Contact:</span>
                    <a href={`tel:${order.courierPhone}`} className="font-mono text-blue-600 font-bold flex items-center gap-1">
                      <Phone size={12} /> {order.courierPhone}
                    </a>
                  </div>
                )}
              </div>

              {order.waybillNotes && (
                <div className="border-t border-[var(--border)] pt-3 text-xs font-medium">
                  <span className="text-[var(--text-muted)] block mb-1 font-bold">Dispatch Notes:</span>
                  <p className="text-[var(--text-primary)] bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--border)]">{order.waybillNotes}</p>
                </div>
              )}
            </div>

            {/* Order Items Summary */}
            <div>
              <h4 className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase mb-3">Items in your package</h4>
              <div className="space-y-2">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-3 text-xs">
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{item.product?.name || 'Fragrance'}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-medium">{item.product?.brand} • x{item.quantity}</p>
                    </div>
                    <span className="font-mono font-bold text-[var(--text-primary)]">
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
