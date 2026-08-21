'use client'
import { useState, useEffect } from 'react'
import { CreditCard, Save, Loader2 } from 'lucide-react'

interface PaymentSettings {
  bankAccountNumber: string
  bankAccountName: string
  bankName: string
  updatedAt?: string
}

export default function PaymentSettingsForm({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [settings, setSettings] = useState<PaymentSettings>({ bankAccountNumber: '', bankAccountName: '', bankName: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<PaymentSettings>({ bankAccountNumber: '', bankAccountName: '', bankName: '' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const res = await fetch('/api/settings/payment')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        setForm({ bankAccountNumber: data.bankAccountNumber || '', bankAccountName: data.bankAccountName || '', bankName: data.bankName || '' })
      } else {
        showToast('Failed to load payment settings', 'error')
      }
    } catch {
      showToast('Error loading payment settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/settings/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        showToast('Payment details updated successfully', 'success')
        await load()
      } else {
        showToast('Failed to update payment details', 'error')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'

  if (loading) return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm flex items-center gap-2">
      <Loader2 size={16} className="animate-spin text-[var(--text-secondary)]" />
      <p className="text-xs text-[var(--text-secondary)] font-medium">Loading...</p>
    </div>
  )

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <div className="rounded-full bg-amber-500/10 p-2">
          <CreditCard size={20} className="text-amber-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Bank Transfer Details</h3>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Customers will see these details when placing an order
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={lbl}>Bank Name</label>
          <input
            type="text"
            value={form.bankName}
            onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
            placeholder="e.g. GTBank, Access Bank, Zenith Bank"
            disabled={saving}
            className={inp}
          />
        </div>

        <div>
          <label className={lbl}>Account Number</label>
          <input
            type="text"
            value={form.bankAccountNumber}
            onChange={e => setForm(f => ({ ...f, bankAccountNumber: e.target.value }))}
            placeholder="10-digit NUBAN account number"
            maxLength={10}
            disabled={saving}
            className={`${inp} font-mono tracking-widest`}
          />
        </div>

        <div>
          <label className={lbl}>Account Name</label>
          <input
            type="text"
            value={form.bankAccountName}
            onChange={e => setForm(f => ({ ...f, bankAccountName: e.target.value }))}
            placeholder="e.g. Jessy Luxury Fragrance"
            disabled={saving}
            className={inp}
          />
        </div>

        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            These details are shown to customers at checkout. Make sure they are correct before saving.
          </p>
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--border)]">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Details</>}
          </button>
        </div>
      </form>

      {settings.updatedAt && (
        <p className="text-[10px] text-[var(--text-muted)] font-medium text-right">
          Last updated: {new Date(settings.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  )
}
