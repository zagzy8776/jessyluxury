'use client'
import { useEffect, useState } from 'react'
import { Ticket, Plus, Edit2, Trash2, RefreshCw, CheckCircle2, X, AlertCircle } from 'lucide-react'

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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-50">Coupons &amp; Discount Engine</h1>
          <p className="mt-1 text-sm text-stone-400">
            Create percentage or fixed discount coupons with automatic limit reactivation.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-xs font-bold tracking-wider text-stone-950 transition hover:bg-amber-400"
        >
          <Plus size={16} /> CREATE NEW COUPON
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-stone-500">Loading coupons engine…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
                c.isActive ? 'border-stone-800 bg-stone-900/60' : 'border-stone-800/40 bg-stone-950/40 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full bg-purple-500/10 p-2.5 text-purple-400">
                      <Ticket size={18} />
                    </span>
                    <div>
                      <h3 className="font-mono text-xl font-bold tracking-wider text-amber-400">{c.code}</h3>
                      <p className="text-xs text-stone-300 font-medium">
                        {c.discountType === 'PERCENTAGE'
                          ? `${c.discountValue}% OFF`
                          : `₦${c.discountValue.toLocaleString('en-NG')} OFF`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider ${
                      c.isActive ? 'bg-green-500/20 text-green-400' : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-stone-400 border-t border-stone-800/80 pt-4">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Min Order Required:</span>
                    <strong className="text-stone-200 font-mono">₦{c.minOrderAmount.toLocaleString('en-NG')}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Usage Tracker:</span>
                    <strong className="text-stone-200 font-mono">{c.usedCount} / {c.usageLimit} used</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] pt-1">
                    <RefreshCw size={12} className={c.autoReactivate ? 'text-amber-400' : 'text-stone-600'} />
                    <span className={c.autoReactivate ? 'text-amber-300 font-medium' : 'text-stone-500'}>
                      {c.autoReactivate ? 'Auto-Reactivation Enabled' : 'Manual Reset'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-stone-800/80 pt-4">
                <button
                  onClick={() => handleOpenModal(c)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:text-white transition"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/10 border border-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600 hover:text-white transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-stone-800 bg-stone-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <h3 className="font-display text-xl text-stone-100">
                {editingCoupon ? 'Edit Promo Coupon' : 'Create New Promo Coupon'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-medium">Coupon Code</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. JESSY10"
                  required
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 font-mono font-bold tracking-wider"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₦)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Discount Value</label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    placeholder="e.g. 10 for 10% or 2000 for ₦2,000"
                    required
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Min. Order Amount (₦)</label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="0 for no minimum"
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="100"
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-800/80">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoReactivate"
                    checked={form.autoReactivate}
                    onChange={(e) => setForm({ ...form, autoReactivate: e.target.checked })}
                    className="h-4 w-4 rounded border-stone-800 bg-stone-900 text-amber-500"
                  />
                  <label htmlFor="autoReactivate" className="text-amber-300 font-medium">
                    Automatic Reactivation (Resets usage count when limit reached)
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-stone-800 bg-stone-900 text-amber-500"
                  />
                  <label htmlFor="isActive" className="text-stone-300">Active</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-stone-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-stone-800 px-5 py-2.5 font-semibold text-stone-400 hover:text-white"
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
