'use client'
import { useEffect, useState } from 'react'
import { Phone, MessageCircle, Search, User, MapPin, ShoppingBag, DollarSign } from 'lucide-react'

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
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-medium text-stone-50">Customer Directory CRM</h1>
          <p className="mt-1 text-sm text-stone-400">
            View all customers who have ordered or inquired. Click to call or WhatsApp immediately.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-3 text-stone-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, city..."
            className="w-full rounded-xl border border-stone-800 bg-stone-900 py-2.5 pl-9 pr-4 text-xs text-stone-200 outline-none transition placeholder:text-stone-600 focus:border-amber-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-stone-500">Loading customer directory…</div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/40 py-20 text-center text-stone-500 text-sm">
          No customer records found matching your search.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => {
            const cleanPhone = c.phone.replace(/\D/g, '')
            const cleanWa = (c.whatsapp || c.phone).replace(/\D/g, '')
            const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
              `Hello ${c.name}! This is Jessy from Jessy Luxury Fragrance.`
            )}`
            const callUrl = `tel:${c.phone}`

            return (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-stone-800 bg-stone-900/60 p-5 transition hover:border-amber-500/40"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-medium text-stone-100">{c.name}</h3>
                        <p className="text-xs text-stone-400 font-mono">{c.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-stone-400 border-t border-stone-800/80 pt-4">
                    {c.city && (
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-amber-400 shrink-0" />
                        <span>{c.city} {c.address ? `• ${c.address}` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="flex items-center gap-1.5 text-stone-400">
                        <ShoppingBag size={13} className="text-amber-400" /> Orders: <strong className="text-stone-100 font-mono">{c.ordersCount}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 text-stone-400">
                        <DollarSign size={13} className="text-green-400" /> Spent: <strong className="text-green-300 font-mono">₦{c.totalSpent.toLocaleString('en-NG')}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Action Buttons */}
                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-stone-800/80 pt-4">
                  <a
                    href={callUrl}
                    className="flex items-center justify-center gap-2 rounded-xl border border-stone-700 bg-stone-800 px-3 py-2.5 text-xs font-bold text-stone-200 transition hover:bg-stone-700 hover:text-white"
                  >
                    <Phone size={14} className="text-blue-400" /> CALL
                  </a>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-green-500 shadow-md"
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
