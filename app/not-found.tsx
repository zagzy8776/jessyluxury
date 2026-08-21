import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-[75vh] items-center justify-center bg-[var(--bg-primary)] p-6 text-[var(--text-primary)]">
      <div className="max-w-md space-y-6 text-center">
        <p className="eyebrow">404 — Page not found</p>

        <h1 className="font-display text-5xl font-bold">This page has vanished</h1>

        <p className="text-xs font-medium leading-6 text-[var(--text-secondary)]">
          The page or product you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/" className="btn-dark !px-6 !py-3.5">
            <ArrowLeft size={15} /> Back to home
          </Link>

          <Link href="/shop" className="btn-outline !px-6 !py-3.5">
            <ShoppingBag size={15} /> Shop collection
          </Link>
        </div>
      </div>
    </div>
  )
}
