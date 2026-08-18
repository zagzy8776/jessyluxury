'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Instagram, MessageCircle, MapPin, Mail } from 'lucide-react'
import { site, wa } from '@/lib/site'

export default function Footer() {
  const pathname = usePathname()

  if (pathname?.startsWith('/store-portal-jl') || pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)]">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="font-display text-lg tracking-[0.2em] font-bold text-[var(--text-primary)]">
              JESSY <span className="text-amber-500">LUXURY</span>
            </span>
            <p className="mt-3 max-w-xs text-xs leading-6 text-[var(--text-secondary)] font-medium">
              Original designer and Arabian fragrances, oil perfumes and gift sets curated for
              confident everyday living.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-[var(--text-secondary)] transition hover:border-amber-500 hover:text-amber-500"
              >
                <Instagram size={16} />
              </a>
              <a
                href={site.tiktok}
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok"
                className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-[var(--text-secondary)] transition hover:border-amber-500 hover:text-amber-500"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 1 1-5.2-1.74 2.89 2.89 0 0 1 2.31-2.83V7.64a6.34 6.34 0 0 0-5.1 6.2 6.34 6.34 0 0 0 10.84 4.49 6.27 6.27 0 0 0 1.81-4.43V9.11a8.16 8.16 0 0 0 4.56 1.4V7.06a4.85 4.85 0 0 1-2.00-.37z"/>
                </svg>
              </a>
              <a
                href={wa('Hello Jessy Luxury! I have a general question.')}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-[var(--text-secondary)] transition hover:border-emerald-500 hover:text-emerald-400"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase">SHOP</p>
            <ul className="mt-4 flex flex-col gap-2.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/shop" className="hover:text-[var(--text-primary)] transition">All Fragrances</Link></li>
              <li><Link href="/gifts" className="hover:text-[var(--text-primary)] transition">Gift Sets</Link></li>
              <li><Link href="/perfume-finder" className="hover:text-[var(--text-primary)] transition">Perfume Finder</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase">CUSTOMER CARE</p>
            <ul className="mt-4 flex flex-col gap-2.5 text-xs text-[var(--text-secondary)] font-medium">
              <li><Link href="/track" className="hover:text-[var(--text-primary)] transition">Track Order</Link></li>
              <li><Link href="/delivery" className="hover:text-[var(--text-primary)] transition">Delivery & Pickup</Link></li>
              <li><Link href="/returns" className="hover:text-[var(--text-primary)] transition">Returns & Exchanges</Link></li>
              <li><Link href="/contact" className="hover:text-[var(--text-primary)] transition">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase">CONTACT</p>
            <div className="mt-4 flex flex-col gap-3 text-xs text-[var(--text-secondary)] font-medium">
              <span className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 shrink-0 text-amber-500" />
                <span>{site.location}</span>
              </span>
              <span className="flex items-center gap-2">
                <Mail size={15} className="shrink-0 text-amber-500" />
                <span>{site.email}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 text-[11px] text-[var(--text-muted)] font-medium sm:flex-row">
          <p>© {new Date().getFullYear()} {site.brand}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[var(--text-secondary)] transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[var(--text-secondary)] transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
