'use client'
import { Gift } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { products } from '@/lib/products'
import { wa } from '@/lib/site'

const gifts = products.filter((p) => p.gift)

export default function GiftsPage() {
  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.26em] text-amber-500">
            <Gift size={15} /> GIFT-READY
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold text-[var(--text-primary)] sm:text-6xl">Gifts &amp; Sets</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)] font-medium">
            Beautifully curated sets for birthdays, weddings, anniversaries and “just because”.
            We can wrap and add a note before delivery.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-3">
          {gifts.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
        <div className="mt-16 rounded-3xl border border-amber-500/30 bg-[var(--card-bg)] p-10 text-center shadow-sm">
          <h2 className="font-display text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">Need a custom gift box?</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--text-secondary)] font-medium">
            Tell us the occasion, budget and scent preference — we will curate a personal box
            and deliver it gift-ready.
          </p>
          <a
            href={wa("Hello Jessy Luxury! I'd like a custom gift box. Occasion: ___, Budget: ___, Scent preference: ___.")}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-xs font-bold tracking-[0.14em] text-white transition hover:bg-emerald-500 shadow-md"
          >
            REQUEST A CUSTOM BOX
          </a>
        </div>
      </section>
    </main>
  )
}