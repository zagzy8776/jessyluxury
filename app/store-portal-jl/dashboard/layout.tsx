'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  BarChart3,
  Truck,
  Settings,
  Bell,
  X,
  Menu,
  LogOut,
  Sun,
  Moon,
  Receipt,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard', href: '/store-portal-jl/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/store-portal-jl/dashboard/products', icon: Package },
  { label: 'Orders & POS', href: '/store-portal-jl/dashboard/orders', icon: ShoppingBag },
  { label: 'Customers', href: '/store-portal-jl/dashboard/customers', icon: Users },
  { label: 'Analytics', href: '/store-portal-jl/dashboard/analytics', icon: BarChart3 },
  { label: 'Shipping', href: '/store-portal-jl/dashboard/shipping', icon: Truck },
  { label: 'Notifications', href: '/store-portal-jl/dashboard/notifications', icon: Bell },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

function bellIcon(type: string) {
  if (type.startsWith('order.')) return Receipt
  if (type.startsWith('inventory.')) return Sparkles
  if (type.startsWith('security.')) return ShieldAlert
  return Bell
}

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [unreadCount, setUnreadCount] = useState(0)
  const [bellOpen, setBellOpen] = useState(false)
  const [recent, setRecent] = useState<any[]>([])
  const [bellLoading, setBellLoading] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  async function fetchUnread() {
    try {
      const res = await fetch('/api/notifications?unread=true')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) setUnreadCount(data.length)
      }
    } catch (err) {
      console.error('Failed to load unread notifications:', err)
    }
  }

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('jl_theme') as 'dark' | 'light' | null
    const active = saved || 'light'
    setTheme(active)
    document.documentElement.setAttribute('data-theme', active)
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
    setBellOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('jl_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  async function openBell() {
    const next = !bellOpen
    setBellOpen(next)
    if (next && recent.length === 0) {
      setBellLoading(true)
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) setRecent(data.slice(0, 6))
        }
      } catch {}
      finally { setBellLoading(false) }
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/admin-auth', { method: 'DELETE' })
    } catch {}
    router.replace('/store-portal-jl')
  }

  const isActive = (href: string) =>
    href === '/store-portal-jl/dashboard'
      ? pathname === '/store-portal-jl/dashboard'
      : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text-primary)]">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 transform border-r border-[var(--admin-sidebar-border)] bg-[var(--admin-sidebar-bg)] transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Admin navigation"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--admin-sidebar-border)] px-5">
            <Link href="/store-portal-jl/dashboard" className="font-display text-base font-bold tracking-[0.18em] text-white">
              JESSY<span className="ml-1 text-[#c9a35d]">LUXURY</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-1.5 text-stone-400 transition hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
            {NAV.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition ${
                    active
                      ? 'bg-[#c9a35d]/15 text-[#e3c989]'
                      : 'text-stone-400 hover:bg-white/5 hover:text-stone-100'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-[var(--admin-sidebar-border)] p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut size={17} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Main column ── */}
      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-[var(--admin-card-bg)]/95 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-[var(--admin-text-secondary)] transition hover:bg-[var(--admin-table-row-hover)] hover:text-[var(--admin-text-primary)] lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
              <h1 className="truncate font-display text-xl font-bold tracking-tight">
                {NAV.find((n) => isActive(n.href))?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={toggleTheme}
                className="rounded-lg p-2.5 text-[var(--admin-text-secondary)] transition hover:bg-[var(--admin-table-row-hover)] hover:text-[var(--admin-text-primary)]"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Notification bell */}
              <div className="relative" ref={bellRef}>
                <button
                  onClick={openBell}
                  className="relative rounded-lg p-2.5 text-[var(--admin-text-secondary)] transition hover:bg-[var(--admin-table-row-hover)] hover:text-[var(--admin-text-primary)]"
                  aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="animate-slide-up absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] shadow-xl sm:w-96">
                    <div className="flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-bg)] px-4 py-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">
                        Recent alerts
                      </span>
                      <Link
                        href="/store-portal-jl/dashboard/notifications"
                        onClick={() => setBellOpen(false)}
                        className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] hover:underline"
                      >
                        View all
                      </Link>
                    </div>
                    <div className="max-h-72 divide-y divide-[var(--admin-border)] overflow-y-auto">
                      {bellLoading ? (
                        <div className="space-y-3 p-4">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="skeleton h-10 w-full" />
                          ))}
                        </div>
                      ) : recent.length === 0 ? (
                        <div className="px-4 py-8 text-center text-xs font-medium text-[var(--admin-text-muted)]">
                          No notifications yet.
                        </div>
                      ) : (
                        recent.map((n) => {
                          const Icon = bellIcon(n.type || '')
                          return (
                            <Link
                              key={n.id}
                              href="/store-portal-jl/dashboard/notifications"
                              onClick={() => setBellOpen(false)}
                              className={`flex items-start gap-3 px-4 py-3 transition hover:bg-[var(--admin-table-row-hover)] ${
                                n.readAt ? 'opacity-70' : ''
                              }`}
                            >
                              <span className={`mt-0.5 rounded-lg p-1.5 ${n.readAt ? 'bg-[var(--admin-bg)] text-[var(--admin-text-muted)]' : 'bg-[var(--accent-soft)] text-[var(--accent)]'}`}>
                                <Icon size={14} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-bold">{n.title}</span>
                                <span className="block truncate text-[11px] text-[var(--admin-text-muted)]">{n.message}</span>
                              </span>
                              {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />}
                            </Link>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
