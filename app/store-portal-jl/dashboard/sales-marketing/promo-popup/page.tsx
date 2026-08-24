'use client'
import { useEffect, useState } from 'react'
import { Sparkles, Eye, EyeOff, Save, RefreshCw, Calendar, DollarSign, Clock, Smartphone } from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'
import PromoRewardPopup, { type PromoRewardConfig } from '@/components/PromoRewardPopup'

export default function PromoPopupConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const { toast, showToast, clearToast } = useToast()

  const [form, setForm] = useState({
    enabled: false,
    title: 'Congratulations ✨',
    message: "You've unlocked an exclusive shopping reward just for visiting today.",
    discountLabel: '10% OFF',
    couponCode: '',
    ctaText: 'Shop & Use Coupon',
    displayDelay: 4000,
    minPurchase: '',
    expiryDate: '',
    displayFreqHrs: 24,
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    try {
      const res = await fetch('/api/settings/promo-popup')
      const data = await res.json()
      if (data) {
        setForm({
          enabled: data.enabled,
          title: data.title,
          message: data.message,
          discountLabel: data.discountLabel,
          couponCode: data.couponCode,
          ctaText: data.ctaText,
          displayDelay: data.displayDelay,
          minPurchase: data.minPurchase ? data.minPurchase.toString() : '',
          expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString().slice(0, 16) : '',
          displayFreqHrs: data.displayFreqHrs,
        })
      }
    } catch {
      showToast('Failed to load promo popup config', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/settings/promo-popup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: form.enabled,
          title: form.title,
          message: form.message,
          discountLabel: form.discountLabel,
          couponCode: form.couponCode,
          ctaText: form.ctaText,
          displayDelay: Number(form.displayDelay),
          minPurchase: form.minPurchase ? Number(form.minPurchase) : null,
          expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
          displayFreqHrs: Number(form.displayFreqHrs),
        }),
      })

      if (res.ok) {
        showToast('Promo popup configuration saved!')
        fetchConfig()
      } else {
        const err = await res.json()
        showToast(err.error || 'Failed to save config', 'error')
      }
    } catch {
      showToast('Error saving configuration', 'error')
    } finally {
      setSaving(false)
    }
  }

  const previewConfig: PromoRewardConfig = {
    enabled: true,
    title: form.title,
    message: form.message,
    discountLabel: form.discountLabel,
    couponCode: form.couponCode || 'PREVIEW',
    ctaText: form.ctaText,
    displayDelay: 0,
    minPurchase: form.minPurchase ? Number(form.minPurchase) : undefined,
    expiryDate: form.expiryDate || undefined,
  }

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-sm outline-none transition focus:border-amber-500 font-sans font-medium shadow-sm'
  const lbl = 'block text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wider'

  if (loading) {
    return <div className="py-20 text-center text-sm animate-pulse">Loading promo popup configuration…</div>
  }

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="text-amber-500" size={20} />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">Customer Rewards</p>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Promotional Reward Popup
        </h1>
        <p className="mt-2 text-sm font-medium text-[var(--text-secondary)] max-w-3xl">
          Configure a delayed, dismissible reward card that appears on the storefront to promote coupon codes. 
          Visitors see it once per configured frequency period. Premium Jessy Luxury design with mobile-first optimization.
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Enabled Toggle */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              {form.enabled ? (
                <Eye className="text-emerald-500" size={24} />
              ) : (
                <EyeOff className="text-[var(--text-muted)]" size={24} />
              )}
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Enable Promotional Popup</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {form.enabled ? 'Popup is LIVE on storefront' : 'Popup is disabled'}
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="h-6 w-6 rounded border-2 border-[var(--border)] text-amber-500 accent-amber-500 transition"
            />
          </label>
        </div>

        {/* Content Configuration */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-5">
          <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
            Content & Appearance
          </h3>

          <div>
            <label className={lbl}>
              <Sparkles size={12} className="inline mr-1" />
              Popup Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Congratulations ✨"
              required
              className={inp}
            />
          </div>

          <div>
            <label className={lbl}>Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="You've unlocked an exclusive shopping reward..."
              required
              rows={3}
              className={inp}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Discount Label</label>
              <input
                type="text"
                value={form.discountLabel}
                onChange={(e) => setForm({ ...form, discountLabel: e.target.value })}
                placeholder="10% OFF or ₦2,000 OFF"
                required
                className={inp + ' font-bold text-amber-500'}
              />
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Shown in large badge
              </p>
            </div>

            <div>
              <label className={lbl}>Coupon Code *</label>
              <input
                type="text"
                value={form.couponCode}
                onChange={(e) => setForm({ ...form, couponCode: e.target.value.toUpperCase() })}
                placeholder="JESSY2000"
                required
                className={inp + ' font-mono font-bold text-amber-500'}
              />
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Must exist in Discounts
              </p>
            </div>
          </div>

          <div>
            <label className={lbl}>Call-to-Action Text</label>
            <input
              type="text"
              value={form.ctaText}
              onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
              placeholder="Shop & Use Coupon"
              required
              className={inp}
            />
          </div>
        </div>

        {/* Business Rules */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-5">
          <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
            Business Safeguards
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>
                <DollarSign size={12} className="inline mr-1" />
                Minimum Purchase (₦)
              </label>
              <input
                type="number"
                value={form.minPurchase}
                onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                placeholder="Optional (e.g. 20000)"
                className={inp + ' font-mono'}
              />
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Display "Minimum purchase: ₦X" note
              </p>
            </div>

            <div>
              <label className={lbl}>
                <Calendar size={12} className="inline mr-1" />
                Expiry Date (Lagos time)
              </label>
              <input
                type="datetime-local"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                className={inp}
              />
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Popup won't show after this date
              </p>
            </div>
          </div>
        </div>

        {/* Display Behavior */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-5">
          <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
            Display Behavior
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>
                <Clock size={12} className="inline mr-1" />
                Display Delay (ms)
              </label>
              <input
                type="number"
                value={form.displayDelay}
                onChange={(e) => setForm({ ...form, displayDelay: Number(e.target.value) })}
                placeholder="4000"
                required
                className={inp + ' font-mono'}
              />
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Wait time after page load (recommended: 3000-5000ms)
              </p>
            </div>

            <div>
              <label className={lbl}>
                <RefreshCw size={12} className="inline mr-1" />
                Frequency (hours)
              </label>
              <input
                type="number"
                value={form.displayFreqHrs}
                onChange={(e) => setForm({ ...form, displayFreqHrs: Number(e.target.value) })}
                placeholder="24"
                required
                className={inp + ' font-mono'}
              />
              <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                Don't show again for X hours after dismissal
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-500 bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-500 hover:bg-amber-500/20 transition"
          >
            <Smartphone size={16} />
            Preview Popup
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-stone-950 hover:bg-amber-400 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Configuration
              </>
            )}
          </button>
        </div>
      </form>

      {/* Live Preview Modal */}
      {showPreview && (
        <>
          <PromoRewardPopup config={previewConfig} />
          <button
            onClick={() => setShowPreview(false)}
            className="fixed bottom-8 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-stone-950 px-6 py-3 text-sm font-bold text-white shadow-2xl hover:bg-stone-800 transition border-2 border-white"
          >
            Close Preview
          </button>
        </>
      )}
    </div>
  )
}
