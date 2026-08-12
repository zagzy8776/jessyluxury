'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PackageSearch, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { products as fallbackProducts, categories } from '@/lib/products'

const PER_PAGE = 9

function ShopInner() {
  const params = useSearchParams()
  const [cat, setCat] = useState(params.get('cat') || 'All')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [liveProducts, setLiveProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setLiveProducts(data)
        } else {
          setLiveProducts(fallbackProducts)
        }
      } catch (e) {
        console.error('Error loading DB products', e)
        setLiveProducts(fallbackProducts)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  useEffect(() => { setPage(1) }, [cat, q])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return liveProducts.filter((p) => {
      const categoryName = typeof p.category === 'object' ? p.category?.name : p.category
      const matchesCat = cat === 'All' || categoryName === cat || p.category === cat
      const matchesQuery = (
        (p.name || '') +
        (p.brand || '') +
        (p.notes || '') +
        (categoryName || '') +
        (p.volume || '')
      )
        .toLowerCase()
        .includes(term)

      return matchesCat && matchesQuery
    })
  }, [cat, q, liveProducts])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function scrollToTop() {
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-[80vh]">
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="text-[10px] font-bold tracking-[0.26em] text-amber-500">THE COLLECTION</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
            Explore All Fragrances
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)] font-medium">
            Discover original designer and Arabian perfumes, long-lasting oils, and luxury gift sets available for delivery.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-[var(--border)] pb-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCat('All')}
              className={`rounded-full border px-4 py-2 text-[11px] font-bold tracking-[0.08em] transition ${
                cat === 'All'
                  ? 'border-amber-500 bg-amber-500 text-stone-950'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-amber-500/50 hover:text-amber-500 bg-[var(--card-bg)]'
              }`}
            >
              ALL
            </button>
            {categories.map((c) => {
              const name = typeof c === 'string' ? c : (c as any).name
              return (
                <button
                  key={name}
                  onClick={() => setCat(name)}
                  className={`rounded-full border px-4 py-2 text-[11px] font-bold tracking-[0.08em] transition ${
                    cat === name
                      ? 'border-amber-500 bg-amber-500 text-stone-950'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-amber-500/50 hover:text-amber-500 bg-[var(--card-bg)]'
                  }`}
                >
                  {name.toUpperCase()}
                </button>
              )
            })}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3 top-3 text-[var(--text-muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search fragrances…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] py-2.5 pl-9 pr-4 text-xs font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 shadow-sm"
            />
          </div>
        </div>

        <p className="mt-8 text-[11px] tracking-[0.12em] text-[var(--text-muted)] font-mono font-bold">
          {loading ? 'LOADING PRODUCTS…' : `${filtered.length} ${filtered.length === 1 ? 'PRODUCT' : 'PRODUCTS'}`}
        </p>

        {loading ? (
          <div className="py-24 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Loading catalog…</div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PackageSearch size={36} className="text-[var(--text-muted)] mb-3" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">No fragrances found</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Try adjusting your search terms or filter category.</p>
            <button
              onClick={() => { setCat('All'); setQ('') }}
              className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-xs font-bold text-amber-500 hover:border-amber-500 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12">
            {paginated.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {/* ── PAGINATION CONTROLS ── */}
        {!loading && totalPages > 1 && (
          <div className="mt-16 flex flex-col items-center gap-4">
            <p className="text-xs text-[var(--text-muted)] font-medium">
              Page <span className="font-bold text-[var(--text-primary)]">{page}</span> of{' '}
              <span className="font-bold text-[var(--text-primary)]">{totalPages}</span> &nbsp;·&nbsp;{' '}
              Showing{' '}
              <span className="font-bold text-[var(--text-primary)]">
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)}
              </span>{' '}
              of <span className="font-bold text-[var(--text-primary)]">{filtered.length}</span> products
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPage(page - 1); scrollToTop() }}
                disabled={page === 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] transition hover:border-amber-500 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (n as number) - (arr[idx - 1] as number) > 1) {
                    acc.push('…')
                  }
                  acc.push(n)
                  return acc
                }, [])
                .map((item, idx) =>
                  item === '…' ? (
                    <span key={`ellipsis-${idx}`} className="flex h-10 w-10 items-center justify-center text-[var(--text-muted)] text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => { setPage(item as number); scrollToTop() }}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-bold transition shadow-xs ${
                        page === item
                          ? 'border-amber-500 bg-amber-500 text-stone-950'
                          : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-amber-500 hover:text-amber-500'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => { setPage(page + 1); scrollToTop() }}
                disabled={page === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] transition hover:border-amber-500 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              >
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