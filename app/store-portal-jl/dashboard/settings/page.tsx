'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Truck, Users, MapPin, Globe, CreditCard, DollarSign, Receipt,
  Plus, Edit2, Save, Smartphone, Building, Lock, Eye, EyeOff
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

export default function StoreSettingsPage() {
  const [activeSection, setActiveSection] = useState<'OPERATIONS' | 'FINANCE'>('OPERATIONS')
  const [activeSubTab, setActiveSubTab] = useState('shipping')
  const { toast, showToast, clearToast } = useToast()

  // General Store Info Form
  const [storeInfo, setStoreInfo] = useState({
    name: 'Jessy Luxury Fragrance',
    phone: '+234 800 000 0000',
    email: 'ijeomaasiegbu963@gmail.com',
    address: '57 MCC Road, Opposite Ihechiuwa Junction, Owerri, Imo State, Nigeria',
    hours: 'Mon – Sat, 9am – 7pm',
  })

  // Bank Info Form
  const [bankInfo, setBankInfo] = useState({
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    accountName: 'Jessy Luxury Fragrance Ltd',
    notes: 'Please send payment proof to WhatsApp after transfer.',
  })

  // Staff Accounts state
  const [staffList] = useState([
    { id: 1, name: 'Jessy (Owner)', email: 'owner@jessyluxury.com', role: 'Owner', permissions: ['all'], active: true },
    { id: 2, name: 'Ada (Fulfillment Manager)', email: 'ada@jessyluxury.com', role: 'Fulfillment', permissions: ['orders', 'shipping'], active: true },
    { id: 3, name: 'Chidi (Catalog Manager)', email: 'chidi@jessyluxury.com', role: 'Catalog', permissions: ['products'], active: true },
  ])

  // Store Locations state
  const [locations] = useState([
    { id: 1, name: 'Headquarters (Owerri)', address: '57 MCC Road, Opposite Ihechiuwa Junction, Owerri', isDefault: true },
    { id: 2, name: 'Lagos Hub Pickup Point', address: 'Lekki Phase 1, Lagos', isDefault: false },
  ])

  // Expenses state
  const [expenses, setExpenses] = useState([
    { id: 1, category: 'Packaging', description: 'Luxury gift boxes & ribbon rolls', amount: 45000, date: '2026-08-10' },
    { id: 2, category: 'Shipping', description: 'Motor park dispatch fees bulk deposit', amount: 30000, date: '2026-08-08' },
  ])

  const [newExpense, setNewExpense] = useState({ category: 'Packaging', description: '', amount: '' })

  function handleSaveStoreInfo(e: React.FormEvent) {
    e.preventDefault()
    showToast('Store operations & contact settings saved!')
  }

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

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-sans font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="border-b border-[var(--border)] pb-5">
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
          Operations &amp; Store Setup
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
          Manage operations (shipping rules, staff permissions, locations) &amp; finance (bank accounts, expenses).
        </p>
      </div>

      {/* Primary Section Tabs (OPERATIONS vs FINANCE) */}
      <div className="flex border-b border-[var(--border)] gap-2">
        <button
          onClick={() => { setActiveSection('OPERATIONS'); setActiveSubTab('shipping') }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-xs font-bold tracking-wider transition ${
            activeSection === 'OPERATIONS'
              ? 'border-amber-500 text-amber-500 bg-amber-500/10 rounded-t-xl'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Building size={16} /> OPERATIONS SETUP
        </button>

        <button
          onClick={() => { setActiveSection('FINANCE'); setActiveSubTab('bank') }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-xs font-bold tracking-wider transition ${
            activeSection === 'FINANCE'
              ? 'border-amber-500 text-amber-500 bg-amber-500/10 rounded-t-xl'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <CreditCard size={16} /> FINANCE &amp; PAYMENTS
        </button>
      </div>

      {/* Sub-tabs for OPERATIONS */}
      {activeSection === 'OPERATIONS' && (
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'shipping', label: 'Shipping Rules', icon: Truck },
            { id: 'staff', label: 'Staff Accounts & Permissions', icon: Users },
            { id: 'locations', label: 'Store Locations', icon: MapPin },
            { id: 'general', label: 'General Info', icon: Globe },
            { id: 'apps', label: 'Connected Apps', icon: Smartphone },
            { id: 'security', label: 'Security Settings', icon: Lock },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
                activeSubTab === sub.id
                  ? 'border-amber-500 bg-amber-500/15 text-amber-500'
                  : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-amber-500/40 hover:text-[var(--text-primary)]'
              }`}
            >
              <sub.icon size={14} /> {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* Sub-tabs for FINANCE */}
      {activeSection === 'FINANCE' && (
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'bank', label: 'Bank Details & Transfer', icon: CreditCard },
            { id: 'expenses', label: 'Expenses Tracker', icon: DollarSign },
            { id: 'taxes', label: 'Taxes & Receipts', icon: Receipt },
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition whitespace-nowrap ${
                activeSubTab === sub.id
                  ? 'border-amber-500 bg-amber-500/15 text-amber-500'
                  : 'border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:border-amber-500/40 hover:text-[var(--text-primary)]'
              }`}
            >
              <sub.icon size={14} /> {sub.label}
            </button>
          ))}
        </div>
      )}

      {/* ==================== OPERATIONS CONTENT ==================== */}

      {/* SubTab: Shipping Rules */}
      {activeSection === 'OPERATIONS' && activeSubTab === 'shipping' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Delivery Zones &amp; Dispatch Rules</h3>
            <Link
              href="/store-portal-jl/dashboard/shipping"
              className="text-xs font-bold text-amber-500 hover:text-amber-400 transition"
            >
              Open Advanced Shipping Manager →
            </Link>
          </div>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Configure delivery fees (₦), lead times, and motor park waybill pickup instructions.
          </p>
        </div>
      )}

      {/* SubTab: Staff Accounts */}
      {activeSection === 'OPERATIONS' && activeSubTab === 'staff' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Staff Accounts &amp; Permissions</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Grant individual staff accounts access to specific modules</p>
            </div>
            <button
              onClick={() => showToast('Staff invite modal opened')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10"
            >
              <Plus size={14} /> Add Staff Account
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {staffList.map((st) => (
              <div key={st.id} className="flex items-center justify-between rounded-xl bg-[var(--bg-primary)] p-4 border border-[var(--border)] text-xs">
                <div>
                  <p className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                    {st.name}
                    <span className="rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold">
                      {st.role}
                    </span>
                  </p>
                  <p className="text-[var(--text-muted)] font-mono mt-0.5 font-medium">{st.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Full Permissions</span>
                  <button className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><Edit2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab: Store Locations */}
      {activeSection === 'OPERATIONS' && activeSubTab === 'locations' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Physical Store Outlets</h3>
              <p className="text-xs text-[var(--text-secondary)] font-medium">Manage pickup points and retail locations</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {locations.map((loc) => (
              <div key={loc.id} className="flex items-center justify-between rounded-xl bg-[var(--bg-primary)] p-4 border border-[var(--border)] text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <MapPin size={14} className="text-amber-500" /> {loc.name}
                    {loc.isDefault && (
                      <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-500/20">
                        Main HQ
                      </span>
                    )}
                  </p>
                  <p className="text-[var(--text-secondary)] font-medium">{loc.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab: General Info */}
      {activeSection === 'OPERATIONS' && activeSubTab === 'general' && (
        <form onSubmit={handleSaveStoreInfo} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-4">General Store Contact</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className={lbl}>Store Brand Name</label>
              <input value={storeInfo.name} onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Business Email</label>
              <input value={storeInfo.email} onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })} className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>Physical Business Address</label>
            <input value={storeInfo.address} onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })} className={inp} />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10">
              <Save size={15} /> Save General Info
            </button>
          </div>
        </form>
      )}

      {/* SubTab: Connected Apps */}
      {activeSection === 'OPERATIONS' && activeSubTab === 'apps' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-4">Connected Services</h3>
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="font-bold text-emerald-600 dark:text-emerald-300">WhatsApp Business</p>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">Direct order checkout integration</p>
              <span className="mt-2.5 inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">ACTIVE</span>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="font-bold text-amber-600 dark:text-amber-300">Cloudinary Library</p>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">Phone gallery photo uploads</p>
              <span className="mt-2.5 inline-block rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">CONNECTED</span>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="font-bold text-blue-600 dark:text-blue-300">Neon PostgreSQL</p>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-1">Live database cloud engine</p>
              <span className="mt-2.5 inline-block rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/30">SYNCED</span>
            </div>
          </div>
        </div>
      )}

      {/* SubTab: Security Settings */}
      {activeSection === 'OPERATIONS' && activeSubTab === 'security' && (
        <SecuritySettingsForm showToast={showToast} />
      )}

      {/* ==================== FINANCE CONTENT ==================== */}

      {/* SubTab: Bank Details */}
      {activeSection === 'FINANCE' && activeSubTab === 'bank' && (
        <form onSubmit={handleSaveBankInfo} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-4">Bank Transfer Details (Manual Payment)</h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <label className={lbl}>Bank Name</label>
              <input value={bankInfo.bankName} onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Account Number</label>
              <input value={bankInfo.accountNumber} onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })} className={`${inp} font-mono font-bold text-amber-500`} />
            </div>
            <div>
              <label className={lbl}>Account Name</label>
              <input value={bankInfo.accountName} onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value })} className={inp} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10">
              <Save size={15} /> Save Bank Details
            </button>
          </div>
        </form>
      )}

      {/* SubTab: Expenses Tracker */}
      {activeSection === 'FINANCE' && activeSubTab === 'expenses' && (
        <div className="space-y-6">
          <form onSubmit={handleAddExpense} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-4">Record Operational Expense</h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
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
              <button type="submit" className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10">
                Record Expense
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-[var(--text-primary)]">
              <thead className="border-b border-[var(--border)] bg-[var(--table-header-bg)] uppercase tracking-wider text-[var(--text-secondary)] text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {expenses.map((ex) => (
                  <tr key={ex.id} className="hover:bg-[var(--table-row-hover)] transition">
                    <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)] font-medium">{ex.date}</td>
                    <td className="py-3.5 px-4 text-amber-500 font-bold">{ex.category}</td>
                    <td className="py-3.5 px-4 text-[var(--text-primary)] font-medium">{ex.description}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--text-primary)]">₦{ex.amount?.toLocaleString('en-NG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab: Taxes & Receipts */}
      {activeSection === 'FINANCE' && activeSubTab === 'taxes' && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm text-xs text-[var(--text-secondary)] font-medium">
          <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-4">Taxes &amp; Order Invoice Setup</h3>
          <p>Configure VAT percentage toggles and custom header notes for WhatsApp receipt links.</p>
        </div>
      )}
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

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] py-3 pl-4 pr-12 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-sans font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'

  return (
    <form onSubmit={handlePasswordChange} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm max-w-md">
      <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-4">
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
              className="absolute right-3.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
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
              className="absolute right-3.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="mt-1 text-[10px] text-[var(--text-muted)] font-medium">
            Password must be at least 12 characters long.
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
              className="absolute right-3.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10 disabled:opacity-50"
        >
          <Save size={15} /> {loading ? 'Updating...' : 'Change Password'}
        </button>
      </div>
    </form>
  )
}

