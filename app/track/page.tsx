'use client'
import { useState } from 'react'
import { Search, Truck, Phone, AlertCircle } from 'lucide-react'

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
            Enter your Order Number and Customer Phone Number to verify ownership and retrieve secure shipment tracking milestones.
          </p>

          <form onSubmit={handleSearch} className="mx-auto mt-8 flex flex-col sm:flex-row max-w-lg items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Order Number (e.g. JL-123456) or Token"
                required
                className="w-full rounded-full border border-[var(--border)] bg-[var(--bg-primary)] py-3 px-5 text-sm font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 font-mono shadow-sm"
              />
            </div>
            <div className="relative flex-1">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone Number (e.g. +234...)"
                className="w-full rounded-full border border-[var(--border)] bg-[var(--bg-primary)] py-3 px-5 text-sm font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 font-mono shadow-sm"
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
      </section>
    </main>
  )
}
