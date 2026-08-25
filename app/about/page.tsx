import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowRight, BadgeCheck, Gem, HeartHandshake, ShieldCheck } from 'lucide-react'
import Bottle from '@/components/Bottle'
import { site, wa } from '@/lib/site'

export const metadata: Metadata = {
  title: 'About Jessy Luxury | Authentic Fragrances in Owerri, Nigeria',
  description: 'Learn about Jessy Luxury Fragrance — 100% authentic designer and Arabian perfumes, oils, and gift sets. Based in Owerri, Imo State, Nigeria. Over 10 years of fragrance expertise.',
  keywords: [
    'Jessy Luxury about',
    'fragrance retailer Owerri',
    'authentic perfumes Nigeria',
    'Jessy Luxury story',
    'luxury perfume store',
  ],
  openGraph: {
    title: 'About Jessy Luxury Fragrance',
    description: 'Authentic designer and Arabian fragrances from Owerri, Nigeria. Personal curation, 100% genuine products, WhatsApp service.',
    url: 'https://jessyluxury.com/about',
    type: 'website',
    images: [
      {
        url: 'https://jessyluxury.com/logo.png.jpeg',
        width: 1200,
        height: 630,
        alt: 'Jessy Luxury Fragrance - Owerri',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Jessy Luxury | Authentic Fragrances',
    description: 'Learn our story — 100% authentic designer and Arabian perfumes in Owerri, Nigeria.',
    images: ['https://jessyluxury.com/logo.png.jpeg'],
  },
  alternates: {
    canonical: 'https://jessyluxury.com/about',
  },
}

const values = [
  { icon: ShieldCheck, t: '100% Authentic', d: 'Every piece is sourced from trusted distributors — no fakes, ever.' },
  { icon: Gem, t: 'Personal Curation', d: 'We help you pick scents that fit your personality and lifestyle.' },
  { icon: HeartHandshake, t: 'Human Service', d: 'Real recommendations over WhatsApp, before you spend a kobo.' },
]

export default function AboutPage() {
  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="text-[10px] font-bold tracking-[0.26em] text-amber-500">ABOUT US</p>
          <h1 className="mt-3 font-display text-5xl font-bold text-[var(--text-primary)] sm:text-6xl">The {site.brand} Story</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)] font-medium">
            Luxury is not about noise — it is about how you show up.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl leading-tight font-bold text-[var(--text-primary)] sm:text-5xl">
              A fragrance should feel like <span className="text-amber-500 italic">part of your identity</span>.
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--text-secondary)] font-medium">
              <p>
                {site.brand} was built for people who want to smell expensive without sounding loud.
                We curate original designer and Arabian fragrances, oil perfumes, body mists and
                gift sets — testing and selecting each one so you never buy a regret.
              </p>
              <p>
                We are based in {site.location}, serving customers across Nigeria with WhatsApp
                ordering, ready-to-ship stock and careful delivery.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {(site.describers as string[]).map((d) => (
                <span key={d} className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card-bg)] px-4 py-2 text-[11px] font-bold tracking-[0.08em] text-[var(--text-primary)] shadow-sm">
                  <BadgeCheck size={14} className="text-amber-500" /> {d}
                </span>
              ))}
            </div>
          </div>
          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br from-amber-500/10 via-[var(--card-bg)] to-amber-500/5 shadow-sm">
            <div className="grain absolute inset-0 opacity-30" />
            <div className="absolute h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png.jpeg" 
              alt="Jessy Luxury Fragrance Logo" 
              className="relative h-64 w-auto max-w-full rounded-2xl object-contain drop-shadow-2xl" 
            />
          </div>
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.t} className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-sm">
              <span className="rounded-full bg-amber-500/10 p-3.5 text-amber-500 inline-block">
                <v.icon size={22} />
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold text-[var(--text-primary)]">{v.t}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] font-medium">{v.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-6 rounded-3xl border border-amber-500/30 bg-[var(--card-bg)] p-10 text-center sm:flex-row sm:text-left shadow-sm">
          <div>
            <h3 className="font-display text-3xl font-bold text-[var(--text-primary)]">Ready to find your scent?</h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)] font-medium">Start with the finder or talk to us directly.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/perfume-finder" className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-4 text-xs font-bold tracking-[0.12em] text-stone-950 transition hover:bg-amber-400 shadow-md">
              TAKE THE QUIZ <ArrowRight size={14} />
            </Link>
            <a href={wa('Hello Jessy Luxury! I\'d like to know more.')} target="_blank" rel="noreferrer" className="rounded-full bg-emerald-600 px-7 py-4 text-xs font-bold tracking-[0.12em] text-white transition hover:bg-emerald-500 shadow-md">
              CHAT ON WHATSAPP
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}