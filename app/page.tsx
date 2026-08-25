'use client'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  Truck,
  ShieldCheck,
  Star,
  RefreshCw,
} from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { site, wa } from '@/lib/site'

const CATEGORY_CARDS = [
  { 
    label: 'Best Sellers', 
    href: '/shop?filter=best', 
    tone: 'oud', 
    kind: 'best',
    fallbackImage: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop'
  },
  { 
    label: 'New Arrivals', 
    href: '/shop?filter=new', 
    tone: 'fresh', 
    kind: 'new',
    fallbackImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=500&fit=crop'
  },
  { 
    label: 'Oud & Amber', 
    href: '/shop?cat=Oud+%26+Amber', 
    tone: 'oud', 
    kind: 'category', 
    category: 'Oud & Amber',
    fallbackImage: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&h=500&fit=crop'
  },
  { 
    label: 'Fresh & Floral', 
    href: '/shop?cat=Fresh', 
    tone: 'fresh', 
    kind: 'category', 
    category: 'Fresh',
    fallbackImage: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=400&h=500&fit=crop'
  },
  { 
    label: 'Sweet & Gourmand', 
    href: '/shop?cat=Sweet+%26+Gourmand', 
    tone: 'sweet', 
    kind: 'category', 
    category: 'Sweet & Gourmand',
    fallbackImage: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&h=500&fit=crop'
  },
  { 
    label: 'Gift Sets', 
    href: '/shop?cat=Gift+Sets', 
    tone: 'amber', 
    kind: 'category', 
    category: 'Gift Sets',
    fallbackImage: 'https://images.unsplash.com/photo-1549888834-3ec93abae044?w=400&h=500&fit=crop'
  },
] as const

const CATEGORY_GRADIENTS: Record<string, string> = {
  oud: 'linear-gradient(135deg,#2a1c08,#6b3d12 55%,#241405)',
  fresh: 'linear-gradient(135deg,#0e2f36,#5aa0a0 55%,#123038)',
  sweet: 'linear-gradient(135deg,#2e1a0e,#c98a3d 55%,#3a2412)',
  amber: 'linear-gradient(135deg,#241a0e,#8a5a13 55%,#d9a441)',
}

function getFirstImage(product: any): string | null {
  if (Array.isArray(product?.images) && product.images.length > 0 && product.images[0]) return product.images[0]
  if (typeof product?.imageUrl === 'string' && product.imageUrl) return product.imageUrl
  return null
}

function categoryName(product: any): string {
  return typeof product?.category === 'object' ? product.category?.name || '' : product?.category || ''
}

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  async function load() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/products', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !Array.isArray(data)) throw new Error('Failed to load products')
      setProducts(data)
    } catch (err) {
      console.error('Error loading live product catalogue:', err)
      setProducts([])
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const bestSellers = products.filter((p) => p.badge === 'BEST' || p.featured).slice(0, 4)
  const newArrivals = products.filter((p) => p.badge === 'NEW').slice(0, 4)
  const onSale = products.filter((p) => p.salePrice != null && p.salePrice < p.price).slice(0, 4)

  const categoryImages = useMemo(() => {
    return CATEGORY_CARDS.map((card) => {
      let match: any = null
      if (card.kind === 'best') {
        match = bestSellers.find((product) => getFirstImage(product))
      } else if (card.kind === 'new') {
        match = newArrivals.find((product) => getFirstImage(product))
      } else {
        match = products.find((product) => categoryName(product) === card.category && getFirstImage(product))
      }
      return { ...card, imageUrl: getFirstImage(match) || card.fallbackImage }
    })
  }, [products, bestSellers, newArrivals])

  const reviews = useMemo(() => {
    const rows = products.flatMap((product) =>
      Array.isArray(product.reviews)
        ? product.reviews.map((review: any) => ({
            id: `${product.id}-${review.id}`,
            name: review.customerName || 'Verified customer',
            text: review.comment,
            rating: Number(review.rating) || 0,
            role: categoryName(product) || product.brand || 'Customer',
          }))
        : []
    )
    return rows
      .filter((review: any) => review.text && review.rating > 0)
      .sort((a: any, b: any) => b.rating - a.rating)
      .slice(0, 3)
  }, [products])

  const rail = (items: any[]) =>
    loading ? (
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <div className="skeleton aspect-[4/5]" />
            <div className="skeleton mt-3 h-3 w-16" />
            <div className="skeleton mt-2 h-5 w-32" />
            <div className="skeleton mt-2 h-4 w-20" />
          </div>
        ))}
      </div>
    ) : items.length === 0 ? null : (
      <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    )

  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="relative flex min-h-[86svh] w-full items-center overflow-hidden sm:min-h-[82vh]">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero-spray.jpg"
            alt="Jessy Luxury fragrance"
            className="hero-zoom h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/60 to-stone-950/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-stone-950/40" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
          <div className="max-w-xl">
            <p className="fade-up inline-flex items-center gap-2 rounded-full border border-[var(--champagne)]/40 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--champagne)] backdrop-blur-md">
              <Sparkles size={12} /> Premium Fragrance House
            </p>

            <h1 className="fade-up mt-6 font-display text-[2.75rem] font-bold leading-[1.02] text-white sm:text-6xl lg:text-7xl" style={{ animationDelay: '0.1s' }}>
              Discover Your
              <br />
              <span className="italic text-[var(--champagne)]">Signature Scent</span>
            </h1>

            <p className="fade-up mt-5 max-w-md text-sm leading-7 text-stone-200 sm:text-base" style={{ animationDelay: '0.2s' }}>
              Original designer and Arabian fragrances, curated perfume oils and gift sets —
              crafted for a presence that lingers.
            </p>

            <div className="fade-up mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" style={{ animationDelay: '0.3s' }}>
              <Link href="/shop" className="btn-champagne group !px-8 !py-4">
                Shop Fragrances
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/shop?filter=best" className="btn-outline !border-white/40 !text-white hover:!border-[var(--champagne)] hover:!text-[var(--champagne)] !px-8 !py-4">
                Explore Best Sellers
              </Link>
            </div>

            <div className="fade-up mt-12 flex flex-wrap gap-x-7 gap-y-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80" style={{ animationDelay: '0.4s' }}>
              <span className="flex items-center gap-2"><BadgeCheck size={15} className="text-[var(--champagne)]" /> 100% Original</span>
              <span className="flex items-center gap-2"><Truck size={15} className="text-[var(--champagne)]" /> Fast Nigeria Dispatch</span>
              <span className="flex items-center gap-2"><MessageCircle size={15} className="text-[var(--champagne)]" /> WhatsApp Orders</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mb-8 text-center">
          <p className="eyebrow">Find your world</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Explore the Collection</h2>
          <p className="mx-auto mt-2 max-w-xl text-xs leading-6 text-[var(--text-secondary)]">
            Curated directly from the live catalogue. Product photography appears here only when a real product image is available.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categoryImages.map((c) => (
            <Link
              key={c.label}
              href={c.href}
              className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--charcoal)] shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-card-hover"
            >
              <span className="absolute inset-0 transition duration-500 group-hover:scale-105" style={{ background: CATEGORY_GRADIENTS[c.tone] }} />
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.imageUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                  loading="lazy"
                />
              ) : (
                <span className="absolute inset-x-6 top-8 h-24 rounded-full border border-white/10 bg-white/5" aria-hidden="true" />
              )}
              <span className="grain absolute inset-0 opacity-20" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <span className="relative z-10 flex flex-col p-4">
                <span className="mt-auto block font-display text-base font-bold text-white sm:text-lg">{c.label}</span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--champagne)]">
                  Discover <ArrowRight size={11} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--card-bg)]">
        <div className="mx-auto grid max-w-7xl divide-y divide-[var(--border)] px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          {[
            { icon: BadgeCheck, t: 'Authentic Selection', d: 'Original designer, Arabian and niche fragrances — guaranteed genuine.' },
            { icon: MessageCircle, t: 'Personal Concierge', d: 'Talk to us on WhatsApp before you order. Real guidance, real people.' },
            { icon: Truck, t: 'Fast, Reliable Delivery', d: 'Same-day Owerri delivery and tracked nationwide dispatch.' },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-4 px-2 py-8 sm:px-8">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]">
                <f.icon size={21} />
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">{f.t}</p>
                <p className="mt-1 text-xs font-medium leading-5 text-[var(--text-secondary)]">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mb-8 flex items-end justify-between border-b border-[var(--border)] pb-5">
          <div>
            <p className="eyebrow">Most loved</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Best Sellers</h2>
          </div>
          <Link href="/shop?filter=best" className="group flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)] transition hover:text-[var(--accent-strong)]">
            View all <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        {rail(bestSellers)}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 sm:pb-18 lg:px-8 lg:pb-20">
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              eyebrow: 'The art of gifting',
              title: 'Curated Gift Sets',
              copy: 'Ready-to-give boxes pairing EDPs, oils and travel sprays — wrapped to impress.',
              href: '/shop?cat=Gift+Sets',
              gradient: CATEGORY_GRADIENTS.amber,
              bgImage: 'https://images.unsplash.com/photo-1549888834-3ec93abae044?w=800&h=600&fit=crop',
            },
            {
              eyebrow: 'Deep & captivating',
              title: 'Oud & Amber',
              copy: 'Rich Arabian blends built for evenings, occasions and unforgettable entrances.',
              href: '/shop?cat=Oud+%26+Amber',
              gradient: CATEGORY_GRADIENTS.oud,
              bgImage: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&h=600&fit=crop',
            },
          ].map((b) => (
            <Link key={b.title} href={b.href} className="group relative flex min-h-[300px] flex-col justify-end overflow-hidden rounded-3xl border border-[var(--border)] p-8 shadow-card transition duration-300 hover:shadow-card-hover sm:min-h-[340px]">
              <span className="absolute inset-0 transition duration-700 group-hover:scale-105" style={{ background: b.gradient }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.bgImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-40 transition duration-700 group-hover:scale-105 group-hover:opacity-50"
                loading="lazy"
              />
              <span className="grain absolute inset-0 opacity-30" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <span className="relative z-10 max-w-sm">
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--champagne)]">{b.eyebrow}</span>
                <span className="mt-2 block font-display text-3xl font-bold text-white sm:text-4xl">{b.title}</span>
                <span className="mt-2 block text-sm leading-6 text-stone-200">{b.copy}</span>
                <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition group-hover:border-[var(--champagne)] group-hover:text-[var(--champagne)]">
                  Shop collection <ArrowRight size={13} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {(loading || newArrivals.length > 0) && (
        <section className="border-y border-[var(--border)] bg-[var(--bg-secondary)]/60">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mb-8 flex items-end justify-between border-b border-[var(--border)] pb-5">
              <div>
                <p className="eyebrow">Just landed</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">New Arrivals</h2>
              </div>
              <Link href="/shop?filter=new" className="group flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)] transition hover:text-[var(--accent-strong)]">
                View all <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            {rail(newArrivals)}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {onSale.length > 0 && !loading && (
          <div className="mb-12">
            <div className="mb-8 flex items-end justify-between border-b border-[var(--border)] pb-5">
              <div>
                <p className="eyebrow">Limited-time offers</p>
                <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">On Sale Now</h2>
              </div>
            </div>
            {rail(onSale)}
          </div>
        )}

        <div className="relative overflow-hidden rounded-3xl bg-[var(--charcoal)] px-6 py-14 text-center shadow-card sm:px-12 lg:py-16">
          <span className="grain absolute inset-0 opacity-20" />
          <span className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[var(--accent)]/25 blur-3xl" />
          <span className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[var(--champagne)]/15 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--champagne)]">
              Jessy Luxury · {site.locationShort}
            </p>
            <h3 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
              Smell expensive. <span className="italic text-[var(--champagne)]">Feel unforgettable.</span>
            </h3>
            <p className="mt-3 text-sm leading-7 text-stone-300">
              Not sure where to start? Message us and we&apos;ll curate a shortlist for your taste,
              occasion and budget.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/shop" className="btn-champagne !px-8 !py-4">Browse the Shop</Link>
              <a href={wa("Hello Jessy Luxury! I'd like a personal recommendation.")} target="_blank" rel="noreferrer" className="btn-outline !border-white/30 !text-white hover:!border-emerald-400 hover:!text-emerald-300 !px-8 !py-4">
                <MessageCircle size={15} /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--card-bg)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 sm:py-20 lg:grid-cols-2 lg:px-8">
          <div className="relative flex min-h-[320px] w-full min-w-0 items-center justify-center overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--charcoal)] p-8 shadow-card">
            <div className="grain absolute inset-0 opacity-30" />
            <div className="absolute h-64 w-64 rounded-full bg-[var(--accent)]/25 blur-3xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png.jpeg" alt="Jessy Luxury" className="relative h-40 max-w-full w-auto rounded-2xl object-contain drop-shadow-2xl" />
          </div>
          <div>
            <p className="eyebrow">About Jessy Luxury</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">A fragrance should feel like part of your identity.</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--text-secondary)]">
              From carefully selected Arabic and designer fragrances to oils and gift sets, {site.brand} helps you choose a scent that fits your personality, occasion and lifestyle.
            </p>
            <Link href="/about" className="group mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)] transition hover:text-[var(--accent-strong)]">
              Read our story <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20 lg:px-8">
          <div className="mb-10 text-center">
            <p className="eyebrow">What customers say</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Loved Across Nigeria</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {reviews.map((t: any) => (
              <figure key={t.id} className="flex h-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-7 shadow-card">
                <div className="flex gap-0.5 text-[var(--champagne)]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < t.rating ? 'fill-[var(--champagne)]' : ''} />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-7 text-[var(--text-secondary)]">&ldquo;{t.text}&rdquo;</blockquote>
                <figcaption className="mt-5 border-t border-[var(--border)] pt-4">
                  <p className="text-sm font-bold text-[var(--text-primary)]">{t.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{t.role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {error && !loading && (
        <div className="mx-auto max-w-xl px-4 pb-12 text-center">
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-amber-500/20 bg-[var(--card-bg)] p-4 text-xs text-[var(--text-secondary)] shadow-card">
            <ShieldCheck size={16} className="text-[var(--champagne)]" />
            <span>Live catalogue could not be reached. No demo inventory is being shown.</span>
            <button onClick={load} className="flex items-center gap-1.5 font-bold text-[var(--accent)] transition hover:text-[var(--accent-strong)]">
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
