'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Instagram, MessageCircle, MapPin, Mail, Clock } from 'lucide-react'
import { site, wa } from '@/lib/site'

export default function Footer() {
  const pathname = usePathname()

  if (pathname?.startsWith('/store-portal-jl') || pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <span className="font-display text-lg font-bold tracking-[0.22em] text-[var(--text-primary)]">
              JESSY<span className="ml-1.5 text-[var(--accent)]">LUXURY</span>
            </span>
            <p className="mt-3 max-w-xs text-xs font-medium leading-6 text-[var(--text-secondary)]">
              Original designer and Arabian fragrances, oil perfumes and gift sets curated for
              confident everyday living.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] p-2.5 text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Instagram size={15} />
              </a>
              <a
                href={site.tiktok}
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] p-2.5 text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.83V7.64a6.34 6.34 0 0 0-5.1 6.2 6.34 6.34 0 0 0 10.84 4.49 6.27 6.27 0 0 0 1.81-4.43V9.11a8.16 8.16 0 0 0 4.56 1.4V7.06a4.85 4.85 0 0 1-2.00-.37z" />
                </svg>
              </a>
              <a
                href={wa('Hello Jessy Luxury! I have a general question.')}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] p-2.5 text-[var(--text-secondary)] transition hover:border-emerald-500 hover:text-emerald-500"
              >
                <MessageCircle size={15} />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Shop</p>
            <ul className="mt-4 flex flex-col gap-2.5 text-xs font-medium text-[var(--text-secondary)]">
              <li><Link href="/shop" className="transition hover:text-[var(--text-primary)]">All Fragrances</Link></li>
              <li><Link href="/shop?filter=best" className="transition hover:text-[var(--text-primary)]">Best Sellers</Link></li>
              <li><Link href="/shop?cat=Gift+Sets" className="transition hover:text-[var(--text-primary)]">Gift Sets</Link></li>
              <li><Link href="/perfume-finder" className="transition hover:text-[var(--text-primary)]">Perfume Finder</Link></li>
            </ul>
          </div>

          {/* Customer care */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Customer Care</p>
            <ul className="mt-4 flex flex-col gap-2.5 text-xs font-medium text-[var(--text-secondary)]">
              <li><Link href="/track" className="transition hover:text-[var(--text-primary)]">Track Order</Link></li>
              <li><Link href="/account" className="transition hover:text-[var(--text-primary)]">My Account</Link></li>
              <li><Link href="/delivery" className="transition hover:text-[var(--text-primary)]">Delivery & Pickup</Link></li>
              <li><Link href="/returns" className="transition hover:text-[var(--text-primary)]">Returns & Exchanges</Link></li>
              <li><Link href="/contact" className="transition hover:text-[var(--text-primary)]">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Visit Us</p>
            <div className="mt-4 flex flex-col gap-3 text-xs font-medium text-[var(--text-secondary)]">
              <span className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
                <span>{site.location}</span>
              </span>
              <span className="flex items-center gap-2">
                <Mail size={14} className="shrink-0 text-[var(--accent)]" />
                <span className="break-all">{site.email}</span>
              </span>
              <span className="flex items-center gap-2">
                <Clock size={14} className="shrink-0 text-[var(--accent)]" />
                <span>{site.hours}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-7 text-[11px] font-medium text-[var(--text-muted)] sm:flex-row">
          <p>© {new Date().getFullYear()} {site.brand}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="transition hover:text-[var(--text-secondary)]">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-[var(--text-secondary)]">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
