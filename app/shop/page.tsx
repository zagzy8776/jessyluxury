'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { PackageSearch, Search } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { products as fallbackProducts, categories } from '@/lib/products'

function ShopInner() {
  const params = useSearchParams()
  const [cat, setCat] = useState(params.get('cat') || 'All')
  const [q, setQ] = useState('')
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

  const list = useMemo(() => {
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

  return (
    <main className="bg-stone-950 min-h-[80vh]">
      <section className="relative overflow-hidden border-b border-stone-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="text-[10px] font-bold tracking-[0.26em] text-amber-400">THE COLLECTION</p>
          <h1 className="mt-3 font-display text-5xl text-stone-50 sm:text-6xl">Shop Fragrances</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-400">
            Original designer and Arabian fragrances — each piece hand-picked and authentic.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full border px-5 py-2.5 text-[11px] font-semibold tracking-[0.08em] transition ${
                  cat === c
                    ? 'border-amber-500 bg-amber-500 text-stone-950'
                    : 'border-stone-700 text-stone-400 hover:border-amber-500/60 hover:text-amber-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-72">
            <Search size={15} className="absolute left-0 top-3 text-stone-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search fragrances, brands, notes…"
              className="w-full border-b border-stone-700 bg-transparent py-2 pl-7 text-sm text-stone-200 outline-none transition placeholder:text-stone-600 focus:border-amber-500"
            />
          </div>
        </div>

        <p className="mt-8 text-[11px] tracking-[0.12em] text-stone-500 font-mono">
          {list.length} {list.length === 1 ? 'PRODUCT' : 'PRODUCTS'}
        </p>

        {loading ? (
          <div className="py-24 text-center text-sm text-stone-500">Loading live catalog…</div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <PackageSearch size={40} className="text-stone-600" />
            <p className="text-sm text-stone-400">Nothing matches your search — try another word or category.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="py-40 text-center text-sm text-stone-500">Loading shop…</div>}>
      <ShopInner />
    </Suspense>
  )
}