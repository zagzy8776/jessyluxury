'use client'
import { useEffect, useRef, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Upload, CheckCircle, Loader2,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

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
    categoryId: '',
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

  const [size, setSize] = useState('100ml')
  const [concentration, setConcentration] = useState('EDP')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId))
  const [categories, setCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        if (res.ok && Array.isArray(data)) {
          setCategories(data)
          // For a fresh create form (no edit target), default the select to the
          // first real category loaded from the database rather than a hardcoded ID.
          if (!editId && data.length > 0) {
            setForm((f) => {
              if (f.categoryId) return f
              return { ...f, categoryId: String(data[0].id) }
            })
          }
        } else {
          showToast('Failed to load categories', 'error')
        }
      } catch {
        showToast('Failed to load categories', 'error')
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [editId])

  useEffect(() => {
    if (editId) {
      const loadProduct = async () => {
        try {
          const res = await fetch(`/api/products/${editId}`)
          if (!res.ok) {
            showToast('Failed to load product details', 'error')
            setLoadingEdit(false)
            return
          }
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
              categoryId: p.categoryId ? p.categoryId.toString() : '',
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

            const vol = p.volume || '100ml EDP'
            const spaceIdx = vol.indexOf(' ')
            if (spaceIdx !== -1) {
              setSize(vol.slice(0, spaceIdx))
              setConcentration(vol.slice(spaceIdx + 1).trim())
            } else {
              setSize(vol)
              setConcentration('None')
            }

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
    setUploadProgress(0)

    try {
      const fd = new FormData()
      fd.append('file', file)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload', true)

      // Listen to real upload progress events
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(percentage)
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText)
            if (data.url) {
              setUploadProgress(100)
              setForm((f) => ({ ...f, imageUrl: data.url }))
              setImagePreview(data.url)
              showToast('Photo uploaded successfully!')
            } else {
              showToast(data.error || 'Upload failed', 'error')
            }
          } catch {
            showToast('Upload failed parsing response', 'error')
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText)
            showToast(data.error || 'Upload failed', 'error')
          } catch {
            showToast('Upload failed', 'error')
          }
        }
        setUploading(false)
      }

      xhr.onerror = () => {
        showToast('Upload failed. Network error.', 'error')
        setUploading(false)
      }

      xhr.send(fd)
    } catch {
      showToast('Upload execution failed.', 'error')
      setUploading(false)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) handleFileUpload(file)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    if (e) e.preventDefault()
    if (!form.name || !form.price) {
      showToast('Product name and retail price are required', 'error')
      return
    }

    const retail = Number(form.price)
    const cost = form.costPrice === '' ? 0 : Number(form.costPrice)
    const sale = form.salePrice === '' ? null : Number(form.salePrice)
    const stockQty = Number(form.stock)

    if (!Number.isFinite(retail) || retail <= 0) {
      showToast('Retail price must be a positive amount', 'error')
      return
    }
    if (!Number.isFinite(cost) || cost < 0) {
      showToast('Cost price cannot be negative', 'error')
      return
    }
    if (sale !== null && (!Number.isFinite(sale) || sale < 0)) {
      showToast('Sale price cannot be negative', 'error')
      return
    }
    if (sale !== null && sale >= retail) {
      showToast('Sale price must be lower than the retail price', 'error')
      return
    }
    if (!Number.isFinite(stockQty) || stockQty < 0) {
      showToast('Stock quantity cannot be negative', 'error')
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
      volume: `${size.trim()} ${concentration}`.trim(),
      images: form.imageUrl ? [form.imageUrl] : [],
    }

    try {
      let response: Response
      if (editId) {
        response = await fetch(`/api/products/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save product' }))
        showToast(errorData.error || 'Failed to save product', 'error')
        return
      }

      const savedProduct = await response.json()
      if (!savedProduct || !savedProduct.id) {
        showToast('Product saved but no ID returned. Please verify.', 'error')
        return
      }

      showToast(editId ? 'Fragrance updated successfully!' : 'Fragrance added to catalog!')
      setTimeout(() => {
        router.push('/store-portal-jl/dashboard/products')
      }, 1000)
    } catch (error) {
      console.error('Error saving product:', error)
      showToast('Failed to save product. Network error.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Auto profit & margin calculations with boundary guards
  const rPrice = Number(form.price) || 0
  const cPrice = Number(form.costPrice) || 0
  const sPrice = Number(form.salePrice) || 0

  const getMarginValuation = () => {
    const activePrice = sPrice > 0 ? sPrice : rPrice
    
    if (rPrice <= 0) {
      return { text: 'Enter retail price', isError: false, profit: 0, percentage: 0 }
    }
    if (sPrice > 0 && sPrice >= rPrice) {
      return { text: 'Invalid sale price', isError: true, profit: 0, percentage: 0 }
    }
    if (cPrice < 0) {
      return { text: 'Invalid cost price', isError: true, profit: 0, percentage: 0 }
    }
    if (cPrice === 0) {
      return { text: `₦${activePrice.toLocaleString('en-NG')} · 100% margin`, isError: false, profit: activePrice, percentage: 100 }
    }
    if (cPrice > activePrice) {
      return { text: 'Below cost', isError: true, profit: activePrice - cPrice, percentage: 0 }
    }
    
    const profit = activePrice - cPrice
    const pct = Math.round((profit / activePrice) * 100)
    return {
      text: `₦${profit.toLocaleString('en-NG')} · ${pct}% margin`,
      isError: false,
      profit,
      percentage: pct
    }
  }

  const marginVal = getMarginValuation()

  const inp = 'w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-xs outline-none transition placeholder:text-[var(--text-muted)] focus:border-brand-gold font-sans font-medium'
  const lbl = 'block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider'

  if (loadingEdit || loadingCategories) {
    return <div className="py-24 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Loading product editor…</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-2 sm:px-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/store-portal-jl/dashboard/products"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-brand-gold hover:border-brand-gold/45 transition shadow-xs"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-light tracking-tight text-[var(--text-primary)]">
              {editId ? 'Edit Product' : 'Add New Fragrance'}
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Specify fragrance details, pricing margins, stock volumes and visuals.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Section 1: Basic Information */}
        <div className="space-y-4">
          <div className="border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
              Basic Information
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder="e.g. Paris Corner"
                required
                className={inp}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Product Photo */}
        <div className="space-y-4">
          <div className="border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
              Product Photo
            </h3>
          </div>

          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`relative flex flex-col items-center justify-center rounded-lg border border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
              uploading
                ? 'border-brand-gold bg-amber-500/5'
                : imagePreview
                ? 'border-[var(--border)] bg-[var(--bg-primary)]'
                : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-brand-gold'
            }`}
            style={{ minHeight: '180px' }}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2 py-8 w-full max-w-xs px-6">
                <Loader2 size={24} className="text-brand-gold animate-spin" />
                <p className="text-[11px] text-[var(--text-secondary)] font-bold">Uploading image…</p>
                <div className="w-full bg-[var(--border)] h-1 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-brand-gold h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">{uploadProgress}%</p>
              </div>
            ) : imagePreview ? (
              <div className="w-full p-2 space-y-3">
                <img src={imagePreview} alt="Preview" className="h-56 w-full object-cover rounded-md border border-[var(--border)]" />
                <div className="flex items-center justify-between px-1 text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle size={14} /> Image ready
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        fileInputRef.current?.click()
                      }}
                      className="font-bold text-[var(--text-primary)] hover:text-brand-gold transition-colors"
                    >
                      Replace photo
                    </button>
                    <span className="text-[var(--text-muted)] font-light">|</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setForm((f) => ({ ...f, imageUrl: '' }))
                        setImagePreview(null)
                      }}
                      className="font-bold text-red-500 hover:text-red-600 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
                <div className="rounded-lg border border-[var(--border)] p-3 text-[var(--text-secondary)]">
                  <Upload size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)]">Tap to upload photo from phone gallery or camera</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">PNG, JPG, WEBP formats supported</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file)
            }}
          />
        </div>

        {/* Section 3: Pricing & Margin */}
        <div className="space-y-4">
          <div className="border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
              Pricing & Margin
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Retail Price (₦) *</label>
              <input
                type="number"
                min="1"
                step="1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="36000"
                required
                className={`${inp} font-sans font-bold text-[var(--text-primary)]`}
              />
            </div>

            <div>
              <label className={lbl}>Cost Price (₦) [Internal]</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                placeholder="22000"
                className={inp}
              />
            </div>

            <div>
              <label className={lbl}>Sale Price (₦) [Optional]</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.salePrice}
                onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                placeholder="32000"
                className={inp}
              />
            </div>

            {/* Dynamic Profit Calculation Block */}
            <div className="col-span-1 sm:col-span-3 p-3 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                {sPrice > 0 ? 'EXPECTED MARGIN' : 'GROSS MARGIN'}
              </span>
              <span className={`text-xs font-bold tabular-nums ${marginVal.isError ? 'text-red-500 font-bold' : 'text-brand-gold font-bold'}`}>
                {marginVal.text}
              </span>
            </div>
          </div>
        </div>

        {/* Section 4: Stock & Catalog */}
        <div className="space-y-4">
          <div className="border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
              Stock & Catalog
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Stock Quantity *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="10"
                required
                className={`${inp} font-sans font-bold`}
              />
            </div>

            <div>
              <label className={lbl}>Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className={inp}
                required
              >
                {categories.length === 0 ? (
                  <option value="">No categories available</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className={lbl}>Size (Volume)</label>
              <input
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g. 100ml"
                className={inp}
              />
            </div>

            <div>
              <label className={lbl}>Concentration</label>
              <select
                value={concentration}
                onChange={(e) => setConcentration(e.target.value)}
                className={inp}
              >
                <option value="EDP">EDP (Eau de Parfum)</option>
                <option value="EDT">EDT (Eau de Toilette)</option>
                <option value="Extrait">Extrait de Parfum</option>
                <option value="Oil">Perfume Oil</option>
                <option value="None">None</option>
              </select>
            </div>

            <div>
              <label className={lbl}>Storefront Badge</label>
              <select
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
                className={inp}
              >
                <option value="">None</option>
                <option value="BEST">Best Seller</option>
                <option value="NEW">New Arrival</option>
                <option value="LIMITED">Limited Edition</option>
                <option value="SALE">Special Sale</option>
                <option value="OIL">Premium Oil</option>
              </select>
            </div>

            <div>
              <label className={lbl}>Bottle Aesthetic / Color</label>
              <select
                value={form.tone}
                onChange={(e) => setForm({ ...form, tone: e.target.value })}
                className={inp}
              >
                <option value="amber">Amber Glass</option>
                <option value="pistachio">Pistachio Green</option>
                <option value="smoke">Smoke Gray</option>
                <option value="rose">Rose Pink</option>
                <option value="oud">Oud Black</option>
                <option value="fresh">Fresh Blue</option>
                <option value="sweet">Sweet Peach</option>
                <option value="musk">Musk White</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Fragrance Details */}
        <div className="space-y-4">
          <div className="border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
              Fragrance Details
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className={lbl}>Scent Notes Summary</label>
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Pistachio · Gelato · Vanilla"
                className={inp}
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Product Description
                </label>
                <span className="text-[9px] font-mono text-[var(--text-muted)]">
                  {(form.description || '').length} / 500
                </span>
              </div>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the fragrance, longevity, projection and key notes."
                rows={4}
                maxLength={500}
                className={`${inp} resize-none`}
              />
            </div>
          </div>
        </div>

        {/* Section 6: Storefront Visibility */}
        <div className="space-y-4">
          <div className="border-b border-[var(--border)] pb-2">
            <h3 className="text-xs font-bold tracking-[0.2em] text-[var(--text-muted)] uppercase">
              Storefront Promotion
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--border)] text-brand-gold focus:ring-brand-gold accent-brand-gold cursor-pointer"
              />
              <span className="text-xs text-[var(--text-primary)] font-bold">Feature on Homepage</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.gift}
                onChange={(e) => setForm({ ...form, gift: e.target.checked })}
                className="h-4 w-4 rounded border-[var(--border)] text-brand-gold focus:ring-brand-gold accent-brand-gold cursor-pointer"
              />
              <span className="text-xs text-[var(--text-primary)] font-bold">Display in Gift Sets</span>
            </label>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end items-center gap-4 border-t border-[var(--border)] pt-8">
          <Link
            href="/store-portal-jl/dashboard/products"
            className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors uppercase tracking-wider"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-brand-gold px-8 py-3 text-xs font-bold text-stone-950 hover:bg-amber-400 active:scale-[0.98] transition shadow-md shadow-amber-500/5 disabled:opacity-60 flex items-center gap-2 uppercase tracking-wider"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Saving…
              </>
            ) : editId ? (
              'Save Changes →'
            ) : (
              'Add to Catalog →'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-xs font-semibold text-[var(--text-muted)]">Loading form…</div>}>
      <AddProductFormInner />
    </Suspense>
  )
}

