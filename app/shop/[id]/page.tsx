'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldCheck, Truck, MessageCircle, Heart, ArrowLeft, Plus, Minus, Check,
  Star, RotateCcw, BadgeCheck, Sparkles, PackageSearch, ImageOff,
} from 'lucide-react'
import ProductCard from '@/components/ProductCard'
import { useCart } from '@/components/CartProvider'
import { wa } from '@/lib/site'
import { formatNaira } from '@/lib/products'

function RatingStars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(value) ? 'fill-[var(--champagne)] text-[var(--champagne)]' : 'text-[var(--border)]'} />
      ))}
    </span>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [revName, setRevName] = useState('')
  const [revRating, setRevRating] = useState(5)
  const [revComment, setRevComment] = useState('')
  const [submittingRev, setSubmittingRev] = useState(false)

  const { add, setDrawer, toggleWish, wishlist } = useCart()

  useEffect(() => {
    fetchProduct()
    window.scrollTo({ top: 0 })
  }, [id])

  async function fetchProduct() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/products/${id}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok || !data || data.error) {
        setProduct(null)
        setRelated([])
        setError(true)
        return
      }

      setProduct(data)
      setActiveImage(0)

      try {
        const allRes = await fetch('/api/products', { cache: 'no-store' })
        const all = await allRes.json()
        if (Array.isArray(all)) {
          const catName = typeof data.category === 'object' ? data.category?.name : data.category
          setRelated(
            all
              .filter((p: any) => p.id !== data.id && (typeof p.category === 'object' ? p.category?.name : p.category) === catName)
              .slice(0, 4)
          )
        }
      } catch {
        setRelated([])
      }
    } catch (e) {
      console.error('Error loading product details', e)
      setProduct(null)
      setRelated([])
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!product) return
    const el = document.getElementById('purchase-block')
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [product])

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!revName || !revComment) return
    setSubmittingRev(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, customerName: revName, rating: revRating, comment: revComment }),
      })
      if (!res.ok) throw new Error('Failed to submit review')
      setRevName('')
      setRevComment('')
      await fetchProduct()
    } catch (err) {
      console.error('Error submitting review', err)
    } finally {
      setSubmittingRev(false)
    }
  }

  if (loading) {
    return (
      <main className="bg-[var(--bg-primary)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-2 lg:px-8">
          <div className="skeleton aspect-square max-w-lg" />
          <div className="space-y-4 pt-4">
            <div className="skeleton h-3 w-24" /><div className="skeleton h-10 w-3/4" /><div className="skeleton h-8 w-40" />
            <div className="skeleton h-24 w-full" /><div className="skeleton h-14 w-full" /><div className="skeleton h-14 w-full" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[var(--bg-primary)] px-6 text-center">
        <div>
          <PackageSearch size={36} className="mx-auto text-[var(--text-muted)]" />
          <p className="mt-4 font-display text-2xl font-bold">Fragrance not found</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">It may have sold out, been moved, or the catalogue is temporarily unavailable.</p>
          <Link href="/shop" className="btn-primary mt-6 !px-6 !py-3">Back to shop</Link>
        </div>
      </main>
    )
  }

  const isWished = wishlist.includes(product.id)
  const hasSale = product.salePrice != null && product.salePrice < product.price
  const price = product.displayPrice ?? product.salePrice ?? product.price
  const save = hasSale ? product.price - product.salePrice : 0
  const images: string[] = Array.isArray(product.images) && product.images.length > 0 ? product.images : []
  const reviews = Array.isArray(product.reviews) ? product.reviews : []
  const avgRating = reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length : null
  const outOfStock = product.stock === 0
  const noteRows = [
    { label: 'Top', value: product.topNotes },
    { label: 'Heart', value: product.middleNotes },
    { label: 'Base', value: product.baseNotes },
  ].filter((r) => r.value)

  return (
    <main className="bg-[var(--bg-primary)] pb-28 text-[var(--text-primary)] lg:pb-0">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
          <Link href="/shop" className="inline-flex items-center gap-1.5 transition hover:text-[var(--accent)]"><ArrowLeft size={14} /> Shop</Link>
          <span>/</span><span className="truncate text-[var(--text-secondary)]">{product.name}</span>
        </nav>

        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] shadow-card">
              {product.badge && (
                <span className="absolute left-5 top-5 z-10 rounded-full bg-[var(--champagne)] px-3 py-1 text-[10px] font-bold tracking-[0.16em] text-[#241a08]">
                  {product.badge === 'BEST' ? 'BEST SELLER' : product.badge}
                </span>
              )}
              <button onClick={() => toggleWish(product.id)} aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'} className="absolute right-5 top-5 z-10 rounded-full border border-[var(--border)] bg-white/90 p-3 shadow-sm backdrop-blur transition hover:scale-110">
                <Heart size={18} className={isWished ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-stone-600'} />
              </button>

              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={images[Math.min(activeImage, images.length - 1)]} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[var(--bg-secondary)] text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-[var(--border)] text-[var(--text-muted)]"><ImageOff size={24} /></span>
                  <span className="px-8 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">Product photography unavailable</span>
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto hide-scrollbar">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} aria-label={`View image ${i + 1}`} className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${activeImage === i ? 'border-[var(--accent)]' : 'border-[var(--border)] opacity-70 hover:opacity-100'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-7">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">{product.brand} · {product.volume}</p>
              <h1 className="mt-2 font-display text-4xl font-bold leading-tight sm:text-5xl">{product.name}</h1>
              {avgRating != null && (
                <p className="mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]"><RatingStars value={avgRating} /><span className="font-bold text-[var(--text-secondary)]">{avgRating.toFixed(1)}</span><span>· {reviews.length} review{reviews.length === 1 ? '' : 's'}</span></p>
              )}
              <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className={`font-display text-4xl font-bold tabular-nums ${hasSale ? 'text-[#b3372f]' : 'text-[var(--accent)]'}`}>{formatNaira(price)}</span>
                {hasSale && <><span className="text-base tabular-nums text-[var(--text-muted)] line-through">{formatNaira(product.price)}</span><span className="rounded-full bg-[var(--champagne-soft)] px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] text-[#7a5c22]">SAVE {formatNaira(save)}</span></>}
              </div>
              <p className="mt-3">
                {outOfStock ? <span className="inline-flex items-center gap-1.5 rounded-full border border-[#b3372f]/30 bg-[#b3372f]/10 px-3 py-1 text-[11px] font-bold text-[#b3372f]">Out of stock</span> : product.stock <= 5 ? <span className="live-dot mr-2 inline-block" /> : null}
                {!outOfStock && <span className="text-xs font-semibold text-[var(--success)]">In stock{product.stock <= 5 ? ` — only ${product.stock} left` : ''}</span>}
              </p>
            </div>

            {product.description && <p className="border-t border-[var(--border)] pt-5 text-sm leading-7 text-[var(--text-secondary)]">{product.description}</p>}

            <div id="purchase-block" className="scroll-mt-24 space-y-3 border-t border-[var(--border)] pt-6">
              <div className="flex items-stretch gap-3">
                <div className="flex items-center rounded-full border border-[var(--border)] bg-[var(--card-bg)] px-1.5 shadow-card">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-2.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-30" disabled={qty <= 1} aria-label="Decrease quantity"><Minus size={15} /></button>
                  <span className="w-8 text-center text-sm font-bold tabular-nums">{qty}</span>
                  <button onClick={() => setQty(Math.min(Math.max(product.stock, 1), qty + 1))} className="p-2.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] disabled:opacity-30" disabled={outOfStock || qty >= product.stock} aria-label="Increase quantity"><Plus size={15} /></button>
                </div>
                <button onClick={() => { add(product, qty); setAdded(true); setDrawer(true); setTimeout(() => setAdded(false), 2000) }} disabled={outOfStock} className="btn-primary flex-1 !py-4">{added ? <Check size={16} /> : null}{added ? 'Added to cart' : outOfStock ? 'Sold out' : 'Add to Cart'}</button>
              </div>

              <button onClick={() => { add(product, qty); setDrawer(true) }} disabled={outOfStock} className="btn-dark w-full !py-4">Buy Now</button>
              <a href={wa(`Hello Jessy Luxury! I want to order ${product.name} (${product.brand}, ${product.volume}) x${qty}. Price: ${formatNaira(price * qty)}`)} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-full border border-emerald-600/40 bg-emerald-50 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300"><MessageCircle size={15} /> Order via WhatsApp</a>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card sm:grid-cols-2">
              {[
                { icon: BadgeCheck, t: '100% Authentic', d: 'Original fragrances, guaranteed genuine.' },
                { icon: Truck, t: 'Fast Delivery', d: 'Same-day Owerri dispatch · nationwide waybill.' },
                { icon: ShieldCheck, t: 'Secure Checkout', d: 'Order confirmation via WhatsApp & email.' },
                { icon: RotateCcw, t: 'Easy Exchanges', d: 'Sealed products eligible for exchange.' },
              ].map((f) => (
                <div key={f.t} className="flex items-start gap-3"><f.icon size={17} className="mt-0.5 shrink-0 text-[var(--accent)]" /><div><p className="text-xs font-bold text-[var(--text-primary)]">{f.t}</p><p className="mt-0.5 text-[11px] leading-4 text-[var(--text-muted)]">{f.d}</p></div></div>
              ))}
            </div>

            {(noteRows.length > 0 || product.notes) && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card">
                <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]"><Sparkles size={14} /> Fragrance Notes</h3>
                <div className="mt-4 space-y-3">
                  {noteRows.length > 0 ? noteRows.map((r, i) => (
                    <div key={r.label} className="flex items-start gap-3">
                      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${['bg-[var(--accent)] text-white', 'bg-[var(--accent)]/15 text-[var(--accent)]', 'bg-[var(--champagne-soft)] text-[#7a5c22]'][i]}`}>{i + 1}</span>
                      <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">{r.label} notes</p><p className="text-sm font-medium text-[var(--text-primary)]">{r.value}</p></div>
                    </div>
                  )) : <p className="text-sm text-[var(--text-secondary)]">{product.notes}</p>}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="mt-16 border-t border-[var(--border)] pt-12 sm:mt-20">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow">Verified feedback</p>
              <h2 className="mt-2 font-display text-3xl font-bold">Customer Reviews</h2>
              {avgRating != null && <div className="mt-4 flex items-center gap-3"><span className="font-display text-4xl font-bold">{avgRating.toFixed(1)}</span><div><RatingStars value={avgRating} size={15} /><p className="mt-0.5 text-xs text-[var(--text-muted)]">{reviews.length} review{reviews.length === 1 ? '' : 's'}</p></div></div>}
              <div className="mt-6 space-y-4">
                {reviews.length > 0 ? reviews.map((rev: any) => (
                  <div key={rev.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card"><div className="flex items-center justify-between gap-3"><span className="text-sm font-bold text-[var(--text-primary)]">{rev.customerName}</span><RatingStars value={rev.rating} /></div><p className="mt-2 text-xs leading-6 text-[var(--text-secondary)]">&ldquo;{rev.comment}&rdquo;</p></div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center"><p className="font-display text-lg font-bold text-[var(--text-primary)]">No reviews yet</p><p className="mt-1 text-xs text-[var(--text-muted)]">Be the first to share how this scent wears.</p></div>
                )}
              </div>
            </div>

            <div className="h-fit rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-card sm:p-8">
              <h3 className="font-display text-xl font-bold">Leave a Review</h3>
              <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4 text-xs">
                <div><label className="mb-1.5 block font-bold text-[var(--text-secondary)]">Your name</label><input value={revName} onChange={(e) => setRevName(e.target.value)} placeholder="Your name" required className="field-input" /></div>
                <div><label className="mb-1.5 block font-bold text-[var(--text-secondary)]">Rating</label><select value={revRating} onChange={(e) => setRevRating(Number(e.target.value))} className="field-input font-bold text-[var(--champagne)]"><option value={5}>★★★★★ (5/5 Excellent)</option><option value={4}>★★★★☆ (4/5 Great)</option><option value={3}>★★★☆☆ (3/5 Average)</option></select></div>
                <div><label className="mb-1.5 block font-bold text-[var(--text-secondary)]">Your review</label><textarea value={revComment} onChange={(e) => setRevComment(e.target.value)} placeholder="How does the scent project? How long does it linger?" rows={3} required className="field-input resize-none" /></div>
                <button type="submit" disabled={submittingRev} className="btn-primary w-full disabled:opacity-50">{submittingRev ? 'Submitting…' : 'Post review'}</button>
              </form>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-16 border-t border-[var(--border)] pt-12 sm:mt-20">
            <div className="mb-8 flex items-end justify-between">
              <div><p className="eyebrow">You may also love</p><h2 className="mt-2 font-display text-3xl font-bold">Complete the Collection</h2></div>
              <Link href="/shop" className="hidden shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)] transition hover:text-[var(--accent-strong)] sm:flex">View all →</Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">{related.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          </section>
        )}
      </div>

      {showStickyBar && !outOfStock && (
        <div className="fixed inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--card-bg)]/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(28,25,23,0.25)] backdrop-blur-md lg:hidden" style={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom))' }}>
          <div className="mx-auto flex max-w-lg items-center gap-3">
            <div className="min-w-0"><p className="truncate text-[11px] font-semibold text-[var(--text-muted)]">{product.name}</p><p className="text-base font-bold tabular-nums text-[var(--accent)]">{formatNaira(price * qty)}</p></div>
            <button onClick={() => { add(product, qty); setDrawer(true) }} className="btn-primary ml-auto shrink-0 !px-6 !py-3">Add to Cart</button>
          </div>
        </div>
      )}
    </main>
  )
}
