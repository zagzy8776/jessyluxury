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
  Sparkles,
  LogOut,
  ChevronRight,
  ShieldAlert,
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

  useEffect(() => {
    const session = localStorage.getItem(SESSION_KEY)
    if (session !== 'authenticated') {
      router.replace('/store-portal-jl')
    } else {
      setAuthed(true)
    }
  }, [router])

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY)
    router.replace('/store-portal-jl')
  }

  if (!authed) return null

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top Glassmorphic Admin Header */}
      <header className="sticky top-0 z-40 border-b border-stone-800/80 bg-stone-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-400 hover:text-white transition"
              title="Return to Public Storefront"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">STOREFRONT</span>
            </Link>
            <span className="h-4 w-px bg-stone-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Sparkles size={16} />
              </div>
              <span className="font-display text-lg tracking-widest text-stone-50 font-medium">
                JESSY LUXURY{' '}
                <span className="text-amber-400 text-xs tracking-normal font-sans bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold ml-1">
                  BUMPA SUITE
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Store Manager
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/80 px-3.5 py-1.5 text-xs text-stone-400 hover:text-white hover:border-stone-700 transition shadow-sm"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        {/* Secondary Glass Navigation bar with Horizontal Scroll */}
        <div className="border-t border-stone-800/60 bg-stone-950/60 overflow-x-auto scrollbar-none">
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
                      : 'border-transparent text-stone-400 hover:border-stone-700 hover:text-stone-200'
                  }`}
                >
                  <item.icon size={15} className={isActive ? 'text-amber-400' : 'text-stone-400'} />
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
