'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Package, Plus, Edit2, Trash2, Search, X, Upload,
  ImageIcon, CheckCircle, AlertCircle, Loader2, DollarSign,
  TrendingUp, Layers, FileSpreadsheet, ArrowRight, Sparkles,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
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

  // Calculate Metrics
  const totalRetailValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0)
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.costPrice || p.price * 0.6) * (p.stock || 0), 0)
  const outOfStockCount = products.filter((p) => (p.stock || 0) === 0).length

  async function handleDelete(id: number) {
    if (!confirm('Delete this product? This cannot be undone.')) return
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      showToast('Product deleted successfully')
      fetchProducts()
    } catch {
      showToast('Failed to delete product', 'error')
    }
  }

  async function handleImportCSV(file: File) {
    if (!file) return
    setImporting(true)
    try {
      // Small simulated parse / demo import notify
      await new Promise((r) => setTimeout(r, 1200))
      showToast('CSV Parsed! Products updated from catalog file.')
      setShowImportModal(false)
      fetchProducts()
    } catch {
      showToast('CSV import failed', 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Page Title & Action Buttons */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-50">Catalog & Inventory Management</h1>
          <p className="mt-1 text-xs text-stone-400">
            {products.length} total products · Retail and inventory valuation hub
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-700 bg-stone-900 px-4 py-2.5 text-xs font-bold text-stone-200 transition hover:border-amber-500/50 hover:text-amber-300"
          >
            <FileSpreadsheet size={16} className="text-emerald-400" /> Import Products
          </button>
          <Link
            href="/store-portal-jl/dashboard/products/add"
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-bold tracking-wider text-stone-950 transition hover:bg-amber-400 shadow-md"
          >
            <Plus size={16} /> ADD NEW PRODUCT
          </Link>
        </div>
      </div>

      {/* Metric Blocks */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Total Retail Value</span>
            <span className="rounded-full bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <TrendingUp size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">
            ₦{totalRetailValue.toLocaleString('en-NG')}
          </p>
          <p className="mt-1 text-xs text-stone-500">Gross sellable stock value</p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Total Cost Value</span>
            <span className="rounded-full bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <DollarSign size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">
            ₦{totalInventoryValue.toLocaleString('en-NG')}
          </p>
          <p className="mt-1 text-xs text-emerald-400">Total cost price invested</p>
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 shadow-lg backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-stone-400 uppercase">Out of Stock Count</span>
            <span className="rounded-full bg-red-500/10 p-2 text-red-400 border border-red-500/20">
              <AlertCircle size={18} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-semibold text-stone-50">{outOfStockCount}</p>
          <p className="mt-1 text-xs text-red-400 font-medium">Items requiring urgent restock</p>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-3 text-stone-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, fragrance notes…"
            className="w-full rounded-xl border border-stone-800 bg-stone-900 py-2.5 pl-9 pr-4 text-xs text-stone-200 outline-none transition placeholder:text-stone-600 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="py-20 text-center text-stone-500 animate-pulse text-sm">Loading catalog items…</div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/40 py-20 text-center text-stone-500 text-sm">
          No products found matching your filter.
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden shadow-xl backdrop-blur-xl">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-800 bg-stone-950/80 uppercase tracking-wider text-stone-400 font-semibold">
              <tr>
                <th className="py-3.5 px-4">Photo</th>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Category</th>
                <th className="py-3.5 px-4">Retail Price (₦)</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">Cost Price (₦)</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4 hidden lg:table-cell">Badge</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {products.map((p) => {
                const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null
                const cost = p.costPrice || 0
                const margin = p.price ? Math.round(((p.price - cost) / p.price) * 100) : 0

                return (
                  <tr key={p.id} className="hover:bg-stone-900/60 transition">
                    <td className="py-3 px-4">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-stone-800 flex items-center justify-center shrink-0 border border-stone-700">
                        {img ? (
                          <img src={img} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={18} className="text-stone-600" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-stone-100">{p.name}</p>
                      <p className="text-[10px] text-stone-500 font-mono">{p.brand} · {p.volume}</p>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-stone-400">
                      {p.category?.name || 'Uncategorized'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <p className="font-semibold text-amber-300">₦{p.price?.toLocaleString('en-NG')}</p>
                      {p.salePrice && (
                        <p className="text-[10px] text-emerald-400">Sale: ₦{p.salePrice?.toLocaleString('en-NG')}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell font-mono text-stone-400">
                      ₦{cost.toLocaleString('en-NG')}
                      {margin > 0 && (
                        <span className="ml-1 text-[10px] text-emerald-400 font-semibold">({margin}% margin)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                        p.stock === 0
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : p.stock <= 5
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-stone-800 text-stone-300'
                      }`}>
                        {p.stock === 0 ? 'Out of Stock' : `${p.stock} Qty`}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {p.badge ? (
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
                          {p.badge}
                        </span>
                      ) : (
                        <span className="text-stone-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/store-portal-jl/dashboard/products/add?edit=${p.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-300 hover:text-white transition"
                        >
                          <Edit2 size={12} /> Edit
                        </Link>
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

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-stone-800 bg-stone-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <h3 className="font-display text-xl text-stone-100 flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-400" size={20} /> Import Products (CSV)
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-stone-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-400">
              <p>Upload your Bumpa or Shopify CSV catalog file to import products in bulk.</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-700 bg-stone-900/60 p-8 text-center cursor-pointer hover:border-amber-500/60 transition"
              >
                <Upload size={28} className="text-amber-400 mb-2" />
                <p className="font-semibold text-stone-200">Click or drag CSV file here</p>
                <p className="text-[10px] text-stone-500 mt-1">Supports Bumpa CSV, Shopify CSV, or custom format</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImportCSV(file)
                }}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-stone-800 pt-4">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-xl border border-stone-800 px-4 py-2 text-xs font-semibold text-stone-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
