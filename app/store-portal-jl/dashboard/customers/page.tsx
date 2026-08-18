'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Phone, MessageCircle, Search, MapPin, ShoppingBag, DollarSign,
  X, Save, Sparkles, Users, UserCheck, RefreshCw, Mail, BellRing
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    totalSpend: 0,
  })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  
  // Drawer edits state
  const [notes, setNotes] = useState('')
  const [marketingEmail, setMarketingEmail] = useState(true)
  const [marketingWhatsapp, setMarketingWhatsapp] = useState(true)
  const [marketingPush, setMarketingPush] = useState(true)
  const [savingDrawer, setSavingDrawer] = useState(false)

  const { toast, showToast, clearToast } = useToast()

  useEffect(() => {
    fetchCustomersData()
  }, [search])

  async function fetchCustomersData() {
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`)
      const data = await res.json()
      if (data.customers && Array.isArray(data.customers)) {
        setCustomers(data.customers)
      }
      if (data.summary) {
        setSummary(data.summary)
      }
    } catch (e) {
      console.error('Failed to fetch customers data', e)
      showToast('Error loading CRM directory', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenCustomer(c: any) {
    setSelectedCustomer(c)
    setNotes(c.notes || '')
    setMarketingEmail(c.marketingEmail ?? true)
    setMarketingWhatsapp(c.marketingWhatsapp ?? true)
    setMarketingPush(c.marketingPush ?? true)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCustomer) return

    setSavingDrawer(true)
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          marketingEmail,
          marketingWhatsapp,
          marketingPush,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        showToast('Customer CRM preferences updated!')
        // Update customer in state
        setCustomers(customers.map((c) => c.id === selectedCustomer.id ? { ...c, ...data } : c))
        setSelectedCustomer({ ...selectedCustomer, ...data })
      } else {
        showToast(data.error || 'Failed to update preferences', 'error')
      }
    } catch {
      showToast('Error updating customer profile', 'error')
    } finally {
      setSavingDrawer(false)
    }
  }

  const getCustomerTypeLabel = (ordersCount: number) => {
    if (ordersCount === 0) return { text: 'Lead Inquirer', style: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-500/20' }
    if (ordersCount === 1) return { text: 'One-Time Client', style: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' }
    return { text: 'Returning Client', style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' }
  }

  const getAOVText = (totalSpent: number, count: number) => {
    if (count === 0) return 'No orders yet'
    const aov = Math.round(totalSpent / count)
    return `₦${aov.toLocaleString('en-NG')}`
  }

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-sans font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Customer Directory CRM
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            Manage customer client files, communication preferences, and audit logs.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-3 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--card-bg)] py-2.5 pl-10 pr-4 text-xs font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 shadow-sm"
          />
        </div>
      </div>

      {/* Summary Aggregate Metrics */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-sm transition hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Total CRM Accounts</span>
            <span className="rounded-xl bg-amber-500/10 p-2 text-amber-500 border border-amber-500/20">
              <Users size={16} />
            </span>
          </div>
          <p className="mt-2.5 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">{summary.totalCustomers}</p>
          <p className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">Registered client database</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-sm transition hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Recently Added</span>
            <span className="rounded-xl bg-blue-500/10 p-2 text-blue-500 border border-blue-500/20">
              <UserCheck size={16} />
            </span>
          </div>
          <p className="mt-2.5 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">{summary.newCustomers}</p>
          <p className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">Added in the last 30 days</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-sm transition hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Returning Clients</span>
            <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500 border border-emerald-500/20">
              <RefreshCw size={16} />
            </span>
          </div>
          <p className="mt-2.5 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">{summary.returningCustomers}</p>
          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Profiles with 2+ completed orders</p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-sm transition hover:border-[var(--border-hover)]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Total Store Spend</span>
            <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500 border border-emerald-500/20">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="mt-2.5 font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">₦{summary.totalSpend?.toLocaleString('en-NG')}</p>
          <p className="text-[9px] text-[var(--text-muted)] font-medium mt-0.5">Aggregate of completed sales</p>
        </div>
      </div>

      {/* Directory Directory Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Loading customer directory…</div>
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] py-20 text-center text-xs font-medium text-[var(--text-muted)]">
          No customer records found matching your search query.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((c) => {
            const cleanWa = c.whatsapp.replace(/\D/g, '')
            const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
              `Hello ${c.name}! This is Jessy from Jessy Luxury Fragrance.`
            )}`
            const callUrl = `tel:${c.phone}`
            const badge = getCustomerTypeLabel(c.ordersCount)
            const isVip = c.totalSpent >= 150000

            return (
              <div
                key={c.id}
                onClick={() => handleOpenCustomer(c)}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 hover:border-amber-500 transition shadow-sm cursor-pointer relative group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-base shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-bold text-[var(--text-primary)] group-hover:text-amber-500 transition">{c.name}</h3>
                          {isVip && (
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-500 border border-amber-500/30">
                              <Sparkles size={8} /> VIP
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] font-mono font-medium">{c.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-[var(--text-secondary)] border-t border-[var(--border)] pt-4 font-medium">
                    {c.address && (
                      <div className="flex items-center gap-2 text-[10px]">
                        <MapPin size={13} className="text-amber-500 shrink-0" />
                        <span className="truncate">{c.address} {c.city ? `(${c.city})` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                        <ShoppingBag size={13} className="text-amber-500" /> Orders: <strong className="text-[var(--text-primary)] font-mono font-bold">{c.ordersCount}</strong>
                      </span>
                      <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                        <DollarSign size={13} className="text-emerald-500" /> Spend: <strong className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">₦{c.totalSpent.toLocaleString('en-NG')}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Badging and Quick Communication options */}
                <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.style}`}>
                    {badge.text}
                  </span>
                  
                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={callUrl}
                      className="p-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-blue-500 hover:border-blue-500/40 transition"
                      title="Call Customer"
                    >
                      <Phone size={13} />
                    </a>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition shadow-sm"
                      title="WhatsApp Customer"
                    >
                      <MessageCircle size={13} />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Customer CRM profile Detail Side-Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs">
          {/* Backdrop Closer */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedCustomer(null)} />

          {/* Drawer Body */}
          <div className="relative w-full max-w-lg h-full bg-[var(--card-bg)] border-l border-[var(--border)] p-6 shadow-2xl overflow-y-auto space-y-6 flex flex-col justify-between">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold text-lg">
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      {selectedCustomer.name}
                      {selectedCustomer.totalSpent >= 150000 && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-500 border border-amber-500/30">
                          <Sparkles size={8} /> VIP
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] font-mono font-medium">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-xl border border-[var(--border)] p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Core CRM Statistics Cards */}
              <div className="grid grid-cols-3 gap-2 text-center mt-6">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Completed Orders</p>
                  <p className="font-mono text-base font-bold text-[var(--text-primary)] mt-1">{selectedCustomer.ordersCount}</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Total Spend</p>
                  <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">₦{selectedCustomer.totalSpent.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3">
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Average Order Value</p>
                  <p className="font-mono text-base font-bold text-amber-500 mt-1">{getAOVText(selectedCustomer.totalSpent, selectedCustomer.ordersCount)}</p>
                </div>
              </div>

              {/* CRM Forms (Notes & Notification Preferences) */}
              <form onSubmit={handleSaveProfile} className="space-y-4 mt-6 text-xs font-medium">
                <div>
                  <label className={lbl}>Client Notes & Preferences</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Fragrance preferences, customized sample choices, delivery details..."
                    rows={4}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none focus:border-amber-500 resize-none font-medium text-xs"
                  />
                </div>

                <div className="space-y-2 border border-dashed border-[var(--border)] rounded-xl p-3 bg-stone-500/5">
                  <p className="font-bold text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Marketing Notifications Channels</p>
                  <p className="text-[9px] text-[var(--text-muted)] mb-2">Configure client marketing subscriptions. Transactional notifications are always on.</p>
                  
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2.5 cursor-pointer py-0.5 select-none">
                      <input
                        type="checkbox"
                        checked={marketingEmail}
                        onChange={(e) => setMarketingEmail(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-[var(--border)] text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px] text-[var(--text-primary)] font-bold flex items-center gap-1.5"><Mail size={12} className="text-[var(--text-secondary)]" /> Opt-In Promotional Emails</span>
                    </label>
                    
                    <label className="flex items-center gap-2.5 cursor-pointer py-0.5 select-none">
                      <input
                        type="checkbox"
                        checked={marketingWhatsapp}
                        onChange={(e) => setMarketingWhatsapp(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-[var(--border)] text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px] text-[var(--text-primary)] font-bold flex items-center gap-1.5"><MessageCircle size={12} className="text-emerald-500" /> Opt-In WhatsApp Broadcasts</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer py-0.5 select-none">
                      <input
                        type="checkbox"
                        checked={marketingPush}
                        onChange={(e) => setMarketingPush(e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-[var(--border)] text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px] text-[var(--text-primary)] font-bold flex items-center gap-1.5"><BellRing size={12} className="text-amber-500" /> Opt-In Store Push Alerts</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingDrawer}
                  className="w-full rounded-xl bg-amber-500 py-3.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Save size={14} /> {savingDrawer ? 'Saving File...' : 'Save CRM File'}
                </button>
              </form>

              {/* Order History */}
              <div className="space-y-3 mt-6 border-t border-[var(--border)] pt-5">
                <h4 className="font-bold text-[10px] text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag size={13} className="text-amber-500" /> Purchase Transaction History
                </h4>
                
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedCustomer.orders?.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] text-center py-4">No order history logged.</p>
                  ) : (
                    selectedCustomer.orders?.map((ord: any) => (
                      <Link
                        key={ord.id}
                        href={`/store-portal-jl/dashboard/orders?openId=${ord.id}`}
                        className="flex justify-between items-center rounded-xl bg-[var(--bg-primary)] p-3 border border-[var(--border)] hover:border-amber-500 transition group"
                      >
                        <div className="text-xs">
                          <p className="font-mono font-bold text-[var(--text-primary)] group-hover:text-amber-500 transition">{ord.orderNumber}</p>
                          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                            {new Date(ord.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-bold text-[var(--text-primary)]">₦{ord.total?.toLocaleString()}</p>
                          <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">{ord.paymentStatus}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Quick Contact Bar */}
            <div className="border-t border-[var(--border)] pt-4 flex gap-2">
              <a
                href={`tel:${selectedCustomer.phone}`}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] py-3 text-xs font-bold text-[var(--text-primary)] transition hover:border-amber-500 hover:text-amber-500"
              >
                <Phone size={14} className="text-blue-500" /> Call
              </a>
              <a
                href={`https://wa.me/${selectedCustomer.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selectedCustomer.name}!`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 shadow-sm"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
