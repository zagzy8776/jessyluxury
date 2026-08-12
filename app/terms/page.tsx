import { FileText } from 'lucide-react'

export default function TermsPage() {
  return (
    <main className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-[70vh]">
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--card-bg)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.26em] text-amber-500">
            <FileText size={14} /> TERMS OF SERVICE
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold text-[var(--text-primary)] sm:text-6xl">Terms &amp; Conditions</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)] font-medium">
            Please read these terms before ordering from Jessy Luxury Fragrance.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14 lg:px-8 text-[var(--text-secondary)] text-sm leading-7 space-y-6 font-medium">
        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">1. Authenticity Guarantee</h2>
          <p>
            Every fragrance, perfume oil, and body mist sold by Jessy Luxury Fragrance is 100% original and authentic, sourced from authorized distributors.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">2. Order Confirmation &amp; Pricing</h2>
          <p>
            Prices listed are in Nigerian Naira (₦). Orders are officially processed and scheduled for dispatch once full payment confirmation is verified on WhatsApp.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mb-2">3. Delivery &amp; Transit</h2>
          <p>
            Delivery timeframes are estimates based on destination (Owerri same-day rider, interstate waybill parks 1-2 days). The customer is responsible for providing accurate phone and address details.
          </p>
        </div>
      </section>
    </main>
  )
}
