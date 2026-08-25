'use client'
import { useEffect, useState } from 'react'
import {
  X, Minus, Plus, Trash2, ShoppingBag, MessageCircle, Ticket, Truck, User,
  CheckCircle2, AlertCircle, Banknote, Copy, Upload,
} from 'lucide-react'
import { useCart } from './CartProvider'
import Bottle from './Bottle'
import { formatNaira } from '@/lib/products'
import { wa } from '@/lib/site'
import { Toast, useToast } from '@/components/Toast'

export default function CartDrawer() {
  const { drawer, setDrawer, items, updateQty, remove, subtotal, count, clear } = useCart()
  const { toast, showToast, clearToast } = useToast()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [shippingZones, setShippingZones] = useState<any[]>([])
  const [selectedZone, setSelectedZone] = useState<any>(null)

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const [ordering, setOrdering] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [showBankTransfer, setShowBankTransfer] = useState(false)
  const [paymentProof, setPaymentProof] = useState<File | null>(null)

  useEffect(() => {
    if (!drawer) return

    fetchShippingZones()
    try {
      const pending = sessionStorage.getItem('jl_pending_coupon')
      if (pending && !couponCode && !appliedCoupon) {
        setCouponCode(pending)
        sessionStorage.removeItem('jl_pending_coupon')
      }
    } catch {
      // Ignore storage restrictions.
    }
  }, [drawer])

  async function fetchShippingZones() {
    try {
      const res = await fetch('/api/shipping', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) {
        setShippingZones([])
        setSelectedZone(null)
        return
      }

      const activeZones = data.filter((z: any) => z.active)
      setShippingZones(activeZones)
      setSelectedZone((current: any) => {
        if (current && activeZones.some((z: any) => z.id === current.id)) return current
        return activeZones[0] ?? null
      })
    } catch (error) {
      console.error('Failed loading shipping options', error)
      setShippingZones([])
      setSelectedZone(null)
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
    } catch (error) {
      console.error('Error applying coupon', error)
      setCouponError('We could not validate that promo code. Please try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  const shippingFee = selectedZone ? selectedZone.fee : 0
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee)

  function handleCopyAccount(text: string) {
    navigator.clipboard.writeText(text)
    showToast('Copied to clipboard!')
  }

  async function handleBankTransferCheckout(e: React.FormEvent) {
    e.preventDefault()
    setCheckoutError('')

    if (!name.trim() || !phone.trim()) {
      setCheckoutError('Please enter your name and phone number.')
      return
    }

    if (!selectedZone) {
      setCheckoutError('Please select a delivery option.')
      return
    }

    if (!selectedZone.isPickup && !address.trim()) {
      setCheckoutError('Please enter your delivery address.')
      return
    }

    if (items.length === 0) {
      setCheckoutError('Your cart is empty.')
      return
    }

    if (!paymentProof) {
      setCheckoutError('Please upload your payment proof.')
      return
    }

    setOrdering(true)

    try {
      // Upload payment proof first (you can implement file upload endpoint)
      const formData = new FormData()
      formData.append('paymentProof', paymentProof)

      // Create order with PENDING payment status
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerWhatsapp: phone.trim(),
          shippingAddress: address.trim(),
          shippingZoneId: selectedZone.id,
          couponCode: appliedCoupon?.code,
          paymentStatus: 'PENDING', // Mark as pending for bank transfer
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      })

      const orderData = await res.json().catch(() => ({}))

      if (!res.ok || !orderData.success || !orderData.orderNumber) {
        setCheckoutError(orderData.error || 'We could not place your order right now. Please try again.')
        return
      }

      showToast(`Order ${orderData.orderNumber} placed! We'll confirm payment shortly.`)
      clear()
      setDrawer(false)
      setShowBankTransfer(false)
      setPaymentProof(null)
    } catch (error) {
      console.error('Error completing bank transfer checkout', error)
      setCheckoutError('We could not place your order right now. Please try again.')
    } finally {
      setOrdering(false)
    }
  }

  async function handleCheckout(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    setCheckoutError('')

    if (!name.trim() || !phone.trim()) {
      setCheckoutError('Please enter your name and phone number.')
      return
    }

    if (!selectedZone) {
      setCheckoutError('Please select a delivery option.')
      return
    }

    if (!selectedZone.isPickup && !address.trim()) {
      setCheckoutError('Please enter your delivery address.')
      return
    }

    if (items.length === 0) {
      setCheckoutError('Your cart is empty.')
      return
    }

    setOrdering(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          customerPhone: phone.trim(),
          customerWhatsapp: phone.trim(),
          shippingAddress: address.trim(),
          shippingZoneId: selectedZone.id,
          couponCode: appliedCoupon?.code,
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      })

      const orderData = await res.json().catch(() => ({}))

      if (!res.ok || !orderData.success || !orderData.orderNumber) {
        setCheckoutError(orderData.error || 'We could not place your order right now. Please try again.')
        return
      }

      const orderNum = orderData.orderNumber
      const confirmedTotal = Number(orderData.total)
      const displayTotal = Number.isFinite(confirmedTotal) ? confirmedTotal : finalTotal

      const lines = items
        .map((item) => `• ${item.name} (${item.brand}) x${item.quantity} — ${formatNaira(item.price * item.quantity)}`)
        .join('\n')

      const waMsg = `Hello Jessy Luxury! I placed an order on your website.\n\n` +
        `Order #: ${orderNum}\n` +
        `Name: ${name}\n` +
        `Phone: ${phone}\n` +
        `Delivery Zone: ${selectedZone.name} (${formatNaira(shippingFee)})\n` +
        `${address ? `Address: ${address}\n` : ''}\n` +
        `Items:\n${lines}\n\n` +
        `Order Total: ${formatNaira(displayTotal)}\n\n` +
        `Please confirm the order and share the current payment details. Thank you!`

      clear()
      setDrawer(false)
      window.open(wa(waMsg), '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Error completing checkout', error)
      setCheckoutError('We could not place your order right now. Please try again.')
    } finally {
      setOrdering(false)
    }
  }

  if (!drawer) return null

  return (
    <div className="fixed inset-0 z-[60]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}
      <div className="fade-in absolute inset-0 bg-stone-950/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
      <aside
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
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
              <p className="mt-1 text-xs text-[var(--text-muted)]">Discover a scent that feels like you.</p>
            </div>
            <button onClick={() => setDrawer(false)} className="btn-primary !px-6 !py-3">
              Browse fragrances
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-3">
                    <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
                      <span className="scale-[0.28]"><Bottle tone={item.tone} /></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">{item.brand} · {item.volume}</p>
                          <p className="truncate font-display text-base font-bold">{item.name}</p>
                        </div>
                        <button onClick={() => remove(item.id)} className="rounded-full p-1.5 text-[var(--text-muted)] transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10" aria-label={`Remove ${item.name}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card-bg)] px-1 py-0.5">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="rounded-full p-1.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]" aria-label="Decrease quantity"><Minus size={12} /></button>
                          <span className="w-5 text-center text-xs font-bold tabular-nums">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="rounded-full p-1.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]" aria-label="Increase quantity"><Plus size={12} /></button>
                        </div>
                        <p className="text-sm font-bold tabular-nums text-[var(--accent)]">{formatNaira(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]"><Ticket size={13} /> Promo code</label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter code e.g. JESSY10" className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] shadow-card outline-none transition focus:border-[var(--accent)]" />
                  <button type="submit" disabled={couponLoading} className="rounded-xl bg-[var(--charcoal)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--bg-primary)] transition hover:opacity-85 disabled:opacity-50">{couponLoading ? '…' : 'Apply'}</button>
                </form>
                {appliedCoupon && <p className="flex items-center gap-1 text-[11px] font-bold text-[var(--success)]"><CheckCircle2 size={13} /> Code <strong>{appliedCoupon.code}</strong> applied — you save {formatNaira(appliedCoupon.discountAmount)}</p>}
                {couponError && <p className="flex items-center gap-1 text-[11px] font-bold text-[var(--danger)]"><AlertCircle size={13} /> {couponError}</p>}
              </div>

              <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]"><User size={13} /> Delivery details</label>

                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *" required className="field-input !py-2.5 text-xs" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (WhatsApp) *" required className="field-input !py-2.5 text-xs" />
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address *" className="field-input !py-2.5 text-xs" />

                {shippingZones.length > 0 ? (
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-[var(--text-secondary)]"><Truck size={12} className="text-[var(--accent)]" /> Delivery option</label>
                    <select value={selectedZone?.id || ''} onChange={(e) => setSelectedZone(shippingZones.find((z) => z.id === Number(e.target.value)) || null)} className="field-input !py-2.5 text-xs font-semibold">
                      <option value="" disabled>Select a delivery option</option>
                      {shippingZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>{zone.name} — {zone.fee === 0 ? 'FREE' : formatNaira(zone.fee)} ({zone.estimatedDays})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <p className="text-xs font-semibold text-[var(--danger)]">Delivery options are temporarily unavailable. Please try again shortly.</p>
                )}
              </div>
            </div>

            <div className="space-y-3 border-t border-[var(--border)] bg-[var(--card-bg)] px-5 py-4 sm:px-6">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[var(--text-secondary)]"><span>Subtotal</span><span className="font-bold tabular-nums text-[var(--text-primary)]">{formatNaira(subtotal)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between font-bold text-[var(--success)]"><span>Discount ({appliedCoupon?.code})</span><span className="tabular-nums">−{formatNaira(discountAmount)}</span></div>}
                <div className="flex justify-between text-[var(--text-secondary)]"><span>Shipping{selectedZone ? ` · ${selectedZone.name}` : ''}</span><span className={`font-bold tabular-nums ${shippingFee === 0 ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'}`}>{shippingFee === 0 ? 'FREE' : formatNaira(shippingFee)}</span></div>
                <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-2.5"><span className="text-sm font-bold">Total</span><span className="font-display text-2xl font-bold tabular-nums text-[var(--accent)]">{formatNaira(finalTotal)}</span></div>
              </div>

              {checkoutError && <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--danger)]"><AlertCircle size={13} /> {checkoutError}</p>}

              {!showBankTransfer ? (
                <div className="space-y-2">
                  <button onClick={handleCheckout} disabled={ordering || !selectedZone} className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-4 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-md transition hover:bg-emerald-500 disabled:opacity-50">
                    <MessageCircle size={16} />
                    {ordering ? 'Processing order…' : 'Confirm & order via WhatsApp'}
                  </button>

                  <div className="relative flex items-center gap-3">
                    <div className="flex-1 border-t border-[var(--border)]" />
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Or</span>
                    <div className="flex-1 border-t border-[var(--border)]" />
                  </div>

                  <button onClick={() => setShowBankTransfer(true)} className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--accent)] bg-[var(--card-bg)] py-4 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white">
                    <Banknote size={16} />
                    Pay via Bank Transfer
                  </button>
                  <p className="text-center text-[10px] text-[var(--text-muted)]">You&apos;ll confirm payment & delivery in WhatsApp — no card required.</p>
                </div>
              ) : (
                <form onSubmit={handleBankTransferCheckout} className="space-y-3">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4 text-xs space-y-3">
                    <p className="font-bold text-[var(--text-primary)]">Bank Transfer Details</p>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-[var(--text-muted)]">ACCOUNT NAME</p>
                      <div className="flex items-center justify-between rounded-lg bg-[var(--card-bg)] px-3 py-2 font-mono text-[11px] font-bold">
                        <span>Jessy Luxury Fragrance</span>
                        <button type="button" onClick={() => handleCopyAccount('Jessy Luxury Fragrance')} className="text-[var(--accent)] hover:text-[var(--accent-strong)]">
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-[var(--text-muted)]">ACCOUNT NUMBER</p>
                      <div className="flex items-center justify-between rounded-lg bg-[var(--card-bg)] px-3 py-2 font-mono text-[11px] font-bold">
                        <span>0235419999</span>
                        <button type="button" onClick={() => handleCopyAccount('0235419999')} className="text-[var(--accent)] hover:text-[var(--accent-strong)]">
                          <Copy size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-[var(--text-muted)]">BANK</p>
                      <div className="rounded-lg bg-[var(--card-bg)] px-3 py-2 font-mono text-[11px] font-bold">
                        GTBank (Guaranty Trust Bank)
                      </div>
                    </div>

                    <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-2">
                      <p className="text-[10px] font-bold text-[var(--accent)]">
                        Transfer Amount: <strong className="text-[11px]">{formatNaira(finalTotal)}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--text-muted)]">UPLOAD PAYMENT PROOF</label>
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--accent)]/30 bg-[var(--accent-soft)] px-4 py-3 transition hover:border-[var(--accent)]/60">
                      <Upload size={14} className="text-[var(--accent)]" />
                      <span className="text-xs font-bold text-[var(--accent)]">
                        {paymentProof ? paymentProof.name : 'Choose receipt or screenshot'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBankTransfer(false)
                        setPaymentProof(null)
                      }}
                      className="flex-1 rounded-full border-2 border-[var(--border)] bg-[var(--card-bg)] py-3 text-xs font-bold uppercase text-[var(--text-primary)] transition hover:border-[var(--text-muted)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={ordering || !paymentProof}
                      className="flex-1 rounded-full bg-[var(--accent)] py-3 text-xs font-bold uppercase text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
                    >
                      {ordering ? 'Processing…' : 'Confirm Payment'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
