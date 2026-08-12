'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ShieldCheck, Truck, MessageCircle, Heart, ArrowLeft, Plus, Minus, Check } from 'lucide-react'
import Bottle from '@/components/Bottle'
import { useCart } from '@/components/CartProvider'
import { wa } from '@/lib/site'

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  // Review form state
  const [revName, setRevName] = useState('')
  const [revRating, setRevRating] = useState(5)
  const [revComment, setRevComment] = useState('')
  const [submittingRev, setSubmittingRev] = useState(false)

  const { add, setDrawer, toggleWish, wishlist } = useCart()

  useEffect(() => {
    fetchProduct()
  }, [id])

  async function fetchProduct() {
    try {
      const res = await fetch(`/api/products/${id}`)
      const data = await res.json()
      if (res.ok && data) setProduct(data)
    } catch (e) {
      console.error('Error loading product details', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!revName || !revComment) return
    setSubmittingRev(true)

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerName: revName,
          rating: revRating,
          comment: revComment,
        }),
      })
      setRevName('')
      setRevComment('')
      fetchProduct()
    } catch (err) {
      console.error('Error submitting review', err)
    } finally {
      setSubmittingRev(false)
    }
  }

  if (loading) {
    return <div className="bg-[var(--bg-primary)] py-32 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Loading fragrance details…</div>
  }

  if (!product) {
    return (
      <div className="bg-[var(--bg-primary)] py-32 text-center text-[var(--text-secondary)] font-medium">
        <p>Fragrance not found.</p>
        <Link href="/shop" className="mt-4 inline-block text-xs font-bold text-amber-500 underline">
          Back to Shop
        </Link>
      </div>
    )
  }

  const isWished = wishlist.includes(product.id)
  const price = product.salePrice ?? product.price

  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)] pb-24">
      <div className="mx-auto max-w-7xl px-6 pt-8 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-[var(--text-secondary)] transition hover:text-amber-500 mb-8"
        >
          <ArrowLeft size={16} /> BACK TO CATALOGUE
        </Link>

        <div className="grid gap-12 lg:grid-cols-2 items-start">
          {/* Left Column: Image or Bottle Display */}
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] flex items-center justify-center p-8 shadow-sm">
            <div className="grain absolute inset-0 opacity-30" />
            {product.badge && (
              <span className="absolute left-6 top-6 z-10 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold tracking-widest text-stone-950">
                {product.badge}
              </span>
            )}
            <button
              onClick={() => toggleWish(product.id)}
              className="absolute right-6 top-6 z-10 rounded-full bg-white/80 border border-stone-200 p-3 shadow-xs transition hover:scale-110"
            >
              <Heart size={18} className={isWished ? 'fill-amber-500 text-amber-500' : 'text-stone-600'} />
            </button>

            {product.images && product.images.length > 0 ? (
              <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover rounded-2xl" />
            ) : (
              <div className="scale-125">
                <Bottle tone={product.tone || 'amber'} />
              </div>
            )}
          </div>

          {/* Right Column: Product Specs & Scent Pyramid */}
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase font-bold tracking-widest text-[var(--text-muted)]">
                {product.brand} • {product.volume}
              </p>
              <h1 className="mt-2 font-display text-4xl font-bold text-[var(--text-primary)] sm:text-5xl">{product.name}</h1>

              <div className="mt-3 flex items-center gap-3">
                <span className="font-display text-3xl font-bold text-amber-500">
                  ₦{price.toLocaleString('en-NG')}
                </span>
                {product.salePrice != null && product.salePrice < product.price && (
                  <span className="text-base text-[var(--text-muted)] line-through font-mono">
                    ₦{product.price.toLocaleString('en-NG')}
                  </span>
                )}
                <span className="ml-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  IN STOCK ({product.stock} left)
                </span>
              </div>
            </div>

            <p className="text-sm leading-7 text-[var(--text-secondary)] border-t border-[var(--border)] pt-4 font-medium">
              {product.description || `Experience the luxury of ${product.name} by ${product.brand}. Hand-selected authentic fragrance.`}
            </p>

            {/* Scent Pyramid Breakdown */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold tracking-widest text-amber-500 uppercase">Scent Notes Pyramid</h3>

              <div className="space-y-2 text-xs font-medium">
                {product.topNotes && (
                  <div className="flex gap-2">
                    <span className="font-bold text-[var(--text-primary)] w-24 shrink-0">Top Notes:</span>
                    <span className="text-[var(--text-secondary)]">{product.topNotes}</span>
                  </div>
                )}
                {product.middleNotes && (
                  <div className="flex gap-2">
                    <span className="font-bold text-[var(--text-primary)] w-24 shrink-0">Heart Notes:</span>
                    <span className="text-[var(--text-secondary)]">{product.middleNotes}</span>
                  </div>
                )}
                {product.baseNotes && (
                  <div className="flex gap-2">
                    <span className="font-bold text-[var(--text-primary)] w-24 shrink-0">Base Notes:</span>
                    <span className="text-[var(--text-secondary)]">{product.baseNotes}</span>
                  </div>
                )}
                {!product.topNotes && (
                  <div className="text-[var(--text-secondary)]">{product.notes}</div>
                )}
              </div>
            </div>

            {/* Add To Cart & WhatsApp Direct Purchase */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-1 shadow-sm">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-mono font-bold text-[var(--text-primary)]">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  onClick={() => {
                    add(product, qty)
                    setAdded(true)
                    setDrawer(true)
                    setTimeout(() => setAdded(false), 2000)
                  }}
                  className="flex-1 rounded-xl bg-amber-500 py-4 text-xs font-bold tracking-widest text-stone-950 transition hover:bg-amber-400 shadow-md shadow-amber-500/10 flex items-center justify-center gap-2"
                >
                  {added ? <Check size={16} /> : null}
                  {added ? 'ADDED TO CART' : 'ADD TO CART'}
                </button>
              </div>

              <a
                href={wa(`Hello Jessy Luxury! I want to order ${product.name} (${product.brand}, ${product.volume}) x${qty}. Price: ₦${price * qty}`)}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-xs font-bold tracking-widest text-white transition hover:bg-emerald-500 shadow-md"
              >
                <MessageCircle size={16} /> DIRECT ORDER ON WHATSAPP
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-[var(--border)] pt-5 text-xs text-[var(--text-secondary)] font-semibold">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-500" />
                <span>100% Original Authentic</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-amber-500" />
                <span>Same-day Owerri dispatch</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="mt-20 border-t border-[var(--border)] pt-14">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">Customer Reviews</h2>
              <p className="mt-1 text-xs text-[var(--text-secondary)] font-medium">Verified feedback from perfume collectors across Nigeria</p>

              <div className="mt-6 space-y-4">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev: any) => (
                    <div key={rev.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[var(--text-primary)]">{rev.customerName}</span>
                        <div className="flex text-amber-500 text-xs">
                          {'★'.repeat(rev.rating)}
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)] font-medium">"{rev.comment}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--text-muted)] font-medium">No reviews submitted yet for this fragrance.</p>
                )}
              </div>
            </div>

            {/* Leave a review form */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 sm:p-8 space-y-4 shadow-sm">
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">Leave a Review</h3>

              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-bold">Your Name</label>
                  <input
                    value={revName}
                    onChange={(e) => setRevName(e.target.value)}
                    placeholder="Adaeze O."
                    required
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 font-medium shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-bold">Rating (1 to 5 Stars)</label>
                  <select
                    value={revRating}
                    onChange={(e) => setRevRating(Number(e.target.value))}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-amber-500 outline-none focus:border-amber-500 font-bold shadow-sm"
                  >
                    <option value={5}>★★★★★ (5/5 Excellent)</option>
                    <option value={4}>★★★★☆ (4/5 Great)</option>
                    <option value={3}>★★★☆☆ (3/5 Average)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] mb-1 font-bold">Your Feedback / Review</label>
                  <textarea
                    value={revComment}
                    onChange={(e) => setRevComment(e.target.value)}
                    placeholder="How does the scent project? How long does it linger?"
                    rows={3}
                    required
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 resize-none font-medium shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingRev}
                  className="w-full rounded-xl bg-amber-500 py-3 text-xs font-bold tracking-widest text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10 disabled:opacity-50"
                >
                  {submittingRev ? 'SUBMITTING…' : 'POST REVIEW'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
