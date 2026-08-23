'use client'
import Link from 'next/link'
import { Heart, ShoppingBag, Star, ImageOff } from 'lucide-react'
import { useCart } from './CartProvider'
import type { Product } from '@/lib/products'
import { formatNaira } from '@/lib/products'

function getFirstImage(p: any): string | null {
  if (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) return p.images[0]
  if (typeof p.imageUrl === 'string' && p.imageUrl) return p.imageUrl
  if (typeof p.images === 'string') {
    try {
      const parsed = JSON.parse(p.images)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
    } catch {}
  }
  return null
}

function getRating(p: any): { avg: number; count: number } | null {
  const reviews = Array.isArray(p.reviews) ? p.reviews : []
  if (reviews.length === 0) return null
  const avg = reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length
  return { avg: Math.round(avg * 10) / 10, count: reviews.length }
}

export default function ProductCard({ p, showAdd = true }: { p: Product; showAdd?: boolean }) {
  const { add, wishlist, toggleWish, setDrawer } = useCart()
  const wished = wishlist.includes(p.id)
  const hasSale = p.salePrice != null && p.salePrice < p.price
  const price = (p as any).displayPrice ?? p.salePrice ?? p.price
  const save = hasSale ? p.price - (p.salePrice as number) : 0
  const imageUrl = getFirstImage(p as any)
  const rating = getRating(p)
  const outOfStock = (p as any).stock === 0

  const badge =
    p.badge === 'SALE'
      ? { label: 'SALE', cls: 'bg-[#b3372f] text-white' }
      : p.badge === 'BEST'
      ? { label: 'BEST SELLER', cls: 'bg-[var(--champagne)] text-[#241a08]' }
      : p.badge === 'NEW'
      ? { label: 'NEW', cls: 'bg-[var(--accent)] text-white' }
      : p.badge
      ? { label: p.badge, cls: 'bg-[var(--champagne-soft)] text-[#7a5c22] border border-[var(--champagne)]/40' }
      : null

  return (
    <article className="group flex h-full flex-col">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-card transition duration-300 group-hover:-translate-y-1 group-hover:shadow-card-hover">
        <Link href={`/shop/${p.id}`} className="relative block aspect-[4/5] cursor-pointer" aria-label={p.name}>
          {p.badge && (
            <span className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.16em] ${badge!.cls}`}>
              {badge!.label}
            </span>
          )}

          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={p.name} className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]" loading="lazy" />
          ) : (
            <span className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--bg-secondary)] text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-[var(--border)] text-[var(--text-muted)]">
                <ImageOff size={22} />
              </span>
              <span className="px-6 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Product image unavailable</span>
            </span>
          )}

          {outOfStock && (
            <span className="absolute inset-x-0 bottom-0 z-10 bg-stone-950/70 py-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-sm">Sold out</span>
          )}
        </Link>

        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleWish(p.id)
          }}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-3 top-3 z-10 rounded-full border border-[var(--border)] bg-white/90 p-2 shadow-sm backdrop-blur transition hover:scale-110"
        >
          <Heart size={15} className={wished ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-stone-600'} />
        </button>

        {showAdd && !outOfStock && (
          <div className="absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block">
            <button
              onClick={() => {
                add(p)
                setDrawer(true)
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-plum transition hover:bg-[var(--accent-strong)]"
            >
              <ShoppingBag size={13} /> Add to cart
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-0.5 pt-3.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">{p.brand} · {p.volume}</p>
        <Link href={`/shop/${p.id}`} className="mt-1 block font-display text-lg font-bold leading-snug text-[var(--text-primary)] transition hover:text-[var(--accent)]">{p.name}</Link>

        {rating ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
            <Star size={12} className="fill-[var(--champagne)] text-[var(--champagne)]" />
            <span className="font-bold text-[var(--text-secondary)]">{rating.avg}</span>
            <span>({rating.count})</span>
          </p>
        ) : (
          <p className="mt-1 truncate text-xs font-medium text-[var(--text-secondary)]">{p.notes}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-base font-bold tabular-nums text-[var(--accent)]">{formatNaira(price)}</span>
              {hasSale && <span className="text-xs tabular-nums text-[var(--text-muted)] line-through">{formatNaira(p.price)}</span>}
            </div>
            {hasSale && <span className="mt-1 inline-block rounded-full bg-[var(--champagne-soft)] px-2 py-0.5 text-[9px] font-bold tracking-[0.08em] text-[#7a5c22]">SAVE {formatNaira(save)}</span>}
          </div>

          {showAdd && !outOfStock && (
            <button
              onClick={() => {
                add(p)
                setDrawer(true)
              }}
              aria-label={`Add ${p.name} to cart`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-plum transition active:scale-95 sm:hidden"
            >
              <ShoppingBag size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
