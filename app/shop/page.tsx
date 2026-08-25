'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import type { Metadata } from 'next'
import { useSearchParams } from 'next/navigation'
import { PackageSearch, Search, ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react'
import ProductCard from '@/components/ProductCard'

// NOTE: This page is client-side rendered, so metadata is handled at layout level or via dynamic route
// For better SEO, consider moving core content to server component with generateMetadata

const PER_PAGE = 9

function ShopInner() {
  const params = useSearchParams()
  const [cat, setCat] = useState(params.get('cat') || 'All')
  const [q, setQ] = useState(params.get('q') || '')
  const [badgeFilter, setBadgeFilter] = useState(params.get('filter') || '')
  const [page, setPage] = useState(1)
  const [liveProducts, setLiveProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function loadProducts() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/products', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) throw new Error('Failed to load catalogue')
      setLiveProducts(data)
    } catch (e) {
      console.error('Error loading DB products', e)
      setLiveProducts([])
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    setCat(params.get('cat') || 'All')
    setQ(params.get('q') || '')
    setBadgeFilter(params.get('filter') || '')
    setPage(1)
  }, [params])

  useEffect(() => {
    setPage(1)
  }, [cat, q, badgeFilter])

  const liveCategories = useMemo(() => {
    const names = liveProducts
      .map((p) => (typeof p.category === 'object' ? p.category?.name : p.category))
      .filter((name): name is string => Boolean(name))
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
  }, [liveProducts])

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim()
    return liveProducts.filter((p) => {
      const categoryName = typeof p.category === 'object' ? p.category?.name : p.category
      const matchesCat = cat === 'All' || categoryName === cat || p.category === cat
      const matchesBadge =
        badgeFilter === 'new'
          ? p.badge === 'NEW'
          : badgeFilter === 'best'
          ? p.badge === 'BEST' || p.featured
          : badgeFilter === 'sale'
          ? p.salePrice != null && p.salePrice < p.price
          : true
      const matchesQuery =
        !term ||
        `${p.name || ''} ${p.brand || ''} ${p.notes || ''} ${categoryName || ''} ${p.volume || ''}`
          .toLowerCase()
          .includes(term)
      return matchesCat && matchesBadge && matchesQuery
    })
  }, [cat, q, badgeFilter, liveProducts])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function scrollToTop() {
    document.getElementById('catalog-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-[11px] font-bold tracking-[0.08em] transition ${
      active
        ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-plum'
        : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]'
    }`

  return (
    <main className="min-h-[80vh] bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,45,127,0.10),transparent_60%)]" />
        <div className="grain absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-14 text-center lg:px-8 lg:py-16">
          <p className="eyebrow">The collection</p>
          <h1 className="mt-2 font-display text-4xl font-bold sm:text-5xl">
            {badgeFilter === 'new'
              ? 'New Arrivals'
              : badgeFilter === 'best'
              ? 'Best Sellers'
              : badgeFilter === 'sale'
              ? 'On Sale Now'
              : 'All Fragrances'}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[var(--text-secondary)]">
            Original designer and Arabian perfumes, long-lasting oils and luxury gift sets —
            delivered nationwide.
          </p>

          <div className="relative mx-auto mt-7 w-full max-w-md">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search fragrances, brands, notes…"
              className="w-full rounded-full border border-[var(--border)] bg-[var(--input-bg)] py-3.5 pl-11 pr-10 text-sm font-medium shadow-card outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]">
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </section>

      <section id="catalog-top" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <button onClick={() => { setCat('All'); setBadgeFilter('') }} className={chip(cat === 'All' && !badgeFilter)}>ALL</button>
          <button onClick={() => { setBadgeFilter('best'); setCat('All') }} className={chip(badgeFilter === 'best')}>BEST SELLERS</button>
          <button onClick={() => { setBadgeFilter('new'); setCat('All') }} className={chip(badgeFilter === 'new')}>NEW ARRIVALS</button>
          <button onClick={() => { setBadgeFilter('sale'); setCat('All') }} className={chip(badgeFilter === 'sale')}>ON SALE</button>
          {liveCategories.map((name) => (
            <button key={name} onClick={() => { setCat(name); setBadgeFilter('') }} className={chip(cat === name && !badgeFilter)}>
              {name.toUpperCase()}
            </button>
          ))}
        </div>

        <p className="mt-7 text-[11px] font-bold tracking-[0.12em] text-[var(--text-muted)]">
          {loading ? 'LOADING PRODUCTS…' : `${filtered.length} ${filtered.length === 1 ? 'PRODUCT' : 'PRODUCTS'}`}
        </p>

        {loading ? (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-[4/5]" />
                <div className="skeleton mt-3 h-3 w-16" />
                <div className="skeleton mt-2 h-5 w-32" />
                <div className="skeleton mt-2 h-4 w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PackageSearch size={36} className="mb-3 text-[var(--text-muted)]" />
            <p className="font-display text-xl font-bold">Catalogue unavailable</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">We couldn&apos;t load live inventory. Demo products are intentionally not shown.</p>
            <button onClick={loadProducts} className="btn-primary mt-5 !px-6 !py-3"><RefreshCw size={14} /> Try again</button>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PackageSearch size={36} className="mb-3 text-[var(--text-muted)]" />
            <p className="font-display text-xl font-bold text-[var(--text-primary)]">We couldn&apos;t find that fragrance.</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Try adjusting your search or browsing the full collection.</p>
            <button onClick={() => { setCat('All'); setQ(''); setBadgeFilter('') }} className="btn-outline mt-5 !px-6 !py-3">Reset filters</button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6">
            {paginated.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-14 flex flex-col items-center gap-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Page <span className="font-bold text-[var(--text-primary)]">{page}</span> of <span className="font-bold text-[var(--text-primary)]">{totalPages}</span> &nbsp;·&nbsp; Showing <span className="font-bold text-[var(--text-primary)]">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)}</span> of <span className="font-bold text-[var(--text-primary)]">{filtered.length}</span> products
            </p>

            <div className="flex items-center gap-2">
              <button onClick={() => { setPage(page - 1); scrollToTop() }} disabled={page === 1} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] shadow-card transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-30" aria-label="Previous page">
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (n as number) - (arr[idx - 1] as number) > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((item, idx) => item === '…' ? (
                  <span key={`ellipsis-${idx}`} className="flex h-10 w-10 items-center justify-center text-sm text-[var(--text-muted)]">…</span>
                ) : (
                  <button key={item} onClick={() => { setPage(item as number); scrollToTop() }} className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold shadow-card transition ${page === item ? 'border-[var(--accent)] bg-[var(--accent)] text-white' : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'}`}>
                    {item}
                  </button>
                ))}

              <button onClick={() => { setPage(page + 1); scrollToTop() }} disabled={page === totalPages} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] shadow-card transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-30" aria-label="Next page">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-xs font-semibold text-[var(--text-muted)]">Loading shop…</div>}>
      <ShopInner />
    </Suspense>
  )
}
