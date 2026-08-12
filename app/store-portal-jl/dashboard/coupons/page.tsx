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

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">Coupons &amp; Discount Engine</h1>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            Create percentage or fixed discount coupons with automatic limit reactivation.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition hover:bg-amber-400 shadow-md shadow-amber-500/10"
        >
          <Plus size={16} /> CREATE NEW COUPON
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Loading coupons engine…</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition shadow-sm ${
                c.isActive
                  ? 'border-[var(--border)] bg-[var(--card-bg)] hover:border-amber-500/40'
                  : 'border-[var(--border)] bg-[var(--bg-primary)] opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-purple-500/10 p-2.5 text-purple-500 border border-purple-500/20">
                      <Ticket size={20} />
                    </span>
                    <div>
                      <h3 className="font-mono text-xl font-bold tracking-wider text-amber-500">{c.code}</h3>
                      <p className="text-xs text-[var(--text-secondary)] font-bold">
                        {c.discountType === 'PERCENTAGE'
                          ? `${c.discountValue}% OFF`
                          : `₦${c.discountValue.toLocaleString('en-NG')} OFF`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wider ${
                      c.isActive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]'
                    }`}
                  >
                    {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-[var(--text-secondary)] border-t border-[var(--border)] pt-4 font-medium">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)] font-semibold">Min Order Required:</span>
                    <strong className="text-[var(--text-primary)] font-mono">₦{c.minOrderAmount.toLocaleString('en-NG')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)] font-semibold">Usage Tracker:</span>
                    <strong className="text-[var(--text-primary)] font-mono">{c.usedCount} / {c.usageLimit} used</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] pt-1 font-bold">
                    <RefreshCw size={13} className={c.autoReactivate ? 'text-amber-500' : 'text-[var(--text-muted)]'} />
                    <span className={c.autoReactivate ? 'text-amber-500' : 'text-[var(--text-muted)]'}>
                      {c.autoReactivate ? 'Auto-Reactivation Enabled' : 'Manual Reset'}
                    </span>
                  </div>
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
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit Coupon */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                {editingCoupon ? 'Edit Promo Coupon' : 'Create New Promo Coupon'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-bold">Coupon Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. JESSY10"
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-amber-500 outline-none focus:border-amber-500 font-mono font-bold tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-bold">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₦)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-bold">Discount Value</label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder="e.g. 10 for 10% or 2000 for ₦2,000"
                    required
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-bold">Min. Order Amount (₦)</label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="0 for no minimum"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-bold">Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="100"
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoReactivate"
                    checked={form.autoReactivate}
                    onChange={(e) => setForm({ ...form, autoReactivate: e.target.checked })}
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                  <label htmlFor="autoReactivate" className="text-amber-500 font-bold">
                    Automatic Reactivation (Resets usage count when limit reached)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                  <label htmlFor="isActive" className="text-[var(--text-primary)] font-bold">Active</label>
                </div>
              </div>

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
