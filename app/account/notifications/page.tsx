'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell, Check, Inbox, RefreshCw, Trash2, ShieldAlert, Sparkles, ShoppingBag,
  LogOut, KeyRound, Receipt, BadgeCheck, Loader2, Truck, PackageCheck,
  XCircle, Megaphone,
} from 'lucide-react'

type NotifCategory = 'transactional' | 'marketing'

function categorize(type: string): { category: NotifCategory; icon: typeof Bell; tint: string } {
  if (type === 'campaign.marketing' || type.includes('promo') || type.startsWith('campaign.')) {
    return { category: 'marketing', icon: Megaphone, tint: 'text-[#7a5c22] bg-[var(--champagne-soft)]' }
  }
  switch (type) {
    case 'order.created':
      return { category: 'transactional', icon: Receipt, tint: 'bg-[var(--accent-soft)] text-[var(--accent)]' }
    case 'order.paid':
      return { category: 'transactional', icon: BadgeCheck, tint: 'bg-emerald-500/10 text-[var(--success)]' }
    case 'order.processing':
      return { category: 'transactional', icon: Loader2, tint: 'bg-blue-500/10 text-blue-600 dark:text-blue-300' }
    case 'order.shipped':
      return { category: 'transactional', icon: Truck, tint: 'bg-[var(--accent-soft)] text-[var(--accent)]' }
    case 'order.delivered':
      return { category: 'transactional', icon: PackageCheck, tint: 'bg-emerald-500/10 text-[var(--success)]' }
    case 'order.cancelled':
      return { category: 'transactional', icon: XCircle, tint: 'bg-red-500/10 text-[var(--danger)]' }
    default:
      return { category: 'marketing', icon: Sparkles, tint: 'text-[#7a5c22] bg-[var(--champagne-soft)]' }
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function CustomerNotificationsPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<'all' | 'unread'>('all')

  // Login Form
  const [phone, setPhone] = useState('')
  const [loginName, setLoginName] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  async function checkAuth() {
    try {
      const res = await fetch('/api/customer-auth/me')
      if (res.ok) {
        const data = await res.json()
        setAuthenticated(data.authenticated)
        if (data.authenticated) {
          setCustomer(data.customer)
          await fetchNotifications()
        }
      }
    } catch (err) {
      console.error('Auth check error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setRefreshing(false)
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
        body: JSON.stringify({
          phone: phone.trim(),
          name: loginName.trim() || undefined
        })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setAuthenticated(true)
        // Refresh me data
        const meRes = await fetch('/api/customer-auth/me')
        const meData = await meRes.json()
        setCustomer(meData.customer)
        await fetchNotifications()
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
        setNotifications([])
      }
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  async function handleToggleRead(id: number, currentlyRead: boolean) {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: currentlyRead ? 'UNREAD' : 'READ' }),
      })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (err) {
      console.error('Error toggling read status:', err)
    }
  }

  async function handleArchive(id: number) {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ARCHIVE' }),
      })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (err) {
      console.error('Error archiving notification:', err)
    }
  }

  async function handleMarkAllAsRead() {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'READ_ALL' }),
      })
      if (res.ok) {
        fetchNotifications()
      }
    } catch (err) {
      console.error('Error marking all read:', err)
    }
  }

  if (loading) {
    return (
      <main className="min-h-[70vh] bg-[var(--bg-primary)] px-4 py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="skeleton h-8 w-56" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 w-full rounded-2xl" />
          ))}
        </div>
      </main>
    )
  }

  // 1. LOGIN VIEW (Anonymous / Guest)
  if (!authenticated) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center bg-[var(--bg-primary)] px-4 py-16">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-card">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(79,45,127,0.07),transparent_60%)]" />

          <div className="relative z-10 space-y-2 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]">
              <KeyRound size={22} />
            </div>
            <h1 className="font-display text-2xl font-bold">Notification Center</h1>
            <p className="mx-auto max-w-xs text-xs leading-relaxed text-[var(--text-secondary)]">
              Enter your registered phone number to view your order updates and personal offers.
            </p>
          </div>

          <form onSubmit={handleLogin} className="relative z-10 mt-6 space-y-4">
            {loginError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-semibold text-[var(--danger)]">
                <ShieldAlert size={14} />
                {loginError}
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
              {loggingIn ? 'Verifying…' : 'Access my notifications'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  // 2. PORTAL VIEW (Logged-in Client)
  const unreadCount = notifications.filter((n) => !n.readAt).length
  const visible =
    tab === 'unread' ? notifications.filter((n) => !n.readAt) : notifications

  return (
    <main className="min-h-[85vh] bg-[var(--bg-primary)] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="eyebrow">Customer portal</p>
            <h1 className="font-display text-3xl font-bold">Notifications</h1>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              Hello, <span className="font-bold text-[var(--text-primary)]">{customer?.name || 'valued customer'}</span>
              {unreadCount > 0 ? ` — ${unreadCount} unread update${unreadCount === 1 ? '' : 's'}.` : " — you're all caught up."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setRefreshing(true)
                fetchNotifications()
              }}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card-bg)] px-3.5 py-2 text-xs font-bold shadow-card transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              Sync
            </button>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-3.5 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
              >
                <Check size={13} /> Mark all read
              </button>
            )}

            <button
              onClick={handleLogout}
              className="ml-auto flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/5 px-3.5 py-2 text-xs font-bold text-[var(--danger)] transition hover:bg-red-500/15 sm:ml-0"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(['all', 'unread'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition ${
                tab === t
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-white shadow-plum'
                  : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50 hover:text-[var(--accent)]'
              }`}
            >
              {t === 'all' ? 'All' : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
            </button>
          ))}
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="space-y-2 rounded-3xl border border-dashed border-[var(--border)] bg-[var(--card-bg)] px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]">
              {tab === 'unread' ? <Check size={22} /> : <Inbox size={22} />}
            </div>
            <p className="mt-2 font-display text-xl font-bold">
              {tab === 'unread' ? "You're all caught up." : "You're all caught up."}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {tab === 'unread'
                ? 'Every notification has been read.'
                : 'Order updates and offers will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map((item) => {
              const meta = categorize(item.type || '')
              const Icon = meta.icon
              const payload = item.payload || {}
              const hasOrderRef = !!payload.orderId || /^JL-/i.test(item.message || '')
              return (
                <article
                  key={item.id}
                  className={`group relative flex gap-4 overflow-hidden rounded-2xl border p-4 transition sm:p-5 ${
                    item.readAt
                      ? 'border-[var(--border)] bg-[var(--card-bg)] opacity-80'
                      : 'border-[var(--accent)]/30 bg-[var(--card-bg)] shadow-plum'
                  }`}
                >
                  {!item.readAt && <span className="absolute inset-y-0 left-0 w-1 bg-[var(--accent)]" />}

                  <span className={`h-fit shrink-0 rounded-full p-2.5 ${meta.tint}`}>
                    <Icon size={16} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className={`text-sm leading-snug ${item.readAt ? 'font-semibold' : 'font-bold'} text-[var(--text-primary)]`}>
                        {!item.readAt && (
                          <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[var(--accent)] align-middle" />
                        )}
                        {item.title}
                      </h3>
                      <time
                        title={new Date(item.createdAt).toLocaleString()}
                        className="shrink-0 pt-0.5 text-[10px] font-medium tabular-nums text-[var(--text-muted)]"
                      >
                        {timeAgo(item.createdAt)}
                      </time>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{item.message}</p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${
                          meta.category === 'marketing'
                            ? 'bg-[var(--champagne-soft)] text-[#7a5c22]'
                            : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        }`}
                      >
                        {meta.category === 'marketing' ? 'Offer' : 'Update'}
                      </span>

                      {hasOrderRef && (
                        <Link
                          href="/track"
                          onClick={() => !item.readAt && handleToggleRead(item.id, false)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                        >
                          Track order →
                        </Link>
                      )}

                      <span className="ml-auto flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => handleToggleRead(item.id, !!item.readAt)}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:text-[var(--accent)]"
                          title={item.readAt ? 'Mark as unread' : 'Mark as read'}
                          aria-label={item.readAt ? 'Mark as unread' : 'Mark as read'}
                        >
                          <Check size={14} className={item.readAt ? 'text-[var(--accent)]' : ''} />
                        </button>
                        <button
                          onClick={() => handleArchive(item.id)}
                          className="rounded-lg p-1.5 text-[var(--text-muted)] transition hover:text-[var(--danger)]"
                          title="Archive"
                          aria-label="Archive notification"
                        >
                          <Trash2 size={14} />
                        </button>
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
