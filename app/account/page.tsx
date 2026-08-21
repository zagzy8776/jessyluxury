'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell, Heart, Package, LogOut, KeyRound, ShieldAlert, User,
  MessageCircle, ChevronRight, MapPin,
} from 'lucide-react'
import { useCart } from '@/components/CartProvider'
import { site, wa } from '@/lib/site'

export default function AccountPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState<number | null>(null)

  const [phone, setPhone] = useState('')
  const [loginName, setLoginName] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const { wishlist } = useCart()

  async function checkAuth() {
    try {
      const res = await fetch('/api/customer-auth/me')
      if (res.ok) {
        const data = await res.json()
        setAuthenticated(data.authenticated)
        if (data.authenticated) {
          setCustomer(data.customer)
          fetchUnread()
        }
      }
    } catch (err) {
      console.error('Auth check error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUnread() {
    try {
      const res = await fetch('/api/notifications?unread=true')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setUnreadCount(data.length)
      }
    } catch {
      /* non-critical */
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!phone) {
      setLoginError('Phone number is required')
      return
    }
    setLoggingIn(true)
    setLoginError('')
    try {
      const res = await fetch('/api/customer-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), name: loginName.trim() || undefined }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const meRes = await fetch('/api/customer-auth/me')
        const meData = await meRes.json()
        setAuthenticated(meData.authenticated)
        setCustomer(meData.customer)
        fetchUnread()
      } else {
        setLoginError(data.error || 'Login failed. Please verify format.')
      }
    } catch (err: any) {
      setLoginError(err.message || 'Connection error. Try again.')
    } finally {
      setLoggingIn(false)
    }
  }

  async function handleLogout() {
    try {
      const res = await fetch('/api/customer-auth/logout', { method: 'POST' })
      if (res.ok) {
        setAuthenticated(false)
        setCustomer(null)
        setUnreadCount(null)
      }
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-[var(--bg-primary)] px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="skeleton h-10 w-48" />
          <div className="skeleton h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="skeleton h-24 rounded-2xl" />
            <div className="skeleton h-24 rounded-2xl" />
          </div>
        </div>
      </main>
    )
  }

  // ── Login view ──
  if (!authenticated) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center bg-[var(--bg-primary)] px-4 py-16">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-card">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,45,127,0.07),transparent_60%)]" />
          <div className="relative z-10 space-y-2 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]">
              <KeyRound size={22} />
            </div>
            <h1 className="font-display text-2xl font-bold">Welcome back</h1>
            <p className="mx-auto max-w-xs text-xs leading-relaxed text-[var(--text-secondary)]">
              Sign in with your phone number to view your notifications, wishlist and orders.
            </p>
          </div>

          <form onSubmit={handleLogin} className="relative z-10 mt-6 space-y-4">
            {loginError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-[var(--danger)]">
                <ShieldAlert size={14} /> {loginError}
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Phone number *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678 or +234…"
                required
                className="field-input font-mono"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                Name (optional, for guest registration)
              </label>
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="e.g. John Doe"
                className="field-input"
              />
            </div>
            <button type="submit" disabled={loggingIn} className="btn-primary w-full disabled:opacity-50">
              {loggingIn ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  // ── Account hub ──
  const initial = (customer?.name || 'J').trim().charAt(0).toUpperCase()

  const links = [
    {
      href: '/account/notifications',
      icon: Bell,
      title: 'Notifications',
      desc: 'Order updates & personal offers',
      badge: unreadCount != null && unreadCount > 0 ? unreadCount : undefined,
    },
    {
      href: '/account/wishlist',
      icon: Heart,
      title: 'Wishlist',
      desc: 'Fragrances you love',
      badge: wishlist.length > 0 ? wishlist.length : undefined,
    },
    {
      href: '/track',
      icon: Package,
      title: 'Track an order',
      desc: 'Live delivery status',
    },
  ]

  return (
    <main className="min-h-[85vh] bg-[var(--bg-primary)] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Greeting */}
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] font-display text-xl font-bold text-white shadow-plum">
              {initial}
            </span>
            <div>
              <p className="eyebrow">My account</p>
              <h1 className="font-display text-2xl font-bold sm:text-3xl">
                Hello, {customer?.name?.split(' ')[0] || 'there'}
              </h1>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/5 px-3.5 py-2 text-xs font-bold text-[var(--danger)] transition hover:bg-red-500/15"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>

        {/* Profile card */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-card sm:p-6">
          <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            <User size={14} /> Profile
          </h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Name</dt>
              <dd className="mt-0.5 font-semibold">{customer?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Phone</dt>
              <dd className="mt-0.5 font-mono font-semibold tabular-nums">{customer?.phone || '—'}</dd>
            </div>
            {customer?.acquisitionSource && (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Member channel</dt>
                <dd className="mt-0.5 font-semibold capitalize">{String(customer.acquisitionSource).toLowerCase()}</dd>
              </div>
            )}
            {customer?.createdAt && (
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Customer since</dt>
                <dd className="mt-0.5 font-semibold">
                  {new Date(customer.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Quick links */}
        <section className="grid gap-3 sm:grid-cols-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-card transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-card-hover"
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <l.icon size={19} />
                {l.badge != null && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
                    {l.badge}
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[var(--text-primary)]">{l.title}</span>
                <span className="block truncate text-xs text-[var(--text-muted)]">{l.desc}</span>
              </span>
              <ChevronRight size={17} className="shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
            </Link>
          ))}
        </section>

        {/* Concierge */}
        <a
          href={wa('Hello Jessy Luxury! I need help with my account.')}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--charcoal)] p-5 text-white shadow-card transition hover:opacity-95"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--champagne)]">
            <MessageCircle size={19} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold">Personal concierge</span>
            <span className="block text-xs text-stone-300">Questions about an order? We reply fast.</span>
          </span>
          <ChevronRight size={17} className="text-stone-400" />
        </a>

        <p className="flex items-center justify-center gap-1.5 pb-4 text-[11px] text-[var(--text-muted)]">
          <MapPin size={12} /> {site.locationShort} · {site.hours}
        </p>
      </div>
    </main>
  )
}
