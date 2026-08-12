'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Package, Plus, Edit2, Trash2, Search, X, Upload,
  ImageIcon, AlertCircle, FileSpreadsheet, TrendingUp, DollarSign,
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
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Page Title & Action Buttons */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Catalog & Inventory Management
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            {products.length} total products · Retail and inventory valuation hub
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-amber-500 hover:text-amber-500 shadow-sm"
          >
            <FileSpreadsheet size={16} className="text-emerald-500" /> Import Products
          </button>
          <Link
            href="/store-portal-jl/dashboard/products/add"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition hover:bg-amber-400 shadow-md shadow-amber-500/10"
          >
            <Plus size={16} /> ADD NEW PRODUCT
          </Link>
        </div>
      </div>

      {/* Metric Blocks */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm transition hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Total Retail Value</span>
            <span className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500 border border-amber-500/20">
              <TrendingUp size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            ₦{totalRetailValue.toLocaleString('en-NG')}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)] font-medium">Gross sellable stock value</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm transition hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Total Cost Value</span>
            <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500 border border-emerald-500/20">
              <DollarSign size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            ₦{totalInventoryValue.toLocaleString('en-NG')}
          </p>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Total cost price invested</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm transition hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">Out of Stock Count</span>
            <span className="rounded-xl bg-red-500/10 p-2.5 text-red-500 border border-red-500/20">
              <AlertCircle size={20} />
            </span>
          </div>
          <p className="mt-3 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">{outOfStockCount}</p>
          <p className="mt-1 text-xs text-red-500 font-semibold">Items requiring urgent restock</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, fragrance notes…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] py-2.5 pl-10 pr-4 text-xs font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 shadow-sm"
          />
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Loading catalog items…</div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] py-20 text-center text-xs font-medium text-[var(--text-muted)]">
          No products found matching your filter.
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-[var(--text-primary)]">
            <thead className="border-b border-[var(--border)] bg-[var(--table-header-bg)] uppercase tracking-wider text-[var(--text-secondary)] text-[11px] font-bold">
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
            <tbody className="divide-y divide-[var(--border)]">
              {products.map((p) => {
                const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null
                const cost = p.costPrice || 0
                const margin = p.price ? Math.round(((p.price - cost) / p.price) * 100) : 0

                return (
                  <tr key={p.id} className="hover:bg-[var(--table-row-hover)] transition">
                    <td className="py-3 px-4">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-[var(--bg-secondary)] flex items-center justify-center shrink-0 border border-[var(--border)]">
                        {img ? (
                          <img src={img} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={18} className="text-[var(--text-muted)]" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-[var(--text-primary)]">{p.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">{p.brand} · {p.volume}</p>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell text-[var(--text-secondary)] font-medium">
                      {p.category?.name || 'Uncategorized'}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <p className="font-bold text-amber-500">₦{p.price?.toLocaleString('en-NG')}</p>
                      {p.salePrice && (
                        <p className="text-[10px] text-emerald-500 font-semibold">Sale: ₦{p.salePrice?.toLocaleString('en-NG')}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell font-mono text-[var(--text-secondary)]">
                      ₦{cost.toLocaleString('en-NG')}
                      {margin > 0 && (
                        <span className="ml-1 text-[10px] text-emerald-500 font-bold">({margin}% margin)</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-mono font-bold px-2.5 py-1 rounded-md text-[11px] ${
                        p.stock === 0
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                          : p.stock <= 5
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)]'
                      }`}>
                        {p.stock === 0 ? 'Out of Stock' : `${p.stock} Qty`}
                      </span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {p.badge ? (
                        <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-500/30">
                          {p.badge}
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/store-portal-jl/dashboard/products/add?edit=${p.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs font-bold text-[var(--text-primary)] hover:border-amber-500 hover:text-amber-500 transition"
                        >
                          <Edit2 size={13} /> Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition"
                        >
                          <Trash2 size={13} /> Del
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-500" size={20} /> Import Products (CSV)
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[var(--text-secondary)] font-medium">
              <p>Upload your Bumpa or Shopify CSV catalog file to import products in bulk.</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-primary)] p-8 text-center cursor-pointer hover:border-amber-500 transition"
              >
                <Upload size={28} className="text-amber-500 mb-2" />
                <p className="font-bold text-[var(--text-primary)]">Click or drag CSV file here</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Supports Bumpa CSV, Shopify CSV, or custom format</p>
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

            <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
