'use client'
import { useEffect, useState } from 'react'
import { Truck, CheckCircle2, Clock, Package, MapPin, AlertCircle, AlertTriangle } from 'lucide-react'

export default function TrackOrderDetailsPage({ params }: { params: { token: string } }) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params.token) {
      fetchTracking()
    }
  }, [params.token])

  async function fetchTracking() {
    try {
      const res = await fetch(`/api/orders/track/${params.token}`)
      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many requests. Please try again in a minute.')
        } else {
          setError('Order not found. Please verify your tracking link.')
        }
        return
      }
      const data = await res.json()
      setOrder(data)
    } catch (err) {
      console.error('Error fetching tracking info', err)
      setError('Could not connect to tracking server.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Truck className="animate-bounce text-amber-500 mx-auto" size={40} />
          <p className="text-xs font-semibold text-[var(--text-muted)] tracking-wider">RETRIEVING LIVE SHIPMENT DATA...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--bg-primary)] py-20 px-6">
        <div className="mx-auto max-w-md rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4">
          <AlertCircle className="text-red-500 mx-auto" size={40} />
          <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">Tracking Failed</h2>
          <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{error}</p>
          <a
            href="/track"
            className="inline-block rounded-xl bg-[var(--border)] border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--text-primary)] hover:border-amber-500 transition"
          >
            Go Back
          </a>
        </div>
      </main>
    )
  }

  // Derive stepper completion status
  const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']
  const statusLabels = {
    PENDING: 'Order Placed',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
  }
  const currentIdx = statuses.indexOf(order.status)

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] pb-20">
      {/* Banner */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card-bg)] py-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.08),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">Live Delivery Tracking</span>
            <h1 className="mt-2 font-mono text-3xl font-bold text-[var(--text-primary)]">{order.orderNumber}</h1>
            <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
              Destination Zone: <strong className="text-amber-500">{order.shippingZone}</strong> ({order.estimatedDays})
            </p>
          </div>

          <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-2xl p-4 flex items-center gap-3 self-start md:self-auto shadow-sm">
            <span className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
              <Truck size={20} />
            </span>
            <div>
              <span className="text-[9px] font-bold text-[var(--text-muted)] block">SHIPMENT STATUS</span>
              <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide">{statusLabels[order.status as keyof typeof statusLabels] || order.status}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Timeline Stepper */}
      <section className="mx-auto max-w-4xl px-6 mt-12">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 sm:p-8 space-y-8 shadow-sm">
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-[var(--border)]">
            <div className="absolute left-[15px] sm:left-0 sm:right-0 top-[20px] sm:top-1/2 h-[calc(100%-40px)] sm:h-0.5 w-0.5 sm:w-full bg-[var(--border)] -translate-y-1/2 -z-10 hidden sm:block" />
            
            {statuses.map((step, idx) => {
              const isActive = idx <= currentIdx
              const isCurrent = idx === currentIdx
              return (
                <div key={step} className="flex sm:flex-col items-center gap-3 sm:gap-2 relative z-10 flex-1 w-full sm:text-center">
                  <div
                    className={`h-8 w-8 rounded-full border flex items-center justify-center transition shadow-sm ${
                      isCurrent
                        ? 'border-amber-500 bg-amber-500 text-stone-950 font-bold'
                        : isActive
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                        : 'border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)]'
                    }`}
                  >
                    {isActive && !isCurrent ? <CheckCircle2 size={16} /> : <span className="text-xs font-mono">{idx + 1}</span>}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {statusLabels[step as keyof typeof statusLabels]}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Courier Tracking info */}
            <div className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-5 space-y-4 shadow-xs">
              <h3 className="font-display text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Truck size={16} className="text-amber-500" /> Waybill &amp; Dispatch Information
              </h3>

              <div className="grid gap-4 sm:grid-cols-2 text-xs text-[var(--text-secondary)] font-medium">
                <div className="space-y-0.5">
                  <span className="text-[var(--text-muted)] block font-bold">Courier / Transport Service</span>
                  <p className="font-bold text-[var(--text-primary)] text-sm">{order.courierName || 'Pending Assignment'}</p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[var(--text-muted)] block font-bold">Waybill / Tracking Receipt</span>
                  <p className="font-mono text-amber-500 font-bold text-sm">{order.trackingNumber || 'Pending Dispatch'}</p>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-5 flex flex-col justify-between shadow-xs text-xs">
              <div>
                <span className="text-[var(--text-muted)] block font-bold mb-1">TOTAL AMOUNT PAID</span>
                <p className="font-mono text-xl font-bold text-amber-500">₦{order.total.toLocaleString('en-NG')}</p>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] font-medium mt-3 leading-relaxed">
                Includes all item discounts, category coupons, and zone waybill/delivery charges.
              </p>
            </div>
          </div>

          {/* Items allowlist summary */}
          <div>
            <h4 className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase mb-3">Package Contents</h4>
            <div className="divide-y divide-[var(--border)] border-t border-b border-[var(--border)]">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-3 text-xs font-medium">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">{item.productName}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--text-primary)]">Qty: {item.quantity}</p>
                    <p className="font-mono text-[var(--text-muted)] mt-0.5">₦{item.price.toLocaleString('en-NG')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Timeline History */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Status History</h4>
            <div className="space-y-4 border-l-2 border-[var(--border)] pl-5 ml-2.5">
              {order.timeline.map((evt: any, idx: number) => (
                <div key={idx} className="relative space-y-1">
                  <span className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-amber-500 shadow-sm" />
                  <p className="text-xs font-bold text-[var(--text-primary)]">{evt.message}</p>
                  <p className="text-[10px] text-[var(--text-muted)] font-medium">
                    {new Date(evt.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
