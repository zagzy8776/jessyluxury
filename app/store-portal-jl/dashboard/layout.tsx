'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Ticket,
  BarChart3,
  Truck,
  Settings,
  ArrowLeft,
  LogOut,
  Sun,
  Moon,
  X,
  Bell,
} from 'lucide-react'

// 3 Most Important Admin Links (Fixed at Bottom Navigation Dock)
const BOTTOM_NAV = [
  { label: 'Overview', href: '/store-portal-jl/dashboard', icon: LayoutDashboard },
  { label: 'Products', href: '/store-portal-jl/dashboard/products', icon: Package },
  { label: 'Orders', href: '/store-portal-jl/dashboard/orders', icon: ShoppingBag },
]

// Secondary Navigation Links (Inside Top == Dropdown Menu)
const TOP_DROPDOWN_NAV = [
  { label: 'Overview Dashboard', href: '/store-portal-jl/dashboard', icon: LayoutDashboard },
  { label: 'Products Catalog', href: '/store-portal-jl/dashboard/products', icon: Package },
  { label: 'Orders & POS', href: '/store-portal-jl/dashboard/orders', icon: ShoppingBag },
  { label: 'Customers CRM', href: '/store-portal-jl/dashboard/customers', icon: Users },
  { label: 'Discounts & Coupons', href: '/store-portal-jl/dashboard/sales-marketing/discounts', icon: Ticket },
  { label: 'Analytics & Reports', href: '/store-portal-jl/dashboard/analytics', icon: BarChart3 },
  { label: 'Shipping & Delivery', href: '/store-portal-jl/dashboard/shipping', icon: Truck },
  { label: 'Notifications Hub', href: '/store-portal-jl/dashboard/notifications', icon: Bell },
  { label: 'Store Settings', href: '/store-portal-jl/dashboard/settings', icon: Settings },
]

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  async function fetchUnreadNotifications() {
    try {
      const res = await fetch('/api/notifications?unread=true')
      if (res.ok) {
        const data = await res.json()
        setUnreadNotifications(data)
      }
    } catch (err) {
      console.error('Failed to load unread notifications count:', err)
    }
  }

  useEffect(() => {
    fetchUnreadNotifications()
    const interval = setInterval(fetchUnreadNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('jl_theme') as 'dark' | 'light' | null
    const activeTheme = savedTheme || 'light'
    setTheme(activeTheme)
    document.documentElement.setAttribute('data-theme', activeTheme)
  }, [])

  useEffect(() => {
    // Identify the admin in OneSignal so the worker can target this browser for push notifications.
    // The admin is always recipientId = 1 (single-admin system).
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId || appId === 'YOUR_APP_ID_HERE') return

    const win = window as any
    const tryLogin = () => {
      if (win.OneSignal && typeof win.OneSignal.login === 'function') {
        win.OneSignal.login('1').catch(() => {
          // Ignore — may fail on localhost without HTTPS
        })
      } else if (win.OneSignalDeferred) {
        win.OneSignalDeferred.push((OneSignal: any) => {
          OneSignal.login('1').catch(() => {})
        })
      }
    }
    // Give SDK a moment to initialize
    const t = setTimeout(tryLogin, 2000)
    return () => clearTimeout(t)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setBellOpen(false)
  }, [pathname])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('jl_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  async function handleNotificationClick(item: any) {
    try {
      await fetch(`/api/notifications/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'READ' }),
      })
      fetchUnreadNotifications()
      setBellOpen(false)
      
      const payload = item.payload || {}
      if (payload.orderId) {
        router.push(`/store-portal-jl/dashboard/orders?openId=${payload.orderId}`)
      } else if (payload.productId) {
        router.push(`/store-portal-jl/dashboard/products/add?edit=${payload.productId}`)
      } else {
        router.push('/store-portal-jl/dashboard/notifications')
      }
    } catch (err) {
      console.error('Failed to handle notification click:', err)
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/admin-auth', { method: 'DELETE' })
    } catch {
      // ignore
    }
    router.replace('/store-portal-jl')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col pb-20 font-sans selection:bg-amber-500 selection:text-stone-950 transition-colors duration-200">

      {/* ── TOP ADMIN HEADER WITH == DROPDOWN MENU ── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card-bg)] shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div>
              <span className="font-display text-base sm:text-lg tracking-[0.2em] font-semibold text-[var(--text-primary)]">
                JESSY LUXURY
              </span>
              <span className="mx-2 text-[var(--text-muted)] font-light">·</span>
              <span className="text-[10px] font-bold tracking-[0.25em] text-[var(--text-muted)] uppercase">
                ADMIN
              </span>
            </div>
          </div>

          {/* Right: Theme Toggle & == Dropdown Button */}
          <div className="relative flex items-center gap-2 sm:gap-3" ref={menuRef}>
            {/* Bell Icon Dropdown */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition shadow-xs shrink-0"
                title="Notifications Hub"
              >
                <Bell size={17} />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-stone-950">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-200">
                  <div className="border-b border-[var(--border)] px-4 py-3 bg-[var(--bg-primary)] flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Unread Messages</span>
                    <Link
                      href="/store-portal-jl/dashboard/notifications"
                      onClick={() => setBellOpen(false)}
                      className="text-[10px] font-bold text-amber-500 hover:underline uppercase tracking-wider"
                    >
                      Console
                    </Link>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border)]">
                    {unreadNotifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-[var(--text-muted)] font-medium">
                        No new notifications. Everything clear!
                      </div>
                    ) : (
                      unreadNotifications.slice(0, 5).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className="w-full text-left px-4 py-3 hover:bg-[var(--bg-primary)] transition flex flex-col gap-1 min-w-0"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-[var(--text-primary)] truncate">{item.title}</span>
                            <span className="text-[9px] text-[var(--text-muted)] shrink-0 font-medium">
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2">{item.message}</p>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="border-t border-[var(--border)] px-4 py-2.5 bg-[var(--bg-primary)] text-center">
                    <Link
                      href="/store-portal-jl/dashboard/notifications"
                      onClick={() => setBellOpen(false)}
                      className="text-xs font-bold text-[var(--text-primary)] hover:text-amber-500 transition uppercase tracking-wider block"
                    >
                      View All Alerts ({unreadNotifications.length})
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition shadow-xs shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* == String / Hamburger Dropdown Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Admin Navigation Menu"
              className="flex h-10 items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 sm:px-3.5 text-xs font-bold tracking-widest text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition shadow-xs shrink-0"
            >
              {menuOpen ? (
                <>
                  <X size={18} />
                  <span className="hidden sm:inline">CLOSE</span>
                </>
              ) : (
                <>
                  <span className="font-mono text-lg font-black leading-none text-amber-500">==</span>
                  <span>MENU</span>
                </>
              )}
            </button>

            {/* ── TOP NAV == RIGHTWARD EXECUTIVE ADMIN MODAL DRAWER ── */}
            {menuOpen && (
              <div className="fixed inset-0 z-50 flex justify-end">
                {/* Backdrop Dimming Overlay — Tap Outside to Close */}
                <div
                  className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity z-40 cursor-pointer"
                  onClick={() => setMenuOpen(false)}
                />

                {/* Rightward Solid Opaque Panel - Medium Sized */}
                <aside className="relative z-50 flex h-full w-full max-w-[340px] sm:max-w-[420px] flex-col border-l border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 pb-28">
                  {/* Sticky Top Bar with Pinned (X) Close Button */}
                  <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--card-bg)] px-6 py-5 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div>
                        <h2 className="font-display text-base font-bold tracking-wider text-[var(--text-primary)]">
                          ADMIN <span className="text-amber-500">PORTAL</span>
                        </h2>
                        <p className="text-[9px] font-bold tracking-[0.16em] text-amber-500 uppercase">
                          STORE CONTROL PANEL
                        </p>
                      </div>
                    </div>

                    {/* Sticky X Close Button */}
                    <button
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-2 text-[var(--text-secondary)] hover:border-amber-500 hover:text-amber-500 transition shadow-xs"
                      aria-label="Close menu"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Rightward Navigation Content */}
                  <div className="flex-1 p-6 space-y-4">
                    <p className="px-1 text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase">STORE MANAGEMENT</p>

                    <div className="space-y-2">
                      {TOP_DROPDOWN_NAV.map((item) => {
                        const isActive =
                          item.href === '/store-portal-jl/dashboard'
                            ? pathname === '/store-portal-jl/dashboard'
                            : pathname.startsWith(item.href)
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className={`flex items-center gap-3.5 rounded-2xl p-3.5 text-xs font-bold transition shadow-xs ${
                              isActive
                                ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                                : 'border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] hover:border-amber-500/60 hover:bg-[var(--card-bg)] hover:text-amber-500'
                            }`}
                          >
                            <span className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-stone-950/10 text-stone-950' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                              <Icon size={18} />
                            </span>
                            <span className="font-semibold text-xs">{item.label}</span>
                          </Link>
                        )
                      })}
                    </div>

                    <div className="my-4 h-px bg-[var(--border)]" />

                    <Link
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-3.5 text-xs font-bold text-[var(--text-secondary)] hover:border-amber-500 hover:text-amber-500 transition shadow-xs"
                    >
                      <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0">
                        <ArrowLeft size={18} />
                      </span>
                      <span className="font-semibold text-xs">View Public Storefront</span>
                    </Link>
                  </div>

                  {/* Non-Sticky Footer / Logout */}
                  <div className="mt-auto border-t border-[var(--border)] p-6 pb-12">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition shadow-sm"
                    >
                      <LogOut size={16} />
                      Log Out of Admin
                    </button>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Admin Page Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* ── BOTTOM DOCK NAVIGATION (3 MOST IMPORTANT LINKS) ── */}
      <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-[var(--border)] bg-[var(--card-bg)] shadow-lg">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
          {BOTTOM_NAV.map((item) => {
            const isActive =
              item.href === '/store-portal-jl/dashboard'
                ? pathname === '/store-portal-jl/dashboard'
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 py-1 px-4 sm:px-6 rounded-xl transition ${
                  isActive
                    ? 'text-amber-500 font-bold scale-105'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-amber-500' : 'text-[var(--text-muted)]'} />
                <span className="text-[10px] tracking-wider uppercase font-semibold">{item.label}</span>
                {isActive && <span className="h-1 w-5 rounded-full bg-amber-500" />}
              </Link>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
