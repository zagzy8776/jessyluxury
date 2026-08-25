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

  useEffect(() => {
    // Debounce so typing does not fire a network request per keystroke.
    const timer = setTimeout(() => {
      fetchProducts()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

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
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete product' }))
        showToast(errorData.error || 'Failed to delete product', 'error')
        return
      }

      showToast('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      console.error('Delete error:', error)
      showToast('Failed to delete product. Network error.', 'error')
    }
  }

  async function handleImportCSV(file: File) {
    if (!file) return
    setImporting(true)
    try {
      // Send the raw CSV text. The /api/products/import handler parses the body
      // as CSV text directly (not multipart), so FormData would break parsing.
      const csvText = await file.text()

      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv; charset=utf-8' },
        body: csvText,
      })

      let result: any = {}
      try { result = await response.json() } catch {}

      // 207 = partial import (some rows failed validation).
      if (!response.ok && response.status !== 207) {
        showToast(result.error || 'CSV import failed', 'error')
        return
      }

      const created = Number(result.created ?? 0)
      const updated = Number(result.updated ?? 0)
      const errors = Array.isArray(result.errors) ? result.errors : []

      if (errors.length > 0) {
        showToast(
          `Imported ${created} product(s) (${updated} updated) with ${errors.length} row error(s). ${errors[0] ?? ''}`,
          'error'
        )
      } else {
        showToast(`CSV imported successfully! ${created} product(s) created, ${updated} updated.`)
      }
      setShowImportModal(false)
      fetchProducts()
    } catch (error) {
      console.error('Import error:', error)
      showToast('CSV import failed. Network error.', 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Inventory</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Catalog & Stock</h1>
          <p className="mt-1 text-xs font-medium text-[var(--admin-text-secondary)]">
            {products.length} total products · Retail and inventory valuation hub
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] px-4 py-2.5 text-xs font-bold transition hover:border-emerald-500 hover:text-emerald-600"
          >
            <FileSpreadsheet size={15} className="text-emerald-500" /> Import CSV
          </button>
          <Link
            href="/store-portal-jl/dashboard/products/add"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)]"
          >
            <Plus size={15} /> Add Product
          </Link>
        </div>
      </div>

      {/* Metric blocks */}
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="admin-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Retail Value</span>
            <span className="rounded-lg bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
              <TrendingUp size={16} />
            </span>
          </div>
          <p className="mt-2.5 font-display text-xl font-bold tabular-nums sm:text-2xl">
            ₦{totalRetailValue.toLocaleString('en-NG')}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--admin-text-muted)]">Gross sellable stock value</p>
        </div>

        <div className="admin-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Cost Value</span>
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="mt-2.5 font-display text-xl font-bold tabular-nums sm:text-2xl">
            ₦{totalInventoryValue.toLocaleString('en-NG')}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-emerald-600">Total cost price invested</p>
        </div>

        <div className="admin-card p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Out of Stock</span>
            <span className={`rounded-lg p-2 ${outOfStockCount > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-600'}`}>
              <AlertCircle size={16} />
            </span>
          </div>
          <p className="mt-2.5 font-display text-xl font-bold tabular-nums sm:text-2xl">{outOfStockCount}</p>
          <p className={`mt-0.5 text-[11px] font-medium ${outOfStockCount > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {outOfStockCount > 0 ? 'Items requiring urgent restock' : 'All stock levels healthy'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, brand, fragrance notes…"
          className="admin-input pl-9 font-medium"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="admin-card py-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)]">
            <Package size={32} className="text-[var(--accent)]" />
          </div>
          <p className="mt-5 font-display text-xl font-bold">Your catalog is empty</p>
          <p className="mt-2 text-sm text-[var(--admin-text-muted)] max-w-md mx-auto">
            {search ? 'No products match your search. Try different keywords.' : 'Start building your fragrance collection by adding your first product.'}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/store-portal-jl/dashboard/products/add" 
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition hover:bg-[var(--accent-strong)]"
            >
              <Plus size={16} /> Add Your First Product
            </Link>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] px-6 py-3 text-sm font-bold transition hover:border-[var(--accent)]"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] shadow-sm">
          {/* Mobile cards */}
          <div className="space-y-3 p-3 md:hidden">
            {products.map((p) => {
              const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null
              return (
                <div key={p.id} className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)]">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[var(--admin-text-muted)]">
                          <ImageIcon size={18} />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{p.name}</p>
                      <p className="font-mono text-[10px] text-[var(--admin-text-muted)]">{p.brand} · {p.volume}</p>
                      <p className="mt-1 font-mono text-xs font-bold text-[var(--accent)]">₦{p.price?.toLocaleString('en-NG')}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                          p.stock === 0 ? 'bg-red-500/10 text-red-600' : p.stock <= 5 ? 'bg-[var(--champagne-soft)] text-[#7a5c22]' : 'bg-emerald-500/10 text-emerald-600'
                        }`}>
                          {p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} in stock`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2 border-t border-[var(--admin-border)] pt-2.5">
                    <Link
                      href={`/store-portal-jl/dashboard/products/add?edit=${p.id}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] px-3 py-2 text-[11px] font-bold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      <Edit2 size={12} /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-table-header)] text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Category</th>
                  <th className="px-4 py-3">Retail Price</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Cost / Margin</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Badge</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--admin-border)]">
                {products.map((p) => {
                  const img = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null
                  const cost = p.costPrice || 0
                  const margin = p.price ? Math.round(((p.price - cost) / p.price) * 100) : 0

                  return (
                    <tr key={p.id} className="transition hover:bg-[var(--admin-table-row-hover)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)]">
                            {img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={img} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[var(--admin-text-muted)]">
                                <ImageIcon size={16} />
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold">{p.name}</p>
                            <p className="font-mono text-[10px] text-[var(--admin-text-muted)]">{p.brand} · {p.volume}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 font-medium text-[var(--admin-text-secondary)] lg:table-cell">
                        {p.category?.name || 'Uncategorized'}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <p className="font-bold text-[var(--accent)]">₦{p.price?.toLocaleString('en-NG')}</p>
                        {p.salePrice && (
                          <p className="text-[10px] font-semibold text-emerald-600">Sale: ₦{p.salePrice?.toLocaleString('en-NG')}</p>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 font-mono text-[var(--admin-text-secondary)] sm:table-cell">
                        ₦{cost.toLocaleString('en-NG')}
                        {margin > 0 && (
                          <span className="ml-1 text-[10px] font-bold text-emerald-600">({margin}%)</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-bold ${
                          p.stock === 0
                            ? 'border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                            : p.stock <= 5
                            ? 'border border-[var(--champagne)]/40 bg-[var(--champagne-soft)] text-[#7a5c22]'
                            : 'border border-[var(--admin-border)] bg-[var(--admin-bg)]'
                        }`}>
                          {p.stock === 0 ? 'Out of Stock' : `${p.stock} Qty`}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        {p.badge ? (
                          <span className="rounded-full border border-[var(--champagne)]/40 bg-[var(--champagne-soft)] px-2.5 py-0.5 text-[10px] font-bold text-[#7a5c22]">
                            {p.badge}
                          </span>
                        ) : (
                          <span className="text-[var(--admin-text-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/store-portal-jl/dashboard/products/add?edit=${p.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] px-3 py-1.5 text-[11px] font-bold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                          >
                            <Edit2 size={12} /> Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-[11px] font-bold text-red-500 transition hover:bg-red-500 hover:text-white"
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
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-4">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <FileSpreadsheet className="text-emerald-500" size={19} /> Import Products (CSV)
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text-primary)]" aria-label="Close import dialog">
                <X size={19} />
              </button>
            </div>

            <div className="space-y-3 text-xs font-medium text-[var(--admin-text-secondary)]">
              <p>Upload your Bumpa or Shopify CSV catalog file to import products in bulk.</p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[var(--admin-border)] bg-[var(--admin-bg)] p-8 text-center transition hover:border-[var(--accent)]"
              >
                <Upload size={26} className="mb-2 text-[var(--accent)]" />
                <p className="font-bold text-[var(--admin-text-primary)]">Click or drag CSV file here</p>
                <p className="mt-1 text-[10px] text-[var(--admin-text-muted)]">Supports Bumpa CSV, Shopify CSV, or custom format</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImportCSV(file)
                }}
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--admin-border)] pt-4">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-xs font-bold text-[var(--admin-text-secondary)] transition hover:text-[var(--admin-text-primary)]"
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
