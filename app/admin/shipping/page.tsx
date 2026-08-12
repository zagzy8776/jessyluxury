'use client'
import { useEffect, useState } from 'react'
import { Truck, Plus, Edit2, Trash2, CheckCircle2, X, MapPin, Clock, Info } from 'lucide-react'

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
      })
    } else {
      setEditingZone(null)
      setForm({
        name: '',
        fee: '',
        estimatedDays: '1-2 Days',
        description: '',
        active: true,
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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-50">Advanced Shipping Manager</h1>
          <p className="mt-1 text-sm text-stone-400">
            Configure delivery destinations, park waybill fees, delivery lead times, and special instructions.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-xs font-bold tracking-wider text-stone-950 transition hover:bg-amber-400"
        >
          <Plus size={16} /> ADD NEW SHIPPING LOCATION
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-stone-500">Loading shipping destinations…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map((z) => (
            <div
              key={z.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition ${
                z.active ? 'border-stone-800 bg-stone-900/60' : 'border-stone-800/40 bg-stone-950/40 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-full bg-amber-500/10 p-2.5 text-amber-400">
                      <Truck size={18} />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-medium text-stone-100">{z.name}</h3>
                      <p className="text-xs text-amber-300 font-mono font-bold">
                        {z.fee === 0 ? 'FREE PICKUP' : `₦${z.fee.toLocaleString('en-NG')}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider ${
                      z.active ? 'bg-green-500/20 text-green-400' : 'bg-stone-800 text-stone-500'
                    }`}
                  >
                    {z.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-stone-400 border-t border-stone-800/80 pt-4">
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-stone-500" />
                    <span>Est. Delivery: <strong className="text-stone-200">{z.estimatedDays}</strong></span>
                  </div>
                  {z.description && (
                    <div className="flex items-start gap-2 pt-1 text-stone-500">
                      <Info size={13} className="text-stone-500 shrink-0 mt-0.5" />
                      <p className="leading-relaxed text-[11px]">{z.description}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-stone-800/80 pt-4">
                <button
                  onClick={() => handleOpenModal(z)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:text-white transition"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(z.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/10 border border-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600 hover:text-white transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-stone-800 bg-stone-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <h3 className="font-display text-xl text-stone-100">
                {editingZone ? 'Edit Shipping Location' : 'Add Shipping Location'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-medium">Location / Shipping Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Owerri Central Rider or Lagos Interstate Waybill"
                  required
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Delivery Fee (₦)</label>
                  <input
                    type="number"
                    value={form.fee}
                    onChange={(e) => setForm({ ...form, fee: e.target.value })}
                    placeholder="0 for free pickup"
                    required
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Est. Lead Time</label>
                  <input
                    value={form.estimatedDays}
                    onChange={(e) => setForm({ ...form, estimatedDays: e.target.value })}
                    placeholder="e.g. Same Day, 1-2 Days"
                    required
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">Description / Customer Note</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Explain park pickup details, rider instructions..."
                  rows={3}
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 rounded border-stone-800 bg-stone-900 text-amber-500"
                />
                <label htmlFor="active" className="text-stone-300">Active (Visible during checkout)</label>
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
