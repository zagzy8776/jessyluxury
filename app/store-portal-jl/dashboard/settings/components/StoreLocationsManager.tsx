'use client'
import { useState, useEffect } from 'react'
import { MapPin, Plus, Edit2, Trash2, CheckCircle, XCircle, Star } from 'lucide-react'

interface StoreLocation {
  id: number
  name: string
  address: string
  city: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface StoreLocationsManagerProps {
  showToast: (msg: string, type?: 'success' | 'error') => void
}

export default function StoreLocationsManager({ showToast }: StoreLocationsManagerProps) {
  const [locations, setLocations] = useState<StoreLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ name: '', address: '', city: '', isDefault: false })
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadLocations()
  }, [])

  async function loadLocations() {
    try {
      setLoading(true)
      const res = await fetch('/api/settings/locations')
      if (res.ok) {
        const data = await res.json()
        setLocations(data.locations || [])
      } else {
        showToast('Failed to load store locations', 'error')
      }
    } catch {
      showToast('Error loading store locations', 'error')
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setDialogMode('create')
    setFormData({ name: '', address: '', city: '', isDefault: false })
    setEditingId(null)
    setShowDialog(true)
  }

  function openEditDialog(location: StoreLocation) {
    setDialogMode('edit')
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      isDefault: location.isDefault,
    })
    setEditingId(location.id)
    setShowDialog(true)
  }

  function closeDialog() {
    setShowDialog(false)
    setFormData({ name: '', address: '', city: '', isDefault: false })
    setEditingId(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Client-side validation
    if (!formData.name.trim()) {
      showToast('Location name is required', 'error')
      return
    }
    if (!formData.address.trim()) {
      showToast('Address is required', 'error')
      return
    }
    if (!formData.city.trim()) {
      showToast('City is required', 'error')
      return
    }

    setSubmitting(true)
    try {
      const url = dialogMode === 'create'
        ? '/api/settings/locations'
        : `/api/settings/locations/${editingId}`
      
      const method = dialogMode === 'create' ? 'POST' : 'PUT'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        showToast(
          dialogMode === 'create' ? 'Location created successfully' : 'Location updated successfully',
          'success'
        )
        closeDialog()
        await loadLocations()
      } else {
        const data = await res.json()
        showToast(data.error || 'Operation failed', 'error')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSetDefault(locationId: number) {
    try {
      const res = await fetch(`/api/settings/locations/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })

      if (res.ok) {
        showToast('Default location updated successfully', 'success')
        await loadLocations()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to set default location', 'error')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    }
  }

  async function handleDelete(locationId: number) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/settings/locations/${locationId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast('Location deleted successfully', 'success')
        setDeleteConfirm(null)
        await loadLocations()
      } else {
        const data = await res.json()
        // Show user-friendly error for protection violations
        if (res.status === 409) {
          showToast(data.error || 'Cannot delete this location', 'error')
        } else {
          showToast('Failed to delete location', 'error')
        }
        setDeleteConfirm(null)
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
      setDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  function canDelete(location: StoreLocation): { allowed: boolean; reason?: string } {
    if (location.isDefault) {
      return { allowed: false, reason: 'Cannot delete the default location' }
    }
    // Note: We can't check coupon/system default references from the client
    // The server will enforce those rules and return 409 if violated
    return { allowed: true }
  }

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-sans font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
        <p className="text-xs text-[var(--text-secondary)] font-medium">Loading store locations...</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Physical Store Outlets</h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium">Manage pickup points and retail locations</p>
          </div>
          <button
            onClick={openCreateDialog}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10"
          >
            <Plus size={14} /> Add Location
          </button>
        </div>

        {locations.length === 0 ? (
          <div className="py-12 text-center">
            <MapPin size={48} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-sm font-bold text-[var(--text-primary)] mb-1">No store locations yet</p>
            <p className="text-xs text-[var(--text-secondary)] font-medium mb-4">
              Create your first location to start managing pickup points
            </p>
            <button
              onClick={openCreateDialog}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10"
            >
              <Plus size={14} /> Add First Location
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {locations.map((loc) => {
              const deleteCheck = canDelete(loc)
              return (
                <div
                  key={loc.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--bg-primary)] p-4 border border-[var(--border)] text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <MapPin size={14} className="text-amber-500" /> {loc.name}
                      {loc.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-500/20">
                          <Star size={10} className="fill-current" /> Default Location
                        </span>
                      )}
                    </p>
                    <p className="text-[var(--text-secondary)] font-medium">{loc.address}</p>
                    <p className="text-[var(--text-muted)] text-[11px] font-medium">{loc.city}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!loc.isDefault && (
                      <button
                        onClick={() => handleSetDefault(loc.id)}
                        className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition"
                        title="Set as default location"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => openEditDialog(loc)}
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition p-2"
                      title="Edit location"
                    >
                      <Edit2 size={14} />
                    </button>
                    {deleteCheck.allowed ? (
                      <button
                        onClick={() => setDeleteConfirm(loc.id)}
                        className="text-red-500 hover:text-red-600 transition p-2"
                        title="Delete location"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="text-[var(--text-muted)] p-2 cursor-not-allowed opacity-50"
                        title={deleteCheck.reason}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border)] pb-3">
              {dialogMode === 'create' ? 'Add New Location' : 'Edit Location'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={lbl}>Location Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Headquarters (Owerri)"
                  className={inp}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className={lbl}>Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. 57 MCC Road, Opposite Ihechiuwa Junction"
                  className={inp}
                  disabled={submitting}
                />
              </div>

              <div>
                <label className={lbl}>City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Owerri, Imo State"
                  className={inp}
                  disabled={submitting}
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-primary)] p-3 border border-[var(--border)]">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border)] text-amber-500 focus:ring-amber-500"
                  disabled={submitting}
                />
                <label htmlFor="isDefault" className="text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                  Set as default location
                  <span className="block text-[10px] text-[var(--text-muted)] font-normal mt-0.5">
                    The default location will be used for new coupons and system operations
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={submitting}
                  className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (dialogMode === 'create' ? 'Create Location' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-500/10 p-2">
                <XCircle size={20} className="text-red-500" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Delete Location?</h3>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-medium mb-4">
              Are you sure you want to delete this location? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-600 transition shadow-md shadow-red-500/10 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
