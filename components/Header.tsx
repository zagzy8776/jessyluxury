'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  Menu, X, ShoppingBag, MessageCircle, ChevronDown, Sun, Moon, Instagram,
  Search, Heart, User, Truck, BadgeCheck,
} from 'lucide-react'
import { useCart } from './CartProvider'
import { site, wa } from '@/lib/site'
import SearchOverlay from './storefront/SearchOverlay'

const COLLECTIONS = [
  ['Oud & Amber', '/shop?cat=Oud+%26+Amber'],
  ['Fresh & Floral', '/shop?cat=Fresh'],
  ['Sweet & Gourmand', '/shop?cat=Sweet+%26+Gourmand'],
  ['Perfume Oils', '/shop?cat=Perfume+Oils'],
  ['Gift Sets', '/shop?cat=Gift+Sets'],
]

const NAV: [string, string][] = [
  ['Shop', '/shop'],
  ['New Arrivals', '/shop?filter=new'],
  ['Best Sellers', '/shop?filter=best'],
  ['About', '/about'],
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const { count, setDrawer, wishlist } = useCart()
  const pathname = usePathname()
  const collectionsRef = useRef<HTMLDivElement>(null)

  if (pathname?.startsWith('/store-portal-jl') || pathname?.startsWith('/admin')) {
    return null
  }

  useEffect(() => {
    const saved = localStorage.getItem('jl_theme') as 'dark' | 'light' | null
    const active = saved || 'light'
    setTheme(active)
    document.documentElement.setAttribute('data-theme', active)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (collectionsRef.current && !collectionsRef.current.contains(e.target as Node)) {
        setCollectionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setOpen(false)
    setCollectionsOpen(false)
  }, [pathname])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('jl_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href.split('?')[0])

  const iconBtn =
    'relative rounded-full p-2.5 text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'

  return (
    <>
      {/* ── Announcement / delivery strip ── */}
      <div className="bg-[#1c1917] text-[#efe9df] overflow-hidden py-2">
        <div className="flex w-max animate-marquee items-center gap-0 text-[10px] font-semibold tracking-[0.14em] uppercase sm:text-[11px]">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-8 px-8">
              <span className="flex items-center gap-2"><Truck size={13} className="text-[var(--champagne)]" /> Fast Nigeria Dispatch</span>
              <span className="text-[var(--champagne)]">·</span>
              <span className="flex items-center gap-2"><BadgeCheck size={13} className="text-[var(--champagne)]" /> 100% Authentic Fragrances</span>
              <span className="text-[var(--champagne)]">·</span>
              <span className="flex items-center gap-2"><MessageCircle size={13} className="text-[var(--champagne)]" /> WhatsApp Orders Welcome</span>
              <span className="text-[var(--champagne)]">·</span>
              <span className="flex items-center gap-2"><BadgeCheck size={13} className="text-[var(--champagne)]" /> Same-day Owerri Delivery</span>
              <span className="text-[var(--champagne)]">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--header-bg)]/90 shadow-xs backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          {/* Mobile menu toggle */}
          <button
            className="-ml-1.5 rounded-full p-2 text-[var(--text-primary)] lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center" aria-label="Jessy Luxury home">
            <span className="font-display text-lg font-bold tracking-[0.22em] text-[var(--text-primary)] sm:text-xl">
              JESSY<span className="ml-1.5 text-[var(--accent)]">LUXURY</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map(([label, href]) =>
              label === 'Shop' ? (
                <Link
                  key={href}
                  href={href}
                  className={`text-xs font-semibold tracking-[0.1em] uppercase transition ${
                    isActive('/shop') && !pathname.includes('?')
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </Link>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className={`text-xs font-semibold tracking-[0.1em] uppercase transition ${
                    isActive(href)
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </Link>
              )
            )}

            {/* Categories Dropdown */}
            <div ref={collectionsRef} className="relative">
              <button
                onClick={() => setCollectionsOpen(!collectionsOpen)}
                className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                  collectionsOpen
                    ? 'text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Categories
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${collectionsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {collectionsOpen && (
                <div className="absolute left-1/2 top-9 z-50 w-60 -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] py-2 shadow-xl">
                  <p className="px-4 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Shop by category
                  </p>
                  {COLLECTIONS.map(([label, href]) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setCollectionsOpen(false)}
                      className="block px-4 py-2.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)]"
                    >
                      {label}
                    </Link>
                  ))}
                  <div className="mx-4 my-1 border-t border-[var(--border)]" />
                  <Link
                    href="/shop"
                    onClick={() => setCollectionsOpen(false)}
                    className="block px-4 py-2.5 text-sm font-bold text-[var(--accent)] transition hover:bg-[var(--bg-secondary)]"
                  >
                    View all fragrances →
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button onClick={() => setSearchOpen(true)} className={iconBtn} aria-label="Search">
              <Search size={19} />
            </button>

            <Link href="/account" className={`${iconBtn} hidden sm:inline-flex`} aria-label="Account">
              <User size={19} />
            </Link>

            <Link href="/account/wishlist" className={`${iconBtn} hidden sm:inline-flex`} aria-label="Wishlist">
              <Heart size={19} className={wishlist.length > 0 ? 'fill-[var(--accent)] text-[var(--accent)]' : ''} />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <button
              onClick={toggleTheme}
              className={`${iconBtn} hidden md:inline-flex`}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <a
              href={wa("Hello! I'd like help choosing a scent.")}
              target="_blank"
              rel="noreferrer"
              className="ml-1 hidden items-center gap-2 rounded-full bg-[var(--charcoal)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--bg-primary)] transition hover:opacity-85 xl:inline-flex"
            >
              <MessageCircle size={14} /> Concierge
            </a>

            {/* Cart */}
            <button onClick={() => setDrawer(true)} className={iconBtn} aria-label="Cart">
              <ShoppingBag size={19} />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          <div
            className="fixed inset-0 z-40 cursor-pointer bg-stone-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
          />

          <aside className="animate-slide-up relative z-50 flex h-full w-full max-w-[330px] flex-col overflow-y-auto border-l border-[var(--border)] bg-[var(--card-bg)] shadow-2xl">
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--card-bg)] px-5 py-4">
              <span className="font-display text-base font-bold tracking-[0.2em] text-[var(--text-primary)]">
                JESSY<span className="text-[var(--accent)]">LUXURY</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)]"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick search entry */}
            <div className="px-4 pt-4">
              <button
                onClick={() => {
                  setOpen(false)
                  setSearchOpen(true)
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-muted)] transition hover:border-[var(--accent)]"
              >
                <Search size={17} /> Search fragrances…
              </button>
            </div>

            <div className="flex-1 space-y-1 px-4 py-5">
              {[['Home', '/'], ...NAV, ['Track Order', '/track'], ['Contact', '/contact']].map(
                ([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isActive(href)
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    {label}
                  </Link>
                )
              )}

              <div className="mx-4 my-3 h-px bg-[var(--border)]" />

              <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Categories
              </p>
              {COLLECTIONS.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)]"
                >
                  {label}
                </Link>
              ))}

              <div className="mx-4 my-3 h-px bg-[var(--border)]" />

              <button
                onClick={() => { toggleTheme(); }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)]"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>

              <div className="px-4 pb-4 pt-2">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Follow us
                </p>
                <div className="flex gap-3">
                  <a
                    href={site.instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <Instagram size={17} />
                  </a>
                  <a
                    href={site.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  >
                    <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.83V7.64a6.34 6.34 0 0 0-5.1 6.2 6.34 6.34 0 0 0 10.84 4.49 6.27 6.27 0 0 0 1.81-4.43V9.11a8.16 8.16 0 0 0 4.56 1.4V7.06a4.85 4.85 0 0 1-2.00-.37z" />
                    </svg>
                  </a>
                  <a
                    href={wa('Hello Jessy Luxury! I am visiting your mobile site.')}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition hover:border-emerald-500 hover:text-emerald-500"
                  >
                    <MessageCircle size={17} />
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
