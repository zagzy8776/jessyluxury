'use client'
import { useEffect, useState } from 'react'
import { Phone, MessageCircle, Search, MapPin, ShoppingBag, DollarSign } from 'lucide-react'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCustomers()
  }, [search])

  async function fetchCustomers() {
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setCustomers(data)
      }
    } catch (e) {
      console.error('Failed to fetch customers', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Customer Directory CRM
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            View all customers who have ordered or inquired. Click to call or WhatsApp immediately.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, city..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] py-2.5 pl-10 pr-4 text-xs font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 shadow-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Loading customer directory…</div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] py-20 text-center text-xs font-medium text-[var(--text-muted)]">
          No customer records found matching your search.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => {
            const cleanWa = (c.whatsapp || c.phone).replace(/\D/g, '')
            const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
              `Hello ${c.name}! This is Jessy from Jessy Luxury Fragrance.`
            )}`
            const callUrl = `tel:${c.phone}`

            return (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 transition hover:border-amber-500/40 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-base shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-[var(--text-primary)]">{c.name}</h3>
                        <p className="text-xs text-[var(--text-muted)] font-mono font-medium">{c.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-[var(--text-secondary)] border-t border-[var(--border)] pt-4 font-medium">
                    {c.city && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-amber-500 shrink-0" />
                        <span>{c.city} {c.address ? `• ${c.address}` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <ShoppingBag size={14} className="text-amber-500" /> Orders: <strong className="text-[var(--text-primary)] font-mono">{c.ordersCount}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                        <DollarSign size={14} className="text-emerald-500" /> Spent: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">₦{c.totalSpent.toLocaleString('en-NG')}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-4">
                  <a
                    href={callUrl}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-xs font-bold text-[var(--text-primary)] transition hover:border-amber-500 hover:text-amber-500"
                  >
                    <Phone size={14} className="text-blue-500" /> CALL
                  </a>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 shadow-sm"
                  >
                    <MessageCircle size={14} /> WHATSAPP
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
