'use client'
import { useEffect, useState } from 'react'
import { Truck, Plus, Edit2, Trash2, X, Clock, Info } from 'lucide-react'

export default function AdminShippingPage() {
  const [zones, setZones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingZone, setEditingZone] = useState<any>(null)

  const [form, setForm] = useState({
    name: '',
    fee: '',
    estimatedDays: '1-2 Days',
    description: '',
    active: true,
    isPickup: false,
  })

  useEffect(() => {
    fetchShipping()
  }, [])

  async function fetchShipping() {
    try {
      const res = await fetch('/api/shipping')
      const data = await res.json()
      if (Array.isArray(data)) setZones(data)
    } catch (e) {
      console.error('Failed fetching shipping zones', e)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenModal(z?: any) {
    if (z) {
      setEditingZone(z)
      setForm({
        name: z.name,
        fee: z.fee.toString(),
        estimatedDays: z.estimatedDays || '1-2 Days',
        description: z.description || '',
        active: z.active,
        isPickup: z.isPickup || false,
      })
    } else {
      setEditingZone(null)
      setForm({
        name: '',
        fee: '',
        estimatedDays: '1-2 Days',
        description: '',
        active: true,
        isPickup: false,
      })
    }
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || form.fee === '') return

    try {
      if (editingZone) {
        await fetch(`/api/shipping/${editingZone.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      } else {
        await fetch('/api/shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
      }
      setShowModal(false)
      fetchShipping()
    } catch (err) {
      console.error('Error saving shipping zone', err)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this shipping zone?')) return
    try {
      await fetch(`/api/shipping/${id}`, { method: 'DELETE' })
      fetchShipping()
    } catch (err) {
      console.error('Error deleting zone', err)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Advanced Shipping Manager
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            Configure delivery destinations, park waybill fees, delivery lead times, and special instructions.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition hover:bg-amber-400 shadow-md shadow-amber-500/10"
        >
          <Plus size={16} /> ADD SHIPPING LOCATION
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Loading shipping destinations…</div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map((z) => (
            <div
              key={z.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition shadow-sm ${
                z.active
                  ? 'border-[var(--border)] bg-[var(--card-bg)] hover:border-amber-500/40'
                  : 'border-[var(--border)] bg-[var(--bg-primary)] opacity-60'
              }`}
            >
              <div>
                  <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500 border border-amber-500/20">
                      <Truck size={20} />
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-bold text-[var(--text-primary)]">{z.name}</h3>
                        {z.isPickup && (
                          <span className="bg-amber-500/10 text-amber-500 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-amber-500/20">
                            PICKUP
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-500 font-mono font-bold">
                        {z.fee === 0 ? 'FREE PICKUP' : `₦${z.fee.toLocaleString('en-NG')}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-0.5 text-[10px] font-bold tracking-wider ${
                      z.active
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border border-[var(--border)]'
                    }`}
                  >
                    {z.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-[var(--text-secondary)] border-t border-[var(--border)] pt-4 font-medium">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[var(--text-muted)] shrink-0" />
                    <span>Est. Delivery: <strong className="text-[var(--text-primary)]">{z.estimatedDays}</strong></span>
                  </div>
                  {z.description && (
                    <div className="flex items-start gap-2 pt-1 text-[var(--text-secondary)]">
                      <Info size={14} className="text-[var(--text-muted)] shrink-0 mt-0.5" />
                      <p className="leading-relaxed text-[11px] font-normal">{z.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
                <button
                  onClick={() => handleOpenModal(z)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-amber-500 hover:text-amber-500 transition"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(z.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Add / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                {editingZone ? 'Edit Shipping Location' : 'Add Shipping Location'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-bold">Location / Shipping Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Owerri Central Rider or Lagos Interstate Waybill"
                  required
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-bold">Delivery Fee (₦)</label>
                  <input
                    type="number"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: e.target.value })}
                    placeholder="0 for free pickup"
                    required
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-bold">Est. Lead Time</label>
                  <input
                    value={form.estimatedDays}
                    onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                    placeholder="e.g. Same Day, 1-2 Days"
                    required
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] mb-1 font-bold">Description / Customer Note</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain park pickup details, rider instructions..."
                  rows={3}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 resize-none font-medium"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                  <label htmlFor="active" className="text-[var(--text-primary)] font-bold">Active (Checkout Visible)</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPickup"
                    checked={form.isPickup}
                    onChange={(e) => setForm({ ...form, isPickup: e.target.checked })}
                    className="h-4 w-4 rounded accent-amber-500"
                  />
                  <label htmlFor="isPickup" className="text-[var(--text-primary)] font-bold">Store Pickup Method</label>
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
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
