import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  Truck,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { formatNGN } from '@/lib/currency'
import { getProducts } from '@/lib/api-client'

const CATEGORY_CARDS = [
  { label: 'Best Sellers', href: '/shop?filter=best', tone: 'amber' },
  { label: 'New Arrivals', href: '/shop?filter=new', tone: 'fresh' },
  { label: 'Oud & Amber', href: '/shop?cat=Oud%20%26%20Amber', tone: 'oud' },
  { label: 'Fresh & Floral', href: '/shop?cat=Fresh', tone: 'fresh' },
  { label: 'Sweet & Gourmand', href: '/shop?cat=Sweet%20%26%20Gourmand', tone: 'sweet' },
  { label: 'Gift Sets', href: '/shop?cat=Gift%20Sets', tone: 'amber' },
] as const

const CATEGORY_GRADIENTS: Record<string, string> = {
  oud: 'linear-gradient(135deg,#2a1c08,#6b3d12 55%,#241405)',
  fresh: 'linear-gradient(135deg,#0e2f36,#5aa0a0 55%,#123038)',
  sweet: 'linear-gradient(135deg,#2e1a0e,#c98a3d 55%,#3a2412)',
  amber: 'linear-gradient(135deg,#241a0e,#8a5a13 55%,#d9a441)',
}

const CATEGORY_PHOTOGRAPHY: Record<string, { src: string; position: string }> = {
  'Best Sellers': { src: '/hero-spray.jpg', position: 'center 58%' },
  'New Arrivals': { src: '/hero-perfume-mist.png', position: 'center 48%' },
  'Oud & Amber': { src: '/hero-spray.jpg', position: 'left 50%' },
  'Fresh & Floral': { src: '/hero-perfume-mist.png', position: 'right 45%' },
  'Sweet & Gourmand': { src: '/hero-perfume-mist.png', position: 'center 60%' },
  'Gift Sets': { src: '/hero-spray.jpg', position: 'right 55%' },
}

function getFirstImage(p: any) {
  const v = p?.images
  if (Array.isArray(v) && typeof v[0] === 'string' && v[0].trim()) return v[0]
  if (typeof v === 'string' && v.trim()) return v
  return null
}

function normalizeProducts(raw: any): any[] {
  if (Array.isArray(raw)) return raw
  if (raw && Array.isArray(raw.products)) return raw.products
  return []
}

export default async function HomePage() {
  let products: any[] = []
  try {
    products = normalizeProducts(await getProducts())
  } catch {
    products = []
  }

  const categoryImages = CATEGORY_CARDS.map((card) => {
    const match = products.find((p) => {
      const category = p?.Category?.name || p?.categoryName || p?.category || ''
      if (card.label === 'Best Sellers') return Boolean(p?.isFeatured)
      if (card.label === 'New Arrivals') return Boolean(p?.isNew)
      return String(category).toLowerCase().includes(card.label.replace(' & ', ' ').split(' ')[0].toLowerCase())
    })
    return {
      ...card,
      imageUrl: getFirstImage(match),
      photography: CATEGORY_PHOTOGRAPHY[card.label],
    }
  })

  const featured = products.filter((p) => p?.isFeatured || p?.isBestSeller).slice(0, 8)
  const newArrivals = products.filter((p) => p?.isNew).slice(0, 8)

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
            Curated from the live catalogue with premium fragrance photography; real product images take priority whenever available.
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.imageUrl || c.photography.src}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
                style={{ objectPosition: c.imageUrl ? 'center' : c.photography.position }}
                loading="lazy"
              />
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

      {featured.length > 0 && <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"> ... </section>}
      {newArrivals.length > 0 && <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8"> ... </section>}
    </main>
  )
}
