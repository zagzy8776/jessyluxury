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
} from 'lucide-react'

const SESSION_KEY = 'jl_admin_session'

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
  { label: 'Store Settings', href: '/store-portal-jl/dashboard/settings', icon: Settings },
]

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY)
    if (session !== 'authenticated') {
      router.replace('/store-portal-jl')
    } else {
      setAuthed(true)
    }

    const savedTheme = localStorage.getItem('jl_theme') as 'dark' | 'light' | null
    const activeTheme = savedTheme || 'light'
    setTheme(activeTheme)
    document.documentElement.setAttribute('data-theme', activeTheme)
  }, [router])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
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

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    router.replace('/store-portal-jl')
  }

  if (!authed) return null

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col pb-20 font-sans selection:bg-amber-500 selection:text-stone-950 transition-colors duration-200">

      {/* ── TOP ADMIN HEADER WITH == DROPDOWN MENU ── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--card-bg)] shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div>
              <span className="font-display text-base sm:text-lg tracking-widest font-bold text-[var(--text-primary)]">
                JESSY <span className="text-amber-500">LUXURY</span>
              </span>
              <span className="ml-2 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                ADMIN
              </span>
            </div>
          </div>

          {/* Right: Theme Toggle & == Dropdown Button */}
          <div className="relative flex items-center gap-2 sm:gap-3" ref={menuRef}>
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
