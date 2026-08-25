'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Phone, MessageCircle, Search, MapPin, ShoppingBag, DollarSign,
  X, Save, Sparkles, Users, UserCheck, RefreshCw, Mail, BellRing, Trash2,
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
  const [customerGroupId, setCustomerGroupId] = useState<string>('')
  const [customerGroups, setCustomerGroups] = useState<any[]>([])
  const [savingDrawer, setSavingDrawer] = useState(false)
  const [deletingCustomer, setDeletingCustomer] = useState(false)

  const { toast, showToast, clearToast } = useToast()

  useEffect(() => {
    fetchCustomersData()
  }, [search])

  useEffect(() => {
    fetch('/api/customer-groups')
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCustomerGroups(data) })
      .catch(() => {})
  }, [])

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
    setCustomerGroupId(c.customerGroupId ? String(c.customerGroupId) : '')
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
          customerGroupId: customerGroupId ? Number(customerGroupId) : null,
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

  async function handleDeleteCustomer() {
    if (!selectedCustomer) return

    const hasOrders = (selectedCustomer.orders?.length || 0) > 0
    const confirmed = confirm(
      hasOrders
        ? `"${selectedCustomer.name}" has historical orders. Deleting will anonymize this account (contact details removed, sales history preserved). Continue?`
        : `Permanently delete "${selectedCustomer.name}"? This cannot be undone.`
    )
    if (!confirmed) return

    setDeletingCustomer(true)
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'DELETE',
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        showToast(data?.error || 'Failed to delete customer', 'error')
        return
      }

      // Server decides: hard delete vs anonymize. Surface whichever happened.
      showToast(data?.message || 'Customer deleted')
      setSelectedCustomer(null)
      fetchCustomersData()
    } catch {
      showToast('Network error while deleting customer', 'error')
    } finally {
      setDeletingCustomer(false)
    }
  }

  const getCustomerTypeLabel = (ordersCount: number) => {
    if (ordersCount === 0) return { text: 'Lead Inquirer', style: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border border-stone-500/20' }
    if (ordersCount === 1) return { text: 'One-Time Client', style: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20' }
    return { text: 'Returning Client', style: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' }
  }

  const getAOVText = (totalSpent: number, count: number) => {
    if (count === 0) return 'No orders yet'
    const aov = Math.round(totalSpent / count)
    return `₦${aov.toLocaleString('en-NG')}`
  }

  const inp = 'admin-input font-medium'
  const lbl = 'mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]'

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">CRM</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Customer Directory</h1>
          <p className="mt-1 text-xs font-medium text-[var(--admin-text-secondary)]">
            Client files, communication preferences and purchase history.
          </p>
        </div>

        <div className="relative w-full lg:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email..."
            className="admin-input pl-9 font-medium"
          />
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Total Accounts</span>
            <span className="rounded-lg bg-[var(--accent-soft)] p-2 text-[var(--accent)]"><Users size={15} /></span>
          </div>
          <p className="mt-2.5 font-display text-xl font-bold tabular-nums sm:text-2xl">{summary.totalCustomers}</p>
          <p className="mt-0.5 text-[10px] font-medium text-[var(--admin-text-muted)]">Registered client database</p>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">New (30d)</span>
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600"><UserCheck size={15} /></span>
          </div>
          <p className="mt-2.5 font-display text-xl font-bold tabular-nums sm:text-2xl">{summary.newCustomers}</p>
          <p className="mt-0.5 text-[10px] font-medium text-[var(--admin-text-muted)]">Added in the last 30 days</p>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Returning</span>
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600"><RefreshCw size={15} /></span>
          </div>
          <p className="mt-2.5 font-display text-xl font-bold tabular-nums sm:text-2xl">{summary.returningCustomers}</p>
          <p className="mt-0.5 text-[10px] font-medium text-emerald-600">Profiles with 2+ completed orders</p>
        </div>

        <div className="admin-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Total Spend</span>
            <span className="rounded-lg bg-[var(--champagne-soft)] p-2 text-[#7a5c22]"><DollarSign size={15} /></span>
          </div>
          <p className="mt-2.5 font-display text-xl font-bold tabular-nums sm:text-2xl">₦{summary.totalSpend?.toLocaleString('en-NG')}</p>
          <p className="mt-0.5 text-[10px] font-medium text-[var(--admin-text-muted)]">Aggregate of completed sales</p>
        </div>
      </div>

      {/* Directory grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-48 w-full" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="admin-card py-16 text-center">
          <Users size={30} className="mx-auto text-[var(--admin-text-muted)]" />
          <p className="mt-3 font-display text-lg font-bold">No customer records found</p>
          <p className="mt-1 text-xs text-[var(--admin-text-muted)]">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((c) => {
            const cleanWa = c.whatsapp.replace(/\D/g, '')
            const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
              `Hello ${c.name}! This is Jessy from Jessy Luxury Fragrance.`
            )}`
            const callUrl = `tel:${c.phone}`
            const badge = getCustomerTypeLabel(c.ordersCount)
            const isVip = c.totalSpent >= 150000
            const isWholesale = Boolean(c.customerGroupId)

            return (
              <button
                key={c.id}
                onClick={() => handleOpenCustomer(c)}
                className="admin-card flex flex-col justify-between p-5 text-left"
                aria-label={`Open CRM file for ${c.name}`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border font-bold text-base ${
                        isWholesale
                          ? 'border-[var(--champagne)]/40 bg-[var(--champagne-soft)] text-[#7a5c22]'
                          : 'border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]'
                      }`}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="truncate font-display text-base font-bold">{c.name}</h3>
                          {isVip && (
                            <span className="inline-flex items-center gap-0.5 rounded border border-[var(--champagne)]/40 bg-[var(--champagne-soft)] px-1.5 py-0.5 text-[9px] font-bold text-[#7a5c22]">
                              <Sparkles size={8} /> VIP
                            </span>
                          )}
                          {isWholesale && (
                            <span className="rounded bg-[var(--champagne-soft)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#7a5c22]">WS</span>
                          )}
                        </div>
                        <p className="font-mono text-xs font-medium text-[var(--admin-text-muted)]">{c.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-[var(--admin-border)] pt-4 text-xs text-[var(--admin-text-secondary)]">
                    {c.address && (
                      <div className="flex items-center gap-2 text-[10px]">
                        <MapPin size={13} className="shrink-0 text-[var(--accent)]" />
                        <span className="truncate">{c.address} {c.city ? `(${c.city})` : ''}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="flex items-center gap-1">
                        <ShoppingBag size={13} className="text-[var(--accent)]" /> Orders:{' '}
                        <strong className="font-mono font-bold tabular-nums">{c.ordersCount}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign size={13} className="text-emerald-600" /> Spend:{' '}
                        <strong className="font-mono font-bold tabular-nums text-emerald-600">₦{c.totalSpent.toLocaleString('en-NG')}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-[var(--admin-border)] pt-3">
                  <span className={`rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badge.style}`}>
                    {badge.text}
                  </span>

                  <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={callUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-2 text-[var(--admin-text-secondary)] transition hover:border-blue-500/40 hover:text-blue-500"
                      title="Call Customer"
                    >
                      <Phone size={13} />
                    </a>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg bg-emerald-600 p-2 text-white shadow-sm transition hover:bg-emerald-500"
                      title="WhatsApp Customer"
                    >
                      <MessageCircle size={13} />
                    </a>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* CRM profile drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fade-in absolute inset-0 cursor-pointer bg-stone-950/60 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />

          <aside
            className="animate-slide-up relative z-10 flex h-full w-full max-w-lg flex-col justify-between overflow-y-auto border-l border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label={`CRM profile for ${selectedCustomer.name}`}
          >
            <div>
              {/* Drawer header */}
              <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full border font-bold text-lg ${
                    selectedCustomer.customerGroupId
                      ? 'border-[var(--champagne)]/40 bg-[var(--champagne-soft)] text-[#7a5c22]'
                      : 'border-[var(--accent)]/20 bg-[var(--accent-soft)] text-[var(--accent)]'
                  }`}>
                    {selectedCustomer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="flex items-center gap-1.5 font-display text-lg font-bold">
                      {selectedCustomer.name}
                      {selectedCustomer.totalSpent >= 150000 && (
                        <span className="inline-flex items-center gap-0.5 rounded border border-[var(--champagne)]/40 bg-[var(--champagne-soft)] px-1.5 py-0.5 text-[8px] font-bold text-[#7a5c22]">
                          <Sparkles size={8} /> VIP
                        </span>
                      )}
                    </h3>
                    <p className="font-mono text-xs font-medium text-[var(--admin-text-secondary)]">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-text-secondary)] transition hover:text-[var(--admin-text-primary)]"
                  aria-label="Close profile"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Core stats */}
              <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Orders</p>
                  <p className="mt-1 font-mono text-base font-bold tabular-nums">{selectedCustomer.ordersCount}</p>
                </div>
                <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Total Spend</p>
                  <p className="mt-1 font-mono text-base font-bold tabular-nums text-emerald-600">₦{selectedCustomer.totalSpent.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">AOV</p>
                  <p className="mt-1 font-mono text-base font-bold tabular-nums text-[var(--accent)]">{getAOVText(selectedCustomer.totalSpent, selectedCustomer.ordersCount)}</p>
                </div>
              </div>

              {/* CRM form */}
              <form onSubmit={handleSaveProfile} className="mt-6 space-y-4 text-xs font-medium">
                <div>
                  <label className={lbl}>Client Notes & Preferences</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Fragrance preferences, customized sample choices, delivery details..."
                    rows={4}
                    className={`${inp} resize-none`}
                  />
                </div>

                <div>
                  <label className={lbl}>Wholesale group</label>
                  <select
                    value={customerGroupId}
                    onChange={(e) => setCustomerGroupId(e.target.value)}
                    className={inp}
                  >
                    <option value="">Retail (no group)</option>
                    {customerGroups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}{g.isActive ? '' : ' (inactive)'}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 rounded-lg border border-dashed border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">Marketing Channels</p>
                  <p className="mb-2 text-[9px] text-[var(--admin-text-muted)]">
                    Configure client marketing subscriptions. Transactional notifications are always on.
                  </p>

                  <div className="flex flex-col gap-2">
                    <label className="flex cursor-pointer select-none items-center gap-2.5 py-0.5">
                      <input
                        type="checkbox"
                        checked={marketingEmail}
                        onChange={(e) => setMarketingEmail(e.target.checked)}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-[var(--admin-border)] accent-[var(--accent)]"
                      />
                      <span className="flex items-center gap-1.5 text-[11px] font-bold"><Mail size={12} className="text-[var(--admin-text-secondary)]" /> Opt-In Promotional Emails</span>
                    </label>

                    <label className="flex cursor-pointer select-none items-center gap-2.5 py-0.5">
                      <input
                        type="checkbox"
                        checked={marketingWhatsapp}
                        onChange={(e) => setMarketingWhatsapp(e.target.checked)}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-[var(--admin-border)] accent-[var(--accent)]"
                      />
                      <span className="flex items-center gap-1.5 text-[11px] font-bold"><MessageCircle size={12} className="text-emerald-500" /> Opt-In WhatsApp Broadcasts</span>
                    </label>

                    <label className="flex cursor-pointer select-none items-center gap-2.5 py-0.5">
                      <input
                        type="checkbox"
                        checked={marketingPush}
                        onChange={(e) => setMarketingPush(e.target.checked)}
                        className="h-3.5 w-3.5 cursor-pointer rounded border-[var(--admin-border)] accent-[var(--accent)]"
                      />
                      <span className="flex items-center gap-1.5 text-[11px] font-bold"><BellRing size={12} className="text-[#7a5c22]" /> Opt-In Store Push Alerts</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingDrawer || deletingCustomer}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-60"
                >
                  <Save size={14} /> {savingDrawer ? 'Saving File...' : 'Save CRM File'}
                </button>

                {/* Danger zone — kept visually separate so it can't be tapped by accident */}
                <button
                  type="button"
                  onClick={handleDeleteCustomer}
                  disabled={deletingCustomer || savingDrawer}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 py-3 text-xs font-bold uppercase tracking-wider text-red-600 transition hover:bg-red-500 hover:text-white disabled:opacity-60 dark:text-red-400"
                >
                  <Trash2 size={14} /> {deletingCustomer ? 'Deleting…' : 'Delete Customer'}
                </button>
              </form>

              {/* Order history */}
              <div className="mt-6 space-y-3 border-t border-[var(--admin-border)] pt-5">
                <h4 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
                  <ShoppingBag size={13} className="text-[var(--accent)]" /> Purchase History
                </h4>

                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {selectedCustomer.orders?.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[var(--admin-text-muted)]">No order history logged.</p>
                  ) : (
                    selectedCustomer.orders?.map((ord: any) => (
                      <Link
                        key={ord.id}
                        href={`/store-portal-jl/dashboard/orders?openId=${ord.id}`}
                        className="group flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 transition hover:border-[var(--accent)]"
                      >
                        <div className="text-xs">
                          <p className="font-mono font-bold transition group-hover:text-[var(--accent)]">{ord.orderNumber}</p>
                          <p className="mt-0.5 text-[9px] text-[var(--admin-text-muted)]">
                            {new Date(ord.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right text-xs">
                          <p className="font-bold tabular-nums">₦{ord.total?.toLocaleString()}</p>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">{ord.paymentStatus}</span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Quick contact bar */}
            <div className="mt-6 flex gap-2 border-t border-[var(--admin-border)] pt-4">
              <a
                href={`tel:${selectedCustomer.phone}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] py-3 text-xs font-bold transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Phone size={14} className="text-blue-500" /> Call
              </a>
              <a
                href={`https://wa.me/${selectedCustomer.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selectedCustomer.name}!`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500"
              >
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
