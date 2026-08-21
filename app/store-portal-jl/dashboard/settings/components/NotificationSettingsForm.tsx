'use client'
import { useState, useEffect } from 'react'
import { Bell, TrendingUp, Sparkles, AlertTriangle, AlertCircle, Mail, MessageCircle, Save } from 'lucide-react'

export default function NotificationSettingsForm({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changedFields, setChangedFields] = useState<any>({})

  useEffect(() => {
    loadNotificationSettings()
  }, [])

  async function loadNotificationSettings() {
    try {
      setLoading(true)
      const res = await fetch('/api/settings/notifications')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to load notification settings', 'error')
      }
    } catch {
      showToast('Error loading notification settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleToggleChange(field: string, value: any) {
    setChangedFields((prev: Record<string, any>) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const hasChanges = Object.keys(changedFields).length > 0
    if (!hasChanges) {
      showToast('No changes to save', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedFields)
      })
      if (res.ok) {
        showToast('Notification settings updated successfully', 'success')
        setChangedFields({})
        await loadNotificationSettings()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update notification settings', 'error')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading notification settings...</div>
  }
  if (!settings) {
    return <div>Failed to load notification settings</div>
  }

  const emailChecked = changedFields.emailEnabled !== undefined ? changedFields.emailEnabled : settings.emailEnabled
  const pushChecked = changedFields.pushEnabled !== undefined ? changedFields.pushEnabled : settings.pushEnabled

  const orderLabels: any = {
    'order-received': 'Order received',
    'payment-confirmed': 'Payment confirmed',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-6 shadow-sm">
      {/* Connection Status */}
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <div className="rounded-full bg-[var(--accent-soft)] p-2">
          <Bell size={18} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="font-bold">Notifications: Active</p>
          <p className="text-xs text-[var(--admin-text-muted)]">
            Connection established · {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Just now'}
          </p>
        </div>
      </div>

      {/* Customer Notifications */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Customer Notifications</h4>
        <div className="space-y-3">
          <div>
            <label>
              <input
                type="checkbox"
                checked={emailChecked}
                onChange={(e) => handleToggleChange('emailEnabled', e.target.checked)}
                className="peer sr-only cursor-pointer"
              />
              <span>Enable Email Notifications</span>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Send order confirmations and updates via email
              </p>
            </label>
          </div>
          <div>
            <label>
              <input
                type="checkbox"
                checked={pushChecked}
                onChange={(e) => handleToggleChange('pushEnabled', e.target.checked)}
                className="sr-only cursor-pointer"
              />
              <span>Enable Push Notifications</span>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Send real-time notifications to customer devices
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Order Updates */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Order Updates</h4>
        <div className="space-y-3">
          <div>
            <input
              type="checkbox"
              checked={changedFields['order-received'] ?? false}
              onChange={(e) => handleToggleChange('order-received', e.target.checked)}
              className="peer sr-only cursor-pointer bg-gray-100 w-5 h-5 rounded border border-gray-300"
            />
            <span>Order received</span>
          </div>
          <div>
            <input
              type="checkbox"
              checked={changedFields['payment-confirmed'] ?? false}
              onChange={(e) => handleToggleChange('payment-confirmed', e.target.checked)}
              className="peer sr-only cursor-pointer bg-gray-100 w-5 h-5 rounded border border-gray-300"
            />
            <span>Payment confirmed</span>
          </div>
          <div>
            <input
              type="checkbox"
              checked={changedFields.processing ?? false}
              onChange={(e) => handleToggleChange('processing', e.target.checked)}
              className="peer sr-only cursor-pointer bg-gray-100 w-5 h-5 rounded border border-gray-300"
            />
            <span>Processing</span>
          </div>
          <div>
            <input
              type="checkbox"
              checked={changedFields.shipped ?? false}
              onChange={(e) => handleToggleChange('shipped', e.target.checked)}
              className="peer sr-only cursor-pointer bg-gray-100 w-5 h-5 rounded border border-gray-300"
            />
            <span>Shipped</span>
          </div>
          <div>
            <input
              type="checkbox"
              checked={changedFields.delivered ?? false}
              onChange={(e) => handleToggleChange('delivered', e.target.checked)}
              className="peer sr-only cursor-pointer bg-gray-100 w-5 h-5 rounded border border-gray-300"
            />
            <span>Delivered</span>
          </div>
          <div>
            <input
              type="checkbox"
              checked={changedFields.cancelled ?? false}
              onChange={(e) => handleToggleChange('cancelled', e.target.checked)}
              className="peer sr-only cursor-pointer bg-gray-100 w-5 h-5 rounded border border-gray-300"
            />
            <span>Cancelled</span>
          </div>
        </div>
      </div>

      {/* Store Announcements */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Store Announcements</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={13} className="text-emerald-600" /> New products
            <span className="text-[10px] text-[var(--admin-text-secondary)]">Notify when new fragrances launch</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-amber-600" /> Promotions
            <span className="text-[10px] text-[var(--admin-text-secondary)]">Notify about upcoming sales</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={13} className="text-red-600" /> Flash sales
            <span className="text-[10px] text-[var(--admin-text-secondary)]">Notify about limited-time offers</span>
          </div>
        </div>
      </div>

      {/* Admin Alerts */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">Admin Alerts</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle size={13} className="text-red-500" /> Low stock threshold
            <input
              type="number"
              value={settings?.lowStockThreshold ?? 5}
              onChange={(e) => handleToggleChange('lowStockThreshold', Number(e.target.value))}
              className="admin-input w-20 rounded-md border border-[var(--admin-border)] bg-[var(--admin-bg)] py-1.5 text-center font-mono font-bold"
            />
          </div>
          <div className="flex items-center gap-2">
            <Mail size={13} className="text-emerald-600" /> New order alerts
            <span className="text-[10px] text-[var(--admin-text-secondary)]">Receive instant alerts for new orders</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle size={13} className="text-amber-600" /> Payment alerts
            <span className="text-[10px] text-[var(--admin-text-secondary)]">Notify on payment status changes</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2 border-t border-[var(--border)]">
        {saving ? (
          <div>Saving...</div>
        ) : (
          <><Save size={14} /> Save Notification Settings</>
        )}
      </div>
    </div>
  )
}