'use client'
import { useState, useEffect } from 'react'
import { CreditCard, Save, Loader2 } from 'lucide-react'
import SecretInput from './SecretInput'

interface PaymentSettings {
  id: number
  bankAccountNumber: string | null
  bankRoutingNumber: string | null
  bankAccountName: string | null
  paymentProviderApiKey: string | null
  merchantId: string | null
  createdAt: string
  updatedAt: string
}

interface PaymentSettingsFormProps {
  showToast: (msg: string, type?: 'success' | 'error') => void
}

/**
 * PaymentSettingsForm Component
 * 
 * Manages payment configuration including bank details and payment provider API keys.
 * Features:
 * - Fetches current payment settings on mount
 * - Displays masked values in SecretInput components
 * - Tracks which fields have changed
 * - Only sends changed fields in PUT request
 * - Shows loading spinner during save
 * - Toast notification on success/error
 * - Clean, organized layout with proper labels
 */
export default function PaymentSettingsForm({ showToast }: PaymentSettingsFormProps) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state - track changed fields only
  const [changedFields, setChangedFields] = useState<Partial<PaymentSettings>>({})

  useEffect(() => {
    loadPaymentSettings()
  }, [])

  async function loadPaymentSettings() {
    try {
      setLoading(true)
      const res = await fetch('/api/settings/payment')
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to load payment settings', 'error')
      }
    } catch {
      showToast('Error loading payment settings', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleSecretChange(field: keyof PaymentSettings, value: string) {
    // Only track changes if value is not empty
    if (value.trim()) {
      setChangedFields(prev => ({
        ...prev,
        [field]: value
      }))
    } else {
      // Remove from changed fields if user clears the input
      const { [field]: _, ...rest } = changedFields
      setChangedFields(rest)
    }
  }

  function handleTextChange(field: keyof PaymentSettings, value: string) {
    // Track changes for non-secret fields
    if (settings && value !== settings[field]) {
      setChangedFields(prev => ({
        ...prev,
        [field]: value || null
      }))
    } else {
      // Remove from changed fields if reverted to original
      const { [field]: _, ...rest } = changedFields
      setChangedFields(rest)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Check if there are any changes
    if (Object.keys(changedFields).length === 0) {
      showToast('No changes to save', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings/payment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedFields)
      })

      if (res.ok) {
        showToast('Payment settings updated successfully', 'success')
        // Clear changed fields
        setChangedFields({})
        // Reload settings to get updated masked values
        await loadPaymentSettings()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update payment settings', 'error')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-sans font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-[var(--text-secondary)]" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">Loading payment settings...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
        <p className="text-xs text-red-500 font-medium">Failed to load payment settings</p>
      </div>
    )
  }

  const hasChanges = Object.keys(changedFields).length > 0

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <div className="rounded-full bg-amber-500/10 p-2">
          <CreditCard size={20} className="text-amber-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Payment Settings</h3>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Configure bank account details and payment provider credentials
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bank Account Details Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
            Bank Account Details
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecretInput
              label="Bank Account Number"
              name="bankAccountNumber"
              value={settings.bankAccountNumber || ''}
              onChange={(value) => handleSecretChange('bankAccountNumber', value)}
              placeholder="Enter bank account number"
              disabled={saving}
            />

            <SecretInput
              label="Bank Routing Number"
              name="bankRoutingNumber"
              value={settings.bankRoutingNumber || ''}
              onChange={(value) => handleSecretChange('bankRoutingNumber', value)}
              placeholder="Enter routing number"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="bankAccountName" className={lbl}>
              Bank Account Name
              <span className="text-[var(--text-muted)] font-normal ml-1">(Optional)</span>
            </label>
            <input
              id="bankAccountName"
              name="bankAccountName"
              type="text"
              defaultValue={settings.bankAccountName || ''}
              onChange={(e) => handleTextChange('bankAccountName', e.target.value)}
              placeholder="e.g., Jessy Luxury Business Account"
              disabled={saving}
              className={inp}
            />
          </div>
        </div>

        {/* Payment Provider Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
            Payment Provider
          </h4>

          <SecretInput
            label="API Key"
            name="paymentProviderApiKey"
            value={settings.paymentProviderApiKey || ''}
            onChange={(value) => handleSecretChange('paymentProviderApiKey', value)}
            placeholder="Enter payment provider API key"
            disabled={saving}
          />

          <div>
            <label htmlFor="merchantId" className={lbl}>
              Merchant ID
              <span className="text-[var(--text-muted)] font-normal ml-1">(Optional)</span>
            </label>
            <input
              id="merchantId"
              name="merchantId"
              type="text"
              defaultValue={settings.merchantId || ''}
              onChange={(e) => handleTextChange('merchantId', e.target.value)}
              placeholder="e.g., merch_123456"
              disabled={saving}
              className={`${inp} font-mono`}
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            <strong>Security Notice:</strong> Secret values are masked for security. Server-side encryption ensures your sensitive data is protected. Only enter new values when you need to update them.
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
          <div>
            {hasChanges && (
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                {Object.keys(changedFields).length} field{Object.keys(changedFields).length !== 1 ? 's' : ''} changed
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving || !hasChanges}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={14} />
                Save Payment Settings
              </>
            )}
          </button>
        </div>
      </form>

      {/* Last Updated Info */}
      {settings.updatedAt && (
        <div className="text-[10px] text-[var(--text-muted)] font-medium text-right">
          Last updated: {new Date(settings.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  )
}
