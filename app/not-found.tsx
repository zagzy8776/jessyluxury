import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-md text-center space-y-6">
        <p className="text-[10px] font-bold tracking-[0.24em] text-amber-500 uppercase">404 PAGE NOT FOUND</p>

        <h1 className="font-display text-5xl font-bold text-[var(--text-primary)]">
          Page Not Found
        </h1>

        <p className="text-xs leading-6 text-[var(--text-secondary)] font-medium">
          The page or product you are looking for doesn't exist or may have been moved.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md"
          >
            <ArrowLeft size={15} /> Back to Home
          </Link>

          <Link
            href="/shop"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-6 py-3.5 text-xs font-bold text-[var(--text-primary)] hover:border-amber-500 transition shadow-sm"
          >
            <ShoppingBag size={15} /> Shop Collection
          </Link>
        </div>
      </div>
    </div>
  )
}
