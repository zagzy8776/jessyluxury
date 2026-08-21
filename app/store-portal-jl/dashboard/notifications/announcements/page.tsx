'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X, Megaphone, Eye, EyeOff, Calendar, AlertCircle } from 'lucide-react'

export default function AnnouncementsDashboard() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form State
  const [editId, setEditId] = useState<number | null>(null)
  const [type, setType] = useState('PROMOTION')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [actionLabel, setActionLabel] = useState('')
  const [actionUrl, setActionUrl] = useState('')
  const [audience, setAudience] = useState('ALL')
  const [priority, setPriority] = useState(0)
  const [dismissible, setDismissible] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')

  async function fetchAnnouncements() {
    try {
      const res = await fetch('/api/store-announcements')
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data)
      }
    } catch (err) {
      console.error('Error fetching announcements:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  function resetForm() {
    setEditId(null)
    setType('PROMOTION')
    setTitle('')
    setMessage('')
    setImageUrl('')
    setActionLabel('')
    setActionUrl('')
    setAudience('ALL')
    setPriority(0)
    setDismissible(true)
    setIsActive(false)
    setStartsAt('')
    setEndsAt('')
    setError('')
  }

  function handleEditClick(item: any) {
    setEditId(item.id)
    setType(item.type)
    setTitle(item.title)
    setMessage(item.message)
    setImageUrl(item.imageUrl || '')
    setActionLabel(item.actionLabel || '')
    setActionUrl(item.actionUrl || '')
    setAudience(item.audience)
    setPriority(item.priority)
    setDismissible(item.dismissible)
    setIsActive(item.isActive)
    setStartsAt(item.startsAt ? new Date(item.startsAt).toISOString().slice(0, 16) : '')
    setEndsAt(item.endsAt ? new Date(item.endsAt).toISOString().slice(0, 16) : '')
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !message) {
      setError('Title and message are required')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      type,
      title,
      message,
      imageUrl,
      actionLabel,
      actionUrl,
      audience,
      priority: Number(priority),
      dismissible,
      isActive,
      startsAt: startsAt ? new Date(startsAt).toISOString() : null,
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
    }

    try {
      const url = editId ? `/api/store-announcements/${editId}` : '/api/store-announcements'
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSuccess(editId ? 'Announcement updated successfully!' : 'Announcement created successfully!')
        resetForm()
        fetchAnnouncements()
      } else {
        const errData = await res.json()
        setError(errData.error || 'Failed to save announcement')
      }
    } catch (err: any) {
      setError(err.message || 'Error saving announcement')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(item: any) {
    try {
      const res = await fetch(`/api/store-announcements/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      if (res.ok) {
        fetchAnnouncements()
      }
    } catch (err) {
      console.error('Error toggling active state:', err)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    try {
      const res = await fetch(`/api/store-announcements/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchAnnouncements()
      }
    } catch (err) {
      console.error('Error deleting announcement:', err)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="border-b border-stone-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-amber-600 uppercase">Customer Engagement</span>
          <h1 className="font-display text-3xl font-bold text-stone-900 mt-1">Storefront Announcements</h1>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Create top banners, promotions, flash sale messages, or welcome overlays for your storefront visitors.
          </p>
        </div>
        <a
          href="/store-portal-jl/dashboard/notifications"
          className="text-xs font-bold text-amber-700 hover:text-amber-800 transition"
        >
          &larr; Back to Notifications Hub
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creator / Editor Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm self-start">
          <h2 className="font-display text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
            <Megaphone size={18} className="text-amber-600" />
            {editId ? 'Edit Announcement' : 'New Announcement'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-lg flex items-center gap-2 border border-red-100">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 text-green-700 text-xs font-medium rounded-lg flex items-center gap-2 border border-green-100">
                <Check size={14} />
                {success}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-none"
              >
                <option value="WELCOME">WELCOME MESSAGE</option>
                <option value="PROMOTION">PROMOTION</option>
                <option value="NEW_PRODUCT">NEW PRODUCT</option>
                <option value="FLASH_SALE">FLASH SALE</option>
                <option value="GENERAL">GENERAL ANNOUNCEMENT</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ✨ NEW ARRIVAL"
                className="w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Describe your offer or message details..."
                className="w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Image URL (Optional)</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Button Label</label>
                <input
                  type="text"
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  placeholder="SHOP NOW"
                  className="w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Button Link</label>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="/products/..."
                  className="w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-none"
                >
                  <option value="ALL">Everyone</option>
                  <option value="VIP">VIP Customers</option>
                  <option value="WHOLESALE">Wholesalers</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Priority</label>
                <input
                  type="number"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  placeholder="0"
                  className="w-full rounded-lg border border-stone-200 bg-white p-2.5 text-xs text-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Starts At</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Ends At</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-white p-2 text-xs text-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dismissible}
                  onChange={(e) => setDismissible(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <span className="text-xs text-stone-700 font-medium">Show close button (X)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                />
                <span className="text-xs text-stone-700 font-bold text-amber-700">Activate Immediately</span>
              </label>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-stone-900 hover:bg-stone-800 px-4 py-2.5 text-xs font-bold text-white shadow transition disabled:opacity-50"
              >
                {saving ? 'SAVING...' : editId ? 'SAVE CHANGES' : 'CREATE'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
                >
                  CANCEL
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Announcements List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-stone-100 pb-2">
            <h2 className="font-display text-lg font-bold text-stone-900">Active & Configured Announcements</h2>
            <span className="text-xs text-stone-400 font-medium">{announcements.length} total</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-stone-400 text-xs font-medium">Loading store announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
              No store announcements created yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-5 border shadow-sm transition flex gap-4 ${
                    item.isActive ? 'border-amber-200/80 bg-amber-50/5' : 'border-stone-200'
                  }`}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-stone-100 text-stone-800 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                        {item.type}
                      </span>
                      <span className="text-[10px] text-stone-400 font-semibold">Priority: {item.priority}</span>
                      <span className="text-[10px] text-stone-400 font-semibold">Target: {item.audience}</span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-stone-900">{item.title}</h3>
                      <p className="text-xs text-stone-600 mt-1 whitespace-pre-wrap">{item.message}</p>
                    </div>

                    {item.imageUrl && (
                      <div className="mt-2 text-[10px] text-stone-400 font-medium truncate max-w-sm">
                        Image: {item.imageUrl}
                      </div>
                    )}

                    {(item.actionLabel || item.actionUrl) && (
                      <div className="flex gap-2 items-center text-[10px] text-amber-700 font-bold bg-amber-50 rounded px-2.5 py-1 w-fit mt-1">
                        CTA: {item.actionLabel || 'Shop Now'} &rarr; {item.actionUrl || '/'}
                      </div>
                    )}

                    {(item.startsAt || item.endsAt) && (
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-medium pt-1">
                        <Calendar size={12} />
                        <span>
                          {item.startsAt ? new Date(item.startsAt).toLocaleString() : 'Anytime'} -{' '}
                          {item.endsAt ? new Date(item.endsAt).toLocaleString() : 'Indefinitely'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between items-end gap-4 border-l border-stone-100 pl-4">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`flex items-center gap-1 rounded px-2.5 py-1.5 text-[10px] font-bold transition ${
                        item.isActive
                          ? 'bg-green-50 text-green-700 hover:bg-green-100/80'
                          : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                      title={item.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {item.isActive ? (
                        <>
                          <Eye size={12} /> ACTIVE
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} /> INACTIVE
                        </>
                      )}
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(item)}
                        className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition"
                        title="Edit"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
