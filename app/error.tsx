'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Home } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-[var(--bg-primary)] p-6 text-[var(--text-primary)]">
      <div className="max-w-md space-y-6 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]">
          <RefreshCw size={26} />
        </div>

        <div>
          <h2 className="font-display text-3xl font-bold">Something went wrong</h2>
          <p className="mt-2 text-xs font-medium leading-6 text-[var(--text-secondary)]">
            An unexpected error occurred while loading this page. We&apos;ve logged the issue and you can try refreshing.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button onClick={() => reset()} className="btn-primary !px-6 !py-3">
            <RefreshCw size={14} /> Try again
          </button>

          <Link href="/" className="btn-outline !px-6 !py-3">
            <Home size={14} /> Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
