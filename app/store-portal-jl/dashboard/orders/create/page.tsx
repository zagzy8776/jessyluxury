'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Search, Plus, ShoppingBag, CheckCircle, MessageCircle,
  User, Loader2, X, Minus, Ticket, Truck, BadgePercent, Banknote,
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

  // Wholesale customer context
  const [customers, setCustomers] = useState<any[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false)
  const [linkedCustomer, setLinkedCustomer] = useState<any>(null)
  const customerBoxRef = useRef<HTMLDivElement>(null)

  // Cart state has overridePrice
  const [cartItems, setCartItems] = useState<{ product: any; quantity: number; overridePrice: number }[]>([])
  const [searchProd, setSearchProd] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [paymentStatus, setPaymentStatus] = useState('PAID')

  const [createdOrder, setCreatedOrder] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [pRes, zRes, cRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/shipping'),
          fetch('/api/customers'),
        ])
        const pData = await pRes.json()
        const zData = await zRes.json()
        const cData = await cRes.json()
        if (Array.isArray(pData)) setProducts(pData)
        if (Array.isArray(zData)) {
          setShippingZones(zData)
          if (zData.length > 0) setSelectedZoneId(zData[0].id.toString())
        }
        if (Array.isArray(cData)) setCustomers(cData)
        else if (Array.isArray(cData?.customers)) setCustomers(cData.customers)
      } catch {
        showToast('Error loading store catalog', 'error')
      }
    }
    loadData()
  }, [])

  // Close customer picker on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (customerBoxRef.current && !customerBoxRef.current.contains(e.target as Node)) {
        setCustomerPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Re-fetch products decorated with wholesale pricing for the linked customer
  const refreshPricing = useCallback(async (customerId: number | null) => {
    try {
      const url = customerId ? `/api/products?forCustomerId=${customerId}` : '/api/products'
      const res = await fetch(url)
      const data = await res.json()
      if (Array.isArray(data)) {
        setProducts(data)
        // Refresh cart override prices against the new price book
        setCartItems((prev) =>
          prev.map((ci) => {
            const fresh = data.find((p: any) => p.id === ci.product.id)
            return fresh ? { ...ci, product: fresh, overridePrice: fresh.displayPrice ?? ci.overridePrice } : ci
          })
        )
      }
    } catch {}
  }, [])

  function handleLinkCustomer(c: any) {
    setLinkedCustomer(c)
    setCustomerName(c.name)
    setCustomerPhone(c.phone)
    setCustomerWhatsapp(c.whatsapp || c.phone)
    if (c.address) setShippingAddress(c.address)
    setCustomerPickerOpen(false)
    setCustomerSearch('')
    refreshPricing(c.id)
  }

  function handleUnlinkCustomer() {
    setLinkedCustomer(null)
    refreshPricing(null)
  }

  const selectedZone = shippingZones.find((z) => z.id.toString() === selectedZoneId)
  const shippingFee = selectedZone ? selectedZone.fee : 0

  const subtotal = cartItems.reduce((sum, item) => sum + item.overridePrice * item.quantity, 0)
  const total = Math.max(0, subtotal + shippingFee - discountAmount)

  // Retail comparison: what these items would cost at retail price
  const retailSubtotal = cartItems.reduce(
    (sum, item) => sum + (item.product.salePrice != null ? item.product.salePrice : item.product.price) * item.quantity,
    0
  )
  const wholesaleSavings = Math.max(0, retailSubtotal - subtotal)
  const isWholesaleContext = Boolean(linkedCustomer?.customerGroupId) || cartItems.some((ci) => ci.product.isWholesale && ci.overridePrice < ((ci.product.salePrice != null ? ci.product.salePrice : ci.product.price)))

  function handleAddToCart(p: any) {
    const existing = cartItems.find((ci) => ci.product.id === p.id)
    const initialPrice = p.displayPrice ?? (p.salePrice !== null ? p.salePrice : p.price)
    if (existing) {
      setCartItems(cartItems.map((ci) => ci.product.id === p.id ? { ...ci, quantity: ci.quantity + 1 } : ci))
    } else {
      setCartItems([...cartItems, { product: p, quantity: 1, overridePrice: initialPrice }])
    }
    showToast(`${p.name} added to cart`)
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
        salesChannel: 'Physical',
        items: cartItems.map((ci) => ({
          productId: ci.product.id,
          quantity: ci.quantity,
          price: ci.overridePrice, // Send validated override price
        })),
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (res.status === 201 && data.id) {
        setCreatedOrder(data)
        showToast(`Manual Order #${data.orderNumber} recorded!`)
      } else if (res.status === 409) {
        showToast(data.error || 'Inventory conflict: stock already reserved', 'error')
      } else {
        showToast(data.error || 'Failed to create manual order', 'error')
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

  const filteredCustomers = customers.filter((c) => {
    const term = customerSearch.toLowerCase()
    if (!term) return true
    return `${c.name} ${c.phone}`.toLowerCase().includes(term)
  }).slice(0, 6)

  const inp = 'admin-input text-sm font-medium'
  const lbl = 'mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]'

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/store-portal-jl/dashboard/orders"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] text-[var(--admin-text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            aria-label="Back to orders"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Point of sale</p>
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">New Sale</h1>
          </div>
        </div>
      </div>

      {createdOrder ? (
        /* ── Success receipt ── */
        <div className="admin-card space-y-6 border-emerald-500/40 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
            <CheckCircle size={32} />
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Order Recorded Successfully!</h2>
            <p className="mt-1 font-mono text-lg font-bold text-[var(--accent)]">#{createdOrder.orderNumber}</p>
            <p className="mt-2 text-xs font-medium text-[var(--admin-text-secondary)]">
              Customer: <strong className="text-[var(--admin-text-primary)]">{createdOrder.customerName}</strong> ({createdOrder.customerPhone})
            </p>
            <p className="mt-2 font-display text-2xl font-bold tabular-nums">
              ₦{createdOrder.total?.toLocaleString('en-NG')}{' '}
              <span className="align-middle text-xs font-bold text-emerald-600">{createdOrder.paymentStatus}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 border-t border-[var(--admin-border)] pt-5">
            <a
              href={`https://wa.me/${(createdOrder.customerWhatsapp || createdOrder.customerPhone).replace(/\D/g, '')}?text=${encodeURIComponent(
                `Hello ${createdOrder.customerName}! Your Jessy Luxury receipt #${createdOrder.orderNumber}:\n\nTotal: ₦${createdOrder.total?.toLocaleString('en-NG')}\nPayment Status: ${createdOrder.paymentStatus}\n\nThank you for your order!`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-emerald-500"
            >
              <MessageCircle size={15} /> Share Receipt
            </a>

            <button
              onClick={() => {
                setCreatedOrder(null)
                setCartItems([])
                setCustomerName('')
                setCustomerPhone('')
                setCustomerWhatsapp('')
                setShippingAddress('')
                setCouponCode('')
                setDiscountAmount(0)
                setLinkedCustomer(null)
                refreshPricing(null)
              }}
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-5 py-3 text-xs font-bold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Record Another Order
            </button>

            <Link
              href="/store-portal-jl/dashboard/orders"
              className="rounded-lg border border-[var(--admin-border)] px-5 py-3 text-xs font-bold text-[var(--admin-text-secondary)] transition hover:text-[var(--admin-text-primary)]"
            >
              View Orders List
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitOrder} className="grid gap-5 lg:grid-cols-12">
          {/* ══ Left: customer + catalog ══ */}
          <div className="space-y-5 lg:col-span-7">
            {/* Customer */}
            <section className="admin-card p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
                  <User size={15} className="text-[var(--accent)]" /> Customer
                </h2>
                {linkedCustomer && (
                  <button
                    type="button"
                    onClick={handleUnlinkCustomer}
                    className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)] transition hover:text-red-500"
                  >
                    <X size={12} /> Unlink
                  </button>
                )}
              </div>

              {/* Linked customer chip */}
              {linkedCustomer ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                    {linkedCustomer.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">
                      {linkedCustomer.name}
                      {linkedCustomer.customerGroupId && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[var(--champagne-soft)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#7a5c22]">
                          <BadgePercent size={10} /> Wholesale
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-[11px] text-[var(--admin-text-muted)]">{linkedCustomer.phone}</p>
                  </div>
                  <span className="shrink-0 text-right text-[10px] font-semibold text-[var(--admin-text-muted)]">
                    {linkedCustomer.ordersCount ?? 0} orders · ₦{(linkedCustomer.totalSpent ?? 0).toLocaleString('en-NG')} spent
                  </span>
                </div>
              ) : (
                <p className="mt-2 text-[11px] font-medium text-[var(--admin-text-muted)]">
                  Link an existing customer to auto-fill details and apply their wholesale price book.
                </p>
              )}

              {/* Customer quick-pick */}
              <div className="relative mt-3" ref={customerBoxRef}>
                <button
                  type="button"
                  onClick={() => setCustomerPickerOpen(!customerPickerOpen)}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-2.5 text-left text-xs font-semibold text-[var(--admin-text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <Search size={14} /> {linkedCustomer ? 'Switch customer…' : 'Find existing customer…'}
                </button>

                {customerPickerOpen && (
                  <div className="animate-slide-up absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] shadow-xl">
                    <div className="border-b border-[var(--admin-border)] p-2">
                      <input
                        autoFocus
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search name or phone…"
                        className="admin-input !py-2 text-xs"
                      />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredCustomers.length === 0 ? (
                        <p className="px-3 py-4 text-center text-[11px] text-[var(--admin-text-muted)]">No matches — continue as new customer below.</p>
                      ) : (
                        filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleLinkCustomer(c)}
                            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-[var(--admin-table-row-hover)]"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-bold">
                                {c.name}
                                {c.customerGroupId && (
                                  <span className="ml-1.5 rounded bg-[var(--champagne-soft)] px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#7a5c22]">WS</span>
                                )}
                              </span>
                              <span className="block font-mono text-[10px] text-[var(--admin-text-muted)]">{c.phone}</span>
                            </span>
                            <span className="shrink-0 text-[10px] font-semibold text-[var(--admin-text-muted)]">{c.ordersCount ?? 0} ord</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Manual entry fields */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

              <div className="mt-3">
                <label className={lbl}>Shipping / Delivery Address</label>
                <input
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Street, City, State"
                  className={inp}
                />
              </div>
            </section>

            {/* Catalog */}
            <section className="admin-card p-5">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
                  <ShoppingBag size={15} className="text-[var(--accent)]" /> Products
                </h2>
                <span className="font-mono text-[11px] font-medium text-[var(--admin-text-muted)]">{products.length} in catalog</span>
              </div>

              <div className="relative mt-3">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
                <input
                  value={searchProd}
                  onChange={(e) => setSearchProd(e.target.value)}
                  placeholder="Search catalog to add…"
                  className={`${inp} pl-9`}
                />
              </div>

              <div className="hide-scrollbar mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {filteredProducts.length === 0 && (
                  <p className="py-8 text-center text-xs font-medium text-[var(--admin-text-muted)]">No products match.</p>
                )}
                {filteredProducts.map((p) => {
                  const availableStock = (p.stock || 0) - (p.reserved || 0)
                  const retail = p.salePrice != null ? p.salePrice : p.price
                  const ws = p.wholesalePrice
                  const showWs = p.isWholesale && ws != null && ws < retail
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 transition hover:border-[var(--accent)]/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold">{p.name}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] text-[var(--admin-text-muted)]">
                          <span>{p.brand}</span>
                          {showWs ? (
                            <>
                              <span className="text-[var(--admin-text-muted)] line-through">₦{retail.toLocaleString('en-NG')}</span>
                              <span className="font-bold text-[#7a5c22]">₦{ws.toLocaleString('en-NG')}</span>
                              <span className="rounded bg-[var(--champagne-soft)] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#7a5c22]">
                                Wholesale −₦{(retail - ws).toLocaleString('en-NG')}
                              </span>
                            </>
                          ) : (
                            <span className="font-bold text-[var(--accent)]">₦{retail.toLocaleString('en-NG')}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          availableStock > 5
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : availableStock > 0
                            ? 'bg-[var(--champagne-soft)] text-[#7a5c22]'
                            : 'bg-red-500/10 text-red-600'
                        }`}>
                          {availableStock > 0 ? `${availableStock} avail` : 'Out'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(p)}
                          disabled={availableStock <= 0}
                          className="flex items-center gap-1 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white disabled:opacity-40"
                        >
                          <Plus size={13} /> Add
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </div>

          {/* ══ Right: cart & checkout ══ */}
          <div className="lg:col-span-5">
            <div className="space-y-4 lg:sticky lg:top-24">
              {/* Cart */}
              <section className="admin-card p-5">
                <h2 className="border-b border-[var(--admin-border)] pb-3 text-xs font-bold uppercase tracking-[0.14em]">
                  Cart ({cartItems.length})
                </h2>

                <div className="hide-scrollbar max-h-64 space-y-3 overflow-y-auto pt-3">
                  {cartItems.length === 0 ? (
                    <p className="py-8 text-center text-xs font-medium text-[var(--admin-text-muted)]">
                      No items yet — search the catalog to add.
                    </p>
                  ) : (
                    cartItems.map((ci) => {
                      const retailUnit = ci.product.salePrice != null ? ci.product.salePrice : ci.product.price
                      const discounted = ci.overridePrice < retailUnit
                      return (
                        <div key={ci.product.id} className="border-b border-[var(--admin-border)] pb-3 last:border-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-xs font-bold">{ci.product.name}</p>
                              <div className="mt-1 flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-[var(--admin-text-muted)]">₦</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={ci.overridePrice}
                                  onChange={(e) => {
                                    const val = Math.max(0, parseInt(e.target.value, 10) || 0)
                                    setCartItems(cartItems.map(item => item.product.id === ci.product.id ? { ...item, overridePrice: val } : item))
                                  }}
                                  aria-label={`Unit price for ${ci.product.name}`}
                                  className="w-24 rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] px-1.5 py-1 text-right font-mono text-[11px] font-bold text-[var(--accent)] outline-none focus:border-[var(--accent)]"
                                />
                                {discounted && (
                                  <span className="font-mono text-[10px] text-[var(--admin-text-muted)] line-through">
                                    ₦{retailUnit.toLocaleString('en-NG')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(ci.product.id, -1)}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] font-bold transition hover:border-[var(--accent)]"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center font-mono text-xs font-bold tabular-nums">{ci.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(ci.product.id, 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] font-bold transition hover:border-[var(--accent)]"
                                aria-label="Increase quantity"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 text-right font-mono text-[11px] font-bold tabular-nums text-[var(--admin-text-secondary)]">
                            = ₦{(ci.overridePrice * ci.quantity).toLocaleString('en-NG')}
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>

              {/* Fulfilment & payment */}
              <section className="admin-card space-y-4 p-5">
                <div>
                  <label className={`${lbl} flex items-center gap-1.5`}>
                    <Truck size={12} className="text-[var(--accent)]" /> Delivery Zone
                  </label>
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

                <div>
                  <label className={`${lbl} flex items-center gap-1.5`}>
                    <Ticket size={12} className="text-[var(--accent)]" /> Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. JESSY10"
                      className={`${inp} font-mono`}
                    />
                    <button
                      type="button"
                      onClick={handleValidateCoupon}
                      className="shrink-0 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-4 text-xs font-bold text-[var(--accent)] transition hover:border-[var(--accent)]"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div>
                  <label className={`${lbl} flex items-center gap-1.5`}>
                    <Banknote size={12} className="text-[var(--accent)]" /> Payment Status
                  </label>
                  <select
                    id="payment-status-select"
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className={`${inp} font-bold`}
                  >
                    <option value="PAID">PAID (Full Bank Transfer / Cash)</option>
                    <option value="PARTIALLY_PAID">PARTIALLY PAID (Deposit)</option>
                    <option value="UNPAID">UNPAID (Pay on Delivery)</option>
                  </select>
                </div>
              </section>

              {/* Totals */}
              <section className="admin-card space-y-2 p-5">
                <div className="flex justify-between text-xs font-medium text-[var(--admin-text-secondary)]">
                  <span>Subtotal</span>
                  <span className="font-mono font-bold tabular-nums text-[var(--admin-text-primary)]">₦{subtotal.toLocaleString('en-NG')}</span>
                </div>
                {wholesaleSavings > 0 && (
                  <div className="flex justify-between text-xs font-bold text-[#7a5c22]">
                    <span className="flex items-center gap-1">
                      <BadgePercent size={12} /> Wholesale savings
                    </span>
                    <span className="font-mono tabular-nums">−₦{wholesaleSavings.toLocaleString('en-NG')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-medium text-[var(--admin-text-secondary)]">
                  <span>Shipping</span>
                  <span className="font-mono font-bold tabular-nums text-[var(--admin-text-primary)]">
                    {shippingFee === 0 ? 'FREE' : `₦${shippingFee.toLocaleString('en-NG')}`}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600">
                    <span>Coupon ({couponCode})</span>
                    <span className="font-mono tabular-nums">−₦{discountAmount.toLocaleString('en-NG')}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between border-t border-[var(--admin-border)] pt-3">
                  <span className="text-sm font-bold">Total</span>
                  <span className="font-display text-3xl font-bold tabular-nums text-[var(--accent)]">
                    ₦{total.toLocaleString('en-NG')}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting || cartItems.length === 0}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-4 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-sm transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Confirm & Generate Order'}
                </button>
              </section>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
