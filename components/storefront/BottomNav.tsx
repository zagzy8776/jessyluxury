'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ShoppingBag, Heart, User, Store } from 'lucide-react'
import { useCart } from '@/components/CartProvider'

export default function BottomNav() {
  const pathname = usePathname()
  const { count, setDrawer } = useCart()

  if (pathname?.startsWith('/store-portal-jl') || pathname?.startsWith('/admin')) {
    return null
  }

  const item = (
    href: string,
    label: string,
    Icon: typeof Home,
    active: boolean,
    badge?: number,
    onClick?: () => void
  ) => {
    const content = (
      <>
        <span className="relative">
          <Icon size={21} strokeWidth={active ? 2.2 : 1.8} />
          {badge != null && badge > 0 && (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
              {badge}
            </span>
          )}
        </span>
        <span className="text-[10px] font-semibold tracking-wide">{label}</span>
      </>
    )
    const cls = `flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition ${
      active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
    }`
    if (onClick) {
      return (
        <button key={label} onClick={onClick} className={cls} aria-label={label}>
          {content}
        </button>
      )
    }
    return (
      <Link key={label} href={href} className={cls} aria-label={label}>
        {content}
      </Link>
    )
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--card-bg)]/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-2 pt-1.5 pb-1.5">
        {item('/', 'Home', Home, pathname === '/')}
        {item('/shop', 'Shop', Store, pathname?.startsWith('/shop') ?? false)}
        {item('/account/wishlist', 'Wishlist', Heart, pathname?.startsWith('/account/wishlist') ?? false)}
        {item('/account', 'Account', User, pathname?.startsWith('/account') ?? false)}
        {item('', 'Cart', ShoppingBag, false, count, () => setDrawer(true))}
      </div>
    </nav>
  )
}
