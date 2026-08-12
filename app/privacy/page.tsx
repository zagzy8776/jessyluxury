import { Shield } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <main className="bg-stone-950 min-h-[70vh]">
      <section className="relative overflow-hidden border-b border-stone-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,163,93,0.14),transparent_60%)]" />
        <div className="grain absolute inset-0" />
        <div className="relative mx-auto max-w-4xl px-6 py-16 text-center lg:px-8 lg:py-20">
          <p className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.26em] text-amber-400">
            <Shield size={14} /> LEGAL &amp; PRIVACY
          </p>
          <h1 className="mt-3 font-display text-5xl text-stone-50 sm:text-6xl">Privacy Policy</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-stone-400">
            How Jessy Luxury Fragrance handles and protects your personal information.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-14 lg:px-8 text-stone-300 text-sm leading-7 space-y-6">
        <div>
          <h2 className="font-display text-2xl text-stone-50 mb-2">1. Information We Collect</h2>
          <p>
            When you place an order or message us via WhatsApp, we collect personal information such as your full name, phone number, delivery address, and order choices. This information is strictly used to process and deliver your fragrance order.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl text-stone-50 mb-2">2. How We Use Your Data</h2>
          <p>
            Your details are used solely to fulfill your order, provide rider/courier tracking updates, confirm payment, and offer personal scent advice. We do not sell or rent your personal data to third parties.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl text-stone-50 mb-2">3. Payment &amp; Security</h2>
          <p>
            We do not store your credit card or sensitive banking credentials on our servers. Bank transfers and payments are verified securely.
          </p>
        </div>

        <div>
          <h2 className="font-display text-2xl text-stone-50 mb-2">4. Contact Us</h2>
          <p>
            If you have questions regarding your data privacy, message us directly via our official WhatsApp line or contact page.
          </p>
        </div>
      </section>
    </main>
  )
}
