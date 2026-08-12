'use client'
import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  Truck,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import Bottle from '@/components/Bottle'
import { site, wa } from '@/lib/site'

const CATEGORIES = ['All', 'Oud & Amber', 'Fresh & Floral', 'Sweet & Gourmand', 'Perfume Oils', 'Gift Sets']
const PER_PAGE = 8

const testimonials = [
  { name: 'Adaeze O.', text: 'Ordered the Khair Pistachio — it arrived the same day and smells even better than I expected. Delivery was smooth.', role: 'Owerri' },
  { name: 'Chinedu K.', text: 'The perfume finder picked the Supremacy Collector for me and it is perfect. Exactly the confidence I wanted.', role: 'Nigeria' },
  { name: 'Amaka E.', text: "Got the Signature Gift Set for my mum's birthday. Beautiful presentation and authentic scents. Highly recommended!", role: 'Lagos' },
]

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (Array.isArray(data)) setProducts(data)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1) }, [cat, q])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return products.filter((p) => {
      const catName = typeof p.category === 'object' ? p.category?.name : p.category
      const matchCat = cat === 'All' || catName === cat
      const matchQ = !term || (
        (p.name || '') + (p.brand || '') + (p.notes || '') + (catName || '')
      ).toLowerCase().includes(term)
      return matchCat && matchQ
    })
  }, [products, cat, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function scrollToCatalog() {
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="bg-stone-950">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,163,93,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(120,60,20,0.18),transparent_55%)]" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-16 text-center lg:px-8 lg:pb-28 lg:pt-24">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[10px] font-semibold tracking-[0.22em] text-amber-300">
            <Sparkles size={12} /> JESSY LUXURY FRAGRANCE
          </p>
          <h1 className="font-display text-6xl font-medium leading-[0.95] text-stone-50 sm:text-7xl lg:text-[92px]">
            Discover your <span className="text-amber-400 italic">signature</span> scent.
          </h1>
          <p className="mt-6 max-w-md mx-auto text-base leading-7 text-stone-400">
            Original designer and Arabian fragrances, oil perfumes and gift sets curated for confident everyday living — with personal WhatsApp ordering.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={scrollToCatalog}
              className="group inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-4 text-xs font-bold tracking-[0.14em] text-stone-950 transition hover:bg-amber-400"
            >
              SHOP THE COLLECTION <ArrowRight size={15} className="transition group-hover:translate-x-1" />
            </button>
            <a
              href={wa("Hello Jessy Luxury! I'd love some perfume recommendations.")}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-stone-700 px-7 py-4 text-xs font-bold tracking-[0.14em] text-stone-200 transition hover:border-green-500 hover:text-green-400"
            >
              <MessageCircle size={15} /> CHAT ON WHATSAPP
            </a>
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-x-7 gap-y-3 text-[10px] tracking-[0.16em] text-stone-500">
            <span className="flex items-center gap-2"><BadgeCheck size={14} className="text-amber-400" /> 100% ORIGINAL</span>
            <span className="flex items-center gap-2"><Truck size={14} className="text-amber-400" /> FAST DELIVERY</span>
            <span className="flex items-center gap-2"><MessageCircle size={14} className="text-amber-400" /> WHATSAPP ORDERS</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES STRIP ── */}
      <section className="border-y border-stone-800 bg-stone-900/40">
        <div className="mx-auto grid max-w-7xl divide-y divide-stone-800 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
          {[
            { icon: BadgeCheck, t: 'Authentic Selection', d: 'Original designer, Arabic and niche fragrances only.' },
            { icon: MessageCircle, t: 'WhatsApp Support', d: 'Talk to us personally before you order.' },
            { icon: Truck, t: 'Fast, Reliable Delivery', d: 'Pickup, Owerri delivery and waybill dispatch.' },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-4 px-2 py-8 sm:px-8">
              <span className="rounded-full bg-amber-500/10 p-3 text-amber-400"><f.icon size={20} /></span>
              <div>
                <p className="text-sm font-semibold text-stone-100">{f.t}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FULL CATALOG WITH PAGINATION ── */}
      <section id="catalog" className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">

        {/* Section header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.24em] text-amber-400">OUR COLLECTION</p>
            <h2 className="mt-2 font-display text-4xl text-stone-50 sm:text-5xl">Shop All Fragrances</h2>
            <p className="mt-2 text-sm text-stone-500">
              {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'}`}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-3 text-stone-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search fragrances, brands, notes…"
              className="w-full rounded-xl border border-stone-700 bg-stone-900 py-2.5 pl-9 pr-4 text-sm text-stone-200 outline-none transition placeholder:text-stone-600 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-5 py-2 text-[11px] font-semibold tracking-[0.08em] transition ${
                cat === c
                  ? 'border-amber-500 bg-amber-500 text-stone-950'
                  : 'border-stone-700 text-stone-400 hover:border-amber-500/50 hover:text-amber-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] rounded-2xl bg-stone-800/70" />
                <div className="mt-4 h-2.5 w-16 rounded bg-stone-800" />
                <div className="mt-2 h-5 w-28 rounded bg-stone-800" />
                <div className="mt-2 h-2.5 w-20 rounded bg-stone-800" />
                <div className="mt-3 h-4 w-14 rounded bg-stone-800" />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-stone-500">No products match your search.</p>
            <button onClick={() => { setQ(''); setCat('All') }} className="mt-4 text-xs font-semibold text-amber-400 hover:text-amber-300 transition">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3 lg:grid-cols-4">
            {paginated.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {!loading && totalPages > 1 && (
          <div className="mt-16 flex flex-col items-center gap-4">
            {/* Page info */}
            <p className="text-xs text-stone-500">
              Page <span className="font-semibold text-stone-300">{page}</span> of{' '}
              <span className="font-semibold text-stone-300">{totalPages}</span> &nbsp;·&nbsp;{' '}
              Showing{' '}
              <span className="font-semibold text-stone-300">
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)}
              </span>{' '}
              of <span className="font-semibold text-stone-300">{filtered.length}</span> products
            </p>

            {/* Buttons row */}
            <div className="flex items-center gap-2">
              {/* Prev */}
              <button
                onClick={() => { setPage(page - 1); scrollToCatalog() }}
                disabled={page === 1}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-700 text-stone-400 transition hover:border-amber-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => {
                  // Show: first, last, current ±1, and ellipsis markers
                  return n === 1 || n === totalPages || Math.abs(n - page) <= 1
                })
                .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                  if (idx > 0 && typeof arr[idx - 1] === 'number' && (n as number) - (arr[idx - 1] as number) > 1) {
                    acc.push('…')
                  }
                  acc.push(n)
                  return acc
                }, [])
                .map((item, idx) =>
                  item === '…' ? (
                    <span key={`ellipsis-${idx}`} className="flex h-10 w-10 items-center justify-center text-stone-600 text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => { setPage(item as number); scrollToCatalog() }}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border text-sm font-semibold transition ${
                        page === item
                          ? 'border-amber-500 bg-amber-500 text-stone-950'
                          : 'border-stone-700 text-stone-400 hover:border-amber-500 hover:text-amber-400'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              {/* Next */}
              <button
                onClick={() => { setPage(page + 1); scrollToCatalog() }}
                disabled={page === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-700 text-stone-400 transition hover:border-amber-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Jump to page (shows when > 5 pages) */}
            {totalPages > 5 && (
              <div className="flex items-center gap-3 text-xs text-stone-500">
                <span>Go to page</span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  defaultValue={page}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const v = parseInt((e.target as HTMLInputElement).value)
                      if (v >= 1 && v <= totalPages) { setPage(v); scrollToCatalog() }
                    }
                  }}
                  className="w-16 rounded-lg border border-stone-700 bg-stone-900 px-2 py-1.5 text-center text-stone-200 outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── STORY TEASER ── */}
      <section className="border-t border-stone-800 bg-stone-900/30">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-3xl border border-stone-800 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950">
            <div className="grain absolute inset-0" />
            <div className="absolute h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
            <img src="/logo.png.jpeg" alt="Jessy Luxury" className="relative h-40 w-auto rounded-2xl object-contain drop-shadow-2xl" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.24em] text-amber-400">ABOUT JESSY LUXURY</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-stone-50 sm:text-5xl">
              A fragrance should feel like part of your identity.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-stone-400">
              From carefully selected Arabic and designer fragrances to oils and gift sets, {site.brand} helps you choose a scent that fits your personality, occasion and lifestyle.
            </p>
            <Link href="/about" className="mt-7 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-amber-300 transition hover:text-amber-200">
              READ OUR STORY <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="mb-10 text-center">
          <p className="text-[10px] font-bold tracking-[0.24em] text-amber-400">WHAT CUSTOMERS SAY</p>
          <h2 className="mt-3 font-display text-4xl text-stone-50 sm:text-5xl">Loved across Nigeria</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-stone-800 bg-stone-900/60 p-7">
              <div className="text-amber-400">★★★★★</div>
              <blockquote className="mt-4 text-sm leading-7 text-stone-300">"{t.text}"</blockquote>
              <figcaption className="mt-5">
                <p className="text-sm font-semibold text-stone-100">{t.name}</p>
                <p className="text-xs text-stone-500">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="border-t border-stone-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-14 text-center sm:flex-row sm:text-left lg:px-8">
          <div>
            <h3 className="font-display text-3xl text-stone-50">Smell expensive. Feel unforgettable.</h3>
            <p className="mt-2 text-sm text-stone-500">The full collection is one message away.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={scrollToCatalog} className="rounded-full bg-amber-500 px-7 py-4 text-xs font-bold tracking-[0.12em] text-stone-950 transition hover:bg-amber-400">
              BROWSE THE SHOP
            </button>
            <a href={wa("Hello Jessy Luxury! I'd like to place an order.")} target="_blank" rel="noreferrer"
              className="rounded-full bg-green-600 px-7 py-4 text-xs font-bold tracking-[0.12em] text-white transition hover:bg-green-500">
              ORDER ON WHATSAPP
            </a>
          </div>
        </div>
      </section>

    </main>
  )
}