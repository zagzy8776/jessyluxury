'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Package, Plus, Edit2, Trash2, Search, X, Upload,
  ImageIcon, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

const CATEGORIES = [
  { id: 1, name: 'Oud & Amber' },
  { id: 2, name: 'Fresh & Floral' },
  { id: 3, name: 'Sweet & Gourmand' },
  { id: 4, name: 'Perfume Oils' },
  { id: 5, name: 'Gift Sets' },
]

const EMPTY_FORM = {
  name: '',
  brand: 'Jessy Selection',
  price: '',
  salePrice: '',
  badge: '',
  categoryId: '1',
  volume: '100ml EDP',
  notes: '',
  topNotes: '',
  middleNotes: '',
  baseNotes: '',
  description: '',
  tone: 'amber',
  stock: '10',
  featured: false,
  gift: false,
  imageUrl: '',
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast, showToast, clearToast } = useToast()

  useEffect(() => { fetchProducts() }, [search])

  async function fetchProducts() {
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      if (Array.isArray(data)) setProducts(data)
    } catch { showToast('Failed to load products', 'error') }
    finally { setLoading(false) }
  }

  function handleOpenModal(p?: any) {
    if (p) {
      setEditingProduct(p)
      const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : ''
      setForm({
        name: p.name, brand: p.brand, price: p.price.toString(),
        salePrice: p.salePrice ? p.salePrice.toString() : '',
        badge: p.badge || '', categoryId: p.categoryId ? p.categoryId.toString() : '1',
        volume: p.volume || '100ml EDP', notes: p.notes || '',
        topNotes: p.topNotes || '', middleNotes: p.middleNotes || '',
        baseNotes: p.baseNotes || '', description: p.description || '',
        tone: p.tone || 'amber', stock: p.stock ? p.stock.toString() : '10',
        featured: p.featured || false, gift: p.gift || false, imageUrl: img,
      })
      setImagePreview(img || null)
    } else {
      setEditingProduct(null)
      setForm({ ...EMPTY_FORM })
      setImagePreview(null)
    }
    setShowModal(true)
  }

  async function handleFileUpload(file: File) {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setForm((f) => ({ ...f, imageUrl: data.url }))
        setImagePreview(data.url)
        showToast('Photo uploaded successfully!')
      } else {
        showToast(data.error || 'Upload failed', 'error')
      }
    } catch {
      showToast('Upload failed. Check Cloudinary settings.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFileUpload(file)
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price) return
    setSaving(true)
    try {
      const payload = { ...form, images: form.imageUrl ? [form.imageUrl] : [] }
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        showToast('Product updated!')
      } else {
        await fetch('/api/products', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        showToast('Product added to catalog!')
      }
      setShowModal(false)
      fetchProducts()
    } catch {
      showToast('Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      showToast('Product deleted')
      fetchProducts()
    } catch {
      showToast('Failed to delete product', 'error')
    }
  }

  const inp = 'w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 text-xs outline-none transition placeholder:text-stone-600 focus:border-amber-500'
  const lbl = 'block text-[11px] font-semibold text-stone-400 mb-1 uppercase tracking-wider'

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-50">Catalog & Products</h1>
          <p className="mt-1 text-sm text-stone-400">
            {products.length} products · Upload photos from your phone
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search size={15} className="absolute left-3 top-2.5 text-stone-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog…"
              className="w-full rounded-xl border border-stone-800 bg-stone-900 py-2 pl-9 pr-4 text-xs text-stone-200 outline-none transition focus:border-amber-500"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 shrink-0 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-bold tracking-wider text-stone-950 transition hover:bg-amber-400"
          >
            <Plus size={16} /> ADD PRODUCT
          </button>
        </div>
      </div>

      {/* Compact Table */}
      {loading ? (
        <div className="py-20 text-center text-stone-500 animate-pulse text-sm">Loading catalog…</div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/40 py-20 text-center text-stone-500 text-sm">
          No products yet. Click <strong className="text-amber-400">ADD PRODUCT</strong> to get started.
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-800 bg-stone-950/80 uppercase tracking-wider text-stone-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Photo</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 hidden md:table-cell">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4 hidden sm:table-cell">Stock</th>
                <th className="py-3 px-4 hidden lg:table-cell">Badge</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {products.map((p) => {
                const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null
                return (
                  <tr key={p.id} className="hover:bg-stone-900/60 transition">
                    <td className="py-3 px-4">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-stone-800 flex items-center justify-center shrink-0">
                        {img ? (
                          <img src={img} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={18} className="text-stone-600" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-stone-100">{p.name}</p>
                      <p className="text-[10px] text-stone-500">{p.brand} · {p.volume}</p>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-stone-400">
                      {p.category?.name || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-amber-300">₦{p.price?.toLocaleString('en-NG')}</p>
                      {p.salePrice && (
                        <p className="text-[10px] text-green-400">Sale: ₦{p.salePrice?.toLocaleString('en-NG')}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <span className={`font-mono font-bold ${p.stock < 3 ? 'text-red-400' : 'text-stone-300'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {p.badge ? (
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          {p.badge}
                        </span>
                      ) : (
                        <span className="text-stone-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:text-white transition"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600/10 border border-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600 hover:text-white transition"
                        >
                          <Trash2 size={12} /> Del
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-stone-800 bg-stone-950 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-800 p-6 pb-4">
              <h3 className="font-display text-xl text-stone-100">
                {editingProduct ? 'Edit Fragrance' : 'Add New Fragrance'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Image Upload Section */}
              <div>
                <label className={lbl}>Product Photo</label>
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition cursor-pointer overflow-hidden ${
                    uploading
                      ? 'border-amber-500/60 bg-amber-500/5'
                      : imagePreview
                      ? 'border-green-500/40 bg-stone-900'
                      : 'border-stone-700 bg-stone-900/60 hover:border-amber-500/50 hover:bg-stone-900'
                  }`}
                  style={{ minHeight: '180px' }}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3 py-8">
                      <Loader2 size={32} className="text-amber-400 animate-spin" />
                      <p className="text-sm text-amber-400 font-medium">Uploading to Cloudinary…</p>
                    </div>
                  ) : imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="h-48 w-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                        <p className="text-white text-sm font-semibold flex items-center gap-2">
                          <Upload size={18} /> Change Photo
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
                      <div className="rounded-full bg-stone-800 p-4">
                        <Upload size={24} className="text-stone-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-300">Tap to upload from phone</p>
                        <p className="text-xs text-stone-500 mt-1">or drag & drop · JPG, PNG, WEBP</p>
                      </div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(file)
                  }}
                />
                {imagePreview && !uploading && (
                  <p className="mt-2 text-[11px] text-green-400 flex items-center gap-1">
                    <CheckCircle size={12} /> Photo saved — will show on storefront
                  </p>
                )}
              </div>

              {/* Name + Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Product Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Khair Pistachio" required className={inp} />
                </div>
                <div>
                  <label className={lbl}>Brand *</label>
                  <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. Lattafa" required className={inp} />
                </div>
              </div>

              {/* Price + Sale Price + Stock */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Price (₦) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="36000" required className={`${inp} font-mono`} />
                </div>
                <div>
                  <label className={lbl}>Sale Price (₦)</label>
                  <input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    placeholder="Optional" className={`${inp} font-mono`} />
                </div>
                <div>
                  <label className={lbl}>Stock Qty</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="10" required className={`${inp} font-mono`} />
                </div>
              </div>

              {/* Badge + Category + Volume */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Badge</label>
                  <select value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} className={inp}>
                    <option value="">None</option>
                    <option value="BEST">BEST</option>
                    <option value="NEW">NEW</option>
                    <option value="SALE">SALE</option>
                    <option value="OIL">OIL</option>
                  </select>
                </div>
                <div>
                  <label className={lbl}>Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inp}>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Volume / Size</label>
                  <input value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })}
                    placeholder="100ml EDP" className={inp} />
                </div>
              </div>

              {/* Scent Notes Summary */}
              <div>
                <label className={lbl}>Scent Notes Summary</label>
                <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Pistachio · Cream · Vanilla" className={inp} />
              </div>

              {/* Top / Middle / Base Notes */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={lbl}>Top Notes</label>
                  <input value={form.topNotes} onChange={(e) => setForm({ ...form, topNotes: e.target.value })}
                    placeholder="Bergamot, Gelato" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Middle Notes</label>
                  <input value={form.middleNotes} onChange={(e) => setForm({ ...form, middleNotes: e.target.value })}
                    placeholder="Peony, Peach" className={inp} />
                </div>
                <div>
                  <label className={lbl}>Base Notes</label>
                  <input value={form.baseNotes} onChange={(e) => setForm({ ...form, baseNotes: e.target.value })}
                    placeholder="Musk, Vanilla" className={inp} />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={lbl}>Full Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe how this fragrance wears on the skin…"
                  rows={3} className={`${inp} resize-none`} />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="h-4 w-4 rounded border-stone-700 bg-stone-900 accent-amber-500" />
                  <span className="text-xs text-stone-300">Feature on Homepage</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.gift} onChange={(e) => setForm({ ...form, gift: e.target.checked })}
                    className="h-4 w-4 rounded border-stone-700 bg-stone-900 accent-amber-500" />
                  <span className="text-xs text-stone-300">Show in Gift Sets</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-stone-800 pt-5">
                <button type="button" onClick={() => setShowModal(false)}
                  className="rounded-xl border border-stone-800 px-5 py-2.5 text-sm font-semibold text-stone-400 hover:text-white transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-stone-950 hover:bg-amber-400 transition disabled:opacity-60 flex items-center gap-2">
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
