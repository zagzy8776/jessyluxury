'use client'
import { useEffect, useState } from 'react'
import {
  Ticket, Plus, Edit2, Trash2, CheckCircle, RefreshCw, X, Calendar, User, Info, DollarSign, Layers
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

const DATE_RANGES = ['Today', 'Last 7 Days', 'Last 30 Days', 'This Year', 'All Time']

export default function DiscountsEnginePage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<any>(null)
const [deletingCoupon, setDeletingCoupon] = useState<number | null>(null)
  const { toast, showToast, clearToast } = useToast()

  const [form, setForm] = useState({
    name: 'Special Promo Discount',
    code: '',
    storeLocation: 'Headquarters (Owerri)',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    minOrderAmount: '0',
    usageLimit: '100',
    customerLimit: '1',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    productIds: [] as number[],
    categoryIds: [] as number[],
    isActive: true,
    wholesaleEligible: false,
  })

  useEffect(() => {
    fetchCoupons()
    fetchProductsAndCategories()
  }, [])

  async function fetchCoupons() {
    try {
      const res = await fetch('/api/coupons')
      const data = await res.json()
      if (Array.isArray(data)) setCoupons(data)
    } catch {
      showToast('Failed fetching coupons', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function fetchProductsAndCategories() {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/shipping'), // Categories are fetched separately if category mapping route exists, but let's query products which contains categoryId
      ])
      const pData = await pRes.json()
      if (Array.isArray(pData)) {
        setProducts(pData)
        // Extract unique categories from products
        const uniqueCatsMap: Record<number, string> = {}
        for (const p of pData) {
          if (p.category) {
            uniqueCatsMap[p.category.id] = p.category.name
          }
        }
        setCategories(Object.entries(uniqueCatsMap).map(([id, name]) => ({ id: Number(id), name })))
      }
    } catch {
      console.error('Failed to load products/categories catalog')
    }
  }

  function handleOpenModal(c?: any) {
    if (c) {
      setEditingCoupon(c)
      setForm({
        name: c.name || 'Promo Discount',
        code: c.code,
        storeLocation: c.storeLocation || 'Headquarters (Owerri)',
        discountType: c.discountType,
        discountValue: c.discountValue.toString(),
        minOrderAmount: c.minOrderAmount.toString(),
        usageLimit: c.usageLimit.toString(),
        customerLimit: c.customerLimit ? c.customerLimit.toString() : '1',
        maxDiscountAmount: c.maxDiscountAmount ? c.maxDiscountAmount.toString() : '',
        startDate: c.startDate ? new Date(c.startDate).toISOString().slice(0, 16) : '',
        endDate: c.endDate ? new Date(c.endDate).toISOString().slice(0, 16) : '',
        productIds: Array.isArray(c.productIds) ? c.productIds : [],
        categoryIds: Array.isArray(c.categoryIds) ? c.categoryIds : [],
        isActive: c.isActive,
        wholesaleEligible: Boolean(c.wholesaleEligible),
      })
    } else {
      setEditingCoupon(null)
      setForm({
        name: 'Flash Promo Discount',
        code: `JESSY${Math.floor(10 + Math.random() * 90)}`,
        storeLocation: 'Headquarters (Owerri)',
        discountType: 'PERCENTAGE',
        discountValue: '10',
        minOrderAmount: '0',
        usageLimit: '100',
        customerLimit: '1',
        maxDiscountAmount: '',
        startDate: '',
        endDate: '',
        productIds: [],
        categoryIds: [],
        isActive: true,
        wholesaleEligible: false,
      })
    }
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.discountValue) return

    const payload = {
      name: form.name,
      code: form.code.toUpperCase(),
      storeLocation: form.storeLocation,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: Number(form.minOrderAmount) || 0,
      usageLimit: Number(form.usageLimit) || 100,
      customerLimit: Number(form.customerLimit) || 1,
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      productIds: form.productIds,
      categoryIds: form.categoryIds,
      isActive: form.isActive,
      wholesaleEligible: form.wholesaleEligible,
    }

    try {
      const url = editingCoupon ? `/api/coupons/${editingCoupon.id}` : '/api/coupons'
      const method = editingCoupon ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        showToast(editingCoupon ? 'Discount updated!' : 'New discount promo code created!')
        setShowModal(false)
        fetchCoupons()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save coupon', 'error')
      }
    } catch {
      showToast('Error saving discount code', 'error')
    }
  }

  async function handleToggleActive(c: any) {
    try {
      const res = await fetch(`/api/coupons/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        showToast(data?.error || 'Failed to update coupon', 'error')
        return
      }

      showToast(`Coupon ${c.code} ${!c.isActive ? 'activated' : 'deactivated'}`)
      fetchCoupons()
    } catch {
      showToast('Network error while updating coupon', 'error')
    }
  }

  async function handleDelete(id: number) {
    const target = coupons.find((c: any) => c.id === id)
    if (!confirm(`Delete "${target?.code || 'this coupon'}"? Coupons with past redemptions or live campaigns are protected automatically.`)) return

    setDeletingCoupon(id)
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        showToast(data?.error || 'Failed to delete coupon', 'error')
        return
      }

      // The API may deactivate instead of deleting when history exists.
      if (data?.deactivated) {
        showToast(data.message || 'Coupon deactivated to preserve history', 'error')
      } else {
        showToast(data?.message || 'Coupon deleted')
      }
      fetchCoupons()
    } catch {
      showToast('Network error while deleting coupon', 'error')
    } finally {
      setDeletingCoupon(null)
    }
  }

  function getCouponState(c: any): { label: string; style: string } {
    const now = new Date()
    if (!c.isActive) {
      return { label: 'DISABLED', style: 'bg-red-500/10 text-red-500 border-red-500/20' }
    }
    if (c.usedCount >= c.usageLimit) {
      return { label: 'DEPLETED', style: 'bg-purple-500/10 text-purple-500 border-purple-500/20' }
    }
    if (c.endDate && new Date(c.endDate) < now) {
      return { label: 'EXPIRED', style: 'bg-stone-500/10 text-stone-500 border-stone-500/20' }
    }
    if (c.startDate && new Date(c.startDate) > now) {
      return { label: 'SCHEDULED', style: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
    }
    return { label: 'ACTIVE', style: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' }
  }

  const activeCount = coupons.filter((c) => getCouponState(c).label === 'ACTIVE').length
  const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-sans font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Discounts &amp; Marketing Engine
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            Advanced promo code constraints with atomic concurrency checks, customer limits, and brand/category exclusions.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition hover:bg-amber-400 shadow-md shadow-amber-500/10"
        >
          <Plus size={16} /> CREATE PROMO CODE
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Active Promo Codes</span>
            <span className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500 border border-amber-500/20">
              <Ticket size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">{activeCount}</p>
          <p className="mt-1 text-xs text-[var(--text-secondary)] font-medium">Valid for checkout application</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Total Redemptions</span>
            <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500 border border-emerald-500/20">
              <CheckCircle size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">{totalUses}</p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">CouponRedemption entries</p>
        </div>
      </div>

      {/* Discounts List */}
      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Loading discount engine…</div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] py-20 text-center text-xs font-medium text-[var(--text-muted)]">
          No discount codes created yet.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => {
            const state = getCouponState(c)
            return (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 transition hover:border-[var(--border-hover)] shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-lg font-bold text-amber-500 tracking-wider">{c.code}</span>
                      <p className="text-xs font-bold text-[var(--text-primary)] mt-0.5">{c.name || 'Store Promo'}</p>
                    </div>

                    <button
                      onClick={() => handleToggleActive(c)}
                      className={`rounded-full px-3 py-0.5 text-[9px] font-bold tracking-wider border ${state.style}`}
                    >
                      {state.label}
                    </button>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-[var(--text-secondary)] border-t border-[var(--border)] pt-4 font-medium">
                    <div className="flex items-center justify-between">
                      <span>Discount Value:</span>
                      <strong className="text-amber-500 font-mono">
                        {c.discountType === 'PERCENTAGE'
                          ? `${c.discountValue}% OFF${c.maxDiscountAmount ? ` (Capped ₦${c.maxDiscountAmount.toLocaleString()})` : ''}`
                          : `₦${c.discountValue?.toLocaleString('en-NG')} OFF`}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Min Order Amount:</span>
                      <span className="font-mono text-[var(--text-primary)] font-semibold">₦{c.minOrderAmount?.toLocaleString('en-NG')}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Usage limits:</span>
                      <span className="font-mono text-[var(--text-primary)] font-semibold">{c.usedCount} / {c.usageLimit} total</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Customer Limit:</span>
                      <span className="font-mono text-[var(--text-primary)] font-semibold">{c.customerLimit} use(s) per client</span>
                    </div>

                    {c.productIds.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Scope:</span>
                        <span className="text-amber-500 font-semibold">{c.productIds.length} Products Only</span>
                      </div>
                    )}

                    {c.categoryIds.length > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Scope:</span>
                        <span className="text-blue-500 font-semibold">{c.categoryIds.length} Categories Only</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
                  <button
                    onClick={() => handleOpenModal(c)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-amber-500 hover:text-amber-500 transition"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingCoupon !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} /> {deletingCoupon === c.id ? 'Working…' : 'Delete / Disable'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal for Creating / Editing Discount */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                {editingCoupon ? 'Edit Discount Code' : 'Create New Discount Code'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className={lbl}>Discount Title</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Black Friday Special"
                  required
                  className={inp}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Promo Code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="JESSY10"
                    required
                    className={inp + ' font-mono font-bold text-amber-500'}
                  />
                </div>

                <div>
                  <label className={lbl}>Store Location</label>
                  <select
                    value={form.storeLocation}
                    onChange={(e) => setForm({ ...form, storeLocation: e.target.value })}
                    className={inp}
                  >
                    <option value="Headquarters (Owerri)">Headquarters (Owerri)</option>
                    <option value="Lagos Hub">Lagos Hub</option>
                    <option value="All Outlets">All Outlets</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className={inp}
                  >
                    <option value="PERCENTAGE">Percentage (%) OFF</option>
                    <option value="FIXED">Fixed Amount (₦) OFF</option>
                  </select>
                </div>

                <div>
                  <label className={lbl}>Discount Value *</label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === 'PERCENTAGE' ? '15' : '2000'}
                    required
                    className={inp + ' font-mono'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Min Order (₦)</label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    className={inp + ' font-mono'}
                  />
                </div>

                <div>
                  <label className={lbl}>Max Uses</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className={inp + ' font-mono'}
                  />
                </div>

                <div>
                  <label className={lbl}>Per-Customer Limit</label>
                  <input
                    type="number"
                    value={form.customerLimit}
                    onChange={(e) => setForm({ ...form, customerLimit: e.target.value })}
                    className={inp + ' font-mono'}
                  />
                </div>
              </div>

              {form.discountType === 'PERCENTAGE' && (
                <div>
                  <label className={lbl}>Max Discount Amount Cap (₦)</label>
                  <input
                    type="number"
                    value={form.maxDiscountAmount}
                    onChange={(e) => setForm({ ...form, maxDiscountAmount: e.target.value })}
                    placeholder="e.g. 5000 (Empty for no cap)"
                    className={inp + ' font-mono'}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Start Date (Lagos time)</label>
                  <input
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>End Date (Lagos time)</label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className={inp}
                  />
                </div>
              </div>

              {/* Product and Category Scope Picker selectors */}
              <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-3">
                <div>
                  <label className={lbl}>Product Restrictions</label>
                  <div className="h-28 overflow-y-auto border border-[var(--border)] bg-[var(--bg-primary)] p-2 rounded-xl space-y-1">
                    {products.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={form.productIds.includes(p.id)}
                          onChange={(e) => {
                            const selected = e.target.checked
                              ? [...form.productIds, p.id]
                              : form.productIds.filter((id) => id !== p.id)
                            setForm({ ...form, productIds: selected })
                          }}
                          className="rounded text-amber-500 accent-amber-500"
                        />
                        <span className="text-[10px] text-[var(--text-primary)] truncate font-semibold">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={lbl}>Category Restrictions</label>
                  <div className="h-28 overflow-y-auto border border-[var(--border)] bg-[var(--bg-primary)] p-2 rounded-xl space-y-1">
                    {categories.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                        <input
                          type="checkbox"
                          checked={form.categoryIds.includes(c.id)}
                          onChange={(e) => {
                            const selected = e.target.checked
                              ? [...form.categoryIds, c.id]
                              : form.categoryIds.filter((id) => id !== c.id)
                            setForm({ ...form, categoryIds: selected })
                          }}
                          className="rounded text-amber-500 accent-amber-500"
                        />
                        <span className="text-[10px] text-[var(--text-primary)] font-semibold">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.wholesaleEligible}
                  onChange={(e) => setForm({ ...form, wholesaleEligible: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-[var(--border)] text-amber-500 accent-amber-500"
                />
                <span className="text-[11px] font-bold text-[var(--text-primary)]">Wholesale-only coupon</span>
              </label>

              <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-[var(--border)] px-5 py-2.5 font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-6 py-2.5 font-bold text-stone-950 hover:bg-amber-400 transition"
                >
                  Save Discount Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

