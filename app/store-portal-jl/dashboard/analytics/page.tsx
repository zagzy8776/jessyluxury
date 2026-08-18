'use client'
import { useEffect, useState } from 'react'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Percent,
  Calendar,
  Layers,
  Users,
  Target,
  ArrowUpRight,
  Info,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

const DATE_RANGES = ['Today', 'Last 7 Days', 'Last 30 Days', 'This Year', 'All Time']
const TABS = ['Sales', 'Products', 'Customers', 'Channels', 'Marketing']

export default function AnalyticsHubPage() {
  const [activeDateRange, setActiveDateRange] = useState('Last 30 Days')
  const [activeTab, setActiveTab] = useState('Sales')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast, showToast, clearToast } = useToast()

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/analytics?range=${encodeURIComponent(activeDateRange)}`)
        if (!res.ok) {
          throw new Error('Failed to load aggregations')
        }
        const json = await res.json()
        setData(json)
      } catch (err: any) {
        showToast(err.message || 'Error loading analytics', 'error')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [activeDateRange])

  if (loading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent mx-auto" />
          <p className="text-xs font-mono text-[var(--text-secondary)] font-bold">Aggregating Executive Metrics...</p>
        </div>
      </div>
    )
  }

  const { sales, products, customers, channels, marketing } = data

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header & Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Executive Analytics Hub
          </h1>
          <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
            Server-aggregated tracking for sales, brand margins, channels, and customer loyalty boundaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-3 py-2 shadow-sm">
            <Calendar size={14} className="text-amber-500" />
            <select
              value={activeDateRange}
              onChange={(e) => setActiveDateRange(e.target.value)}
              className="bg-transparent text-xs font-bold text-[var(--text-primary)] outline-none cursor-pointer"
            >
              {DATE_RANGES.map((r) => (
                <option key={r} value={r} className="bg-[var(--card-bg)]">{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Row */}
      <div className="grid gap-5 sm:grid-cols-4">
        {/* Gross Revenue */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Gross Revenue</span>
            <span className="rounded-xl bg-amber-500/10 p-2 text-amber-500 border border-amber-500/20">
              <TrendingUp size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-[var(--text-primary)]">
            ₦{sales.grossRevenue.toLocaleString('en-NG')}
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)] font-medium">Completed order values</p>
        </div>

        {/* Profit After Discounts */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Profit after Discounts</span>
            <span className="rounded-xl bg-emerald-500/10 p-2 text-emerald-500 border border-emerald-500/20">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-[var(--text-primary)]">
            {sales.profitAfterDiscounts !== null ? `₦${sales.profitAfterDiscounts.toLocaleString('en-NG')}` : 'Unavailable'}
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)] font-medium">Historical cost snapshot basis</p>
        </div>

        {/* Successful Orders */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Completed Orders</span>
            <span className="rounded-xl bg-purple-500/10 p-2 text-purple-500 border border-purple-500/20">
              <ShoppingBag size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-[var(--text-primary)]">
            {sales.completedOrders}
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)] font-medium">Active PAID transactions</p>
        </div>

        {/* Average Order Value */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-[var(--text-muted)] uppercase">Average Order Value</span>
            <span className="rounded-xl bg-blue-500/10 p-2 text-blue-500 border border-blue-500/20">
              <Percent size={16} />
            </span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-[var(--text-primary)]">
            ₦{sales.averageOrderValue.toLocaleString('en-NG')}
          </p>
          <p className="mt-1 text-[10px] text-[var(--text-secondary)] font-medium">AOV per checkout</p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-[var(--border)] gap-2 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-5 py-3 text-xs font-bold tracking-wide transition whitespace-nowrap ${
              activeTab === tab
                ? 'border-amber-500 text-amber-500 bg-amber-500/5 rounded-t-xl'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab} Report
          </button>
        ))}
      </div>

      {/* TAB 1: Sales Reports */}
      {activeTab === 'Sales' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Revenue and Orders Chart Visualizer */}
          <div className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Revenue Trend Visualizer</h3>
              <span className="text-[10px] text-amber-500 font-mono font-bold">{activeDateRange}</span>
            </div>
            <div className="h-64 flex items-end justify-between gap-3 pt-6 border-b border-[var(--border)] pb-2">
              {sales.trend.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-[var(--text-muted)] font-mono">
                  No transaction activity logged in period
                </div>
              ) : (
                sales.trend.map((t: any, i: number) => {
                  const maxRevenue = Math.max(...sales.trend.map((x: any) => x.revenue || 1), 1)
                  const heightPct = Math.max(10, Math.round((t.revenue / maxRevenue) * 100))
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div className="text-[9px] text-[var(--text-secondary)] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        ₦{Math.round(t.revenue / 1000)}k
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-t-md bg-amber-500/20 group-hover:bg-amber-500 transition-colors duration-200"
                      />
                      <span className="text-[8px] text-[var(--text-muted)] font-mono font-bold rotate-45 mt-2 origin-left whitespace-nowrap">
                        {t.label.split('-').slice(-2).join('/')}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] text-center font-medium pt-2">
              Values grouped timezone-correctly relative to Africa/Lagos boundaries
            </p>
          </div>

          {/* Sales Profitability Sidebar */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-6 shadow-sm">
            <h3 className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Profitability Audit</h3>
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--text-secondary)]">Discounts Offered</span>
                <span className="text-red-500">-₦{sales.discountsGiven.toLocaleString('en-NG')}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--text-secondary)]">Gross Cost of Goods</span>
                <span className="text-[var(--text-primary)] font-mono">
                  {sales.grossProductProfit !== null
                    ? `₦${(sales.grossRevenue - sales.grossProductProfit).toLocaleString('en-NG')}`
                    : 'Unavailable'}
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--border)] pb-2">
                <span className="text-[var(--text-secondary)]">Calculated Margin Share</span>
                <span className="text-emerald-500">
                  {sales.profitAfterDiscounts !== null && sales.grossRevenue > 0
                    ? `${Math.round((sales.profitAfterDiscounts / sales.grossRevenue) * 100)}%`
                    : '—'}
                </span>
              </div>
              {sales.profitCoverageNote && (
                <div className="rounded-lg bg-amber-500/10 p-3 text-[10px] text-amber-600 dark:text-amber-400 flex gap-2">
                  <Info size={14} className="flex-shrink-0" />
                  <p>{sales.profitCoverageNote}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Products Reports */}
      {activeTab === 'Products' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Selling Products list */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Top Selling Fragrances</h3>
            <div className="space-y-3">
              {products.bestSellers.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-4 text-center">No units sold in this period.</p>
              ) : (
                products.bestSellers.map((p: any, idx: number) => (
                  <div key={p.productId} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 font-mono font-bold text-[10px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{p.name}</p>
                        <p className="text-[9px] text-[var(--text-muted)] font-mono">{p.brand}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold text-[var(--text-primary)]">{p.unitsSold} units</p>
                      <p className="text-[9px] text-emerald-500">₦{p.revenue.toLocaleString('en-NG')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Performing Products list */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Low Performing / Stagnant Stock</h3>
            <div className="space-y-3">
              {products.lowPerformers.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-4 text-center">No stagnant inventory listings.</p>
              ) : (
                products.lowPerformers.map((p: any) => (
                  <div key={p.productId} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-xs">
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{p.name}</p>
                      <p className="text-[9px] text-[var(--text-muted)] font-mono">{p.brand}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-500 font-mono">{p.unitsSold} sold</p>
                      <p className="text-[9px] text-[var(--text-secondary)] font-medium">Stock: {p.stock} units</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Customers Reports */}
      {activeTab === 'Customers' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Cohort Segments cards */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Cohort Metrics</h3>
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 flex justify-between items-center">
                <div>
                  <p className="text-[var(--text-muted)] font-bold uppercase text-[9px]">New Customer Growth</p>
                  <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{customers.newCustomers}</p>
                </div>
                <Users className="text-amber-500" size={24} />
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 flex justify-between items-center">
                <div>
                  <p className="text-[var(--text-muted)] font-bold uppercase text-[9px]">Returning Customer Rate</p>
                  <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{customers.returningCustomers}</p>
                </div>
                <Target className="text-blue-500" size={24} />
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 flex justify-between items-center">
                <div>
                  <p className="text-[var(--text-muted)] font-bold uppercase text-[9px]">One-Time Buyer Counts</p>
                  <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{customers.oneTimeCustomers}</p>
                </div>
                <Layers className="text-purple-500" size={24} />
              </div>
            </div>
          </div>

          {/* Top customer spenders within the selected range */}
          <div className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Top Customers (Range Active Spend)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-bold">
                    <th className="py-2.5">Name</th>
                    <th className="py-2.5">Phone</th>
                    <th className="py-2.5 text-center">Orders</th>
                    <th className="py-2.5 text-right">Spend</th>
                    <th className="py-2.5 text-right">AOV</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.topClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-[var(--text-muted)]">No active checkout customers in range</td>
                    </tr>
                  ) : (
                    customers.topClients.map((c: any) => (
                      <tr key={c.customerId} className="border-b border-[var(--border)] font-medium text-[var(--text-primary)]">
                        <td className="py-3 font-bold">{c.name}</td>
                        <td className="py-3 font-mono text-[var(--text-secondary)]">{c.phone}</td>
                        <td className="py-3 text-center font-mono">{c.orders}</td>
                        <td className="py-3 text-right font-mono text-emerald-500">₦{c.spend.toLocaleString('en-NG')}</td>
                        <td className="py-3 text-right font-mono text-amber-500">₦{c.aov.toLocaleString('en-NG')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Channel Reports */}
      {activeTab === 'Channels' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Order Channel List */}
          <div className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Channel Performance (Order.salesChannel)</h3>
            <div className="space-y-4 pt-2">
              {channels.channels.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] py-4 text-center">No sales channel allocations mapped.</p>
              ) : (
                channels.channels.map((ch: any) => (
                  <div key={ch.channel} className="space-y-1.5 text-xs font-semibold">
                    <div className="flex justify-between items-center text-[var(--text-primary)]">
                      <span className="font-bold">{ch.channel}</span>
                      <span className="font-mono text-amber-500">{ch.share}% <span className="text-[var(--text-muted)]">({ch.orders} orders)</span></span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[var(--bg-primary)] overflow-hidden border border-[var(--border)]">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${ch.share}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Business Insights Panel */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm flex flex-col justify-center">
            <h3 className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Acquisition Source vs Sales Channel</h3>
            <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-2">
              <p>
                <strong>Order Sales Channel</strong> represents where the transaction checkout actually occurred (e.g., Physical POS, WhatsApp shop, Instagram direct DM).
              </p>
              <p>
                <strong>Customer Acquisition Source</strong> represents where the client was originally discovered (e.g., Online Store referral, Referral from friend).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Marketing Campaigns */}
      {activeTab === 'Marketing' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Promo Impact Widget cards */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Promo Performance</h3>
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 flex justify-between items-center">
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase">Revenue Influenced by Coupons</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-500 font-mono">₦{marketing.totalRevenueInfluenced.toLocaleString('en-NG')}</p>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 flex justify-between items-center">
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase">Total Discount Deductions</p>
                  <p className="text-2xl font-bold mt-1 text-red-500 font-mono">₦{marketing.totalDiscountGiven.toLocaleString('en-NG')}</p>
                </div>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-4 flex justify-between items-center">
                <div>
                  <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase">Checkout Count using Promo</p>
                  <p className="text-2xl font-bold mt-1 text-[var(--text-primary)]">{marketing.ordersWithDiscount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Coupon Leaderboard */}
          <div className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold text-[var(--text-primary)] tracking-wide uppercase">Active Coupon Redemptions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] font-bold">
                    <th className="py-2.5">Code</th>
                    <th className="py-2.5 text-center">Uses</th>
                    <th className="py-2.5 text-right">Discount Claimed</th>
                    <th className="py-2.5 text-right">Revenue Influenced</th>
                  </tr>
                </thead>
                <tbody>
                  {marketing.couponUsage.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-[var(--text-muted)]">No coupons redeemed in range</td>
                    </tr>
                  ) : (
                    marketing.couponUsage.map((c: any) => (
                      <tr key={c.code} className="border-b border-[var(--border)] font-medium text-[var(--text-primary)]">
                        <td className="py-3 font-bold font-mono text-amber-500">{c.code}</td>
                        <td className="py-3 text-center font-mono">{c.timesUsed}</td>
                        <td className="py-3 text-right font-mono text-red-500">₦{c.totalDiscountGiven.toLocaleString('en-NG')}</td>
                        <td className="py-3 text-right font-mono text-emerald-500">₦{c.revenueInfluenced.toLocaleString('en-NG')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
