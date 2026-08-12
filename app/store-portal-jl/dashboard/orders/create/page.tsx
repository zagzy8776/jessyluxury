'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Search, Plus, ShoppingBag, CheckCircle, MessageCircle,
  User, Loader2,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

export default function CreateManualOrderPage() {
  const { toast, showToast, clearToast } = useToast()

  const [products, setProducts] = useState<any[]>([])
  const [shippingZones, setShippingZones] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerWhatsapp, setCustomerWhatsapp] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')

  const [cartItems, setCartItems] = useState<{ product: any; quantity: number }[]>([])
  const [searchProd, setSearchProd] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState('PAID')

  const [createdOrder, setCreatedOrder] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, zRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/shipping'),
        ])
        const pData = await pRes.json()
        const zData = await zRes.json()
        if (Array.isArray(pData)) setProducts(pData)
        if (Array.isArray(zData)) {
          setShippingZones(zData)
          if (zData.length > 0) setSelectedZoneId(zData[0].id.toString())
        }
      } catch {
        showToast('Error loading store catalog', 'error')
      }
    }
    loadData()
  }, [])

  const selectedZone = shippingZones.find((z) => z.id.toString() === selectedZoneId)
  const shippingFee = selectedZone ? selectedZone.fee : 0

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const total = Math.max(0, subtotal + shippingFee - discountAmount)

  function handleAddToCart(p: any) {
    const existing = cartItems.find((ci) => ci.product.id === p.id)
    if (existing) {
      setCartItems(cartItems.map((ci) => ci.product.id === p.id ? { ...ci, quantity: ci.quantity + 1 } : ci))
    } else {
      setCartItems([...cartItems, { product: p, quantity: 1 }])
    }
  }

  function handleUpdateQty(id: number, delta: number) {
    setCartItems(
      cartItems
        .map((ci) => {
          if (ci.product.id === id) {
            const nQ = ci.quantity + delta
            return nQ > 0 ? { ...ci, quantity: nQ } : null
          }
          return ci
        })
        .filter(Boolean) as any
    )
  }

  async function handleValidateCoupon() {
    if (!couponCode) return
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      })
      const data = await res.json()
      if (data.valid) {
        setDiscountAmount(data.discountAmount)
        showToast(`Coupon applied! -₦${data.discountAmount.toLocaleString('en-NG')}`)
      } else {
        showToast(data.message || 'Invalid coupon', 'error')
      }
    } catch {
      showToast('Error validating coupon', 'error')
    }
  }

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!customerName || !customerPhone) {
      showToast('Customer name and phone number required', 'error')
      return
    }
    if (cartItems.length === 0) {
      showToast('Add at least one product to the order', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        customerName,
        customerPhone,
        customerWhatsapp: customerWhatsapp || customerPhone,
        shippingAddress,
        shippingZoneId: selectedZoneId ? Number(selectedZoneId) : null,
        shippingFee,
        subtotal,
        discountAmount,
        couponCode: discountAmount > 0 ? couponCode : null,
        total,
        paymentStatus,
        status: 'PENDING',
        items: cartItems.map((ci) => ({
          productId: ci.product.id,
          quantity: ci.quantity,
          price: ci.product.price,
        })),
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.ok && data.id) {
        setCreatedOrder(data)
        showToast(`Manual Order #${data.orderNumber} recorded!`)
      } else {
        showToast('Failed to create manual order', 'error')
      }
    } catch {
      showToast('Error recording order', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter((p) =>
    (p.name + p.brand + p.notes).toLowerCase().includes(searchProd.toLowerCase())
  )

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-sans font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/store-portal-jl/dashboard/orders"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-amber-500 transition shadow-sm"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">Record Manual POS Order</h1>
            <p className="text-xs font-medium text-[var(--text-secondary)]">Create walk-in, phone, or custom orders with instant receipts</p>
          </div>
        </div>
      </div>

      {createdOrder ? (
        /* Order Success Receipt Panel */
        <div className="rounded-3xl border border-emerald-500/40 bg-[var(--card-bg)] p-8 shadow-xl space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
            <CheckCircle size={32} />
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">Order Recorded Successfully!</h2>
            <p className="mt-1 font-mono text-lg font-bold text-amber-500">#{createdOrder.orderNumber}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">
              Customer: <strong className="text-[var(--text-primary)]">{createdOrder.customerName}</strong> ({createdOrder.customerPhone})
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)] mt-1">
              Total: ₦{createdOrder.total?.toLocaleString('en-NG')} · <span className="text-emerald-600 dark:text-emerald-400">{createdOrder.paymentStatus}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-[var(--border)]">
            <a
              href={`https://wa.me/${(createdOrder.customerWhatsapp || createdOrder.customerPhone).replace(/\D/g, '')}?text=${encodeURIComponent(
                `Hello ${createdOrder.customerName}! Your Jessy Luxury receipt #${createdOrder.orderNumber}:\n\nTotal: ₦${createdOrder.total?.toLocaleString('en-NG')}\nPayment Status: ${createdOrder.paymentStatus}\n\nThank you for your order!`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md"
            >
              <MessageCircle size={16} /> Share Receipt
            </a>

            <button
              onClick={() => {
                setCreatedOrder(null)
                setCartItems([])
                setCustomerName('')
                setCustomerPhone('')
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-6 py-3 text-xs font-bold text-[var(--text-primary)] hover:border-amber-500 transition"
            >
              Record Another Order
            </button>

            <Link
              href="/store-portal-jl/dashboard/orders"
              className="rounded-xl border border-[var(--border)] px-5 py-3 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              View Orders List
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitOrder} className="grid gap-6 md:grid-cols-12">
          {/* Left Column: Customer & Product Selection */}
          <div className="space-y-6 md:col-span-7">
            {/* Customer Details */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-4 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                <User size={16} className="text-amber-500" /> Customer Information
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Customer Name *</label>
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Blessing Okafor"
                    required
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Phone Number *</label>
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="08012345678"
                    required
                    className={`${inp} font-mono`}
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>Shipping / Delivery Address</label>
                <input
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street, City, State"
                  className={inp}
                />
              </div>
            </div>

            {/* Product Selector */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                  <ShoppingBag size={16} className="text-amber-500" /> Select Fragrances
                </h2>
                <span className="text-[11px] text-[var(--text-muted)] font-mono font-medium">{products.length} in catalog</span>
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-[var(--text-muted)]" />
                <input
                  value={searchProd}
                  onChange={(e) => setSearchProd(e.target.value)}
                  placeholder="Search catalog to add..."
                  className={inp + ' pl-10'}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 hover:border-amber-500 transition"
                  >
                    <div>
                      <p className="font-bold text-xs text-[var(--text-primary)]">{p.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">{p.brand} · ₦{p.price?.toLocaleString('en-NG')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(p)}
                      className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-bold text-amber-500 hover:bg-amber-500 hover:text-stone-950 transition flex items-center gap-1"
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Payment Status */}
          <div className="space-y-6 md:col-span-5">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-4 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
                Order Summary ({cartItems.length} items)
              </h2>

              {/* Cart Items List */}
              <div className="space-y-3 max-h-56 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[var(--text-muted)] font-medium">No items added to order yet.</p>
                ) : (
                  cartItems.map((ci) => (
                    <div key={ci.product.id} className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2 font-medium">
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{ci.product.name}</p>
                        <p className="text-[10px] text-amber-500 font-mono">₦{ci.product.price?.toLocaleString('en-NG')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(ci.product.id, -1)}
                          className="h-6 w-6 rounded bg-[var(--bg-primary)] border border-[var(--border)] font-bold text-[var(--text-primary)]"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-[var(--text-primary)]">{ci.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(ci.product.id, 1)}
                          className="h-6 w-6 rounded bg-[var(--bg-primary)] border border-[var(--border)] font-bold text-[var(--text-primary)]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Shipping Zone Selector */}
              <div>
                <label className={lbl}>Delivery Location Zone</label>
                <select
                  value={selectedZoneId}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className={inp}
                >
                  {shippingZones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} (+₦{z.fee.toLocaleString('en-NG')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Coupon Discount Code */}
              <div>
                <label className={lbl}>Promo / Discount Code</label>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. JESSY10"
                    className={inp + ' font-mono'}
                  />
                  <button
                    type="button"
                    onClick={handleValidateCoupon}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-xs font-bold text-amber-500 hover:border-amber-500 shrink-0 transition"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Payment Status Selector */}
              <div>
                <label className={lbl}>Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className={`${inp} font-bold text-emerald-600 dark:text-emerald-400`}
                >
                  <option value="PAID">PAID (Full Bank Transfer / Cash)</option>
                  <option value="PARTIALLY_PAID">PARTIALLY PAID (Deposit)</option>
                  <option value="UNPAID">UNPAID (Pay on Delivery)</option>
                </select>
              </div>

              {/* Total Calculation */}
              <div className="border-t border-[var(--border)] pt-3 space-y-1.5 text-xs font-medium">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">₦{subtotal.toLocaleString('en-NG')}</span>
                </div>
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Shipping Fee:</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">₦{shippingFee.toLocaleString('en-NG')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>Discount Applied:</span>
                    <span className="font-mono">-₦{discountAmount.toLocaleString('en-NG')}</span>
                  </div>
                )}
                <div className="flex justify-between font-display text-lg font-bold text-[var(--text-primary)] border-t border-[var(--border)] pt-2">
                  <span>Total Amount:</span>
                  <span className="text-amber-500">₦{total.toLocaleString('en-NG')}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || cartItems.length === 0}
                className="w-full rounded-xl bg-amber-500 py-3.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Generate Order'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
