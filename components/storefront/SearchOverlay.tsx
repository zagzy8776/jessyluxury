'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, Heart, PackageSearch } from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import Bottle from '@/components/Bottle'
import { formatNaira } from '@/lib/products'

function firstImage(p: any): string | null {
  if (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) return p.images[0]
  if (typeof p.imageUrl === 'string' && p.imageUrl) return p.imageUrl
  return null
}

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { wishlist, toggleWish } = useCart()

  useEffect(() => {
    if (!open) return
    setQ('')
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open || products.length > 0 || loading) return
    setLoading(true)
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setProducts(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, products.length, loading])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    return products
      .filter((p) =>
        `${p.name || ''} ${p.brand || ''} ${p.notes || ''}`.toLowerCase().includes(term)
      )
      .slice(0, 8)
  }, [q, products])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Search products">
      <div className="absolute inset-0 bg-stone-950/50 backdrop-blur-sm fade-in" onClick={onClose} />
      <div className="relative mx-auto mt-0 sm:mt-24 w-full sm:max-w-xl px-4 pt-20 sm:pt-0">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl animate-slide-up">
          {/* Input row */}
          <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
            <Search size={18} className="shrink-0 text-[var(--text-muted)]" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results.length > 0) {
                  router.push(`/shop/${results[0].id}`)
                  onClose()
                }
              }}
              placeholder="Search products…"
              className="w-full bg-transparent text-base text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
            />
            <button onClick={onClose} aria-label="Close search" className="rounded-full p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]">
              <X size={18} />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[55vh] overflow-y-auto">
            {q.trim() === '' ? (
              <div className="px-5 py-8 text-center">
                <p className="eyebrow">Popular searches</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['Oud', 'Gift Set', 'Perfume Oil', '9PM', 'Lattafa'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setQ(s)}
                      className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : loading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton h-14 w-14 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-3 w-2/3" />
                      <div className="skeleton h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <PackageSearch size={28} className="mx-auto text-[var(--text-muted)]" />
                <p className="mt-3 font-display text-lg font-bold text-[var(--text-primary)]">
                  We couldn&apos;t find that fragrance.
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Try a different name, brand or note.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border)]">
                {results.map((p) => {
                  const img = firstImage(p)
                  const price = p.displayPrice ?? p.salePrice ?? p.price
                  const wished = wishlist.includes(p.id)
                  return (
                    <li key={p.id}>
                      <Link
                        href={`/shop/${p.id}`}
                        onClick={onClose}
                        className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-[var(--bg-secondary)]"
                      >
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="scale-[0.22]">
                              <Bottle tone={p.tone} />
                            </span>
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">{p.name}</span>
                          <span className="block truncate text-xs text-[var(--text-muted)]">{p.brand}</span>
                        </span>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-[var(--accent)]">
                          {formatNaira(price)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleWish(p.id)
                          }}
                          aria-label="Toggle wishlist"
                          className="rounded-full border border-[var(--border)] bg-[var(--card-bg)] p-2 transition hover:border-[var(--accent)]"
                        >
                          <Heart size={14} className={wished ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-[var(--text-muted)]'} />
                        </button>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {q.trim() !== '' && results.length > 0 && (
            <Link
              href={`/shop?q=${encodeURIComponent(q.trim())}`}
              onClick={onClose}
              className="block border-t border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)] transition hover:bg-[var(--accent-soft)]"
            >
              View all results
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
