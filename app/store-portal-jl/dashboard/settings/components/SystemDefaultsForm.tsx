'use client'
import { useState, useEffect } from 'react'
import { Settings, Save, Loader2 } from 'lucide-react'

interface SystemDefaults {
  id: number
  defaultShippingZoneId: number | null
  defaultStoreLocationId: number | null
  defaultAcquisitionSource: string
  orderNumberPrefix: string
  createdAt: string
  updatedAt: string
}

interface ShippingZone {
  id: number
  name: string
}

interface StoreLocation {
  id: number
  name: string
  city: string
}

interface SystemDefaultsFormProps {
  showToast: (msg: string, type?: 'success' | 'error') => void
}

/**
 * SystemDefaultsForm Component
 * 
 * Manages system-wide default values including shipping zones, store locations,
 * acquisition sources, and order number prefixes.
 * Features:
 * - Fetches current system defaults on mount
 * - Fetches shipping zones for dropdown
 * - Fetches store locations for dropdown
 * - Tracks which fields have changed
 * - Only sends changed fields in PUT request
 * - Shows loading spinner during save
 * - Toast notification on success/error
 * - Clean, organized layout with proper labels
 */
export default function SystemDefaultsForm({ showToast }: SystemDefaultsFormProps) {
  const [settings, setSettings] = useState<SystemDefaults | null>(null)
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([])
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state - track changed fields only
  const [changedFields, setChangedFields] = useState<Partial<SystemDefaults>>({})

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      
      // Load system defaults
      const settingsRes = await fetch('/api/settings/system-defaults')
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        setSettings(data)
      } else {
        const error = await settingsRes.json()
        showToast(error.error || 'Failed to load system defaults', 'error')
      }

      // Load shipping zones
      const zonesRes = await fetch('/api/shipping')
      if (zonesRes.ok) {
        const zonesData = await zonesRes.json()
        setShippingZones(zonesData)
      }

      // Load store locations
      const locationsRes = await fetch('/api/settings/locations')
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json()
        setStoreLocations(locationsData)
      }
    } catch {
      showToast('Error loading system defaults', 'error')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectChange(field: keyof SystemDefaults, value: string) {
    if (!settings) return
    
    // Convert value to appropriate type
    let parsedValue: number | null = null
    if (value) {
      parsedValue = parseInt(value)
    }

    // Track changes
    if (parsedValue !== settings[field]) {
      setChangedFields(prev => ({
        ...prev,
        [field]: parsedValue
      }))
    } else {
      // Remove from changed fields if reverted to original
      const { [field]: _, ...rest } = changedFields
      setChangedFields(rest)
    }
  }

  function handleTextChange(field: keyof SystemDefaults, value: string) {
    if (!settings) return

    // Track changes for text fields
    if (value !== settings[field]) {
      setChangedFields(prev => ({
        ...prev,
        [field]: value
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
      const res = await fetch('/api/settings/system-defaults', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedFields)
      })

      if (res.ok) {
        showToast('System defaults updated successfully', 'success')
        // Clear changed fields
        setChangedFields({})
        // Reload settings to get updated values
        await loadData()
      } else {
        const error = await res.json()
        showToast(error.error || 'Failed to update system defaults', 'error')
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
          <p className="text-xs text-[var(--text-secondary)] font-medium">Loading system defaults...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
        <p className="text-xs text-red-500 font-medium">Failed to load system defaults</p>
      </div>
    )
  }

  const hasChanges = Object.keys(changedFields).length > 0
  const currentShippingZoneId = changedFields.defaultShippingZoneId !== undefined 
    ? changedFields.defaultShippingZoneId 
    : settings.defaultShippingZoneId
  const currentStoreLocationId = changedFields.defaultStoreLocationId !== undefined 
    ? changedFields.defaultStoreLocationId 
    : settings.defaultStoreLocationId
  const currentAcquisitionSource = changedFields.defaultAcquisitionSource !== undefined
    ? changedFields.defaultAcquisitionSource
    : settings.defaultAcquisitionSource
  const currentOrderPrefix = changedFields.orderNumberPrefix !== undefined
    ? changedFields.orderNumberPrefix
    : settings.orderNumberPrefix

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-6 shadow-sm">
      <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
        <div className="rounded-full bg-amber-500/10 p-2">
          <Settings size={20} className="text-amber-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">System Defaults</h3>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Configure system-wide default values for new operations
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Settings Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
            Order Settings
          </h4>

          <div>
            <label htmlFor="orderNumberPrefix" className={lbl}>
              Order Number Prefix
            </label>
            <input
              id="orderNumberPrefix"
              name="orderNumberPrefix"
              type="text"
              value={currentOrderPrefix}
              onChange={(e) => handleTextChange('orderNumberPrefix', e.target.value)}
              placeholder="e.g., JL"
              disabled={saving}
              className={`${inp} font-mono`}
            />
            <p className="mt-1 text-[10px] text-[var(--text-muted)] font-medium">
              Prefix used for all order numbers (e.g., JL-0001)
            </p>
          </div>
        </div>

        {/* Default Shipping Zone Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
            Default Shipping Zone
          </h4>

          <div>
            <label htmlFor="defaultShippingZoneId" className={lbl}>
              Select Shipping Zone
              <span className="text-[var(--text-muted)] font-normal ml-1">(Optional)</span>
            </label>
            <select
              id="defaultShippingZoneId"
              name="defaultShippingZoneId"
              value={currentShippingZoneId || ''}
              onChange={(e) => handleSelectChange('defaultShippingZoneId', e.target.value)}
              disabled={saving}
              className={inp}
            >
              <option value="">None</option>
              {shippingZones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-[var(--text-muted)] font-medium">
              Default shipping zone for new orders
            </p>
          </div>
        </div>

        {/* Default Store Location Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
            Default Store Location
          </h4>

          <div>
            <label htmlFor="defaultStoreLocationId" className={lbl}>
              Select Store Location
              <span className="text-[var(--text-muted)] font-normal ml-1">(Optional)</span>
            </label>
            <select
              id="defaultStoreLocationId"
              name="defaultStoreLocationId"
              value={currentStoreLocationId || ''}
              onChange={(e) => handleSelectChange('defaultStoreLocationId', e.target.value)}
              disabled={saving}
              className={inp}
            >
              <option value="">None</option>
              {storeLocations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name} - {location.city}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-[var(--text-muted)] font-medium">
              Default location for operations and fulfillment
            </p>
          </div>
        </div>

        {/* Customer Acquisition Section */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider border-b border-[var(--border)] pb-2">
            Customer Acquisition
          </h4>

          <div>
            <label htmlFor="defaultAcquisitionSource" className={lbl}>
              Default Acquisition Source
            </label>
            <input
              id="defaultAcquisitionSource"
              name="defaultAcquisitionSource"
              type="text"
              value={currentAcquisitionSource}
              onChange={(e) => handleTextChange('defaultAcquisitionSource', e.target.value)}
              placeholder="e.g., Manual"
              disabled={saving}
              className={inp}
            />
            <p className="mt-1 text-[10px] text-[var(--text-muted)] font-medium">
              Default source for new customer acquisitions
            </p>
          </div>
        </div>

        {/* Info Notice */}
        <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            <strong>Note:</strong> These defaults apply to newly created records only. Existing orders, customers, and operations remain unchanged.
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
                Save System Defaults
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
