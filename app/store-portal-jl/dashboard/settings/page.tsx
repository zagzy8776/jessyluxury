'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Settings, Truck, Users, MapPin, Globe, CreditCard, DollarSign, Receipt,
  Plus, Edit2, Trash2, ShieldCheck, CheckCircle, Save, Smartphone, Building,
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
  const [staffList, setStaffList] = useState([
    { id: 1, name: 'Jessy (Owner)', email: 'owner@jessyluxury.com', role: 'Owner', permissions: ['all'], active: true },
    { id: 2, name: 'Ada (Fulfillment Manager)', email: 'ada@jessyluxury.com', role: 'Fulfillment', permissions: ['orders', 'shipping'], active: true },
    { id: 3, name: 'Chidi (Catalog Manager)', email: 'chidi@jessyluxury.com', role: 'Catalog', permissions: ['products'], active: true },
  ])

  // Store Locations state
  const [locations, setLocations] = useState([
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

  const inp = 'w-full rounded-xl border border-stone-800 bg-stone-900 p-3 text-stone-200 text-xs outline-none transition focus:border-amber-500 font-sans'
  const lbl = 'block text-[11px] font-semibold text-stone-400 mb-1 uppercase tracking-wider'

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="border-b border-stone-800 pb-4">
        <h1 className="font-display text-3xl font-medium text-stone-50">Operations &amp; Store Setup</h1>
        <p className="mt-1 text-xs text-stone-400">
          Manage operations (shipping rules, staff permissions, locations) &amp; finance (bank accounts, expenses).
        </p>
      </div>

      {/* Primary Section Tabs (OPERATIONS vs FINANCE) */}
      <div className="flex border-b border-stone-800">
        <button
          onClick={() => { setActiveSection('OPERATIONS'); setActiveSubTab('shipping') }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-xs font-bold tracking-wider transition ${
            activeSection === 'OPERATIONS'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Building size={16} /> OPERATIONS SETUP
        </button>

        <button
          onClick={() => { setActiveSection('FINANCE'); setActiveSubTab('bank') }}
          className={`flex items-center gap-2 border-b-2 px-6 py-3 text-xs font-bold tracking-wider transition ${
            activeSection === 'FINANCE'
              ? 'border-amber-400 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-stone-400 hover:text-stone-200'
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
          ].map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubTab(sub.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                activeSubTab === sub.id
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                  : 'border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
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
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                activeSubTab === sub.id
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                  : 'border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200'
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
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 space-y-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-100">Delivery Zones &amp; Dispatch Rules</h3>
            <Link
              href="/store-portal-jl/dashboard/shipping"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition"
            >
              Open Advanced Shipping Manager →
            </Link>
          </div>
          <p className="text-xs text-stone-400">
            Configure delivery fees (₦), lead times, and motor park waybill pickup instructions.
          </p>
        </div>
      )}

      {/* SubTab: Staff Accounts & Granular Permissions */}
      {activeSection === 'OPERATIONS' && activeSubTab === 'staff' && (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 space-y-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-100">Staff Accounts &amp; Permissions</h3>
              <p className="text-xs text-stone-400">Grant individual staff accounts access to specific modules</p>
            </div>
            <button
              onClick={() => showToast('Staff invite modal opened')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400 transition"
            >
              <Plus size={14} /> Add Staff Account
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {staffList.map((st) => (
              <div key={st.id} className="flex items-center justify-between rounded-xl bg-stone-950 p-4 border border-stone-800 text-xs">
                <div>
                  <p className="font-semibold text-stone-100 flex items-center gap-2">
                    {st.name}
                    <span className="rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                      {st.role}
                    </span>
                  </p>
                  <p className="text-stone-500 font-mono mt-0.5">{st.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-emerald-400 font-medium">Full Permissions</span>
                  <button className="text-stone-400 hover:text-white"><Edit2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab: Store Locations */}
      {activeSection === 'OPERATIONS' && activeSubTab === 'locations' && (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 space-y-4 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-stone-100">Physical Store Outlets</h3>
              <p className="text-xs text-stone-400">Manage pickup points and retail locations</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {locations.map((loc) => (
              <div key={loc.id} className="flex items-center justify-between rounded-xl bg-stone-950 p-4 border border-stone-800 text-xs">
                <div className="space-y-1">
                  <p className="font-semibold text-stone-100 flex items-center gap-2">
                    <MapPin size={14} className="text-amber-400" /> {loc.name}
                    {loc.isDefault && (
                      <span className="rounded-full bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                        Main HQ
                      </span>
                    )}
                  </p>
                  <p className="text-stone-400">{loc.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab: General Info */}
      {activeSection === 'OPERATIONS' && activeSubTab === 'general' && (
        <form onSubmit={handleSaveStoreInfo} className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 space-y-4 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-stone-100 border-b border-stone-800 pb-3">General Store Contact</h3>
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
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition">
              <Save size={15} /> Save General Info
            </button>
          </div>
        </form>
      )}

      {/* SubTab: Connected Apps */}
      {activeSection === 'OPERATIONS' && activeSubTab === 'apps' && (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 space-y-4 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-stone-100 border-b border-stone-800 pb-3">Connected Services</h3>
          <div className="grid gap-3 sm:grid-cols-3 text-xs">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p className="font-bold text-emerald-300">WhatsApp Business</p>
              <p className="text-[10px] text-stone-400 mt-1">Direct order checkout integration</p>
              <span className="mt-2 inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">ACTIVE</span>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="font-bold text-amber-300">Cloudinary Library</p>
              <p className="text-[10px] text-stone-400 mt-1">Phone gallery photo uploads</p>
              <span className="mt-2 inline-block rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">CONNECTED</span>
            </div>

            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="font-bold text-blue-300">Neon PostgreSQL</p>
              <p className="text-[10px] text-stone-400 mt-1">Live database cloud engine</p>
              <span className="mt-2 inline-block rounded bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">SYNCED</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== FINANCE CONTENT ==================== */}

      {/* SubTab: Bank Details */}
      {activeSection === 'FINANCE' && activeSubTab === 'bank' && (
        <form onSubmit={handleSaveBankInfo} className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 space-y-4 shadow-xl backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-stone-100 border-b border-stone-800 pb-3">Bank Transfer Details (Manual Payment)</h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <label className={lbl}>Bank Name</label>
              <input value={bankInfo.bankName} onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })} className={inp} />
            </div>
            <div>
              <label className={lbl}>Account Number</label>
              <input value={bankInfo.accountNumber} onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })} className={`${inp} font-mono font-bold text-amber-300`} />
            </div>
            <div>
              <label className={lbl}>Account Name</label>
              <input value={bankInfo.accountName} onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value })} className={inp} />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition">
              <Save size={15} /> Save Bank Details
            </button>
          </div>
        </form>
      )}

      {/* SubTab: Expenses Tracker */}
      {activeSection === 'FINANCE' && activeSubTab === 'expenses' && (
        <div className="space-y-6">
          <form onSubmit={handleAddExpense} className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 space-y-4 shadow-xl backdrop-blur-xl">
            <h3 className="text-sm font-semibold text-stone-100 border-b border-stone-800 pb-3">Record Operational Expense</h3>
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
              <button type="submit" className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition">
                Record Expense
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-stone-800 bg-stone-900/40 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-800 bg-stone-950/80 uppercase tracking-wider text-stone-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {expenses.map((ex) => (
                  <tr key={ex.id} className="hover:bg-stone-900/60">
                    <td className="py-3 px-4 font-mono text-stone-400">{ex.date}</td>
                    <td className="py-3 px-4 text-amber-300 font-semibold">{ex.category}</td>
                    <td className="py-3 px-4 text-stone-200">{ex.description}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-stone-100">₦{ex.amount?.toLocaleString('en-NG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SubTab: Taxes & Receipts */}
      {activeSection === 'FINANCE' && activeSubTab === 'taxes' && (
        <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6 space-y-4 shadow-xl backdrop-blur-xl text-xs text-stone-300">
          <h3 className="text-sm font-semibold text-stone-100 border-b border-stone-800 pb-3">Taxes &amp; Order Invoice Setup</h3>
          <p>Configure VAT percentage toggles and custom header notes for WhatsApp receipt links.</p>
        </div>
      )}
    </div>
  )
}
