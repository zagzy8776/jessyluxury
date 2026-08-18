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
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-md text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <RefreshCw size={28} className="animate-spin-slow" />
        </div>

        <div>
          <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">Something went wrong</h2>
          <p className="mt-2 text-xs leading-6 text-[var(--text-secondary)] font-medium">
            An unexpected error occurred while loading this page. We've logged the issue and you can try refreshing.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md"
          >
            <RefreshCw size={14} /> Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-6 py-3 text-xs font-bold text-[var(--text-primary)] hover:border-amber-500 transition shadow-sm"
          >
            <Home size={14} /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
