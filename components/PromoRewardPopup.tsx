'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Copy, CheckCheck, Sparkles, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PromoRewardConfig {
  enabled: boolean
  title: string
  message: string
  discountLabel: string
  couponCode: string
  ctaText: string
  displayDelay?: number        // ms, default 4000
  minPurchase?: number         // ₦ amount, optional
  expiryDate?: string          // ISO string, optional
  imageUrl?: string            // optional fragrance image
}

const DEFAULT_CONFIG: PromoRewardConfig = {
  enabled: true,
  title: 'Congratulations ✨',
  message: "You've unlocked an exclusive shopping reward just for visiting today.",
  discountLabel: '₦2,000 OFF',
  couponCode: 'JESSY2000',
  ctaText: 'Shop & Use Coupon',
  displayDelay: 4000,
}

const STORAGE_KEY = 'jl_promo_dismissed'
const SESSION_KEY = 'jl_promo_seen'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isDismissed(): boolean {
  try {
    const val = localStorage.getItem(STORAGE_KEY)
    if (!val) return false
    const { code, until } = JSON.parse(val)
    // Dismiss persists for 24 h per coupon code
    return code === DEFAULT_CONFIG.couponCode && Date.now() < until
  } catch {
    return false
  }
}

function markDismissed(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      code,
      until: Date.now() + 24 * 60 * 60 * 1000,
    }))
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch { /* ignore */ }
}

function isExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false
  return Date.now() > new Date(expiryDate).getTime()
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  config?: PromoRewardConfig
}

export default function PromoRewardPopup({ config = DEFAULT_CONFIG }: Props) {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const cfg = { ...DEFAULT_CONFIG, ...config }

  // Detect reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
  }, [])

  // Show popup after delay if not dismissed
  useEffect(() => {
    if (!cfg.enabled) return
    if (isExpired(cfg.expiryDate)) return
    if (isDismissed()) return
    // Don't show again in same session if already seen
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return
    } catch { /* ignore */ }

    const timer = setTimeout(() => {
      setAnimating(true)
      setTimeout(() => setVisible(true), 20) // allow DOM paint before transition
    }, cfg.displayDelay ?? 4000)

    return () => clearTimeout(timer)
  }, [cfg.enabled, cfg.expiryDate, cfg.displayDelay])

  // Focus trap — move focus to close button when popup opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => closeRef.current?.focus(), 100)
    }
  }, [visible])

  // Keyboard: Escape to close
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible])

  const dismiss = useCallback(() => {
    setVisible(false)
    setTimeout(() => {
      setAnimating(false)
      markDismissed(cfg.couponCode)
    }, prefersReducedMotion ? 0 : 320)
  }, [cfg.couponCode, prefersReducedMotion])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cfg.couponCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea')
      el.value = cfg.couponCode
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }, [cfg.couponCode])

  const handleCTA = useCallback(() => {
    // Store coupon code in sessionStorage so CartDrawer can pre-fill it
    try {
      sessionStorage.setItem('jl_pending_coupon', cfg.couponCode)
    } catch { /* ignore */ }
    dismiss()
    // Navigate to shop — coupon will be surfaced in cart
    router.push('/shop')
  }, [cfg.couponCode, dismiss, router])

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) dismiss()
  }, [dismiss])

  if (!animating) return null

  const motionClass = prefersReducedMotion ? '' : 'transition-all duration-300 ease-out'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Exclusive shopping reward"
      className={[
        'fixed inset-0 z-[70] flex items-center justify-center px-4',
        'pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]',
        motionClass,
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
      ].join(' ')}
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={[
          'absolute inset-0 bg-stone-950/60 backdrop-blur-[2px]',
          motionClass,
          visible ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        ref={cardRef}
        className={[
          // Layout
          'relative z-10 w-full max-w-[92vw] sm:max-w-sm lg:max-w-md',
          // Surface
          'rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]',
          // Shadow — layered for depth
          'shadow-[0_32px_64px_-16px_rgba(28,25,23,0.28),0_0_0_1px_rgba(201,163,93,0.08)]',
          // Entry animation
          motionClass,
          visible
            ? 'translate-y-0 scale-100 opacity-100'
            : 'translate-y-6 scale-[0.97] opacity-0',
        ].join(' ')}
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle grain texture */}
        <div className="grain pointer-events-none absolute inset-0 rounded-2xl opacity-40" aria-hidden="true" />

        {/* Purple glow top-left */}
        <div
          className="pointer-events-none absolute -left-8 -top-8 h-40 w-40 rounded-full bg-[var(--accent)]/12 blur-3xl"
          aria-hidden="true"
        />
        {/* Champagne glow bottom-right */}
        <div
          className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-[var(--champagne)]/10 blur-2xl"
          aria-hidden="true"
        />

        {/* Close button */}
        <button
          ref={closeRef}
          onClick={dismiss}
          aria-label="Close reward popup"
          className={[
            'absolute right-3 top-3 z-20 rounded-full p-2',
            'text-[var(--text-muted)] transition-colors duration-150',
            'hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2',
          ].join(' ')}
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Content */}
        <div className="relative z-10 px-6 pb-6 pt-7 sm:px-8 sm:pb-7 sm:pt-8">

          {/* Eyebrow */}
          <p className="eyebrow flex items-center gap-1.5">
            <Sparkles size={11} />
            Exclusive Reward
          </p>

          {/* Title */}
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-3xl">
            {cfg.title}
          </h2>

          {/* Gold divider */}
          <div className="gold-line my-4" />

          {/* Discount badge */}
          <div className="flex items-center justify-center">
            <div className={[
              'relative inline-flex flex-col items-center justify-center',
              'rounded-xl border border-[var(--champagne)]/30 bg-[var(--champagne-soft)]',
              'px-8 py-4 text-center',
            ].join(' ')}>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--champagne)]">
                Your Reward
              </span>
              <span className="mt-1 font-display text-4xl font-bold leading-none text-[var(--champagne)] sm:text-5xl">
                {cfg.discountLabel}
              </span>
            </div>
          </div>

          {/* Message */}
          <p className="mt-4 text-center text-sm leading-6 text-[var(--text-secondary)]">
            {cfg.message}
          </p>

          {/* Min purchase note */}
          {cfg.minPurchase && (
            <p className="mt-1 text-center text-[11px] text-[var(--text-muted)]">
              Minimum purchase: ₦{cfg.minPurchase.toLocaleString()}
            </p>
          )}

          {/* Expiry note */}
          {cfg.expiryDate && !isExpired(cfg.expiryDate) && (
            <p className="mt-1 text-center text-[11px] text-[var(--text-muted)]">
              Valid until {new Date(cfg.expiryDate).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}

          {/* Coupon code block */}
          <div className="mt-5">
            <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Your Coupon Code
            </p>
            <button
              onClick={handleCopy}
              aria-label={copied ? 'Coupon code copied' : `Copy coupon code ${cfg.couponCode}`}
              className={[
                'group flex w-full items-center justify-between gap-3',
                'rounded-xl border-2 border-dashed px-5 py-3.5',
                'transition-all duration-200',
                copied
                  ? 'border-[var(--success)]/50 bg-[var(--success)]/5'
                  : 'border-[var(--accent)]/30 bg-[var(--accent-soft)] hover:border-[var(--accent)]/60',
              ].join(' ')}
            >
              <span className="font-mono text-lg font-bold tracking-[0.18em] text-[var(--accent)] sm:text-xl">
                {cfg.couponCode}
              </span>
              <span className={[
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] transition-colors duration-200',
                copied
                  ? 'bg-[var(--success)]/15 text-[var(--success)]'
                  : 'bg-[var(--accent)]/10 text-[var(--accent)] group-hover:bg-[var(--accent)]/20',
              ].join(' ')}>
                {copied
                  ? <><CheckCheck size={12} /> Copied</>
                  : <><Copy size={12} /> Copy</>
                }
              </span>
            </button>
          </div>

          {/* CTA */}
          <button
            onClick={handleCTA}
            className={[
              'btn-primary mt-4 w-full !py-4 !text-[11px]',
              'group',
            ].join(' ')}
          >
            {cfg.ctaText}
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>

          {/* Maybe later */}
          <button
            onClick={dismiss}
            className="mt-3 w-full text-center text-[11px] text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
