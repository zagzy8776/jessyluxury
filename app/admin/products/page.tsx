'use client'
import { useEffect, useState } from 'react'
import { Package, Plus, Edit2, Trash2, Search, X, Sparkles } from 'lucide-react'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)

  const [form, setForm] = useState({
    name: '',
    brand: '',
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
  })

  useEffect(() => {
    fetchProducts()
  }, [search])

  async function fetchProducts() {
    try {
      const [pRes, cRes] = await Promise.all([
        fetch(`/api/products?search=${encodeURIComponent(search)}`),
        fetch('/api/products'), // placeholder or categories endpoint
      ])
      const pData = await pRes.json()
      if (Array.isArray(pData)) setProducts(pData)
    } catch (e) {
      console.error('Failed fetching products', e)
    } finally {
      setLoading(false)
    }
  }

  function handleOpenModal(p?: any) {
    if (p) {
      setEditingProduct(p)
      setForm({
        name: p.name,
        brand: p.brand,
        price: p.price.toString(),
        salePrice: p.salePrice ? p.salePrice.toString() : '',
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
        imageUrl: p.images && p.images.length > 0 ? p.images[0] : '',
      })
    } else {
      setEditingProduct(null)
      setForm({
        name: '',
        brand: 'Jessy Selection',
        price: '35000',
        salePrice: '',
        badge: 'NEW',
        categoryId: '1',
        volume: '100ml EDP',
        notes: 'Amber · Musk · Vanilla',
        topNotes: '',
        middleNotes: '',
        baseNotes: '',
        description: '',
        tone: 'amber',
        stock: '10',
        featured: true,
        gift: false,
        imageUrl: '',
      })
    }
    setShowModal(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.price) return

    const payload = {
      ...form,
      images: form.imageUrl ? [form.imageUrl] : [],
    }

    try {
      if (editingProduct) {
        await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      setShowModal(false)
      fetchProducts()
    } catch (err) {
      console.error('Error saving product', err)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      fetchProducts()
    } catch (err) {
      console.error('Error deleting product', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-50">Catalog &amp; Inventory Manager</h1>
          <p className="mt-1 text-sm text-stone-400">
            Add new fragrances, update prices, manage stock, and edit scent notes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-60">
            <Search size={16} className="absolute left-3 top-3 text-stone-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search catalog..."
              className="w-full rounded-xl border border-stone-800 bg-stone-900 py-2.5 pl-9 pr-4 text-xs text-stone-200 outline-none transition placeholder:text-stone-600 focus:border-amber-500"
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

      {loading ? (
        <div className="py-20 text-center text-sm text-stone-500">Loading catalog…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-800 bg-stone-900/60 p-4 transition hover:border-amber-500/40"
            >
              <div>
                <div className="relative aspect-square rounded-xl bg-stone-950 overflow-hidden flex items-center justify-center mb-3">
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <Sparkles className="mx-auto text-amber-400 mb-1" size={24} />
                      <span className="text-[10px] text-stone-500">Bottle Art Vector</span>
                    </div>
                  )}
                  {p.badge && (
                    <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-stone-950">
                      {p.badge}
                    </span>
                  )}
                </div>

                <p className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                  {p.brand} • {p.volume}
                </p>
                <h3 className="font-display text-lg font-medium text-stone-100">{p.name}</h3>
                <p className="text-xs text-stone-400 line-clamp-1">{p.notes}</p>

                <div className="mt-2 flex items-center justify-between border-t border-stone-800/80 pt-2 text-xs">
                  <span className="font-semibold text-amber-300">₦{p.price?.toLocaleString('en-NG')}</span>
                  <span className={`font-mono text-[11px] ${p.stock < 3 ? 'text-red-400 font-bold' : 'text-stone-400'}`}>
                    Stock: {p.stock}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 border-t border-stone-800/80 pt-3">
                <button
                  onClick={() => handleOpenModal(p)}
                  className="inline-flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:text-white transition"
                >
                  <Edit2 size={13} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600/10 border border-red-600/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-600 hover:text-white transition"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Product Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-stone-800 bg-stone-950 p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <h3 className="font-display text-xl text-stone-100">
                {editingProduct ? 'Edit Fragrance' : 'Add New Fragrance'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Product Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Khair Pistachio"
                    required
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Brand</label>
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    placeholder="e.g. Paris Corner or Lattafa"
                    required
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Price (₦)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="36000"
                    required
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Sale Price (₦) [Optional]</label>
                  <input
                    type="number"
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    placeholder="32000"
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Stock Qty</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    placeholder="10"
                    required
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Badge</label>
                  <select
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  >
                    <option value="">None</option>
                    <option value="BEST">BEST</option>
                    <option value="NEW">NEW</option>
                    <option value="SALE">SALE</option>
                    <option value="OIL">OIL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  >
                    <option value="1">Oud & Amber</option>
                    <option value="2">Fresh</option>
                    <option value="3">Sweet & Gourmand</option>
                    <option value="4">Perfume Oils</option>
                    <option value="5">Gift Sets</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Volume / Size</label>
                  <input
                    value={form.volume}
                    onChange={(e) => setForm({ ...form, volume: e.target.value })}
                    placeholder="100ml EDP"
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">Main Scent Notes Summary</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Pistachio · Cream · Vanilla"
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Top Notes</label>
                  <input
                    value={form.topNotes}
                    onChange={(e) => setForm({ ...form, topNotes: e.target.value })}
                    placeholder="Italian Bergamot, Gelato"
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Middle Notes</label>
                  <input
                    value={form.middleNotes}
                    onChange={(e) => setForm({ ...form, middleNotes: e.target.value })}
                    placeholder="Peony, White Peach"
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-medium">Base Notes</label>
                  <input
                    value={form.baseNotes}
                    onChange={(e) => setForm({ ...form, baseNotes: e.target.value })}
                    placeholder="Whipped Cream, Tonka Bean"
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">Photo Image URL</label>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-medium">Full Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Write a rich description of how this fragrance wears..."
                  rows={3}
                  className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={form.featured}
                    onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                    className="h-4 w-4 rounded border-stone-800 bg-stone-900 text-amber-500"
                  />
                  <label htmlFor="featured" className="text-stone-300">Feature on Homepage</label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="gift"
                    checked={form.gift}
                    onChange={(e) => setForm({ ...form, gift: e.target.checked })}
                    className="h-4 w-4 rounded border-stone-800 bg-stone-900 text-amber-500"
                  />
                  <label htmlFor="gift" className="text-stone-300">Show in Gift Sets</label>
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
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
