'use client'
import { useState } from 'react'
import { ChevronDown, Newspaper } from 'lucide-react'
import { wa } from '@/lib/site'

const posts = [
  {
    slug: 'how-to-choose-a-signature-scent',
    title: 'How to Choose a Signature Scent',
    excerpt:
      'Your signature scent is the fragrance people remember you by. Here is a simple five-step method to find yours — start with mood, then budget, then strength.',
    content: [
      'Start with how you want to feel — fresh, warm, bold or soft.',
      'Set a budget that feels comfortable; great scents exist at every price.',
      'Test strength preference: close-to-skin oils vs. projecting EDPs.',
      'Match the occasion you wear it for most — office, evenings or everyday.',
      'When in doubt, message us on WhatsApp with your mood and we will point you right.',
    ],
  },
  {
    slug: 'perfume-oils-vs-edp',
    title: 'Perfume Oils vs EDP: Which Is Right for You?',
    excerpt:
      'Both have fans for good reasons. Oils sit close to the skin and last quietly; sprays project and announce you. Learn which to choose.',
    content: [
      'Oil perfumes are alcohol-free, intimate and excellent for office and warm weather.',
      'EDPs (eau de parfum) project more and trail beautifully for events and evenings.',
      'Many collectors own both — an oil for day-to-day, an EDP for statement moments.',
      'Ask about layering: an oil base under an EDP extends both lasting power and depth.',
    ],
  },
  {
    slug: 'best-perfumes-for-hot-nigerian-weather',
    title: 'Best Perfumes for Hot Nigerian Weather',
    excerpt:
      'Heat changes how a fragrance behaves. For warm weather, fresh, citrus and aquatic notes stay clean while heavy ouds may feel overwhelming mid-day.',
    content: [
      'Choose fresh, citrus and aquatic profiles for daytime comfort.',
      'Moderate your sprays — two to three in hot weather is plenty.',
      'Light body mists are perfect for layering when you want subtle refreshment.',
      'Keep your fragrance in a cool, dark place; heat dulls top notes fast.',
    ],
  },
]

export default function BlogPage() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <main className="bg-stone-950">
      <section className="relative overflow-hidden border-b border-stone-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.26em] text-amber-400">
            <Newspaper size={14} /> SCENT NOTES
          </p>
          <h1 className="mt-3 font-display text-5xl text-stone-50 sm:text-6xl">The Journal</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-400">
            Perfume advice, guides and stories from the world of fragrance.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14 lg:px-8">
        <div className="space-y-4">
          {posts.map((post) => {
            const isOpen = open === post.slug
            return (
              <article key={post.slug} className="overflow-hidden rounded-3xl border border-stone-800 bg-stone-900/50">
                <button
                  onClick={() => setOpen(isOpen ? null : post.slug)}
                  className="flex w-full items-start justify-between gap-4 p-6 text-left sm:p-8"
                >
                  <div>
                    <h2 className="font-display text-2xl text-stone-50">{post.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-500">{post.excerpt}</p>
                  </div>
                  <ChevronDown size={20} className={`mt-1 shrink-0 text-amber-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="border-t border-stone-800 px-6 pb-8 pt-5 sm:px-8">
                    <ol className="space-y-3">
                      {post.content.map((line, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm leading-6 text-stone-300">
                          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-400">
                            {i + 1}
                          </span>
                          {line}
                        </li>
                      ))}
                    </ol>
                    <a
                      href={wa('Hello! I read your journal article and have a question.')}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 inline-block text-xs font-semibold tracking-[0.1em] text-amber-300 transition hover:text-amber-200"
                    >
                      ASK US ABOUT THIS →
                    </a>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
    </main>
  )
}