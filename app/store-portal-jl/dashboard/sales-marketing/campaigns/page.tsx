'use client'
import { useEffect, useState } from 'react'
import {
  Plus, Calendar, Target, DollarSign, Activity, Percent, Layers, BarChart3, AlertCircle, X, ChevronDown, ChevronUp, Link
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
    if (!form.name || !form.couponId || !form.channel || !form.startDate || !form.endDate) return

    const payload = {
      name: form.name,
      description: form.description,
      couponId: Number(form.couponId),
      audience: form.audience,
      channel: form.channel,
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

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-sans font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Marketing Campaigns
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            Attribute sales redemptions, revenues, discount costs, and net contributions directly to marketing campaigns.
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
              startDate: '',
              endDate: '',
            })
            setShowModal(true)
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 transition hover:bg-amber-400 shadow-md shadow-amber-500/10"
        >
          <Plus size={16} /> NEW CAMPAIGN
        </button>
      </div>

      {/* Main Grid: Left List, Right Stats Drawer panel */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaign List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity size={16} className="text-amber-500" /> Active &amp; Scheduled Campaigns
          </h2>

          {loading ? (
            <div className="py-20 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Loading campaigns…</div>
          ) : campaigns.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] py-20 text-center text-xs font-medium text-[var(--text-muted)]">
              No active or scheduled campaigns found.
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleLoadStats(c.id)}
                  className={`rounded-2xl border p-5 cursor-pointer transition shadow-sm bg-[var(--card-bg)] hover:border-amber-500/55 ${
                    selectedStats?.campaignId === c.id ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-base font-bold text-[var(--text-primary)]">{c.name}</h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{c.description || 'No description'}</p>
                    </div>

                    <span className="rounded-full bg-amber-500/10 px-3 py-0.5 text-[9px] font-bold text-amber-500 border border-amber-500/20">
                      {c.channel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-secondary)] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Target size={14} className="text-[var(--text-muted)]" />
                      <span>Audience: <strong className="text-[var(--text-primary)] font-bold">{c.audience}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link size={14} className="text-[var(--text-muted)]" />
                      <span>Coupon: <strong className="text-amber-500 font-mono font-bold">{c.coupon.code}</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Stats Attribution Drawer Panel */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BarChart3 size={16} className="text-amber-500" /> Attribution Analytics
          </h2>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm space-y-6">
            {!selectedStats ? (
              <div className="py-20 text-center text-xs font-semibold text-[var(--text-muted)] flex flex-col items-center justify-center space-y-2">
                <AlertCircle size={24} className="text-[var(--text-muted)] mb-1" />
                <p>Select a campaign on the left to view financial performance stats</p>
              </div>
            ) : statsLoading ? (
              <div className="py-20 text-center text-xs font-semibold text-[var(--text-muted)] animate-pulse">Computing real-time analytics…</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-display text-lg font-bold text-[var(--text-primary)]">{selectedStats.name}</h3>
                  <span className="text-[11px] font-mono font-semibold text-amber-500">CODE: {selectedStats.couponCode}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase block tracking-wider">Redemptions</span>
                    <strong className="text-xl font-display font-bold text-[var(--text-primary)] block mt-1">{selectedStats.redemptionsCount}</strong>
                    <span className="text-[9px] text-[var(--text-muted)] font-medium">Coupon uses</span>
                  </div>

                  <div className="bg-[var(--bg-primary)] p-3 rounded-xl border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase block tracking-wider">Completed Orders</span>
                    <strong className="text-xl font-display font-bold text-emerald-500 block mt-1">{selectedStats.completedOrdersCount}</strong>
                    <span className="text-[9px] text-[var(--text-muted)] font-medium">Paid/valid orders</span>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[var(--text-secondary)]">Campaign Gross Revenue:</span>
                    <span className="font-mono text-[var(--text-primary)] font-bold">₦{selectedStats.revenue.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-[var(--text-secondary)]">Discounts Granted Cost:</span>
                    <span className="font-mono text-red-500 font-bold">₦{selectedStats.discountCost.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-medium pt-3 border-t border-[var(--border)]">
                    <span className="text-[var(--text-primary)] font-bold">Net Contribution:</span>
                    <span className="font-mono text-emerald-500 font-bold text-sm">₦{selectedStats.netContribution.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Creating Campaign */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="font-display text-xl font-bold text-[var(--text-primary)]">
                Schedule Marketing Campaign
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                <label className={lbl}>Campaign Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Target details, promotional goals..."
                  rows={2}
                  className={inp}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Promo Coupon Code</label>
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
                  <label className={lbl}>Marketing Channel</label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value })}
                    required
                    className={inp}
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>Audience Segment</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value })}
                    className={inp}
                  >
                    <option value="ALL">ALL Customers</option>
                    <option value="VIP">VIP Segment</option>
                    <option value="INSTAGRAM_ACQUIRED">Instagram Acquired</option>
                    <option value="WHATSAPP_ACQUIRED">WhatsApp Acquired</option>
                    <option value="INACTIVE">INACTIVE Customers (No order last 90 days)</option>
                  </select>
                </div>

                <div />
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

              <div className="flex justify-end gap-3 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-[var(--border)] px-5 py-2.5 font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-6 py-2.5 font-bold text-stone-950 hover:bg-amber-400 transition"
                >
                  Schedule Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
