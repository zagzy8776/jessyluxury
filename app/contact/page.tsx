'use client'
import { useState } from 'react'
import { Clock, Instagram, Mail, MapPin, MessageCircle, Send } from 'lucide-react'
import { site, wa } from '@/lib/site'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')

  const href =
    wa(`Hello Jessy Luxury! My name is ${name || '___'}.\n\n${msg || 'I have a question.'}`)

  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="text-[10px] font-bold tracking-[0.26em] text-amber-500">GET IN TOUCH</p>
          <h1 className="mt-3 font-display text-5xl font-bold text-[var(--text-primary)] sm:text-6xl">Contact Us</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)] font-medium">
            Questions, orders or scent advice — we reply fast on WhatsApp.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">Send us a message</h2>
          <div className="mt-6 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-5 py-4 text-sm font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 shadow-sm"
            />
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="How can we help?"
              rows={5}
              className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-5 py-4 text-sm font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 shadow-sm"
            />
          </div>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-xs font-bold tracking-[0.14em] text-white transition hover:bg-emerald-500 shadow-md"
          >
            <Send size={15} /> SEND ON WHATSAPP
          </a>
        </div>

        <div className="space-y-4">
          {[
            { icon: MessageCircle, t: 'WhatsApp', d: site.phone, href: wa('Hello Jessy Luxury!') },
            { icon: Mail, t: 'Email', d: site.email, href: `mailto:${site.email}` },
            { icon: MapPin, t: 'Location', d: site.location },
            { icon: Clock, t: 'Hours', d: site.hours },
            { icon: Instagram, t: 'Instagram', d: '@jessyluxury', href: site.instagram },
          ].map((c) => (
            <div key={c.t} className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
              <span className="rounded-full bg-amber-500/10 p-3 text-amber-500">
                <c.icon size={19} />
              </span>
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] text-[var(--text-muted)] uppercase">{c.t}</p>
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noreferrer" className="text-sm font-bold text-[var(--text-primary)] transition hover:text-amber-600">
                    {c.d}
                  </a>
                ) : (
                  <p className="text-sm font-bold text-[var(--text-primary)]">{c.d}</p>
                )}
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
            <p className="text-sm leading-6 text-[var(--text-secondary)] font-medium">
              <span className="font-bold text-amber-600">Business tip:</span> for order
              enquiries, including the exact perfume names from the shop helps us reply faster.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}