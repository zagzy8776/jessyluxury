'use client'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useCart } from './CartProvider'
import Bottle from './Bottle'
import type { Product } from '@/lib/products'
import { formatNaira } from '@/lib/products'

function getFirstImage(p: any): string | null {
  // Handle both array (from DB) and string formats
  if (Array.isArray(p.images) && p.images.length > 0 && p.images[0]) return p.images[0]
  if (typeof p.imageUrl === 'string' && p.imageUrl) return p.imageUrl
  // Handle JSON string stored in DB
  if (typeof p.images === 'string') {
    try {
      const parsed = JSON.parse(p.images)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]
    } catch {}
  }
  return null
}

export default function ProductCard({ p, showAdd = true }: { p: Product; showAdd?: boolean }) {
  const { add, wishlist, toggleWish, setDrawer } = useCart()
  const wished = wishlist.includes(p.id)
  const price = p.salePrice ?? p.price
  const imageUrl = getFirstImage(p as any)

  const badgeColor =
    p.badge === 'SALE'
      ? 'bg-red-600 text-white'
      : p.badge === 'BEST'
      ? 'bg-amber-500 text-stone-950'
      : p.badge === 'NEW'
      ? 'bg-green-500 text-stone-950'
      : 'bg-white/90 text-stone-900'

  // If out of stock (stock = 0), show disabled
  const outOfStock = (p as any).stock === 0

  return (
    <article className="group">
      <div className="relative overflow-hidden rounded-2xl bg-stone-900 shadow-card">
        <Link
          href={`/shop/${p.id}`}
          className="relative flex aspect-[4/5] items-center justify-center bg-gradient-to-b from-stone-800 to-stone-950 cursor-pointer block"
        >
          <div className="grain absolute inset-0 opacity-60" />
          {p.badge && (
            <span
              className={`absolute left-3 top-3 z-10 rounded-full px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] ${badgeColor}`}
            >
              {p.badge}
            </span>
          )}
          {outOfStock && (
            <span className="absolute right-3 bottom-3 z-10 rounded-full bg-stone-950/80 px-2.5 py-1 text-[9px] font-bold tracking-wider text-stone-400 border border-stone-700">
              OUT OF STOCK
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleWish(p.id)
            }}
            aria-label="Wishlist"
            className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-2 backdrop-blur transition hover:scale-110"
          >
            <Heart size={15} className={wished ? 'fill-amber-400 text-amber-400' : 'text-stone-300'} />
          </button>

          {imageUrl ? (
            <img
              src={imageUrl}
              alt={p.name}
              className="h-full w-full object-cover rounded-xl"
              loading="lazy"
            />
          ) : (
            <div className="scale-90 transition duration-700 group-hover:scale-100">
              <Bottle tone={p.tone} />
            </div>
          )}
        </Link>

        {showAdd && !outOfStock && (
          <div className="absolute inset-x-3 bottom-3 z-10 flex translate-y-2 flex-col gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={() => {
                add(p)
                setDrawer(true)
              }}
              className="w-full rounded-xl bg-amber-500 py-3 text-[10px] font-bold tracking-[0.16em] text-stone-950 transition hover:bg-amber-400"
            >
              ADD TO CART
            </button>
          </div>
        )}
      </div>

      <div className="pt-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-stone-500">
          {p.brand} · {p.volume}
        </p>
        <Link
          href={`/shop/${p.id}`}
          className="mt-1 font-display text-lg text-stone-100 hover:text-amber-400 transition block"
        >
          {p.name}
        </Link>
        <p className="mt-0.5 text-xs text-stone-500">{p.notes}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-amber-300">{formatNaira(price)}</span>
          {p.salePrice != null && p.salePrice < p.price && (
            <span className="text-xs text-stone-500 line-through">{formatNaira(p.price)}</span>
          )}
          {outOfStock && <span className="text-[10px] text-red-400 font-semibold">Sold Out</span>}
        </div>
      </div>
    </article>
  )
}
