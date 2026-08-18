'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Menu, X, ShoppingBag, MessageCircle, ChevronDown, Sun, Moon, Instagram } from 'lucide-react'
import { useCart } from './CartProvider'
import { site, wa } from '@/lib/site'

const COLLECTIONS = [
  ['Oud & Amber', '/shop?cat=Oud+%26+Amber'],
  ['Fresh & Floral', '/shop?cat=Fresh+%26+Floral'],
  ['Sweet & Gourmand', '/shop?cat=Sweet+%26+Gourmand'],
  ['Perfume Oils', '/shop?cat=Perfume+Oils'],
  ['Gift Sets', '/shop?cat=Gift+Sets'],
]

const NAV: [string, string][] = [
  ['Home', '/'],
  ['Shop', '/shop'],
  ['Track Order', '/track'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const { count, setDrawer } = useCart()
  const pathname = usePathname()
  const collectionsRef = useRef<HTMLDivElement>(null)

  if (pathname?.startsWith('/store-portal-jl') || pathname?.startsWith('/admin')) {
    return null
  }

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('jl_theme') as 'dark' | 'light' | null
    const active = saved || 'light'
    setTheme(active)
    document.documentElement.setAttribute('data-theme', active)
  }, [])

  // Close collections dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (collectionsRef.current && !collectionsRef.current.contains(e.target as Node)) {
        setCollectionsOpen(false)
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

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-primary)] shadow-xs transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        {/* Mobile menu toggle */}
        <button
          className="-ml-1.5 p-1.5 text-[var(--text-muted)] lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-lg tracking-[0.2em] text-[var(--text-primary)]">
            JESSY<span className="text-amber-400"> LUXURY</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-5 lg:flex">
          {NAV.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`text-[11px] tracking-[0.08em] transition ${
                isActive(href)
                  ? 'text-amber-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
            </Link>
          ))}

          {/* Collections Dropdown */}
          <div ref={collectionsRef} className="relative">
            <button
              onClick={() => setCollectionsOpen(!collectionsOpen)}
              className={`flex items-center gap-1 text-[11px] tracking-[0.08em] transition ${
                pathname.startsWith('/shop')
                  ? 'text-amber-400'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Collections
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${collectionsOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {collectionsOpen && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-52 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] shadow-2xl backdrop-blur-xl py-2 z-50">
                <p className="px-4 py-1.5 text-[9px] font-bold tracking-[0.2em] text-stone-500 uppercase">
                  Shop by Collection
                </p>
                {COLLECTIONS.map(([label, href]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setCollectionsOpen(false)}
                    className="block px-4 py-2.5 text-xs text-[var(--text-muted)] hover:text-amber-400 hover:bg-amber-500/5 transition"
                  >
                    {label}
                  </Link>
                ))}
                <div className="mx-4 my-1 border-t border-[var(--border)]" />
                <Link
                  href="/shop"
                  onClick={() => setCollectionsOpen(false)}
                  className="block px-4 py-2.5 text-xs font-semibold text-amber-400 hover:bg-amber-500/5 transition"
                >
                  View All Products →
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* WhatsApp Chat */}
          <a
            href={wa("Hello! I'd like help choosing a scent.")}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-green-500 sm:inline-flex"
          >
            <MessageCircle size={15} /> Chat
          </a>

          {/* Cart */}
          <button
            onClick={() => setDrawer(true)}
            className="relative p-2 text-[var(--text-muted)] transition hover:text-amber-400"
            aria-label="Cart"
          >
            <ShoppingBag size={19} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-stone-950">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Slide-Out Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end lg:hidden">
          {/* Backdrop Dimming Overlay */}
          <div
            className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity z-40 cursor-pointer"
            onClick={() => setOpen(false)}
          />

          {/* Rightward Solid Opaque Panel */}
          <aside className="relative z-50 flex h-full w-full max-w-[320px] flex-col border-l border-[var(--border)] bg-[var(--card-bg)] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Sticky Top Bar with Close Button */}
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--card-bg)] px-6 py-5 shadow-xs">
              <span className="font-display text-base tracking-[0.2em] font-bold text-[var(--text-primary)]">
                MENU
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-[var(--text-secondary)] hover:text-amber-500 transition"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Links */}
            <div className="flex-1 px-4 py-6 space-y-1">
              {NAV.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl px-4 py-3.5 text-sm transition font-medium ${
                    isActive(href)
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-primary)] hover:text-amber-400'
                  }`}
                >
                  {label}
                </Link>
              ))}

              <div className="my-4 h-px bg-[var(--border)] mx-4" />

              {/* Mobile Collections */}
              <p className="px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase">Collections</p>
              {COLLECTIONS.map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-amber-400 transition"
                >
                  {label}
                </Link>
              ))}

              <div className="my-4 h-px bg-[var(--border)] mx-4" />

              {/* Mobile Theme Toggle */}
              <button
                onClick={() => { toggleTheme(); setOpen(false) }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-amber-400 transition font-medium"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>

              <div className="my-4 h-px bg-[var(--border)] mx-4" />

              {/* Mobile Social Links */}
              <div className="px-4 pt-1 pb-4">
                <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-stone-500 uppercase">Follow Us</p>
                <div className="flex gap-3">
                  <a
                    href={site.instagram}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-amber-500 hover:text-amber-500 transition"
                  >
                    <Instagram size={17} />
                  </a>
                  <a
                    href={site.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="TikTok"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-amber-500 hover:text-amber-500 transition"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.83V7.64a6.34 6.34 0 0 0-5.1 6.2 6.34 6.34 0 0 0 10.84 4.49 6.27 6.27 0 0 0 1.81-4.43V9.11a8.16 8.16 0 0 0 4.56 1.4V7.06a4.85 4.85 0 0 1-2.00-.37z"/>
                    </svg>
                  </a>
                  <a
                    href={wa('Hello Jessy Luxury! I am visiting your mobile site.')}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:border-emerald-500 hover:text-emerald-400 transition"
                  >
                    <MessageCircle size={17} />
                  </a>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </header>
  )
}
