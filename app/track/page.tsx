'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, Truck, AlertCircle, ShieldCheck } from 'lucide-react'

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [, setOrder] = useState<any>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!orderNumber.trim()) return
    setLoading(true)
    setError('')
    setOrder(null)

    // Direct tracking token lookup shortcut
    if (orderNumber.trim().startsWith('track_')) {
      window.location.href = `/track/${orderNumber.trim()}`
      return
    }

    if (!phone.trim()) {
      setError('Phone number is required for order number lookups.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/orders/track/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          customerPhone: phone.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.trackingToken) {
        window.location.href = `/track/${data.trackingToken}`
      } else {
        setError(data.error || 'Order not found. Please check your order details.')
      }
    } catch (err) {
      console.error('Error tracking order', err)
      setError('Could not connect to tracking service. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-[80vh] bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,45,127,0.10),transparent_60%)]" />
        <div className="grain absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-3xl px-6 py-16 text-center lg:py-20">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
            <Truck size={13} /> Live order tracking
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">Track Your Order</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[var(--text-secondary)]">
            Enter your order number and the phone number used at checkout to see live delivery milestones.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Order number (e.g. JL-123456)"
              required
              className="field-input flex-1 rounded-full font-mono !py-3.5"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="field-input flex-1 rounded-full font-mono !py-3.5"
            />
            <button type="submit" disabled={loading} className="btn-primary shrink-0 !px-7 !py-3.5">
              <Search size={15} /> {loading ? 'Tracking…' : 'Track'}
            </button>
          </form>

          {error && (
            <div className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-left text-sm font-semibold text-[var(--danger)]">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: ShieldCheck,
              t: 'Private by design',
              d: 'Only you can view your shipment — verification is tied to your phone number.',
            },
            {
              icon: Truck,
              t: 'Live milestones',
              d: 'From payment confirmation to doorstep delivery, follow every step.',
            },
          ].map((c) => (
            <div key={c.t} className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card">
              <c.icon size={19} className="mt-0.5 shrink-0 text-[var(--accent)]" />
              <div>
                <p className="text-sm font-bold">{c.t}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{c.d}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
          Lost your order number?{' '}
          <Link href="/contact" className="font-bold text-[var(--accent)] hover:underline">
            Contact us
          </Link>{' '}
          and we&apos;ll locate it for you.
        </p>
      </section>
    </main>
  )
}
