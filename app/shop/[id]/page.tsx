'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Star, ShieldCheck, Truck, MessageCircle, Heart, ArrowLeft, Plus, Minus, Check } from 'lucide-react'
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
    return <div className="bg-stone-950 py-32 text-center text-sm text-stone-500">Loading fragrance details…</div>
  }

  if (!product) {
    return (
      <div className="bg-stone-950 py-32 text-center text-stone-400">
        <p>Fragrance not found.</p>
        <Link href="/shop" className="mt-4 inline-block text-xs font-bold text-amber-400 underline">
          Back to Shop
        </Link>
      </div>
    )
  }

  const isWished = wishlist.includes(product.id)
  const price = product.salePrice ?? product.price

  return (
    <main className="bg-stone-950 pb-24">
      <div className="mx-auto max-w-7xl px-6 pt-8 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-stone-400 transition hover:text-amber-300 mb-8"
        >
          <ArrowLeft size={15} /> BACK TO CATALOGUE
        </Link>

        <div className="grid gap-12 lg:grid-cols-2 items-start">
          {/* Left Column: Image or Bottle Display */}
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-stone-800 bg-gradient-to-b from-stone-800/80 to-stone-950 flex items-center justify-center p-8">
            <div className="grain absolute inset-0" />
            {product.badge && (
              <span className="absolute left-6 top-6 z-10 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold tracking-widest text-stone-950">
                {product.badge}
              </span>
            )}
            <button
              onClick={() => toggleWish(product.id)}
              className="absolute right-6 top-6 z-10 rounded-full bg-black/40 p-3 backdrop-blur transition hover:scale-110"
            >
              <Heart size={18} className={isWished ? 'fill-amber-400 text-amber-400' : 'text-stone-300'} />
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
              <p className="text-xs uppercase font-bold tracking-widest text-stone-500">
                {product.brand} • {product.volume}
              </p>
              <h1 className="mt-2 font-display text-4xl font-medium text-stone-50 sm:text-5xl">{product.name}</h1>

              <div className="mt-3 flex items-center gap-3">
                <span className="font-display text-3xl font-bold text-amber-300">
                  ₦{price.toLocaleString('en-NG')}
                </span>
                {product.salePrice != null && product.salePrice < product.price && (
                  <span className="text-base text-stone-500 line-through font-mono">
                    ₦{product.price.toLocaleString('en-NG')}
                  </span>
                )}
                <span className="ml-auto rounded-full bg-green-500/10 border border-green-500/30 px-3 py-1 text-[10px] font-bold text-green-400">
                  IN STOCK ({product.stock} left)
                </span>
              </div>
            </div>

            <p className="text-sm leading-7 text-stone-400 border-t border-stone-800/80 pt-4">
              {product.description || `Experience the luxury of ${product.name} by ${product.brand}. Hand-selected authentic fragrance.`}
            </p>

            {/* Scent Pyramid Breakdown */}
            <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-5 space-y-3">
              <h3 className="text-xs font-bold tracking-widest text-amber-400 uppercase">Scent Notes Pyramid</h3>

              <div className="space-y-2 text-xs">
                {product.topNotes && (
                  <div className="flex gap-2">
                    <span className="font-semibold text-stone-300 w-24 shrink-0">Top Notes:</span>
                    <span className="text-stone-400">{product.topNotes}</span>
                  </div>
                )}
                {product.middleNotes && (
                  <div className="flex gap-2">
                    <span className="font-semibold text-stone-300 w-24 shrink-0">Heart Notes:</span>
                    <span className="text-stone-400">{product.middleNotes}</span>
                  </div>
                )}
                {product.baseNotes && (
                  <div className="flex gap-2">
                    <span className="font-semibold text-stone-300 w-24 shrink-0">Base Notes:</span>
                    <span className="text-stone-400">{product.baseNotes}</span>
                  </div>
                )}
                {!product.topNotes && (
                  <div className="text-stone-400">{product.notes}</div>
                )}
              </div>
            </div>

            {/* Add To Cart & WhatsApp Direct Purchase */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-xl border border-stone-700 bg-stone-900 p-1">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="p-2 text-stone-400 hover:text-white"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-mono text-stone-100">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    className="p-2 text-stone-400 hover:text-white"
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
                  className="flex-1 rounded-xl bg-amber-500 py-4 text-xs font-bold tracking-widest text-stone-950 transition hover:bg-amber-400 flex items-center justify-center gap-2"
                >
                  {added ? <Check size={16} /> : null}
                  {added ? 'ADDED TO CART' : 'ADD TO CART'}
                </button>
              </div>

              <a
                href={wa(`Hello Jessy Luxury! I want to order ${product.name} (${product.brand}, ${product.volume}) x${qty}. Price: ₦${price * qty}`)}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-xs font-bold tracking-widest text-white transition hover:bg-green-500"
              >
                <MessageCircle size={16} /> DIRECT ORDER ON WHATSAPP
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-stone-800/80 pt-5 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-amber-400" />
                <span>100% Original Authentic</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-amber-400" />
                <span>Same-day Owerri dispatch</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="mt-20 border-t border-stone-800 pt-14">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl text-stone-50">Customer Reviews</h2>
              <p className="mt-1 text-xs text-stone-400">Verified feedback from perfume collectors across Nigeria</p>

              <div className="mt-6 space-y-4">
                {product.reviews && product.reviews.length > 0 ? (
                  product.reviews.map((rev: any) => (
                    <div key={rev.id} className="rounded-2xl border border-stone-800 bg-stone-900/40 p-5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-stone-200">{rev.customerName}</span>
                        <div className="flex text-amber-400 text-xs">
                          {'★'.repeat(rev.rating)}
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-6 text-stone-400">"{rev.comment}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-stone-500">No reviews submitted yet for this fragrance.</p>
                )}
              </div>
            </div>

            {/* Leave a review form */}
            <div className="rounded-3xl border border-stone-800 bg-stone-900/40 p-6 sm:p-8 space-y-4">
              <h3 className="font-display text-xl text-stone-100">Leave a Review</h3>

              <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-stone-400 mb-1">Your Name</label>
                  <input
                    value={revName}
                    onChange={(e) => setRevName(e.target.value)}
                    placeholder="Adaeze O."
                    required
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Rating (1 to 5 Stars)</label>
                  <select
                    value={revRating}
                    onChange={(e) => setRevRating(Number(e.target.value))}
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-amber-300 outline-none focus:border-amber-500 font-bold"
                  >
                    <option value={5}>★★★★★ (5/5 Excellent)</option>
                    <option value={4}>★★★★☆ (4/5 Great)</option>
                    <option value={3}>★★★☆☆ (3/5 Average)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">Your Feedback / Review</label>
                  <textarea
                    value={revComment}
                    onChange={(e) => setRevComment(e.target.value)}
                    placeholder="How does the scent project? How long does it linger?"
                    rows={3}
                    required
                    className="w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingRev}
                  className="w-full rounded-xl bg-amber-500 py-3 text-xs font-bold tracking-widest text-stone-950 hover:bg-amber-400 transition disabled:opacity-50"
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
