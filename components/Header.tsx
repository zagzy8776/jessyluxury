'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, ShoppingBag, MessageCircle } from 'lucide-react'
import { useCart } from './CartProvider'
import { wa } from '@/lib/site'

const NAV: [string, string][] = [
  ['Home', '/'],
  ['Shop', '/shop'],
  ['Gifts', '/gifts'],
  ['Finder', '/perfume-finder'],
  ['Gallery', '/gallery'],
  ['Blog', '/blog'],
  ['Delivery', '/delivery'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const { count, setDrawer } = useCart()
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-40 border-b border-stone-800/80 bg-stone-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <button
          className="-ml-1.5 p-1.5 text-stone-300 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <Link href="/" className="flex items-center gap-2">
          <span className="font-display text-lg tracking-[0.2em] text-stone-100">
            JESSY<span className="text-amber-400"> LUXURY</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className={`text-[11px] tracking-[0.08em] transition ${
                isActive(href) ? 'text-amber-400' : 'text-stone-400 hover:text-stone-100'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={wa("Hello! I'd like help choosing a scent.")}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full bg-green-600 px-4 py-2 text-[11px] font-semibold text-white transition hover:bg-green-500 sm:inline-flex"
          >
            <MessageCircle size={15} /> Chat
          </a>
          <button onClick={() => setDrawer(true)} className="relative p-2 text-stone-300 transition hover:text-amber-400" aria-label="Cart">
            <ShoppingBag size={19} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-stone-950">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-stone-800 bg-stone-950 px-6 py-4 lg:hidden">
          <div className="grid">
            {NAV.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`rounded py-2.5 text-sm transition ${
                  isActive(href) ? 'text-amber-400' : 'text-stone-300 hover:text-amber-400'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
