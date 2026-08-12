'use client'
import { useEffect, useState } from 'react'
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle, Ticket, Truck, User, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react'
import { useCart } from './CartProvider'
import Bottle from './Bottle'
import { formatNaira } from '@/lib/products'
import { site, wa } from '@/lib/site'

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
      // 1. Create order in PostgreSQL DB
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

      // 2. Build WhatsApp confirmation message
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

      // Clear cart and close drawer
      clear()
      setDrawer(false)

      // Open WhatsApp chat
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
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawer(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-stone-800 bg-stone-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-800 px-6 py-5">
          <h2 className="font-display text-xl text-stone-100">
            Your Cart <span className="text-amber-400">({count})</span>
          </h2>
          <button onClick={() => setDrawer(false)} className="p-1 text-stone-400 hover:text-stone-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="rounded-full bg-stone-900 p-5 text-stone-500">
              <ShoppingBag size={26} />
            </div>
            <p className="text-sm text-stone-400">Your cart is empty.</p>
            <button
              onClick={() => setDrawer(false)}
              className="rounded-full bg-amber-500 px-6 py-3 text-xs font-bold tracking-[0.12em] text-stone-950 transition hover:bg-amber-400"
            >
              Browse fragrances
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {/* Items List */}
              <div className="space-y-3">
                {items.map((i) => (
                  <div key={i.id} className="flex gap-4 rounded-2xl bg-stone-900 p-3">
                    <div className="flex h-20 w-12 shrink-0 items-center justify-center">
                      <div className="scale-[0.45] origin-center -my-4">
                        <Bottle tone={i.tone} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-stone-500 uppercase">{i.brand}</p>
                      <p className="font-display text-base text-stone-100">{i.name}</p>
                      <p className="text-xs text-amber-300 font-mono">{formatNaira(i.price)}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <button
                          onClick={() => updateQty(i.id, i.quantity - 1)}
                          className="rounded-full bg-stone-800 p-1 text-stone-300 hover:text-white"
                          aria-label="Decrease"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-xs text-stone-100 font-mono">{i.quantity}</span>
                        <button
                          onClick={() => updateQty(i.id, i.quantity + 1)}
                          className="rounded-full bg-stone-800 p-1 text-stone-300 hover:text-white"
                          aria-label="Increase"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => remove(i.id)}
                          className="ml-auto p-1 text-stone-500 hover:text-red-400"
                          aria-label="Remove"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Redemption Input */}
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4 space-y-2">
                <label className="text-[10px] font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
                  <Ticket size={13} /> Promo Coupon / Discount
                </label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Try JESSY10, OUD2026..."
                    className="flex-1 rounded-xl border border-stone-800 bg-stone-950 px-3 py-2 text-xs text-stone-200 outline-none uppercase font-mono font-bold tracking-wider focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="rounded-xl bg-stone-800 border border-stone-700 px-4 py-2 text-xs font-bold text-stone-200 hover:bg-amber-500 hover:text-stone-950 transition disabled:opacity-50"
                  >
                    APPLY
                  </button>
                </form>
                {appliedCoupon && (
                  <p className="text-[11px] text-green-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Coupon <strong>{appliedCoupon.code}</strong> applied (-{formatNaira(appliedCoupon.discountAmount)})!
                  </p>
                )}
                {couponError && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} /> {couponError}
                  </p>
                )}
              </div>

              {/* Customer Contact & Shipping Selector */}
              <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4 space-y-3">
                <label className="text-[10px] font-bold tracking-widest text-amber-400 uppercase flex items-center gap-1.5">
                  <User size={13} /> Your Order Details
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Full Name *"
                  required
                  className="w-full rounded-xl border border-stone-800 bg-stone-950 px-3 py-2.5 text-xs text-stone-200 outline-none focus:border-amber-500"
                />

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number (WhatsApp) *"
                  required
                  className="w-full rounded-xl border border-stone-800 bg-stone-950 px-3 py-2.5 text-xs text-stone-200 outline-none focus:border-amber-500 font-mono"
                />

                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Delivery Address / City [Optional]"
                  className="w-full rounded-xl border border-stone-800 bg-stone-950 px-3 py-2.5 text-xs text-stone-200 outline-none focus:border-amber-500"
                />

                {shippingZones.length > 0 && (
                  <div>
                    <label className="text-[10px] text-stone-400 block mb-1 flex items-center gap-1">
                      <Truck size={12} /> Shipping Destination:
                    </label>
                    <select
                      value={selectedZone?.id || ''}
                      onChange={(e) => {
                        const z = shippingZones.find((x) => x.id === Number(e.target.value))
                        setSelectedZone(z)
                      }}
                      className="w-full rounded-xl border border-stone-800 bg-stone-950 px-3 py-2.5 text-xs text-stone-200 outline-none focus:border-amber-500 font-medium"
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

            {/* Total Summary & Checkout Button */}
            <div className="border-t border-stone-800 px-6 py-4 bg-stone-950 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-stone-200">{formatNaira(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount ({appliedCoupon?.code}):</span>
                    <span className="font-mono">-{formatNaira(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-400">
                  <span>Shipping Fee ({selectedZone?.name}):</span>
                  <span className="font-mono text-stone-200">{formatNaira(shippingFee)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-stone-800/80 pt-2 text-stone-100">
                  <span>Total Amount:</span>
                  <span className="font-display text-amber-300 text-xl">{formatNaira(finalTotal)}</span>
                </div>
              </div>

              {checkoutError && (
                <p className="text-xs text-red-400 text-center font-medium">{checkoutError}</p>
              )}

              <button
                onClick={handleCheckout}
                disabled={ordering}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white transition hover:bg-green-500 shadow-lg disabled:opacity-50"
              >
                <MessageCircle size={18} /> {ordering ? 'PROCESSING ORDER…' : 'CONFIRM & ORDER VIA WHATSAPP'}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
