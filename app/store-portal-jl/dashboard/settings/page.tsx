'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Truck, Users, MapPin, Globe, CreditCard, DollarSign, Receipt,
  Save, Smartphone, Building, Lock, Eye, EyeOff, Bell, ShieldCheck,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'
import BusinessProfileForm from './components/BusinessProfileForm'
import StoreLocationsManager from './components/StoreLocationsManager'
import StaffAccountsManager from './components/StaffAccountsManager'
import PaymentSettingsForm from './components/PaymentSettingsForm'
import NotificationSettingsForm from './components/NotificationSettingsForm'
import SystemDefaultsForm from './components/SystemDefaultsForm'

type Section = 'OPERATIONS' | 'FINANCE' | 'COMMUNICATION' | 'SECURITY'

export default function StoreSettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>('OPERATIONS')
  const [activeSubTab, setActiveSubTab] = useState('shipping')
  const { toast, showToast, clearToast } = useToast()

  // Bank Info Form
  const [bankInfo, setBankInfo] = useState({
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    accountName: 'Jessy Luxury Fragrance Ltd',
    notes: 'Please send payment proof to WhatsApp after transfer.',
  })

  // Expenses state
  const [expenses, setExpenses] = useState([
    { id: 1, category: 'Packaging', description: 'Luxury gift boxes & ribbon rolls', amount: 45000, date: '2026-08-10' },
    { id: 2, category: 'Shipping', description: 'Motor park dispatch fees bulk deposit', amount: 30000, date: '2026-08-08' },
  ])

  const [newExpense, setNewExpense] = useState({ category: 'Packaging', description: '', amount: '' })

  function handleSaveBankInfo(e: React.FormEvent) {
    e.preventDefault()
    showToast('Bank details & payment settings updated!')
  }

  function handleAddExpense(e: React.FormEvent) {
    e.preventDefault()
    if (!newExpense.amount || !newExpense.description) return
    const item = {
      id: Date.now(),
      category: newExpense.category,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      date: new Date().toISOString().split('T')[0],
    }
    setExpenses([item, ...expenses])
    setNewExpense({ category: 'Packaging', description: '', amount: '' })
    showToast('Expense recorded successfully')
  }

  function switchSection(section: Section, defaultTab: string) {
    setActiveSection(section)
    setActiveSubTab(defaultTab)
  }

  const inp = 'admin-input font-medium'
  const lbl = 'mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]'

  const SECTIONS: { id: Section; label: string; icon: typeof Building; defaultTab: string; desc: string }[] = [
    { id: 'OPERATIONS', label: 'Operations', icon: Building, defaultTab: 'shipping', desc: 'Shipping rules, staff accounts, locations and connected apps.' },
    { id: 'FINANCE', label: 'Finance', icon: CreditCard, defaultTab: 'payment', desc: 'Payment settings, bank transfer details and expense tracking.' },
    { id: 'COMMUNICATION', label: 'Communication', icon: Bell, defaultTab: 'notifications', desc: 'Notification routing and system defaults.' },
    { id: 'SECURITY', label: 'Security', icon: ShieldCheck, defaultTab: 'security', desc: 'Password policy and access protection.' },
  ]

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="border-b border-[var(--admin-border)] pb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Configuration</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-xs font-medium text-[var(--admin-text-secondary)]">
          {SECTIONS.find((s) => s.id === activeSection)?.desc}
        </p>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 sm:gap-4">
        {SECTIONS.map((s) => {
          const active = activeSection === s.id
          return (
            <button
              key={s.id}
              onClick={() => switchSection(s.id, s.defaultTab)}
              className={`rounded-xl border p-4 text-left transition ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm'
                  : 'border-[var(--admin-border)] bg-[var(--admin-card-bg)] hover:border-[var(--accent)]/40'
              }`}
            >
              <span className={`inline-flex rounded-lg p-2 ${active ? 'bg-[var(--accent)] text-white' : 'bg-[var(--admin-bg)] text-[var(--accent)]'}`}>
                <s.icon size={16} />
              </span>
              <p className={`mt-2.5 text-xs font-bold ${active ? 'text-[var(--accent)]' : ''}`}>{s.label}</p>
              <p className="mt-0.5 hidden text-[10px] font-medium leading-4 text-[var(--admin-text-muted)] lg:block">
                {s.desc.split(',')[0]}
              </p>
            </button>
          )
        })}
      </div>

      {/* Sub-tabs */}
      {(activeSection === 'OPERATIONS'
        ? [
            { id: 'shipping', label: 'Shipping Rules', icon: Truck },
            { id: 'staff', label: 'Staff Accounts', icon: Users },
            { id: 'locations', label: 'Store Locations', icon: MapPin },
            { id: 'general', label: 'General Info', icon: Globe },
            { id: 'apps', label: 'Connected Apps', icon: Smartphone },
          ]
        : activeSection === 'FINANCE'
        ? [
            { id: 'payment', label: 'Payment Settings', icon: CreditCard },
            { id: 'bank', label: 'Bank Details', icon: Building },
            { id: 'expenses', label: 'Expenses Tracker', icon: DollarSign },
            { id: 'taxes', label: 'Taxes & Receipts', icon: Receipt },
          ]
        : activeSection === 'COMMUNICATION'
        ? [
            { id: 'notifications', label: 'Notification Settings', icon: Bell },
            { id: 'defaults', label: 'System Defaults', icon: Globe },
          ]
        : [
            { id: 'security', label: 'Change Password', icon: Lock },
          ]
      ).map((sub) => (
        <div key={sub.id}>
          {activeSubTab === sub.id && (
            <>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em]">
                <sub.icon size={14} className="text-[var(--accent)]" /> {sub.label}
              </h2>

              {/* ═══ OPERATIONS ═══ */}
              {activeSection === 'OPERATIONS' && sub.id === 'shipping' && (
                <div className="admin-card space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Delivery Zones &amp; Dispatch Rules</h3>
                    <Link
                      href="/store-portal-jl/dashboard/shipping"
                      className="text-xs font-bold text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
                    >
                      Open Delivery Zones Manager →
                    </Link>
                  </div>
                  <p className="text-xs font-medium text-[var(--admin-text-secondary)]">
                    Configure delivery fees (₦), lead times, and motor park waybill pickup instructions.
                  </p>
                </div>
              )}

              {activeSection === 'OPERATIONS' && sub.id === 'staff' && (
                <StaffAccountsManager showToast={showToast} />
              )}

              {activeSection === 'OPERATIONS' && sub.id === 'locations' && (
                <StoreLocationsManager showToast={showToast} />
              )}

              {activeSection === 'OPERATIONS' && sub.id === 'general' && (
                <BusinessProfileForm showToast={showToast} />
              )}

              {activeSection === 'OPERATIONS' && sub.id === 'apps' && (
                <div className="admin-card space-y-4 p-6">
                  <h3 className="border-b border-[var(--admin-border)] pb-4 text-sm font-bold">Connected Services</h3>
                  <div className="grid gap-4 text-xs sm:grid-cols-3">
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                      <p className="font-bold text-emerald-700 dark:text-emerald-300">WhatsApp Business</p>
                      <p className="mt-1 text-[11px] font-medium text-[var(--admin-text-secondary)]">Direct order checkout integration</p>
                      <span className="mt-2.5 inline-block rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">ACTIVE</span>
                    </div>

                    <div className="rounded-lg border border-[var(--champagne)]/40 bg-[var(--champagne-soft)] p-4">
                      <p className="font-bold text-[#7a5c22]">Cloudinary Library</p>
                      <p className="mt-1 text-[11px] font-medium text-[var(--admin-text-secondary)]">Phone gallery photo uploads</p>
                      <span className="mt-2.5 inline-block rounded-full border border-[var(--champagne)]/40 bg-white/60 px-2.5 py-0.5 text-[10px] font-bold text-[#7a5c22] dark:bg-black/20">CONNECTED</span>
                    </div>

                    <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
                      <p className="font-bold text-blue-700 dark:text-blue-300">Neon PostgreSQL</p>
                      <p className="mt-1 text-[11px] font-medium text-[var(--admin-text-secondary)]">Live database cloud engine</p>
                      <span className="mt-2.5 inline-block rounded-full border border-blue-500/30 bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">SYNCED</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ FINANCE ═══ */}
              {activeSection === 'FINANCE' && sub.id === 'payment' && (
                <PaymentSettingsForm showToast={showToast} />
              )}

              {activeSection === 'FINANCE' && sub.id === 'bank' && (
                <form onSubmit={handleSaveBankInfo} className="admin-card space-y-4 p-6">
                  <h3 className="border-b border-[var(--admin-border)] pb-4 text-sm font-bold">Bank Transfer Details (Manual Payment)</h3>
                  <div className="grid gap-4 text-xs md:grid-cols-3">
                    <div>
                      <label className={lbl}>Bank Name</label>
                      <input value={bankInfo.bankName} onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })} className={inp} />
                    </div>
                    <div>
                      <label className={lbl}>Account Number</label>
                      <input value={bankInfo.accountNumber} onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })} className={`${inp} font-mono font-bold`} />
                    </div>
                    <div>
                      <label className={lbl}>Account Name</label>
                      <input value={bankInfo.accountName} onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value })} className={inp} />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)]">
                      <Save size={14} /> Save Details
                    </button>
                  </div>
                </form>
              )}

              {activeSection === 'FINANCE' && sub.id === 'expenses' && (
                <div className="space-y-5">
                  <form onSubmit={handleAddExpense} className="admin-card space-y-4 p-6">
                    <h3 className="border-b border-[var(--admin-border)] pb-4 text-sm font-bold">Record Operational Expense</h3>
                    <div className="grid gap-4 text-xs md:grid-cols-3">
                      <div>
                        <label className={lbl}>Category</label>
                        <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} className={inp}>
                          <option value="Packaging">Packaging & Gift Boxes</option>
                          <option value="Shipping">Shipping & Dispatch</option>
                          <option value="Marketing">Social Media Ads</option>
                          <option value="Utility">Rent & Utilities</option>
                        </select>
                      </div>
                      <div>
                        <label className={lbl}>Description</label>
                        <input value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} placeholder="e.g. Ribbon rolls" className={inp} />
                      </div>
                      <div>
                        <label className={lbl}>Amount (₦)</label>
                        <input type="number" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} placeholder="15000" className={`${inp} font-mono`} />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="rounded-lg bg-[var(--accent)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)]">
                        Record Expense
                      </button>
                    </div>
                  </form>

                  <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-bg)] shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-table-header)] text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-secondary)]">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--admin-border)]">
                        {expenses.map((ex) => (
                          <tr key={ex.id} className="transition hover:bg-[var(--admin-table-row-hover)]">
                            <td className="px-4 py-3 font-mono font-medium text-[var(--admin-text-secondary)]">{ex.date}</td>
                            <td className="px-4 py-3 font-bold text-[var(--accent)]">{ex.category}</td>
                            <td className="px-4 py-3 font-medium">{ex.description}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">₦{ex.amount?.toLocaleString('en-NG')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeSection === 'FINANCE' && sub.id === 'taxes' && (
                <div className="admin-card space-y-4 p-6 text-xs font-medium text-[var(--admin-text-secondary)]">
                  <h3 className="border-b border-[var(--admin-border)] pb-4 text-sm font-bold text-[var(--admin-text-primary)]">Taxes &amp; Order Invoice Setup</h3>
                  <p>Configure VAT percentage toggles and custom header notes for WhatsApp receipt links.</p>
                </div>
              )}

              {/* ═══ COMMUNICATION ═══ */}
              {activeSection === 'COMMUNICATION' && sub.id === 'notifications' && (
                <NotificationSettingsForm showToast={showToast} />
              )}

              {activeSection === 'COMMUNICATION' && sub.id === 'defaults' && (
                <SystemDefaultsForm showToast={showToast} />
              )}

              {/* ═══ SECURITY ═══ */}
              {activeSection === 'SECURITY' && sub.id === 'security' && (
                <SecuritySettingsForm showToast={showToast} />
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

function SecuritySettingsForm({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    if (newPassword.length < 12) {
      showToast('Password must be at least 12 characters', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin-auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      })

      if (res.ok) {
        showToast('Password changed successfully! Redirecting...', 'success')
        setTimeout(() => {
          router.replace('/store-portal-jl?message=changed')
        }, 1500)
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to update password', 'error')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'admin-input pr-11 font-medium'
  const lbl = 'mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--admin-text-muted)]'

  return (
    <form onSubmit={handlePasswordChange} className="admin-card max-w-md space-y-4 p-6">
      <h3 className="border-b border-[var(--admin-border)] pb-4 text-sm font-bold">
        Change Admin Password
      </h3>

      <div className="space-y-4">
        <div>
          <label className={lbl}>Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inp}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text-primary)]"
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div>
          <label className={lbl}>New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inp}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text-primary)]"
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="mt-1 text-[10px] font-medium text-[var(--admin-text-muted)]">
            Must be at least 12 characters long.
          </p>
        </div>

        <div>
          <label className={lbl}>Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inp}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] transition hover:text-[var(--admin-text-primary)]"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
        >
          <Lock size={14} /> {loading ? 'Updating...' : 'Change Password'}
        </button>
      </div>
    </form>
  )
}
