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
  ShieldCheck,
} from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { site, wa } from '@/lib/site'

const CATEGORIES = ['All', 'Oud & Amber', 'Fresh & Floral', 'Sweet & Gourmand', 'Perfume Oils', 'Gift Sets']
const PER_PAGE = 9

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
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-200">

      {/* ── HERO BANNER WITH USER'S PHOTO BACKGROUND ── */}
      <section className="relative min-h-[88vh] sm:min-h-[85vh] w-full flex items-center justify-center overflow-hidden border-b border-[var(--border)]">
        {/* Background Image: User's Exact Uploaded Photo */}
        <div className="absolute inset-0 z-0 w-full h-full">
          <img
            src="/hero-spray.jpg"
            alt="Perfume Spray"
            className="h-full w-full object-cover object-center"
          />
          {/* Subtle gradient vignette overlay to ensure text contrast while retaining the dark rim light photo */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/75 to-stone-950/50" />
          <div className="grain absolute inset-0 opacity-30" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center lg:px-8">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-1.5 text-[10px] font-bold tracking-[0.24em] text-amber-300 uppercase shadow-md backdrop-blur-md">
            <Sparkles size={13} /> JESSY LUXURY FRAGRANCE
          </p>

          <h1 className="font-display text-5xl font-bold leading-[0.98] text-white sm:text-7xl lg:text-[88px] drop-shadow-lg">
            Smell expensive. <br />
            <span className="text-amber-400 italic font-serif">Feel unforgettable.</span>
          </h1>

          <p className="mt-6 max-w-lg mx-auto text-base leading-8 text-stone-200 font-medium drop-shadow">
            Original designer and Arabian fragrances, perfume oils and curated gift sets crafted for confident everyday living.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={scrollToCatalog}
              className="group inline-flex items-center gap-2.5 rounded-full bg-amber-500 px-8 py-4 text-xs font-bold tracking-[0.14em] text-stone-950 transition hover:bg-amber-400 shadow-xl"
            >
              SHOP THE COLLECTION <ArrowRight size={15} className="transition group-hover:translate-x-1" />
            </button>
            <a
              href={wa("Hello Jessy Luxury! I'd love some perfume recommendations.")}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2.5 rounded-full border border-stone-600 bg-stone-900/80 backdrop-blur-md px-8 py-4 text-xs font-bold tracking-[0.14em] text-white transition hover:border-emerald-500 hover:text-emerald-400 shadow-lg"
            >
              <MessageCircle size={15} className="text-emerald-400" /> CHAT ON WHATSAPP
            </a>
          </div>

          <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[10px] font-bold tracking-[0.18em] text-stone-300 uppercase">
            <span className="flex items-center gap-2"><BadgeCheck size={16} className="text-amber-400" /> 100% ORIGINAL</span>
            <span className="flex items-center gap-2"><Truck size={16} className="text-amber-400" /> FAST NIGERIA DISPATCH</span>
            <span className="flex items-center gap-2"><MessageCircle size={16} className="text-amber-400" /> WHATSAPP ORDERS</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES STRIP ── */}
      <section className="border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="mx-auto grid max-w-7xl divide-y divide-[var(--border)] px-4 sm:px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
          {[
            { icon: BadgeCheck, t: 'Authentic Selection', d: 'Original designer, Arabic and niche fragrances.' },
            { icon: MessageCircle, t: 'WhatsApp Support', d: 'Talk to us personally before you order.' },
            { icon: Truck, t: 'Fast, Reliable Delivery', d: 'Pickup, Owerri delivery and waybill dispatch.' },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-4 px-2 py-8 sm:px-8">
              <span className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <f.icon size={22} />
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{f.t}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)] font-medium">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FULL CATALOG WITH PAGINATION ── */}
      <section id="catalog" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">

        {/* Section header */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-[var(--border)] pb-6">
          <div>
            <p className="text-[10px] font-bold tracking-[0.24em] text-amber-500 uppercase">OUR COLLECTION</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-[var(--text-primary)] sm:text-5xl">Shop All Fragrances</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)] font-medium">
              {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'}`}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3 top-3 text-[var(--text-muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search fragrances, brands, notes…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] py-2.5 pl-9 pr-4 text-xs font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`rounded-full border px-5 py-2.5 text-[11px] font-bold tracking-[0.08em] transition shadow-xs ${
                cat === c
                  ? 'border-amber-500 bg-amber-500 text-stone-950'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-amber-500/50 hover:text-amber-500 bg-[var(--card-bg)]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Product Grid - 3 items per row */}
        {loading ? (
          <div className="grid grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/5] rounded-2xl bg-stone-200/40 dark:bg-stone-800/40" />
                <div className="mt-4 h-2.5 w-16 rounded bg-stone-200/40 dark:bg-stone-800/40" />
                <div className="mt-2 h-5 w-28 rounded bg-stone-200/40 dark:bg-stone-800/40" />
                <div className="mt-2 h-2.5 w-20 rounded bg-stone-200/40 dark:bg-stone-800/40" />
                <div className="mt-3 h-4 w-14 rounded bg-stone-200/40 dark:bg-stone-800/40" />
              </div>
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-[var(--text-muted)] font-medium">No products match your search.</p>
            <button onClick={() => { setQ(''); setCat('All') }} className="mt-4 text-xs font-bold text-amber-500 hover:text-amber-400 transition">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-12">
            {paginated.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {/* ── PAGINATION ── */}
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
                onClick={() => { setPage(page - 1); scrollToCatalog() }}
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
                      onClick={() => { setPage(item as number); scrollToCatalog() }}
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
                onClick={() => { setPage(page + 1); scrollToCatalog() }}
                disabled={page === totalPages}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] transition hover:border-amber-500 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── STORY TEASER WITH LOGO ── */}
      <section className="border-t border-[var(--border)] bg-[var(--card-bg)]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-3xl border border-[var(--border)] bg-stone-950 p-8 shadow-md">
            <div className="grain absolute inset-0 opacity-30" />
            <div className="absolute h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
            <img src="/logo.png.jpeg" alt="Jessy Luxury" className="relative h-44 w-auto rounded-2xl object-contain drop-shadow-2xl" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.24em] text-amber-500 uppercase">ABOUT JESSY LUXURY</p>
            <h2 className="mt-3 font-display text-4xl leading-tight font-bold text-[var(--text-primary)] sm:text-5xl">
              A fragrance should feel like part of your identity.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-8 text-[var(--text-secondary)] font-medium">
              From carefully selected Arabic and designer fragrances to oils and gift sets, {site.brand} helps you choose a scent that fits your personality, occasion and lifestyle.
            </p>
            <Link href="/about" className="mt-7 inline-flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-amber-500 transition hover:text-amber-600">
              READ OUR STORY <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="mb-10 text-center">
          <p className="text-[10px] font-bold tracking-[0.24em] text-amber-500 uppercase">WHAT CUSTOMERS SAY</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-[var(--text-primary)] sm:text-5xl">Loved Across Nigeria</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-7 shadow-sm">
              <div className="text-amber-500 text-xs">★★★★★</div>
              <blockquote className="mt-4 text-sm leading-7 text-[var(--text-secondary)] font-medium">"{t.text}"</blockquote>
              <figcaption className="mt-5">
                <p className="text-sm font-bold text-[var(--text-primary)]">{t.name}</p>
                <p className="text-xs text-[var(--text-muted)] font-medium">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="border-t border-[var(--border)] bg-[var(--card-bg)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-14 text-center sm:flex-row sm:text-left lg:px-8">
          <div>
            <h3 className="font-display text-3xl font-bold text-[var(--text-primary)]">Smell expensive. Feel unforgettable.</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)] font-medium">The full collection is one message away.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={scrollToCatalog} className="rounded-full bg-amber-500 px-7 py-4 text-xs font-bold tracking-[0.12em] text-stone-950 transition hover:bg-amber-400 shadow-md">
              BROWSE THE SHOP
            </button>
            <a href={wa("Hello Jessy Luxury! I'd like to place an order.")} target="_blank" rel="noreferrer"
              className="rounded-full bg-emerald-600 px-7 py-4 text-xs font-bold tracking-[0.12em] text-white transition hover:bg-emerald-500 shadow-md">
              ORDER ON WHATSAPP
            </a>
          </div>
        </div>
      </section>

    </main>
  )
}