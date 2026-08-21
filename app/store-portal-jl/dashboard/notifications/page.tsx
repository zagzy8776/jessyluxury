'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell, Check, Inbox, RefreshCw, Trash2, ShieldAlert, Sparkles, ShoppingBag, Eye, EyeOff, Megaphone,
} from 'lucide-react'

export default function NotificationsDashboard() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ORDERS' | 'STOCK' | 'SECURITY'>('ALL')
  const [refreshing, setRefreshing] = useState(false)

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (err) {
      console.error('Error loading notifications:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll notifications every 15 seconds
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

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

  // Filter lists client-side
  const filteredNotifications = notifications.filter(item => {
    if (filter === 'UNREAD') return !item.readAt
    if (filter === 'ORDERS') return item.type.startsWith('order.')
    if (filter === 'STOCK') return item.type.startsWith('inventory.')
    if (filter === 'SECURITY') return item.type.startsWith('security.')
    return true
  })

  const unreadCount = notifications.filter((n) => !n.readAt).length

  function getIcon(type: string) {
    if (type.startsWith('order.')) return <ShoppingBag className="text-[var(--accent)]" size={16} />
    if (type.startsWith('inventory.')) return <Sparkles className="text-red-500" size={16} />
    if (type.startsWith('security.')) return <ShieldAlert className="text-orange-500" size={16} />
    return <Megaphone className="text-[#7a5c22]" size={16} />
  }

  function getIconBg(item: any) {
    if (item.readAt) return 'bg-[var(--admin-bg)] border-[var(--admin-border)]'
    if (item.type.startsWith('order.')) return 'bg-[var(--accent-soft)] border-[var(--accent)]/20'
    return 'bg-[var(--champagne-soft)] border-[var(--champagne)]/30'
  }

  function handleNotificationClick(item: any) {
    // Navigate dynamically depending on the payload
    if (!item.readAt) {
      handleToggleRead(item.id, false)
    }

    const payload = item.payload || {}
    if (payload.orderId) {
      window.location.href = `/store-portal-jl/dashboard/orders?openId=${payload.orderId}`
    } else if (payload.productId) {
      window.location.href = `/store-portal-jl/dashboard/products/add?edit=${payload.productId}`
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--admin-border)] pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Alert console</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Notification Center</h1>
          <p className="mt-1 text-xs font-medium text-[var(--admin-text-secondary)]">
            {unreadCount > 0
              ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'} in the queue.`
              : 'Operational event queue is clear.'}
          </p>
          <div className="mt-3 flex gap-4 text-[11px] font-bold">
            <span className="cursor-default border-b-2 border-[var(--accent)] pb-1 text-[var(--accent)]">Alert Queue</span>
            <Link
              href="/store-portal-jl/dashboard/notifications/announcements"
              className="text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text-primary)]"
            >
              Storefront Announcements →
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => {
              setRefreshing(true)
              fetchNotifications()
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] px-3.5 py-2 text-xs font-bold shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Sync
          </button>
          <button
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-3.5 py-2 text-xs font-bold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white disabled:opacity-40"
          >
            <Check size={13} />
            Mark all read
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex max-w-lg flex-wrap items-center gap-1 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-bg)] p-1.5">
        {(['ALL', 'UNREAD', 'ORDERS', 'STOCK', 'SECURITY'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-3.5 py-1.5 text-[11px] font-bold tracking-wide transition ${
              filter === tab
                ? 'bg-[var(--admin-card-bg)] text-[var(--accent)] shadow-sm'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
            }`}
          >
            {tab}
            {tab === 'UNREAD' && unreadCount > 0 && (
              <span className="ml-1.5 rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[9px] font-bold text-white">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 w-full" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="admin-card flex flex-col items-center justify-center py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--admin-bg)] text-[var(--admin-text-muted)]">
            <Inbox size={26} />
          </span>
          <h3 className="mt-4 font-display text-lg font-bold">Inbox clean</h3>
          <p className="mt-1 max-w-xs text-xs font-medium text-[var(--admin-text-muted)]">
            No notifications match your current filter. System queue is idle.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <article
              key={item.id}
              className={`group relative flex flex-col justify-between gap-4 rounded-xl border p-4 transition-all sm:flex-row sm:p-5 ${
                item.readAt
                  ? 'border-[var(--admin-border)] bg-[var(--admin-card-bg)] hover:border-[var(--admin-border-hover)]'
                  : 'border-[var(--accent)]/35 bg-[var(--admin-card-bg)] shadow-sm'
              }`}
            >
              {!item.readAt && <span className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-[var(--accent)]" />}

              <div className="flex flex-1 items-start gap-4">
                <div className={`shrink-0 rounded-lg border p-2.5 ${getIconBg(item)}`}>
                  {getIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={`text-sm ${item.readAt ? 'font-semibold text-[var(--admin-text-secondary)]' : 'font-bold'}`}>
                      {item.title}
                    </h3>
                    {!item.readAt && (
                      <span className="inline-block rounded-full bg-[var(--accent)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="max-w-2xl text-xs font-medium leading-relaxed text-[var(--admin-text-secondary)]">{item.message}</p>

                  {/* Delivery channels */}
                  {item.deliveries && item.deliveries.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 border-t border-[var(--admin-border)] pt-2.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Deliveries:</span>
                      {item.deliveries.map((del: any, dIdx: number) => (
                        <div key={dIdx} className="flex items-center gap-1.5 text-[10px] font-semibold">
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                            del.status === 'SENT' ? 'bg-emerald-500' :
                            del.status === 'SKIPPED' ? 'bg-stone-400' :
                            del.status === 'PROCESSING' ? 'bg-blue-500' : 'bg-red-500'
                          }`} />
                          <span className="font-bold">{del.channel}</span>
                          <span className="rounded-md bg-[var(--admin-bg)] px-1.5 py-0.5 text-[9px] text-[var(--admin-text-muted)]">
                            {del.status === 'SKIPPED' ? 'SKIPPED (No Key)' : del.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="block pt-1 text-[10px] font-bold tabular-nums text-[var(--admin-text-muted)]">
                    {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end transition-opacity md:self-start">
                <button
                  onClick={() => handleNotificationClick(item)}
                  className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-2 shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  title="Open linked item"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleToggleRead(item.id, !!item.readAt)}
                  className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-2 shadow-sm transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  title={item.readAt ? 'Mark as Unread' : 'Mark as Read'}
                >
                  {item.readAt ? <EyeOff size={14} /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => handleArchive(item.id)}
                  className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-2 text-[var(--admin-text-secondary)] shadow-sm transition hover:border-red-500/40 hover:text-red-500"
                  title="Archive notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
