'use client'
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Upload, CheckCircle, Loader2, ImageIcon, Plus, Sparkles, X,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

const CATEGORIES = [
  { id: 1, name: 'Oud & Amber' },
  { id: 2, name: 'Fresh & Floral' },
  { id: 3, name: 'Sweet & Gourmand' },
  { id: 4, name: 'Perfume Oils' },
  { id: 5, name: 'Gift Sets' },
]

function AddProductFormInner() {
  const params = useSearchParams()
  const router = useRouter()
  const editId = params.get('edit')
  const { toast, showToast, clearToast } = useToast()

  const [form, setForm] = useState({
    name: '',
    brand: 'Jessy Selection',
    price: '',
    salePrice: '',
    costPrice: '',
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
  })

  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId))
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editId) {
      const loadProduct = async () => {
        try {
          const res = await fetch(`/api/products/${editId}`)
          const p = await res.json()
          if (p && p.id) {
            const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : ''
            setForm({
              name: p.name || '',
              brand: p.brand || 'Jessy Selection',
              price: p.price ? p.price.toString() : '',
              salePrice: p.salePrice ? p.salePrice.toString() : '',
              costPrice: p.costPrice ? p.costPrice.toString() : '',
              badge: p.badge || '',
              categoryId: p.categoryId ? p.categoryId.toString() : '1',
              volume: p.volume || '100ml EDP',
              notes: p.notes || '',
              topNotes: p.topNotes || '',
              middleNotes: p.middleNotes || '',
              baseNotes: p.baseNotes || '',
              description: p.description || '',
              tone: p.tone || 'amber',
              stock: p.stock ? p.stock.toString() : '10',
              featured: p.featured || false,
              gift: p.gift || false,
              imageUrl: img,
            })
            setImagePreview(img || null)
          }
        } catch {
          showToast('Failed to load product details', 'error')
        } finally {
          setLoadingEdit(false)
        }
      }
      loadProduct()
    }
  }, [editId])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price) {
      showToast('Product name and retail price are required', 'error')
      return
    }
    setSaving(true)

    const payload = {
      ...form,
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      costPrice: form.costPrice ? Number(form.costPrice) : 0,
      stock: Number(form.stock) || 0,
      categoryId: Number(form.categoryId),
      images: form.imageUrl ? [form.imageUrl] : [],
    }

    try {
      if (editId) {
        await fetch(`/api/products/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        showToast('Fragrance updated successfully!')
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        showToast('Fragrance added to catalog!')
      }
      setTimeout(() => {
        router.push('/store-portal-jl/dashboard/products')
      }, 1000)
    } catch {
      showToast('Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Auto profit calculation
  const retailPrice = Number(form.price) || 0
  const costPrice = Number(form.costPrice) || 0
  const profitMargin = retailPrice > 0 && costPrice > 0 ? Math.round(((retailPrice - costPrice) / retailPrice) * 100) : 0

  const inp = 'w-full rounded-xl border border-stone-800 bg-stone-900 p-3.5 text-stone-200 text-xs outline-none transition placeholder:text-stone-600 focus:border-amber-500 font-sans'
  const lbl = 'block text-[11px] font-semibold text-stone-400 mb-1.5 uppercase tracking-wider'

  if (loadingEdit) {
    return <div className="py-24 text-center text-sm text-stone-500 animate-pulse">Loading product editor…</div>
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/store-portal-jl/dashboard/products"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-800 bg-stone-900 text-stone-400 hover:text-white transition"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-medium text-stone-50">
              {editId ? 'Edit Product Listing' : 'Add New Fragrance Listing'}
            </h1>
            <p className="text-xs text-stone-400">
              Fill in product info, cost valuation, collection tags, and photo upload.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : 'Save Fragrance'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload Section */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 shadow-xl backdrop-blur-xl space-y-3">
          <label className={lbl}>Product Photo (Cloudinary)</label>
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition cursor-pointer overflow-hidden ${
              uploading
                ? 'border-amber-500/60 bg-amber-500/5'
                : imagePreview
                ? 'border-emerald-500/40 bg-stone-900'
                : 'border-stone-700 bg-stone-900/60 hover:border-amber-500/50 hover:bg-stone-900'
            }`}
            style={{ minHeight: '200px' }}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 size={36} className="text-amber-400 animate-spin" />
                <p className="text-sm text-amber-400 font-medium">Uploading to Cloudinary…</p>
              </div>
            ) : imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="h-56 w-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                  <p className="text-white text-sm font-semibold flex items-center gap-2">
                    <Upload size={18} /> Change Photo
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
                <div className="rounded-full bg-stone-800 p-4 border border-stone-700">
                  <Upload size={24} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-200">Tap to upload photo from phone gallery or camera</p>
                  <p className="text-xs text-stone-500 mt-1">PNG, JPG, WEBP formats supported</p>
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
            <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle size={14} /> Cloudinary image active — will display on customer storefront
            </p>
          )}
        </div>

        {/* General Info */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 shadow-xl backdrop-blur-xl space-y-4">
          <h2 className="text-sm font-semibold text-stone-200 border-b border-stone-800 pb-3">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Product Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Khair Pistachio"
                required
                className={inp}
              />
            </div>
            <div>
              <label className={lbl}>Brand / Supplier *</label>
              <input
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="e.g. Paris Corner / Lattafa"
                required
                className={inp}
              />
            </div>
          </div>
        </div>

        {/* Valuation & Pricing */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h2 className="text-sm font-semibold text-stone-200">Pricing & Profit Margin Valuation</h2>
            {profitMargin > 0 && (
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-400 font-mono">
                {profitMargin}% Estimated Profit Margin
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Retail Price (₦) *</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="36000"
                required
                className={`${inp} font-mono font-bold text-amber-300`}
              />
            </div>

            <div>
              <label className={lbl}>Cost Price (₦) [Internal]</label>
              <input
                type="number"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                placeholder="22000"
                className={`${inp} font-mono text-stone-300`}
              />
            </div>

            <div>
              <label className={lbl}>Sale Price (₦) [Optional]</label>
              <input
                type="number"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                placeholder="32000"
                className={`${inp} font-mono text-emerald-300`}
              />
            </div>
          </div>
        </div>

        {/* Inventory & Collection Tagging */}
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 shadow-xl backdrop-blur-xl space-y-4">
          <h2 className="text-sm font-semibold text-stone-200 border-b border-stone-800 pb-3">Stock & Collection Setup</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Stock Quantity *</label>
              <input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="10"
                required
                className={`${inp} font-mono`}
              />
            </div>

            <div>
              <label className={lbl}>Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className={inp}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={lbl}>Volume / Size</label>
              <input
                value={form.volume}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
                placeholder="100ml EDP"
                className={inp}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className={lbl}>Badge Tag</label>
              <select
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                className={inp}
              >
                <option value="">None</option>
                <option value="BEST">BEST</option>
                <option value="NEW">NEW</option>
                <option value="SALE">SALE</option>
                <option value="OIL">OIL</option>
              </select>
            </div>

            <div>
              <label className={lbl}>Scent Notes Summary</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Pistachio · Gelato · Vanilla"
                className={inp}
              />
            </div>
          </div>

          <div>
            <label className={lbl}>Full Product Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Write a rich description of scent longevity, projection, and notes…"
              rows={3}
              className={`${inp} resize-none`}
            />
          </div>

          <div className="flex gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="h-4 w-4 rounded border-stone-700 bg-stone-900 accent-amber-500"
              />
              <span className="text-xs text-stone-300 font-medium">Feature on Storefront Homepage</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.gift}
                onChange={(e) => setForm({ ...form, gift: e.target.checked })}
                className="h-4 w-4 rounded border-stone-700 bg-stone-900 accent-amber-500"
              />
              <span className="text-xs text-stone-300 font-medium">Display in Gift Sets Category</span>
            </label>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex justify-end gap-3 border-t border-stone-800 pt-4">
          <Link
            href="/store-portal-jl/dashboard/products"
            className="rounded-xl border border-stone-800 px-5 py-2.5 text-xs font-semibold text-stone-400 hover:text-white transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-amber-500 px-7 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-lg disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Fragrance Listing'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-sm text-stone-500">Loading form…</div>}>
      <AddProductFormInner />
    </Suspense>
  )
}
