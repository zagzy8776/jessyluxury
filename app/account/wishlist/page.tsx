'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { useCart } from '@/components/CartProvider'
import { products as fallbackProducts } from '@/lib/products'

export default function WishlistPage() {
  const { wishlist } = useCart()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) setProducts(data)
        else setProducts(fallbackProducts)
      } catch {
        setProducts(fallbackProducts)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const wished = products.filter((p) => wishlist.includes(p.id))

  return (
    <main className="min-h-[80vh] bg-[var(--bg-primary)] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="border-b border-[var(--border)] pb-6">
          <p className="eyebrow">Saved for later</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">My Wishlist</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {wishlist.length === 0
              ? 'Fragrances you save will appear here.'
              : `${wishlist.length} treasured ${wishlist.length === 1 ? 'piece' : 'pieces'}`}
          </p>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-[4/5]" />
                <div className="skeleton mt-3 h-3 w-16" />
                <div className="skeleton mt-2 h-5 w-32" />
              </div>
            ))}
          </div>
        ) : wished.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card-bg)] px-6 py-20 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <Heart size={26} />
            </span>
            <p className="mt-4 font-display text-2xl font-bold">Your wishlist is empty</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-[var(--text-muted)]">
              Tap the heart on any fragrance to keep it here for later.
            </p>
            <Link href="/shop" className="btn-primary mt-6 !px-7 !py-3.5">
              Discover fragrances
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
            {wished.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
