import { CheckCircle2, MapPin, MessageCircle, Store, Truck, Waypoints } from 'lucide-react'
import { wa } from '@/lib/site'

const methods = [
  {
    icon: Store,
    title: 'Pickup from store',
    fee: 'Free',
    note: 'Pick up in person in Owerri after confirmation on WhatsApp.',
  },
  {
    icon: MapPin,
    title: 'Owerri delivery',
    fee: '₦3,000',
    note: 'Same- / next-day rider delivery within Owerri, coordinated after confirmation.',
  },
  {
    icon: Waypoints,
    title: 'Waybill / park dispatch',
    fee: '₦1,000',
    note: 'Send your order to the park for transport to your city — rider costs are paid by you.',
  },
]

const steps = [
  'Send your order on WhatsApp',
  'We confirm price, availability & delivery total',
  'Payment via bank transfer (details shared on WhatsApp)',
  'We dispatch, then share your tracking / rider update',
]

const faqs = [
  { q: 'How fast is delivery?', a: 'Owerri deliveries usually arrive the same day. Waybill dispatch goes out the same day for morning orders, and other cities typically arrive within 1–3 days depending on the park route.' },
  { q: 'Do you deliver outside Nigeria?', a: 'We currently deliver within Nigeria only. For international orders, send us a message and we will check what is possible.' },
  { q: 'What if my perfume is damaged in transit?', a: 'Send us photos within 24 hours of delivery and we will make it right — replacement or refund.' },
]

export default function DeliveryPage() {
  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.26em] text-amber-500">
            <Truck size={15} /> DELIVERY &amp; PICKUP
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold text-[var(--text-primary)] sm:text-6xl">Get it to your door.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)] font-medium">
            Pick it up in Owerri, or have it delivered anywhere in Nigeria.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {methods.map((m) => (
            <div key={m.title} className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-sm">
              <span className="rounded-full bg-amber-500/10 p-3.5 text-amber-500 inline-block">
                <m.icon size={22} />
              </span>
              <p className="mt-5 font-display text-2xl font-bold text-[var(--text-primary)]">{m.title}</p>
              <p className="mt-1 text-lg font-bold text-amber-500">{m.fee}</p>
              <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)] font-medium">{m.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-sm">
            <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">How ordering works</h2>
            <ol className="mt-6 space-y-5">
              {steps.map((s, i) => (
                <li key={s} className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-stone-950">
                    {i + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-[var(--text-secondary)] font-medium">{s}</p>
                </li>
              ))}
            </ol>
            <a
              href={wa('Hello Jessy Luxury! I\'d like to place an order.')}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-7 py-4 text-xs font-bold tracking-[0.12em] text-white transition hover:bg-emerald-500 shadow-md"
            >
              <MessageCircle size={15} /> START AN ORDER
            </a>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-sm">
            <h2 className="font-display text-3xl font-bold text-[var(--text-primary)]">Questions</h2>
            <div className="mt-6 space-y-5">
              {faqs.map((f) => (
                <div key={f.q}>
                  <p className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                    <CheckCircle2 size={16} className="text-amber-500" /> {f.q}
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-[var(--text-secondary)] font-medium">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}