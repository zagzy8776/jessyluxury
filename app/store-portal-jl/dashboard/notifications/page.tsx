'use client'
import { useState, useEffect } from 'react'
import { Bell, Check, Inbox, RefreshCw, Trash2, Mail, ShieldAlert, Sparkles, ShoppingBag, Eye, EyeOff } from 'lucide-react'

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

  function getIcon(type: string) {
    if (type.startsWith('order.')) return <ShoppingBag className="text-amber-600" size={16} />
    if (type.startsWith('inventory.')) return <Sparkles className="text-red-500" size={16} />
    if (type.startsWith('security.')) return <ShieldAlert className="text-orange-500" size={16} />
    return <Bell className="text-amber-500" size={16} />
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
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <span className="text-[10px] font-bold tracking-[0.2em] text-amber-600 uppercase">Alert Console</span>
          <h1 className="font-display text-3xl font-bold text-stone-900 mt-1">Notification Center</h1>
          <p className="text-xs text-stone-500 font-medium mt-1">Monitor operational event queues, email receipts, and outbox delivery metrics.</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={() => {
              setRefreshing(true)
              fetchNotifications()
            }}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 text-xs font-bold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'REFRESHING...' : 'SYNC'}
          </button>
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50/50 px-3.5 py-2 text-xs font-bold text-amber-800 shadow-sm transition hover:bg-amber-100/50"
          >
            <Check size={14} />
            MARK ALL READ
          </button>
        </div>
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-wrap items-center gap-1 bg-stone-100 p-1.5 rounded-xl border border-stone-200/50 max-w-md">
        {(['ALL', 'UNREAD', 'ORDERS', 'STOCK', 'SECURITY'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-white text-stone-950 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notifications List Container */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-stone-400">
          <RefreshCw className="animate-spin text-amber-500 mb-3" size={32} />
          <p className="text-xs font-bold tracking-wider">LOADING NOTIFICATION CACHE...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-3xl border border-stone-200/80 bg-white/50 text-center shadow-sm">
          <Inbox size={48} className="text-stone-300 mb-4" />
          <h3 className="font-display text-lg font-bold text-stone-900">Inbox Clean</h3>
          <p className="text-xs text-stone-500 font-medium max-w-xs mt-1.5">No notifications match your current filter settings. System queue is idle.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`group flex flex-col md:flex-row md:items-start justify-between rounded-2xl border transition-all p-5 gap-4 bg-white shadow-sm ${
                item.readAt
                  ? 'border-stone-200/80 hover:border-stone-300/80'
                  : 'border-amber-300 bg-amber-50/10 hover:border-amber-400 shadow-amber-500/5'
              }`}
            >
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  item.readAt ? 'bg-stone-50 border-stone-200' : 'bg-amber-100 border-amber-200'
                }`}>
                  {getIcon(item.type)}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-sm font-bold text-stone-900">{item.title}</h3>
                    {!item.readAt && (
                      <span className="inline-block rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-stone-950 uppercase tracking-wider">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-600 font-medium leading-relaxed max-w-2xl">{item.message}</p>
                  
                  {/* Delivery Channels status display */}
                  {item.deliveries && item.deliveries.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-stone-100">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Deliveries:</span>
                      {item.deliveries.map((del: any, dIdx: number) => (
                        <div key={dIdx} className="flex items-center gap-1.5 text-[10px] font-semibold text-stone-600">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                            del.status === 'SENT' ? 'bg-emerald-500' :
                            del.status === 'SKIPPED' ? 'bg-stone-400' :
                            del.status === 'PROCESSING' ? 'bg-blue-500' : 'bg-red-500'
                          }`} />
                          <span className="font-bold text-stone-700">{del.channel}</span>
                          <span className="text-[9px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">
                            {del.status === 'SKIPPED' ? 'SKIPPED (No Key)' : del.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <span className="text-[10px] text-stone-400 font-bold block pt-1">
                    {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-start opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleNotificationClick(item)}
                  className="p-2 rounded-lg border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 transition shadow-sm"
                  title="View item detail page"
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => handleToggleRead(item.id, !!item.readAt)}
                  className="p-2 rounded-lg border border-stone-200 text-stone-700 bg-white hover:bg-stone-50 transition shadow-sm"
                  title={item.readAt ? 'Mark as Unread' : 'Mark as Read'}
                >
                  {item.readAt ? <EyeOff size={14} /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => handleArchive(item.id)}
                  className="p-2 rounded-lg border border-stone-200 text-red-600 hover:text-red-700 bg-white hover:bg-red-50 transition shadow-sm"
                  title="Archive notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
