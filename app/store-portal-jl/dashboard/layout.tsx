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
  ArrowLeft,
  Sparkles,
  LogOut,
} from 'lucide-react'

const SESSION_KEY = 'jl_admin_session'

const ADMIN_NAV = [
  { label: 'Overview', href: '/store-portal-jl/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/store-portal-jl/dashboard/orders', icon: ShoppingBag },
  { label: 'Customers CRM', href: '/store-portal-jl/dashboard/customers', icon: Users },
  { label: 'Products', href: '/store-portal-jl/dashboard/products', icon: Package },
  { label: 'Shipping', href: '/store-portal-jl/dashboard/shipping', icon: Truck },
  { label: 'Coupons', href: '/store-portal-jl/dashboard/coupons', icon: Ticket },
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
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 border-b border-stone-800 bg-stone-900/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-stone-400 hover:text-white transition">
              <ArrowLeft size={16} />
              <span className="text-xs font-semibold tracking-wider hidden sm:block">STOREFRONT</span>
            </Link>
            <span className="h-4 w-px bg-stone-800 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span className="font-display text-lg tracking-widest text-stone-50 font-medium">
                JESSY LUXURY{' '}
                <span className="text-amber-400 text-xs tracking-normal font-sans bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold ml-1">
                  ADMIN
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-green-500/10 border border-green-500/30 px-3 py-1 text-[11px] font-medium text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl border border-stone-800 px-3 py-1.5 text-xs text-stone-400 hover:text-white hover:border-stone-600 transition"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>

        {/* Secondary Nav bar */}
        <div className="border-t border-stone-800/60 bg-stone-950/60 overflow-x-auto">
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
                  <item.icon size={15} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
