'use client'
import { useEffect, useState } from 'react'
import { Ticket, Plus, Edit2, Trash2, RefreshCw, X } from 'lucide-react'

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<any>(null)

  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    usageLimit: '100',
    autoReactivate: true,
    isActive: true,
  })

  useEffect(() => {
    fetchCoupons()
  }, [])

  async function fetchCoupons() {
    try {
      const res = await fetch('/api/coupons')
      const data = await res.json()
      if (Array.isArray(data)) setCoupons(data)
    } catch (e) {
      console.error('Failed fetching coupons', e)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenModal(c?: any) {
    if (c) {
      setEditingCoupon(c)
      setForm({
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue.toString(),
        minOrderAmount: c.minOrderAmount.toString(),
        usageLimit: c.usageLimit.toString(),
        autoReactivate: c.autoReactivate,
        isActive: c.isActive,
      })
    } else {
      setEditingCoupon(null)
      setForm({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: '10',
        minOrderAmount: '20000',
        usageLimit: '100',
        autoReactivate: true,
        isActive: true,
      })
    }
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code || !form.discountValue) return

    try {
      if (editingCoupon) {
        await fetch(`/api/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setShowModal(false)
      fetchCoupons()
    } catch (err) {
      console.error('Error saving coupon', err)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    try {
      await fetch(`/api/coupons/${id}`, { method: 'DELETE' })
      fetchCoupons()
    } catch (err) {
      console.error('Error deleting coupon', err)
    }
  }

  const inp = 'admin-input font-medium'
  const lbl = 'mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Promotions</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Coupons &amp; Discounts</h1>
          <p className="mt-1 text-xs font-medium text-[var(--admin-text-secondary)]">
            Percentage or fixed discounts with automatic limit reactivation.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)]"
        >
          <Plus size={15} /> New Coupon
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-48 w-full" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="admin-card py-16 text-center">
          <Ticket size={30} className="mx-auto text-[var(--admin-text-muted)]" />
          <p className="mt-3 font-display text-lg font-bold">No coupons yet</p>
          <p className="mt-1 text-xs text-[var(--admin-text-muted)]">Create your first promo code to run discounts.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className={`flex flex-col justify-between rounded-xl border p-5 transition ${
                c.isActive
                  ? 'border-[var(--admin-border)] bg-[var(--admin-card-bg)] shadow-sm hover:border-[var(--accent)]/40'
                  : 'border-dashed border-[var(--admin-border)] bg-[var(--admin-bg)] opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-[var(--accent-soft)] p-2.5 text-[var(--accent)]">
                      <Ticket size={18} />
                    </span>
                    <div>
                      <h3 className="font-mono text-lg font-bold tracking-wider text-[var(--accent)]">{c.code}</h3>
                      <p className="text-xs font-bold text-[#7a5c22]">
                        {c.discountType === 'PERCENTAGE'
                          ? `${c.discountValue}% OFF`
                          : `₦${c.discountValue.toLocaleString('en-NG')} OFF`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${
                      c.isActive
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-[var(--admin-border)] bg-[var(--admin-bg)] text-[var(--admin-text-muted)]'
                    }`}
                  >
                    {c.isActive ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-[var(--admin-border)] pt-4 text-xs font-medium text-[var(--admin-text-secondary)]">
                  <div className="flex justify-between">
                    <span className="font-semibold text-[var(--admin-text-muted)]">Min Order:</span>
                    <strong className="font-mono tabular-nums">₦{c.minOrderAmount.toLocaleString('en-NG')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-[var(--admin-text-muted)]">Usage:</span>
                    <strong className="font-mono tabular-nums">{c.usedCount} / {c.usageLimit} used</strong>
                  </div>
                  {/* Usage progress */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--admin-bg)]">
                    <div
                      className={`h-full rounded-full ${c.usedCount >= c.usageLimit && !c.autoReactivate ? 'bg-red-500' : 'bg-[var(--champagne)]'}`}
                      style={{ width: `${Math.min(100, Math.round((c.usedCount / Math.max(c.usageLimit, 1)) * 100))}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pt-1 text-[11px] font-bold">
                    <RefreshCw size={12} className={c.autoReactivate ? 'text-emerald-600' : 'text-[var(--admin-text-muted)]'} />
                    <span className={c.autoReactivate ? 'text-emerald-600' : 'text-[var(--admin-text-muted)]'}>
                      {c.autoReactivate ? 'Auto-Reactivation Enabled' : 'Manual Reset'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--admin-border)] pt-4">
                <button
                  onClick={() => handleOpenModal(c)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-1.5 text-[11px] font-bold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-[11px] font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="w-full max-w-lg space-y-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-4">
              <h3 className="font-display text-lg font-bold">
                {editingCoupon ? 'Edit Promo Coupon' : 'Create Promo Coupon'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text-primary)]" aria-label="Close dialog">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className={lbl}>Coupon Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. JESSY10"
                  required
                  className={`${inp} font-mono font-bold uppercase tracking-wider`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className={inp}
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₦)</option>
                  </select>
                </div>

                <div>
                  <label className={lbl}>Discount Value</label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder="10 for 10% or 2000 for ₦2,000"
                    required
                    className={`${inp} font-mono font-bold`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Min. Order Amount (₦)</label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="0 for no minimum"
                    className={`${inp} font-mono font-bold`}
                  />
                </div>

                <div>
                  <label className={lbl}>Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="100"
                    className={`${inp} font-mono font-bold`}
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-[var(--admin-border)] pt-3">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.autoReactivate}
                    onChange={(e) => setForm({ ...form, autoReactivate: e.target.checked })}
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                  <span className="font-bold">Auto-reactivate when limit reached</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                  <span className="font-bold">Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-[var(--admin-border)] pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-[var(--admin-border)] px-5 py-2.5 font-bold text-[var(--admin-text-secondary)] transition hover:text-[var(--admin-text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--accent)] px-6 py-2.5 font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)]"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
