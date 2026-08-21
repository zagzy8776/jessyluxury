'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Truck, CheckCircle2, Package, AlertCircle, AlertTriangle, Receipt,
  CreditCard, Loader2, PackageCheck, XCircle,
} from 'lucide-react'

const STEPS = [
  { key: 'ORDER_RECEIVED', label: 'Order received', icon: Receipt, eventTypes: ['ORDER_CREATED'] },
  { key: 'PAYMENT_CONFIRMED', label: 'Payment confirmed', icon: CreditCard, eventTypes: ['PAYMENT_UPDATED'] },
  { key: 'PROCESSING', label: 'Processing', icon: Loader2, eventTypes: ['STATUS_CHANGED'] },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck, eventTypes: ['ORDER_SHIPPED'] },
  { key: 'DELIVERED', label: 'Delivered', icon: PackageCheck, eventTypes: ['ORDER_DELIVERED'] },
] as const

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
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="space-y-4 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)]">
            <Truck size={26} className="animate-bounce text-[var(--accent)]" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Retrieving shipment…
          </p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--bg-primary)] px-6 py-20">
        <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <AlertCircle size={36} className="mx-auto text-[var(--danger)]" />
          <h2 className="font-display text-xl font-bold">Tracking unavailable</h2>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{error}</p>
          <Link href="/track" className="btn-primary mt-2 !px-6 !py-3">Try another order</Link>
        </div>
      </main>
    )
  }

  const cancelled = order.status === 'CANCELLED'
  const statusMap: Record<string, number> = {
    PENDING: 0,
    PROCESSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
  }
  let currentIdx = statusMap[order.status] ?? 0
  // Payment confirmed step (index 1) inferred from timeline
  const hasPaymentEvent = (order.timeline || []).some((e: any) => e.eventType === 'PAYMENT_UPDATED')
  if (order.status === 'PENDING' && hasPaymentEvent) currentIdx = 1

  const eventForStep = (eventTypes: readonly string[]) =>
    (order.timeline || []).find((e: any) => eventTypes.includes(e.eventType))

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] pb-20 text-[var(--text-primary)]">
      {/* Banner */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card-bg)] py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,45,127,0.08),transparent_60%)]" />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-6 px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">Live delivery tracking</p>
            <h1 className="mt-1.5 font-mono text-2xl font-bold sm:text-3xl">{order.orderNumber}</h1>
            <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
              Destination: <strong className="text-[var(--accent)]">{order.shippingZone}</strong> · Estimated {order.estimatedDays}
            </p>
          </div>

          <div
            className={`flex items-center gap-3 self-start rounded-2xl border p-4 shadow-card md:self-auto ${
              cancelled
                ? 'border-red-500/25 bg-red-500/5'
                : 'border-[var(--border)] bg-[var(--bg-primary)]'
            }`}
          >
            <span
              className={`rounded-xl p-2 ${
                cancelled ? 'bg-red-500/10 text-[var(--danger)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'
              }`}
            >
              {cancelled ? <XCircle size={20} /> : <Truck size={20} />}
            </span>
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Shipment status
              </span>
              <span className="text-sm font-bold tracking-wide">
                {cancelled
                  ? 'Cancelled'
                  : STEPS[currentIdx]?.label}
              </span>
            </div>
          </div>
        </div>
      </section>

      {cancelled && (
        <section className="mx-auto max-w-4xl px-6 pt-6">
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm font-semibold text-[var(--danger)]">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <p>This order was cancelled. Contact us on WhatsApp if this looks wrong.</p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mt-8 space-y-8 rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card sm:p-8">
          {/* ═══ Timeline ═══ */}
          <div>
            <h2 className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Delivery progress
            </h2>

            {/* Desktop: horizontal */}
            <ol className="relative hidden justify-between sm:flex">
              <span className="absolute left-5 right-5 top-5 h-0.5 bg-[var(--border)]" />
              <span
                className="absolute left-5 top-5 h-0.5 bg-[var(--accent)] transition-all duration-500"
                style={{ width: `calc((100% - 2.5rem) * ${currentIdx / (STEPS.length - 1)})` }}
              />
              {STEPS.map((step, idx) => {
                const done = !cancelled && idx < currentIdx
                const active = !cancelled && idx === currentIdx
                const evt = eventForStep(step.eventTypes)
                return (
                  <li key={step.key} className="relative z-10 flex w-24 flex-col items-center gap-2 text-center">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 bg-[var(--card-bg)] transition ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-plum'
                          : done
                          ? 'border-[var(--accent)] text-[var(--accent)]'
                          : 'border-[var(--border)] text-[var(--text-muted)]'
                      }`}
                    >
                      {done ? <CheckCircle2 size={17} /> : <step.icon size={16} />}
                    </span>
                    <span className={`text-[11px] font-bold leading-tight ${idx <= currentIdx && !cancelled ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] tabular-nums text-[var(--text-muted)]">
                      {evt ? fmtDate(evt.createdAt) : active ? 'In progress' : ''}
                    </span>
                  </li>
                )
              })}
            </ol>

            {/* Mobile: vertical */}
            <ol className="relative space-y-0 sm:hidden">
              {STEPS.map((step, idx) => {
                const done = !cancelled && idx < currentIdx
                const active = !cancelled && idx === currentIdx
                const evt = eventForStep(step.eventTypes)
                const last = idx === STEPS.length - 1
                return (
                  <li key={step.key} className="relative flex gap-4 pb-7 last:pb-0">
                    {!last && (
                      <span
                        className={`absolute left-[17px] top-9 h-[calc(100%-2rem)] w-0.5 ${
                          done ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                        }`}
                      />
                    )}
                    <span
                      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                        active
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                          : done
                          ? 'border-[var(--accent)] bg-[var(--card-bg)] text-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-muted)]'
                      }`}
                    >
                      {done ? <CheckCircle2 size={15} /> : <step.icon size={14} />}
                    </span>
                    <span className="pt-1">
                      <span className={`block text-sm font-bold ${idx <= currentIdx && !cancelled ? '' : 'text-[var(--text-muted)]'}`}>
                        {step.label}
                      </span>
                      <span className="block text-[11px] tabular-nums text-[var(--text-muted)]">
                        {evt ? fmtDate(evt.createdAt) : active ? 'In progress' : 'Pending'}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>

          {/* ═══ Dispatch info ═══ */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-5 md:col-span-2">
              <h3 className="flex items-center gap-2 font-display text-base font-bold">
                <Truck size={16} className="text-[var(--accent)]" /> Dispatch information
              </h3>
              <div className="grid gap-4 text-xs sm:grid-cols-2">
                <div>
                  <span className="block font-bold text-[var(--text-muted)]">Courier / transport</span>
                  <p className="mt-0.5 text-sm font-bold">{order.courierName || 'Pending assignment'}</p>
                </div>
                <div>
                  <span className="block font-bold text-[var(--text-muted)]">Waybill / tracking</span>
                  <p className="mt-0.5 font-mono text-sm font-bold text-[var(--accent)]">
                    {order.trackingNumber || 'Pending dispatch'}
                  </p>
                </div>
                <div>
                  <span className="block font-bold text-[var(--text-muted)]">Delivery estimate</span>
                  <p className="mt-0.5 text-sm font-bold">{order.estimatedDays}</p>
                </div>
                <div>
                  <span className="block font-bold text-[var(--text-muted)]">Destination</span>
                  <p className="mt-0.5 text-sm font-bold">{order.shippingZone}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-5 text-xs">
              <div>
                <span className="mb-1 block font-bold text-[var(--text-muted)]">Order total</span>
                <p className="font-display text-2xl font-bold tabular-nums text-[var(--accent)]">
                  ₦{Number(order.total).toLocaleString('en-NG')}
                </p>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-[var(--text-muted)]">
                Includes item discounts, coupons and delivery charges.
              </p>
            </div>
          </div>

          {/* ═══ Items ═══ */}
          <div>
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Package contents
            </h4>
            <div className="divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] px-5">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-4 py-3.5 text-xs">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                      <Package size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold">{item.productName}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{item.brand}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold tabular-nums">×{item.quantity}</p>
                    <p className="mt-0.5 font-mono tabular-nums text-[var(--text-muted)]">
                      ₦{Number(item.price).toLocaleString('en-NG')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ═══ History ═══ */}
          {order.timeline?.length > 0 && (
            <div>
              <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Status history
              </h4>
              <ol className="ml-2.5 space-y-4 border-l-2 border-[var(--border)] pl-6">
                {[...order.timeline].reverse().map((evt: any, idx: number) => (
                  <li key={idx} className="relative">
                    <span
                      className={`absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full ${
                        idx === 0 ? 'bg-[var(--accent)] ring-4 ring-[var(--accent-soft)]' : 'bg-[var(--champagne)]'
                      }`}
                    />
                    <p className="text-xs font-bold">{evt.message}</p>
                    <p className="mt-0.5 text-[10px] font-medium tabular-nums text-[var(--text-muted)]">
                      {fmtDate(evt.createdAt)}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex flex-col items-center gap-2 border-t border-[var(--border)] pt-6 sm:flex-row sm:justify-between">
            <p className="text-[11px] text-[var(--text-muted)]">
              Questions about this delivery? We&apos;re happy to help.
            </p>
            <Link
              href="/contact"
              className="btn-outline !px-5 !py-2.5 !text-[10px]"
            >
              Contact support
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
