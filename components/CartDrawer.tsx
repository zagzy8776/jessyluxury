'use client'
import { useEffect, useState } from 'react'
import {
  X, Minus, Plus, Trash2, ShoppingBag, MessageCircle, Ticket, Truck, User,
  CheckCircle2, AlertCircle,
} from 'lucide-react'
import { useCart } from './CartProvider'
import Bottle from './Bottle'
import { formatNaira } from '@/lib/products'
import { wa } from '@/lib/site'

export default function CartDrawer() {
  const { drawer, setDrawer, items, updateQty, remove, subtotal, count, clear } = useCart()

  // Checkout states
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [shippingZones, setShippingZones] = useState<any[]>([])
  const [selectedZone, setSelectedZone] = useState<any>(null)

  // Coupon states
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const [ordering, setOrdering] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  useEffect(() => {
    if (drawer) {
      fetchShippingZones()
      // Auto-fill coupon code if one was set by the promo popup
      try {
        const pending = sessionStorage.getItem('jl_pending_coupon')
        if (pending && !couponCode && !appliedCoupon) {
          setCouponCode(pending)
          sessionStorage.removeItem('jl_pending_coupon')
        }
      } catch { /* ignore */ }
    }
  }, [drawer])

  async function fetchShippingZones() {
    try {
      const res = await fetch('/api/shipping')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const activeZones = data.filter((z: any) => z.active)
        setShippingZones(activeZones)
        if (activeZones.length > 0 && !selectedZone) {
          setSelectedZone(activeZones[0])
        }
      }
    } catch (e) {
      console.error('Failed loading shipping options', e)
    }
  }

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault()
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError('')

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setAppliedCoupon(data)
      } else {
        setCouponError(data.error || 'Invalid coupon code')
        setAppliedCoupon(null)
      }
    } catch (err) {
      console.error('Error applying coupon', err)
      setCouponError('Failed to validate promo code')
    } finally {
      setCouponLoading(false)
    }
  }

  const shippingFee = selectedZone ? selectedZone.fee : 0
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee)

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      setCheckoutError('Please enter your Name and Phone Number')
      return
    }
    setOrdering(true)
    setCheckoutError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerWhatsapp: phone.trim(),
          shippingAddress: address.trim(),
          shippingZoneId: selectedZone?.id,
          shippingFee,
          subtotal,
          discountAmount,
          couponCode: appliedCoupon?.code,
          items: items.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      })

      const orderData = await res.json()
      const orderNum = orderData.orderNumber || `JL-${Math.floor(100000 + Math.random() * 900000)}`

      const lines = items
        .map((i) => `• ${i.name} (${i.brand}) x${i.quantity} — ${formatNaira(i.price * i.quantity)}`)
        .join('\n')

      const waMsg = `Hello Jessy Luxury! I placed an order on your website.\n\n` +
        `Order #: ${orderNum}\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Delivery Zone: ${selectedZone?.name || 'Standard'} (${formatNaira(shippingFee)})\n` +
        `${address ? `Address: ${address}\n` : ''}\n` +
        `Items:\n${lines}\n\n` +
        `Subtotal: ${formatNaira(subtotal)}\n` +
        `${discountAmount > 0 ? `Coupon Discount (${appliedCoupon.code}): -${formatNaira(discountAmount)}\n` : ''}` +
        `Shipping Fee: ${formatNaira(shippingFee)}\n` +
        `Total: ${formatNaira(finalTotal)}\n\n` +
        `Please confirm availability and share payment details. Thank you!`

      clear()
      setDrawer(false)
      window.open(wa(waMsg), '_blank')
    } catch (err) {
      console.error('Error completing checkout', err)
      setCheckoutError('Could not process order. Please try again.')
    } finally {
      setOrdering(false)
    }
  }

  if (!drawer) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="fade-in absolute inset-0 bg-stone-950/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <h2 className="font-display text-xl font-bold">
            Your Cart <span className="text-[var(--accent)]">({count})</span>
          </h2>
          <button
            onClick={() => setDrawer(false)}
            className="rounded-full p-2 text-[var(--text-muted)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Close cart"
          >
            <X size={19} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-[var(--text-muted)]">
              <ShoppingBag size={30} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-[var(--text-primary)]">Your cart is empty</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Discover a scent that feels like you.
              </p>
            </div>
            <button
              onClick={() => setDrawer(false)}
              className="btn-primary !px-6 !py-3"
            >
              Browse fragrances
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
              {/* Items */}
              <div className="space-y-3">
                {items.map((i) => (
                  <div
                    key={i.id}
                    className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-3"
                  >
                    <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
                      <span className="scale-[0.28]">
                        <Bottle tone={i.tone} />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                            {i.brand} · {i.volume}
                          </p>
                          <p className="truncate font-display text-base font-bold">{i.name}</p>
                        </div>
                        <button
                          onClick={() => remove(i.id)}
                          className="rounded-full p-1.5 text-[var(--text-muted)] transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                          aria-label={`Remove ${i.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card-bg)] px-1 py-0.5">
                          <button
                            onClick={() => updateQty(i.id, i.quantity - 1)}
                            className="rounded-full p-1.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-5 text-center text-xs font-bold tabular-nums">{i.quantity}</span>
                          <button
                            onClick={() => updateQty(i.id, i.quantity + 1)}
                            className="rounded-full p-1.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        <p className="text-sm font-bold tabular-nums text-[var(--accent)]">
                          {formatNaira(i.price * i.quantity)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                  <Ticket size={13} /> Promo code
                </label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code e.g. JESSY10"
                    className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] shadow-card outline-none transition focus:border-[var(--accent)]"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="rounded-xl bg-[var(--charcoal)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--bg-primary)] transition hover:opacity-85 disabled:opacity-50"
                  >
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </form>
                {appliedCoupon && (
                  <p className="flex items-center gap-1 text-[11px] font-bold text-[var(--success)]">
                    <CheckCircle2 size={13} /> Code <strong>{appliedCoupon.code}</strong> applied — you save{' '}
                    {formatNaira(appliedCoupon.discountAmount)}
                  </p>
                )}
                {couponError && (
                  <p className="flex items-center gap-1 text-[11px] font-bold text-[var(--danger)]">
                    <AlertCircle size={13} /> {couponError}
                  </p>
                )}
              </div>

              {/* Delivery details */}
              <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                  <User size={13} /> Your details
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name *"
                  required
                  className="field-input !py-2.5 text-xs"
                />

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number (WhatsApp) *"
                  required
                  className="field-input !py-2.5 text-xs"
                />

                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Delivery address / city (optional)"
                  className="field-input !py-2.5 text-xs"
                />

                {shippingZones.length > 0 && (
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)]">
                      <Truck size={12} className="text-[var(--accent)]" /> Shipping destination
                    </label>
                    <select
                      value={selectedZone?.id || ''}
                      onChange={(e) => {
                        const z = shippingZones.find((x) => x.id === Number(e.target.value))
                        setSelectedZone(z)
                      }}
                      className="field-input !py-2.5 text-xs font-semibold"
                    >
                      {shippingZones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} — {z.fee === 0 ? 'FREE' : formatNaira(z.fee)} ({z.estimatedDays})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Summary & checkout */}
            <div className="space-y-3 border-t border-[var(--border)] bg-[var(--card-bg)] px-5 py-4 sm:px-6">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Subtotal</span>
                  <span className="font-bold tabular-nums text-[var(--text-primary)]">{formatNaira(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between font-bold text-[var(--success)]">
                    <span>Discount ({appliedCoupon?.code})</span>
                    <span className="tabular-nums">−{formatNaira(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Shipping{selectedZone ? ` · ${selectedZone.name}` : ''}</span>
                  <span className={`font-bold tabular-nums ${shippingFee === 0 ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}>
                    {shippingFee === 0 ? 'FREE' : formatNaira(shippingFee)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-2.5">
                  <span className="text-sm font-bold">Total</span>
                  <span className="font-display text-2xl font-bold tabular-nums text-[var(--accent)]">
                    {formatNaira(finalTotal)}
                  </span>
                </div>
              </div>

              {checkoutError && (
                <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--danger)]">
                  <AlertCircle size={13} /> {checkoutError}
                </p>
              )}

              <button
                onClick={handleCheckout}
                disabled={ordering}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-md transition hover:bg-emerald-500 disabled:opacity-50"
              >
                <MessageCircle size={16} />
                {ordering ? 'Processing order…' : 'Confirm & order via WhatsApp'}
              </button>
              <p className="text-center text-[10px] text-[var(--text-muted)]">
                You&apos;ll confirm payment & delivery in WhatsApp — no card required.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
