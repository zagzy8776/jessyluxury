import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  Truck,
} from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import Bottle from '@/components/Bottle'
import { products } from '@/lib/products'
import { site, wa } from '@/lib/site'

const featured = products.filter((p) => p.featured)

const categoryTiles = [
  { name: 'Oud & Amber', tone: 'oud', blurb: 'Bold, rich and grounding' },
  { name: 'Fresh', tone: 'fresh', blurb: 'Clean, crisp everyday wear' },
  { name: 'Sweet & Gourmand', tone: 'sweet', blurb: 'Warm, comforting and fun' },
  { name: 'Perfume Oils', tone: 'rose', blurb: 'Intimate close-to-skin luxury' },
  { name: 'Gift Sets', tone: 'amber', blurb: 'Curated, gift-ready boxes' },
  { name: 'Body Mists', tone: 'musk', blurb: 'Light layers for any moment' },
]

const testimonials = [
  { name: 'Adaeze O.', text: 'Ordered the Khair Pistachio — it arrived the same day and smells even better than I expected. Delivery was smooth.', role: 'Owerri' },
  { name: 'Chinedu K.', text: 'The perfume finder picked the Supremacy Collector for me and it is perfect. Exactly the confidence I wanted.', role: 'Nigeria' },
  { name: 'Amaka E.', text: 'Got the Signature Gift Set for my mum’s birthday. Beautiful presentation and authentic scents. Highly recommended!', role: 'Lagos' },
]

export default function Home() {
  return (
    <main className="bg-stone-950">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,163,93,0.16),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(120,60,20,0.18),transparent_55%)]" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-6 pb-20 pt-16 text-center lg:px-8 lg:pb-28 lg:pt-24">
          <div className="mx-auto max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-[10px] font-semibold tracking-[0.22em] text-amber-300">
              <Sparkles size={12} /> JESSY LUXURY FRAGRANCE
            </p>
            <h1 className="font-display text-6xl font-medium leading-[0.95] text-stone-50 sm:text-7xl lg:text-[92px]">
              Discover your <span className="text-amber-400 italic">signature</span> scent.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-stone-400">
              Experience luxury that lingers. Original designer and Arabian fragrances, oil
              perfumes and gift sets curated for confident everyday living — with personal
              WhatsApp ordering.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-4 text-xs font-bold tracking-[0.14em] text-stone-950 transition hover:bg-amber-400"
              >
                SHOP THE COLLECTION
                <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </Link>
              <a
                href={wa("Hello Jessy Luxury! I'd love some perfume recommendations.")}
                target="_blank"
                rel="noreferrer"
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
        </div>
      </section>
      {/* FEATURES STRIP */}
      <section className="border-y border-stone-800 bg-stone-900/40">
        <div className="mx-auto grid max-w-7xl divide-y divide-stone-800 px-6 sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:px-8">
          {[
            { icon: BadgeCheck, t: 'Authentic Selection', d: 'Original designer, Arabic and niche fragrances only.' },
            { icon: MessageCircle, t: 'WhatsApp Support', d: 'Talk to us personally before you order.' },
            { icon: Truck, t: 'Fast, Reliable Delivery', d: 'Pickup, Owerri delivery and waybill dispatch.' },
          ].map((f) => (
            <div key={f.t} className="flex items-start gap-4 px-2 py-8 sm:px-8">
              <span className="rounded-full bg-amber-500/10 p-3 text-amber-400">
                <f.icon size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold text-stone-100">{f.t}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold tracking-[0.24em] text-amber-400">CUSTOMER FAVOURITES</p>
            <h2 className="mt-3 font-display text-4xl text-stone-50 sm:text-5xl">Best Sellers</h2>
          </div>
          <Link href="/shop" className="group inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-stone-400 transition hover:text-amber-300">
            VIEW ALL <ArrowRight size={14} className="transition group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">
          {featured.slice(0, 4).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* COLLECTIONS */}
      <section className="border-y border-stone-800 bg-stone-900/30">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="mb-10 max-w-2xl">
            <p className="text-[10px] font-bold tracking-[0.24em] text-amber-400">SHOP BY MOOD</p>
            <h2 className="mt-3 font-display text-4xl text-stone-50 sm:text-5xl">Collections</h2>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              Explore by scent family — from deep ouds to crisp freshies and sweet gourmands.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {categoryTiles.map((c) => (
              <Link
                key={c.name}
                href={`/shop?cat=${encodeURIComponent(c.name)}`}
                className="group relative flex h-44 flex-col justify-end overflow-hidden rounded-2xl border border-stone-800 bg-gradient-to-b from-stone-800/60 to-stone-950 p-5 transition hover:border-amber-500/50"
              >
                <div className="absolute -right-4 -top-6 opacity-80 transition duration-700 group-hover:opacity-100">
                  <Bottle tone={c.tone} className="scale-[0.62] origin-top-right" />
                </div>
                <p className="font-display text-2xl text-stone-100">{c.name}</p>
                <p className="mt-1 text-xs text-stone-500">{c.blurb}</p>
                <span className="mt-3 text-[10px] font-bold tracking-[0.16em] text-amber-400 opacity-0 transition group-hover:opacity-100">
                  SHOP NOW →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      {/* FINDER TEASER */}
      <section className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,163,93,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="text-[10px] font-bold tracking-[0.26em] text-amber-400">NOT SURE WHAT TO CHOOSE?</p>
          <h2 className="mt-4 font-display text-5xl text-stone-50 sm:text-6xl">Find your signature scent.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-400">
            Answer a few quick questions and we will point you to the perfect bottle — or send your
            scent profile straight to our WhatsApp for a personal recommendation.
          </p>
          <div className="mt-9">
            <Link
              href="/perfume-finder"
              className="group inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-4 text-xs font-bold tracking-[0.14em] text-stone-950 transition hover:bg-amber-400"
            >
              TAKE THE QUIZ <ArrowRight size={15} className="transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* STORY TEASER */}
      <section className="border-t border-stone-800 bg-stone-900/30">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="relative flex min-h-[380px] items-center justify-center overflow-hidden rounded-3xl border border-stone-800 bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950">
            <div className="grain absolute inset-0" />
            <div className="absolute h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
            <img
              src="/logo.png.jpeg"
              alt="Jessy Luxury"
              className="relative h-40 w-auto rounded-2xl object-contain drop-shadow-2xl"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.24em] text-amber-400">ABOUT JESSY LUXURY</p>
            <h2 className="mt-3 font-display text-4xl leading-tight text-stone-50 sm:text-5xl">
              A fragrance should feel like part of your identity.
            </h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-stone-400">
              From carefully selected Arabic and designer fragrances to oils and gift sets, {site.brand}
              helps you choose a scent that fits your personality, occasion and lifestyle. We believe
              luxury is not about noise — it is about how you show up.
            </p>
            <Link href="/about" className="mt-7 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-amber-300 transition hover:text-amber-200">
              READ OUR STORY <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <div className="mb-10 text-center">
          <p className="text-[10px] font-bold tracking-[0.24em] text-amber-400">WHAT CUSTOMERS SAY</p>
          <h2 className="mt-3 font-display text-4xl text-stone-50 sm:text-5xl">Loved across Nigeria</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="rounded-2xl border border-stone-800 bg-stone-900/60 p-7">
              <div className="text-amber-400">★★★★★</div>
              <blockquote className="mt-4 text-sm leading-7 text-stone-300">“{t.text}”</blockquote>
              <figcaption className="mt-5">
                <p className="text-sm font-semibold text-stone-100">{t.name}</p>
                <p className="text-xs text-stone-500">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="border-t border-stone-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-14 text-center sm:flex-row sm:text-left lg:px-8">
          <div>
            <h3 className="font-display text-3xl text-stone-50">Smell expensive. Feel unforgettable.</h3>
            <p className="mt-2 text-sm text-stone-500">The full collection is one message away.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="rounded-full bg-amber-500 px-7 py-4 text-xs font-bold tracking-[0.12em] text-stone-950 transition hover:bg-amber-400">
              BROWSE THE SHOP
            </Link>
            <a href={wa("Hello Jessy Luxury! I'd like to place an order.")} target="_blank" rel="noreferrer" className="rounded-full bg-green-600 px-7 py-4 text-xs font-bold tracking-[0.12em] text-white transition hover:bg-green-500">
              ORDER ON WHATSAPP
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}