'use client'
import { useEffect, useState } from 'react'
import { Truck, Plus, Edit2, Trash2, X, Clock, Info, MapPin } from 'lucide-react'

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

  const inp = 'admin-input font-medium'
  const lbl = 'mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Logistics</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Delivery Zones</h1>
          <p className="mt-1 text-xs font-medium text-[var(--admin-text-secondary)]">
            Configure destinations, waybill fees, lead times and pickup instructions.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)]"
        >
          <Plus size={15} /> Add Zone
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-48 w-full" />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="admin-card py-16 text-center">
          <Truck size={30} className="mx-auto text-[var(--admin-text-muted)]" />
          <p className="mt-3 font-display text-lg font-bold">No delivery zones yet</p>
          <p className="mt-1 text-xs text-[var(--admin-text-muted)]">Add your first zone so customers can choose delivery at checkout.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {zones.map((z) => (
            <div
              key={z.id}
              className={`flex flex-col justify-between rounded-xl border p-5 transition ${
                z.active
                  ? 'border-[var(--admin-border)] bg-[var(--admin-card-bg)] shadow-sm hover:border-[var(--accent)]/40'
                  : 'border-dashed border-[var(--admin-border)] bg-[var(--admin-bg)] opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-lg p-2.5 ${z.isPickup ? 'bg-[var(--champagne-soft)] text-[#7a5c22]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'}`}>
                      {z.isPickup ? <MapPin size={18} /> : <Truck size={18} />}
                    </span>
                    <div>
                      <h3 className="font-display text-base font-bold">{z.name}</h3>
                      <p className="font-mono text-xs font-bold text-[var(--accent)]">
                        {z.fee === 0 ? 'FREE' : `₦${z.fee.toLocaleString('en-NG')}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-bold tracking-wider ${
                      z.active
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-[var(--admin-border)] bg-[var(--admin-bg)] text-[var(--admin-text-muted)]'
                    }`}
                  >
                    {z.active ? 'ACTIVE' : 'HIDDEN'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-[var(--admin-border)] pt-4 text-xs font-medium text-[var(--admin-text-secondary)]">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="shrink-0 text-[var(--admin-text-muted)]" />
                    <span>Est. Delivery: <strong className="text-[var(--admin-text-primary)]">{z.estimatedDays}</strong></span>
                  </div>
                  {z.isPickup && (
                    <span className="inline-block rounded bg-[var(--champagne-soft)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#7a5c22]">
                      Store Pickup Method
                    </span>
                  )}
                  {z.description && (
                    <div className="flex items-start gap-2 pt-1">
                      <Info size={13} className="mt-0.5 shrink-0 text-[var(--admin-text-muted)]" />
                      <p className="text-[11px] font-normal leading-relaxed">{z.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--admin-border)] pt-4">
                <button
                  onClick={() => handleOpenModal(z)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-1.5 text-[11px] font-bold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(z.id)}
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
                {editingZone ? 'Edit Shipping Zone' : 'Add Shipping Zone'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text-primary)]" aria-label="Close dialog">
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className={lbl}>Location / Shipping Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Owerri Central Rider or Lagos Interstate Waybill"
                  required
                  className={inp}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Delivery Fee (₦)</label>
                  <input
                    type="number"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: e.target.value })}
                    placeholder="0 for free pickup"
                    required
                    className={`${inp} font-mono font-bold`}
                  />
                </div>

                <div>
                  <label className={lbl}>Est. Lead Time</label>
                  <input
                    value={form.estimatedDays}
                    onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                    placeholder="e.g. Same Day, 1-2 Days"
                    required
                    className={inp}
                  />
                </div>
              </div>

              <div>
                <label className={lbl}>Description / Customer Note</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain park pickup details, rider instructions..."
                  rows={3}
                  className={`${inp} resize-none`}
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="h-4 w-4 rounded accent-[var(--accent)]"
                  />
                  <span className="font-bold">Active (checkout visible)</span>
                </label>

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isPickup}
                    onChange={(e) => setForm({ ...form, isPickup: e.target.checked })}
                    className="h-4 w-4 rounded accent-[var(--champagne)]"
                  />
                  <span className="font-bold">Store pickup method</span>
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
                  Save Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
