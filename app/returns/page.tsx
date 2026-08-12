import { RefreshCw } from 'lucide-react'

export default function ReturnsPage() {
  return (
    <main className="bg-stone-950 min-h-[70vh]">
      <section className="relative overflow-hidden border-b border-stone-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.26em] text-amber-400">
            <RefreshCw size={14} /> REFUNDS &amp; RETURNS
          </p>
          <h1 className="mt-3 font-display text-5xl text-stone-50 sm:text-6xl">Return Policy</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-400">
            Our promise to you on damaged or incorrect items.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14 lg:px-8 text-stone-300 text-sm leading-7 space-y-6">
        <div>
          <h2 className="font-display text-2xl text-stone-50 mb-2">1. Damaged or Broken Bottles</h2>
          <p>
            If your perfume arrives broken or damaged during transit, please take unboxing photos or video within 24 hours of delivery and send them to us on WhatsApp. We will immediately issue a replacement or full refund.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl text-stone-50 mb-2">2. Unopened &amp; Sealed Return</h2>
          <p>
            Due to hygiene and fragrance integrity standards, opened or sprayed perfume bottles cannot be returned for change of mind. Unopened, sealed boxes may be exchanged within 48 hours of delivery.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl text-stone-50 mb-2">3. How to Request an Exchange</h2>
          <p>
            Message our WhatsApp support team with your Order # (e.g. JL-849201) and item photo.
          </p>
        </div>
      </section>
    </main>
  )
}
