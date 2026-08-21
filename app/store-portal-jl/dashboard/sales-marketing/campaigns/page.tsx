'use client'
import { useEffect, useState } from 'react'
import {
  Plus, Target, Activity, BarChart3, AlertCircle, X, Sparkles, Megaphone, Eye,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

export default function CampaignsDashboardPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedStats, setSelectedStats] = useState<any | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const { toast, showToast, clearToast } = useToast()

  const [form, setForm] = useState({
    name: 'Independence Day Sales Drive',
    description: 'Targeting Instagram acquired followers via bulk broadcast updates.',
    couponId: '',
    audience: 'ALL',
    channel: 'Instagram',
    emailEnabled: false,
    pushEnabled: false,
    websiteEnabled: false,
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchCampaigns()
    fetchCoupons()
  }, [])

  async function fetchCampaigns() {
    try {
      const res = await fetch('/api/campaigns')
      const data = await res.json()
      if (Array.isArray(data)) setCampaigns(data)
    } catch {
      showToast('Error loading marketing campaigns', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function fetchCoupons() {
    try {
      const res = await fetch('/api/coupons')
      const data = await res.json()
      if (Array.isArray(data)) setCoupons(data)
    } catch {
      showToast('Error loading coupon codes', 'error')
    }
  }

  async function handleLoadStats(id: number) {
    setStatsLoading(true)
    setSelectedStats(null)
    try {
      const res = await fetch(`/api/campaigns/${id}/stats`)
      const data = await res.json()
      if (data.error) {
        showToast(data.error, 'error')
      } else {
        setSelectedStats(data)
      }
    } catch {
      showToast('Failed to load attribution metrics', 'error')
    } finally {
      setStatsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.couponId || (!form.emailEnabled && !form.pushEnabled && !form.websiteEnabled) || !form.startDate || !form.endDate) {
      showToast('Please specify name, coupon, dates, and at least one channel', 'error')
      return
    }

    const payload = {
      name: form.name,
      description: form.description,
      couponId: Number(form.couponId),
      audience: form.audience,
      channel: form.channel,
      emailEnabled: form.emailEnabled,
      pushEnabled: form.pushEnabled,
      websiteEnabled: form.websiteEnabled,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    }

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        showToast('Campaign successfully scheduled!')
        setShowModal(false)
        fetchCampaigns()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save campaign', 'error')
      }
    } catch {
      showToast('Error scheduling campaign', 'error')
    }
  }

  const inp = 'admin-input font-medium'
  const lbl = 'mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]'

  const selectedCoupon = coupons.find((c) => String(c.id) === form.couponId)

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Growth</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Marketing Campaigns</h1>
          <p className="mt-1 text-xs font-medium text-[var(--admin-text-secondary)]">
            Attribute redemptions, revenue and discount costs to campaigns.
          </p>
        </div>

        <button
          onClick={() => {
            if (coupons.length === 0) {
              showToast('Please create a discount coupon promo code first', 'error')
              return
            }
            setForm({
              name: 'Instagram VIP Broadcast',
              description: 'Targeted broadcast of special promo codes.',
              couponId: coupons[0]?.id?.toString() || '',
              audience: 'VIP',
              channel: 'Instagram',
              emailEnabled: false,
              pushEnabled: false,
              websiteEnabled: false,
              startDate: '',
              endDate: '',
            })
            setShowModal(true)
          }}
          className="inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)]"
        >
          <Plus size={15} /> New Campaign
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Campaign list */}
        <div className="space-y-4 xl:col-span-2">
          <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em]">
            <Activity size={15} className="text-[var(--accent)]" /> Active &amp; Scheduled
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div key={i} className="skeleton h-28 w-full" />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="admin-card py-14 text-center">
              <Megaphone size={28} className="mx-auto text-[var(--admin-text-muted)]" />
              <p className="mt-3 font-display text-lg font-bold">No campaigns yet</p>
              <p className="mt-1 text-xs text-[var(--admin-text-muted)]">Schedule your first campaign to start tracking attribution.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleLoadStats(c.id)}
                  className={`admin-card w-full p-5 text-left ${
                    selectedStats?.campaignId === c.id ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]/25' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-bold">{c.name}</h3>
                      <p className="mt-1 truncate text-xs font-medium text-[var(--admin-text-secondary)]">{c.description || 'No description'}</p>
                    </div>
                    <span className="shrink-0 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
                      {c.channel}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--admin-border)] pt-4 text-xs font-medium text-[var(--admin-text-secondary)]">
                    <div className="flex items-center gap-1.5">
                      <Target size={13} className="shrink-0 text-[var(--admin-text-muted)]" />
                      <span>Audience: <strong className="text-[var(--admin-text-primary)]">{c.audience.replaceAll('_', ' ')}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[var(--admin-text-muted)]">Coupon:</span>
                      <span className="font-mono font-bold text-[var(--accent)]">{c.coupon.code}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Attribution panel */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em]">
            <BarChart3 size={15} className="text-[var(--accent)]" /> Attribution
          </h2>

          <div className="admin-card space-y-6 p-5">
            {!selectedStats ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-16 text-center">
                <AlertCircle size={22} className="text-[var(--admin-text-muted)]" />
                <p className="px-4 text-xs font-semibold text-[var(--admin-text-muted)]">
                  Select a campaign to view financial performance
                </p>
              </div>
            ) : statsLoading ? (
              <div className="space-y-3 py-6">
                <div className="skeleton h-6 w-3/4" />
                <div className="skeleton h-20 w-full" />
                <div className="skeleton h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display text-lg font-bold">{selectedStats.name}</h3>
                  <span className="font-mono text-[11px] font-bold text-[var(--accent)]">CODE: {selectedStats.couponCode}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Redemptions</span>
                    <strong className="mt-1 block font-display text-xl font-bold tabular-nums">{selectedStats.redemptionsCount}</strong>
                    <span className="text-[9px] font-medium text-[var(--admin-text-muted)]">Coupon uses</span>
                  </div>
                  <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Completed Orders</span>
                    <strong className="mt-1 block font-display text-xl font-bold tabular-nums text-emerald-600">{selectedStats.completedOrdersCount}</strong>
                    <span className="text-[9px] font-medium text-[var(--admin-text-muted)]">Paid/valid orders</span>
                  </div>
                </div>

                <div className="space-y-3 border-t border-[var(--admin-border)] pt-4">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[var(--admin-text-secondary)]">Gross Revenue:</span>
                    <span className="font-mono font-bold tabular-nums">₦{selectedStats.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[var(--admin-text-secondary)]">Discount Cost:</span>
                    <span className="font-mono font-bold tabular-nums text-red-500">₦{selectedStats.discountCost.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--admin-border)] pt-3 text-xs">
                    <span className="font-bold">Net Contribution:</span>
                    <span className="font-mono text-sm font-bold tabular-nums text-emerald-600">₦{selectedStats.netContribution.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign creation modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] pb-4">
              <h3 className="font-display text-lg font-bold">Schedule Campaign</h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text-primary)]" aria-label="Close dialog">
                <X size={19} />
              </button>
            </div>

            <div className="grid gap-5 lg:grid-cols-5">
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs lg:col-span-3">
                <div>
                  <label className={lbl}>Campaign Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Independence Day Promo Drive"
                    required
                    className={inp}
                  />
                </div>

                <div>
                  <label className={lbl}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Target details, promotional goals..."
                    rows={2}
                    className={`${inp} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Promo Coupon</label>
                    <select
                      value={form.couponId}
                      onChange={(e) => setForm({ ...form, couponId: e.target.value })}
                      required
                      className={inp}
                    >
                      <option value="">Select coupon...</option>
                      {coupons.map((c) => (
                        <option key={c.id} value={c.id}>{c.code} ({c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₦${c.discountValue}`})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={lbl}>Audience</label>
                    <select
                      value={form.audience}
                      onChange={(e) => setForm({ ...form, audience: e.target.value })}
                      className={inp}
                    >
                      <option value="ALL">ALL Customers</option>
                      <option value="VIP">VIP Segment</option>
                      <option value="INSTAGRAM_ACQUIRED">Instagram Acquired</option>
                      <option value="WHATSAPP_ACQUIRED">WhatsApp Acquired</option>
                      <option value="INACTIVE">INACTIVE (90+ days)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={lbl}>Channels</label>
                  <div className="flex flex-col gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3">
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={form.emailEnabled}
                        onChange={(e) => setForm({ ...form, emailEnabled: e.target.checked })}
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      Email via Resend
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={form.pushEnabled}
                        onChange={(e) => setForm({ ...form, pushEnabled: e.target.checked })}
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      Push via OneSignal
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-bold">
                      <input
                        type="checkbox"
                        checked={form.websiteEnabled}
                        onChange={(e) => setForm({ ...form, websiteEnabled: e.target.checked })}
                        className="h-4 w-4 rounded accent-[var(--accent)]"
                      />
                      Website Announcement
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Start Date</label>
                    <input
                      type="datetime-local"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      required
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className={lbl}>End Date</label>
                    <input
                      type="datetime-local"
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      required
                      className={inp}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-[var(--admin-border)] pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="rounded-lg border border-[var(--admin-border)] px-5 py-2.5 font-bold text-[var(--admin-text-secondary)] transition hover:text-[var(--admin-text-primary)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[var(--accent)] px-6 py-2.5 font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)]"
                  >
                    Publish Campaign
                  </button>
                </div>
              </form>

              {/* Customer-facing preview */}
              <div className="lg:col-span-2">
                <p className={`${lbl} flex items-center gap-1.5`}>
                  <Eye size={12} /> Storefront preview
                </p>
                <div className="sticky top-2 mt-1 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 shadow-sm">
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[var(--admin-text-muted)]">
                    How customers will see it
                  </p>
                  <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] shadow-md">
                    <div className="flex gap-3 p-4">
                      <div className="h-fit shrink-0 rounded-full border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
                        {form.websiteEnabled ? <Sparkles size={15} /> : <Megaphone size={15} />}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">Promotion</p>
                        <h4 className="truncate font-display text-sm font-bold">{form.name || 'Campaign name'}</h4>
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-[var(--admin-text-secondary)]">
                          {form.description || 'Campaign description preview…'}
                        </p>
                        {selectedCoupon && (
                          <span className="mt-1 inline-block rounded-full bg-[var(--accent)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white">
                            {selectedCoupon.code}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-center text-[9px] font-medium text-[var(--admin-text-muted)]">
                    {form.websiteEnabled ? 'Shown as website announcement card' : 'Enable “Website Announcement” to preview the storefront card'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
