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
  Info,
} from 'lucide-react'
import { Toast, useToast } from '@/components/Toast'

const DATE_RANGES = ['Today', 'Last 7 Days', 'Last 30 Days', 'This Year', 'All Time']
const TABS = ['Sales', 'Products', 'Customers', 'Channels', 'Marketing', 'Wholesale']

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
      <div className="space-y-4">
        <div className="skeleton h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 w-full" />
          ))}
        </div>
        <div className="skeleton h-72 w-full" />
      </div>
    )
  }

  const { sales, products, customers, channels, marketing } = data

  return (
    <div className="space-y-5">
      {toast && <Toast message={toast.message} type={toast.type} onClose={clearToast} />}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--admin-border)] pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Insights</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-xs font-medium text-[var(--admin-text-secondary)]">
            Server-aggregated sales, margins, channels and customer loyalty.
          </p>
        </div>

        <div className="relative flex w-fit items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-card-bg)] px-3 py-2.5 shadow-sm">
          <Calendar size={14} className="text-[var(--accent)]" />
          <select
            value={activeDateRange}
            onChange={(e) => setActiveDateRange(e.target.value)}
            className="cursor-pointer bg-transparent text-xs font-bold outline-none"
            aria-label="Date range"
          >
            {DATE_RANGES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Gross Revenue</span>
            <span className="rounded-lg bg-[var(--accent-soft)] p-2 text-[var(--accent)]"><TrendingUp size={15} /></span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold tabular-nums">
            ₦{sales.grossRevenue.toLocaleString('en-NG')}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--admin-text-muted)]">Completed order values</p>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Profit after Discounts</span>
            <span className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600"><DollarSign size={15} /></span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold tabular-nums">
            {sales.profitAfterDiscounts !== null ? `₦${sales.profitAfterDiscounts.toLocaleString('en-NG')}` : 'Unavailable'}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--admin-text-muted)]">Historical cost snapshot basis</p>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Completed Orders</span>
            <span className="rounded-lg bg-blue-500/10 p-2 text-blue-600"><ShoppingBag size={15} /></span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold tabular-nums">{sales.completedOrders}</p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--admin-text-muted)]">Active PAID transactions</p>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--admin-text-muted)]">Average Order Value</span>
            <span className="rounded-lg bg-[var(--champagne-soft)] p-2 text-[#7a5c22]"><Percent size={15} /></span>
          </div>
          <p className="mt-3 font-display text-2xl font-bold tabular-nums">
            ₦{sales.averageOrderValue.toLocaleString('en-NG')}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[var(--admin-text-muted)]">AOV per checkout</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="hide-scrollbar flex gap-1 overflow-x-auto border-b border-[var(--admin-border)]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-bold tracking-wide transition ${
              activeTab === tab
                ? 'border-[var(--accent)] text-[var(--accent)]'
                : 'border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB: Sales */}
      {activeTab === 'Sales' && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="admin-card space-y-4 p-6 md:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Revenue Trend</h3>
              <span className="font-mono text-[10px] font-bold text-[var(--accent)]">{activeDateRange}</span>
            </div>
            <div className="flex h-64 items-end justify-between gap-2 border-b border-[var(--admin-border)] pb-2 pt-6 sm:gap-3">
              {sales.trend.length === 0 ? (
                <div className="flex h-full w-full items-center justify-center text-xs font-medium text-[var(--admin-text-muted)]">
                  No transaction activity logged in period
                </div>
              ) : (
                sales.trend.map((t: any, i: number) => {
                  const maxRevenue = Math.max(...sales.trend.map((x: any) => x.revenue || 1), 1)
                  const heightPct = Math.max(8, Math.round((t.revenue / maxRevenue) * 100))
                  return (
                    <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                      <div className="whitespace-nowrap font-mono text-[9px] text-[var(--admin-text-secondary)] opacity-0 transition-opacity group-hover:opacity-100">
                        ₦{Math.round(t.revenue / 1000)}k
                      </div>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className="w-full rounded-t-md bg-[var(--accent)]/20 transition-colors duration-200 group-hover:bg-[var(--accent)]"
                      />
                      <span className="mt-2 whitespace-nowrap font-mono text-[8px] font-bold text-[var(--admin-text-muted)]">
                        {t.label.split('-').slice(-2).join('/')}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
            <p className="pt-1 text-center text-[10px] font-medium text-[var(--admin-text-muted)]">
              Values grouped timezone-correctly relative to Africa/Lagos boundaries
            </p>
          </div>

          <div className="admin-card space-y-5 p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Profitability</h3>
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between border-b border-[var(--admin-border)] pb-2">
                <span className="text-[var(--admin-text-secondary)]">Discounts Offered</span>
                <span className="font-mono tabular-nums text-red-500">−₦{sales.discountsGiven.toLocaleString('en-NG')}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--admin-border)] pb-2">
                <span className="text-[var(--admin-text-secondary)]">Cost of Goods</span>
                <span className="font-mono tabular-nums">
                  {sales.grossProductProfit !== null
                    ? `₦${(sales.grossRevenue - sales.grossProductProfit).toLocaleString('en-NG')}`
                    : 'Unavailable'}
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--admin-border)] pb-2">
                <span className="text-[var(--admin-text-secondary)]">Margin Share</span>
                <span className="font-mono tabular-nums text-emerald-600">
                  {sales.profitAfterDiscounts !== null && sales.grossRevenue > 0
                    ? `${Math.round((sales.profitAfterDiscounts / sales.grossRevenue) * 100)}%`
                    : '—'}
                </span>
              </div>
              {sales.profitCoverageNote && (
                <div className="flex gap-2 rounded-lg bg-[var(--champagne-soft)] p-3 text-[10px] font-medium text-[#7a5c22]">
                  <Info size={14} className="shrink-0" />
                  <p>{sales.profitCoverageNote}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Products */}
      {activeTab === 'Products' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-card space-y-4 p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Top Selling Fragrances</h3>
            <div className="space-y-3">
              {products.bestSellers.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--admin-text-muted)]">No units sold in this period.</p>
              ) : (
                products.bestSellers.map((p: any, idx: number) => (
                  <div key={p.productId} className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 text-xs">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                        idx === 0 ? 'bg-[var(--champagne)] text-white' : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{p.name}</p>
                        <p className="font-mono text-[9px] text-[var(--admin-text-muted)]">{p.brand}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right font-mono tabular-nums">
                      <p className="font-bold">{p.unitsSold} units</p>
                      <p className="text-[9px] text-emerald-600">₦{p.revenue.toLocaleString('en-NG')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="admin-card space-y-4 p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Low Performing Stock</h3>
            <div className="space-y-3">
              {products.lowPerformers.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--admin-text-muted)]">No stagnant inventory listings.</p>
              ) : (
                products.lowPerformers.map((p: any) => (
                  <div key={p.productId} className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{p.name}</p>
                      <p className="font-mono text-[9px] text-[var(--admin-text-muted)]">{p.brand}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono font-bold tabular-nums text-red-500">{p.unitsSold} sold</p>
                      <p className="text-[9px] font-medium text-[var(--admin-text-secondary)]">Stock: {p.stock} units</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Customers */}
      {activeTab === 'Customers' && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="admin-card space-y-4 p-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Cohorts</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">New Customers</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">{customers.newCustomers}</p>
                </div>
                <Users className="text-[var(--accent)]" size={22} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Returning</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">{customers.returningCustomers}</p>
                </div>
                <Target className="text-emerald-600" size={22} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">One-Time Buyers</p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">{customers.oneTimeCustomers}</p>
                </div>
                <Layers className="text-blue-500" size={22} />
              </div>
            </div>
          </div>

          <div className="admin-card space-y-4 p-6 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Top Customers (Active Spend)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--admin-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
                    <th className="py-2.5 pr-3">Name</th>
                    <th className="py-2.5 pr-3">Phone</th>
                    <th className="py-2.5 pr-3 text-center">Orders</th>
                    <th className="py-2.5 pr-3 text-right">Spend</th>
                    <th className="py-2.5 text-right">AOV</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.topClients.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[var(--admin-text-muted)]">No active checkout customers in range</td>
                    </tr>
                  ) : (
                    customers.topClients.map((c: any) => (
                      <tr key={c.customerId} className="border-b border-[var(--admin-border)] last:border-0">
                        <td className="py-3 pr-3 font-bold">{c.name}</td>
                        <td className="py-3 pr-3 font-mono text-[var(--admin-text-secondary)]">{c.phone}</td>
                        <td className="py-3 pr-3 text-center font-mono tabular-nums">{c.orders}</td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums text-emerald-600">₦{c.spend.toLocaleString('en-NG')}</td>
                        <td className="py-3 text-right font-mono tabular-nums text-[var(--accent)]">₦{c.aov.toLocaleString('en-NG')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Channels */}
      {activeTab === 'Channels' && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="admin-card space-y-4 p-6 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Channel Performance</h3>
            <div className="space-y-4 pt-2">
              {channels.channels.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--admin-text-muted)]">No sales channel allocations mapped.</p>
              ) : (
                channels.channels.map((ch: any) => (
                  <div key={ch.channel} className="space-y-1.5 text-xs font-semibold">
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{ch.channel}</span>
                      <span className="font-mono tabular-nums text-[var(--accent)]">
                        {ch.share}% <span className="font-normal text-[var(--admin-text-muted)]">({ch.orders} orders)</span>
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--admin-bg)]">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${ch.share}%` }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="admin-card flex flex-col justify-center space-y-4 p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Acquisition vs Channel</h3>
            <div className="space-y-2 text-xs leading-relaxed text-[var(--admin-text-secondary)]">
              <p>
                <strong className="text-[var(--admin-text-primary)]">Order Sales Channel</strong> represents where the transaction checkout occurred (Physical POS, WhatsApp shop, Instagram DM).
              </p>
              <p>
                <strong className="text-[var(--admin-text-primary)]">Customer Acquisition Source</strong> represents where the client was originally discovered.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Marketing */}
      {activeTab === 'Marketing' && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="admin-card space-y-4 p-5">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Promo Performance</h3>
            <div className="space-y-3 text-xs">
              <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Revenue Influenced by Coupons</p>
                <p className="mt-1 font-display text-xl font-bold tabular-nums text-emerald-600">₦{marketing.totalRevenueInfluenced.toLocaleString('en-NG')}</p>
              </div>
              <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Total Discount Deductions</p>
                <p className="mt-1 font-display text-xl font-bold tabular-nums text-red-500">₦{marketing.totalDiscountGiven.toLocaleString('en-NG')}</p>
              </div>
              <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Checkouts Using Promo</p>
                <p className="mt-1 font-display text-xl font-bold tabular-nums">{marketing.ordersWithDiscount}</p>
              </div>
            </div>
          </div>

          <div className="admin-card space-y-4 p-6 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Coupon Redemptions</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--admin-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">
                    <th className="py-2.5 pr-3">Code</th>
                    <th className="py-2.5 pr-3 text-center">Uses</th>
                    <th className="py-2.5 pr-3 text-right">Discount Claimed</th>
                    <th className="py-2.5 text-right">Revenue Influenced</th>
                  </tr>
                </thead>
                <tbody>
                  {marketing.couponUsage.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[var(--admin-text-muted)]">No coupons redeemed in range</td>
                    </tr>
                  ) : (
                    marketing.couponUsage.map((c: any) => (
                      <tr key={c.code} className="border-b border-[var(--admin-border)] last:border-0">
                        <td className="py-3 pr-3 font-mono font-bold text-[var(--accent)]">{c.code}</td>
                        <td className="py-3 pr-3 text-center font-mono tabular-nums">{c.timesUsed}</td>
                        <td className="py-3 pr-3 text-right font-mono tabular-nums text-red-500">₦{c.totalDiscountGiven.toLocaleString('en-NG')}</td>
                        <td className="py-3 text-right font-mono tabular-nums text-emerald-600">₦{c.revenueInfluenced.toLocaleString('en-NG')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Wholesale */}
      {activeTab === 'Wholesale' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="admin-card space-y-5 p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Wholesale KPIs</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">WS Orders</p>
                <p className="mt-1 font-display text-xl font-bold tabular-nums">{data.wholesale.wholesaleOrders}</p>
              </div>
              <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">WS Revenue</p>
                <p className="mt-1 font-display text-xl font-bold tabular-nums text-emerald-600">₦{data.wholesale.wholesaleRevenue.toLocaleString('en-NG')}</p>
              </div>
              <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">WS Units Sold</p>
                <p className="mt-1 font-display text-xl font-bold tabular-nums">{data.wholesale.wholesaleUnitsSold}</p>
              </div>
              <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Avg WS Order</p>
                <p className="mt-1 font-display text-xl font-bold tabular-nums">₦{data.wholesale.averageWholesaleOrderValue.toLocaleString('en-NG')}</p>
              </div>
            </div>
          </div>

          <div className="admin-card space-y-6 p-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Wholesale vs Retail</h3>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Revenue Share</h4>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-[#7a5c22]">Wholesale:</span>
                <span className="font-mono font-bold tabular-nums">₦{data.wholesale.wholesaleVsRetailRevenue.wholesaleRevenue.toLocaleString('en-NG')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-blue-600">Retail:</span>
                <span className="font-mono font-bold tabular-nums">₦{data.wholesale.wholesaleVsRetailRevenue.retailRevenue.toLocaleString('en-NG')}</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--admin-bg)]" title={`Wholesale ${data.wholesale.wholesaleVsRetailRevenue.wholesaleShare}%`}>
                <div className="h-full bg-[var(--champagne)]" style={{ width: `${data.wholesale.wholesaleVsRetailRevenue.wholesaleShare}%` }} />
                <div className="h-full bg-blue-500/70" style={{ width: `${100 - data.wholesale.wholesaleVsRetailRevenue.wholesaleShare}%` }} />
              </div>
              <p className="text-right text-[10px] font-bold text-[#7a5c22]">{data.wholesale.wholesaleVsRetailRevenue.wholesaleShare}% wholesale share</p>
            </div>

            <div className="space-y-2 border-t border-[var(--admin-border)] pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-text-muted)]">Order Volume Share</h4>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-[#7a5c22]">Wholesale Orders:</span>
                <span className="font-mono font-bold tabular-nums">{data.wholesale.wholesaleVsRetailOrderCount.wholesaleOrders}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-blue-600">Retail Orders:</span>
                <span className="font-mono font-bold tabular-nums">{data.wholesale.wholesaleVsRetailOrderCount.retailOrders}</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--admin-bg)]" title={`Wholesale ${data.wholesale.wholesaleVsRetailOrderCount.wholesaleShare}%`}>
                <div className="h-full bg-[var(--champagne)]" style={{ width: `${data.wholesale.wholesaleVsRetailOrderCount.wholesaleShare}%` }} />
                <div className="h-full bg-blue-500/70" style={{ width: `${100 - data.wholesale.wholesaleVsRetailOrderCount.wholesaleShare}%` }} />
              </div>
              <p className="text-right text-[10px] font-bold text-[#7a5c22]">{data.wholesale.wholesaleVsRetailOrderCount.wholesaleShare}% wholesale share</p>
            </div>
          </div>

          <div className="admin-card space-y-4 p-6 md:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.14em]">Top Wholesale Products</h3>
            <div className="space-y-3">
              {data.wholesale.topWholesaleProducts.length === 0 ? (
                <p className="py-6 text-center text-xs text-[var(--admin-text-muted)]">No wholesale units sold in this period.</p>
              ) : (
                data.wholesale.topWholesaleProducts.map((p: any, idx: number) => (
                  <div key={p.productId} className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-bg)] p-3 text-xs">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] font-bold ${
                        idx === 0 ? 'bg-[var(--champagne)] text-white' : 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      }`}>
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{p.name}</p>
                        <p className="font-mono text-[9px] text-[var(--admin-text-muted)]">{p.brand}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right font-mono tabular-nums">
                      <p className="font-bold">{p.unitsSold} units</p>
                      <p className="text-[9px] text-emerald-600">₦{p.revenue.toLocaleString('en-NG')}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
