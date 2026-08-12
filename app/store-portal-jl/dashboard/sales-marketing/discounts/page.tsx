'use client'
import { useEffect, useState } from 'react'
import {
  Ticket, Plus, Edit2, Trash2, CheckCircle, RefreshCw, AlertCircle,
  Tag, MapPin, DollarSign, Percent, ToggleLeft, ToggleRight, Sparkles, X,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

export default function DiscountsEnginePage() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<any>(null)
  const { toast, showToast, clearToast } = useToast()

  const [form, setForm] = useState({
    name: 'Special Promo Discount',
    code: '',
    storeLocation: 'Headquarters (Owerri)',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    minOrderAmount: '0',
    usageLimit: '100',
    autoReactivate: true,
    isActive: true,
  })

  useEffect(() => { fetchCoupons() }, [])

  async function fetchCoupons() {
    try {
      const res = await fetch('/api/coupons')
      const data = await res.json()
      if (Array.isArray(data)) setCoupons(data)
    } catch { showToast('Failed fetching coupons', 'error') }
    finally { setLoading(false) }
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
        autoReactivate: c.autoReactivate,
        isActive: c.isActive,
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
        autoReactivate: true,
        isActive: true,
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
      autoReactivate: form.autoReactivate,
      isActive: form.isActive,
    }

    try {
      if (editingCoupon) {
        await fetch(`/api/coupons/${editingCoupon.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        showToast('Discount updated!')
      } else {
        await fetch('/api/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        showToast('New discount promo code created!')
      }
      setShowModal(false)
      fetchCoupons()
    } catch {
      showToast('Error saving discount code', 'error')
    }
  }

  async function handleToggleActive(c: any) {
    try {
      await fetch(`/api/coupons/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !c.isActive }),
      })
      showToast(`Coupon ${c.code} ${!c.isActive ? 'activated' : 'deactivated'}`)
      fetchCoupons()
    } catch {
      showToast('Error toggling coupon', 'error')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this coupon promo code?')) return
    try {
      await fetch(`/api/coupons/${id}`, { method: 'DELETE' })
      showToast('Coupon deleted')
      fetchCoupons()
    } catch {
      showToast('Error deleting coupon', 'error')
    }
  }

  const activeCount = coupons.filter((c) => c.isActive).length
  const totalUses = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)

  const inp = 'w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 text-xs outline-none transition focus:border-amber-500 font-sans'
  const lbl = 'block text-[11px] font-semibold text-stone-400 mb-1 uppercase tracking-wider'

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-50">Discount &amp; Promo Engine</h1>
          <p className="mt-1 text-xs text-stone-400">
            Bumpa-style discount creation by store location, fixed ₦ or %, and auto-reactivation.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-bold tracking-wider text-stone-950 transition hover:bg-amber-400 shadow-md"
        >
          <Plus size={16} /> CREATE DISCOUNT
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Active Promo Codes</span>
            <span className="rounded-full bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <Ticket size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">{activeCount}</p>
          <p className="mt-1 text-xs text-stone-500">Live in cart checkout</p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Total Redemptions</span>
            <span className="rounded-full bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <CheckCircle size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">{totalUses}</p>
          <p className="mt-1 text-xs text-emerald-400">Used by customers</p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Auto-Reactivation</span>
            <span className="rounded-full bg-purple-500/10 p-2 text-purple-400 border border-purple-500/20">
              <RefreshCw size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">6 Active</p>
          <p className="mt-1 text-xs text-stone-500">Resets count when limit is hit</p>
        </div>
      </div>

      {/* Discounts List */}
      {loading ? (
        <div className="py-20 text-center text-sm text-stone-500 animate-pulse">Loading discount engine…</div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/40 py-20 text-center text-stone-500 text-sm">
          No discount codes created yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-800 bg-stone-900/60 p-5 transition hover:border-amber-500/40 shadow-xl backdrop-blur-xl"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-lg font-bold text-amber-400 tracking-wider">{c.code}</span>
                    <p className="text-xs font-semibold text-stone-200 mt-0.5">{c.name || 'Store Promo'}</p>
                  </div>

                  <button
                    onClick={() => handleToggleActive(c)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider border ${
                      c.isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-stone-800 text-stone-500 border-stone-700'
                    }`}
                  >
                    {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>
                </div>

                <div className="mt-4 space-y-2 text-xs text-stone-400 border-t border-stone-800/80 pt-4">
                  <div className="flex items-center justify-between">
                    <span>Discount Value:</span>
                    <strong className="text-amber-300 font-mono">
                      {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% OFF` : `₦${c.discountValue?.toLocaleString('en-NG')} OFF`}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Store Location:</span>
                    <span className="text-stone-200">{c.storeLocation || 'Headquarters (Owerri)'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Min Order Amount:</span>
                    <span className="font-mono text-stone-200">₦{c.minOrderAmount?.toLocaleString('en-NG')}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Usage Count:</span>
                    <span className="font-mono text-stone-200">{c.usedCount} / {c.usageLimit} uses</span>
                  </div>

                  {c.autoReactivate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium pt-1">
                      <RefreshCw size={12} /> Auto-reactivates on limit reach
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-stone-800/80 pt-4">
                <button
                  onClick={() => handleOpenModal(c)}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:text-white transition"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600/10 border border-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600 hover:text-white transition"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Creating / Editing Discount */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-stone-800 bg-stone-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <h3 className="font-display text-xl text-stone-100">
                {editingCoupon ? 'Edit Discount Code' : 'Create New Discount Code'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className={lbl}>Discount Title / Campaign Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Independence Sale Promo"
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
                    className={inp + ' font-mono font-bold text-amber-300'}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Min Order Amount (₦)</label>
                  <input
                    type="number"
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="0"
                    className={inp + ' font-mono'}
                  />
                </div>

                <div>
                  <label className={lbl}>Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="100"
                    className={inp + ' font-mono'}
                  />
                </div>
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.autoReactivate}
                    onChange={(e) => setForm({ ...form, autoReactivate: e.target.checked })}
                    className="h-4 w-4 rounded border-stone-800 bg-stone-900 accent-amber-500"
                  />
                  <span className="text-stone-300">Auto-Reactivate when limit is reached</span>
                </label>
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
