'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, Mail, Save, Smartphone } from 'lucide-react'

type NotificationSettings = {
  emailEnabled: boolean
  pushEnabled: boolean
  updatedAt?: string
}

export default function NotificationSettingsForm({
  showToast,
}: {
  showToast: (msg: string, type?: 'success' | 'error') => void
}) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [changedFields, setChangedFields] = useState<Partial<NotificationSettings>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadNotificationSettings() {
    try {
      setLoading(true)
      const res = await fetch('/api/settings/notifications', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Failed to load notification settings', 'error')
        return
      }

      setSettings({
        emailEnabled: Boolean(data.emailEnabled),
        pushEnabled: Boolean(data.pushEnabled),
        updatedAt: data.updatedAt,
      })
      setChangedFields({})
    } catch {
      showToast('Error loading notification settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotificationSettings()
  }, [])

  function setField(field: keyof NotificationSettings, value: boolean) {
    setChangedFields((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (Object.keys(changedFields).length === 0) {
      showToast('No changes to save', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedFields),
      })
      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Failed to update notification settings', 'error')
        return
      }

      showToast('Notification settings updated successfully', 'success')
      await loadNotificationSettings()
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
        <p className="text-sm text-[var(--admin-text-muted)]">Loading notification settings…</p>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Failed to load notification settings.
      </div>
    )
  }

  const emailEnabled = changedFields.emailEnabled ?? settings.emailEnabled
  const pushEnabled = changedFields.pushEnabled ?? settings.pushEnabled

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <div className="rounded-full bg-[var(--accent-soft)] p-2">
          <Bell size={18} className="text-[var(--accent)]" />
        </div>
        <div>
          <p className="font-bold">Notifications</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--admin-text-muted)]">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Notification service is active</span>
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
          Customer notifications
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-4 transition hover:border-[var(--accent)]">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(event) => setField('emailEnabled', event.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--accent)]"
            />
            <span>
              <span className="flex items-center gap-2 font-semibold">
                <Mail size={15} /> Email updates
              </span>
              <span className="mt-1 block text-xs text-[var(--admin-text-muted)]">
                Send customer order confirmations and important updates by email.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-4 transition hover:border-[var(--accent)]">
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(event) => setField('pushEnabled', event.target.checked)}
              className="mt-1 h-4 w-4 accent-[var(--accent)]"
            />
            <span>
              <span className="flex items-center gap-2 font-semibold">
                <Smartphone size={15} /> Push updates
              </span>
              <span className="mt-1 block text-xs text-[var(--admin-text-muted)]">
                Send important customer updates to supported devices.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--admin-bg)] p-4">
        <h3 className="text-sm font-semibold">Store announcements</h3>
        <p className="mt-1 text-xs leading-5 text-[var(--admin-text-muted)]">
          Promotions, new fragrance announcements, and flash-sale messages are managed from the Marketing and Announcements areas.
        </p>
      </section>

      <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-4">
        <p className="text-xs text-[var(--admin-text-muted)]">
          {settings.updatedAt
            ? `Last updated ${new Date(settings.updatedAt).toLocaleString()}`
            : 'Ready to configure'}
        </p>
        <button
          type="submit"
          disabled={saving || Object.keys(changedFields).length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={15} />
          {saving ? 'Saving…' : 'Save notification settings'}
        </button>
      </div>
    </form>
  )
}
