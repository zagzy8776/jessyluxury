'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Package,
  Truck,
  Ticket,
  BarChart3,
  Settings,
  ArrowLeft,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'

const SESSION_KEY = 'jl_admin_session'

const ADMIN_NAV = [
  { label: 'Overview', href: '/store-portal-jl/dashboard', icon: LayoutDashboard },
  { label: 'Catalog', href: '/store-portal-jl/dashboard/products', icon: Package },
  { label: 'Orders & POS', href: '/store-portal-jl/dashboard/orders', icon: ShoppingBag },
  { label: 'Customers CRM', href: '/store-portal-jl/dashboard/customers', icon: Users },
  { label: 'Discounts', href: '/store-portal-jl/dashboard/sales-marketing/discounts', icon: Ticket },
  { label: 'Analytics', href: '/store-portal-jl/dashboard/analytics', icon: BarChart3 },
  { label: 'Shipping', href: '/store-portal-jl/dashboard/shipping', icon: Truck },
  { label: 'Settings', href: '/store-portal-jl/dashboard/settings', icon: Settings },
]

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY)
    if (session !== 'authenticated') {
      router.replace('/store-portal-jl')
    } else {
      setAuthed(true)
    }

    const savedTheme = localStorage.getItem('jl_theme') as 'dark' | 'light' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [router])

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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950 transition-colors duration-200">
      {/* Top Glassmorphic Admin Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-amber-400 transition"
              title="Return to Public Storefront"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">STOREFRONT</span>
            </Link>
            <span className="h-4 w-px bg-stone-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="font-display text-lg tracking-widest text-[var(--text-primary)] font-medium">
                JESSY <span className="text-amber-400">LUXURY</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-amber-500/40 transition shadow-sm"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        {/* Secondary Glass Navigation bar with Horizontal Scroll */}
        <div className="border-t border-[var(--border)] bg-[var(--header-bg)] overflow-x-auto scrollbar-none">
          <div className="mx-auto flex max-w-7xl gap-1 px-4 sm:px-6 lg:px-8">
            {ADMIN_NAV.map((item) => {
              const isActive =
                item.href === '/store-portal-jl/dashboard'
                  ? pathname === '/store-portal-jl/dashboard'
                  : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-semibold tracking-wide transition ${
                    isActive
                      ? 'border-amber-400 text-amber-400 bg-amber-500/5'
                      : 'border-transparent text-[var(--text-secondary)] hover:border-stone-700 hover:text-[var(--text-primary)]'
                  }`}
                >
                  <item.icon size={15} className={isActive ? 'text-amber-400' : 'text-[var(--text-secondary)]'} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
