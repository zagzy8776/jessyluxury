import Link from 'next/link'
import { Instagram, MessageCircle, MapPin, Mail } from 'lucide-react'
import { site, wa } from '@/lib/site'

export default function Footer() {
  return (
    <footer className="border-t border-stone-800 bg-stone-950">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="font-display text-lg tracking-[0.2em] text-stone-100">
              {site.brandUpper}
            </span>
            <p className="mt-3 max-w-xs text-xs leading-6 text-stone-500">
              Original designer and Arabian fragrances, oil perfumes and gift sets curated for
              confident everyday living.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-stone-900 p-2.5 text-stone-300 transition hover:text-amber-400"
                aria-label="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href={wa('Hello! I visited your website.')}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-stone-900 p-2.5 text-stone-300 transition hover:text-green-400"
                aria-label="WhatsApp"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400">SHOP</p>
            <div className="mt-4 space-y-3 text-xs text-stone-500">
              <Link className="block transition hover:text-amber-300" href="/shop">All fragrances</Link>
              <Link className="block transition hover:text-amber-300" href="/gifts">Gifts &amp; sets</Link>
              <Link className="block transition hover:text-amber-300" href="/perfume-finder">Perfume finder</Link>
              <Link className="block transition hover:text-amber-300" href="/gallery">Gallery</Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400">EXPLORE</p>
            <div className="mt-4 space-y-3 text-xs text-stone-500">
              <Link className="block transition hover:text-amber-300" href="/about">About</Link>
              <Link className="block transition hover:text-amber-300" href="/blog">Blog</Link>
              <Link className="block transition hover:text-amber-300" href="/delivery">Delivery &amp; pickup</Link>
              <Link className="block transition hover:text-amber-300" href="/contact">Contact</Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-stone-400">CONTACT</p>
            <div className="mt-4 space-y-3 text-xs text-stone-500">
              <span className="flex items-center gap-2">
                <MapPin size={13} /> {site.location}
              </span>
              <a className="flex items-center gap-2 transition hover:text-green-400" href={wa('Hello Jessy Luxury!')} target="_blank" rel="noreferrer">
                <MessageCircle size={13} /> WhatsApp us
              </a>
              <a className="flex items-center gap-2 transition hover:text-amber-300" href={`mailto:${site.email}`}>
                <Mail size={13} /> {site.email}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-stone-800" />
        <div className="flex flex-col items-center justify-between gap-3 pt-6 text-[10px] tracking-[0.08em] text-stone-600 sm:flex-row">
          <span>© {new Date().getFullYear()} {site.brand} Fragrance</span>
          <span>{site.tagline}</span>
        </div>
      </div>
    </footer>
  )
}
