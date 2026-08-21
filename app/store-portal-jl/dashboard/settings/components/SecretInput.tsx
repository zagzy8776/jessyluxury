'use client'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface SecretInputProps {
  label: string
  name: string
  value: string // Masked value from server (e.g., "ab••••••••9a21")
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

/**
 * SecretInput Component
 * 
 * Displays masked values from the server and allows users to enter new secret values.
 * Features:
 * - Shows masked value as placeholder
 * - Eye icon toggle for visibility
 * - Clear visual indication when user is editing (replacing masked value)
 * - Optional field indicator
 */
export default function SecretInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false
}: SecretInputProps) {
  const [showSecret, setShowSecret] = useState(false)
  const [localValue, setLocalValue] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    setIsEditing(newValue.length > 0)
    onChange(newValue)
  }

  const toggleVisibility = () => {
    setShowSecret(!showSecret)
  }

  const displayPlaceholder = value || placeholder || 'Enter secret value'
  const inputType = showSecret ? 'text' : 'password'

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 pr-12 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-mono font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'

  return (
    <div>
      <label htmlFor={name} className={lbl}>
        {label} {required && <span className="text-red-500">*</span>}
        {!required && <span className="text-[var(--text-muted)] font-normal ml-1">(Optional)</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          value={localValue}
          onChange={handleChange}
          placeholder={displayPlaceholder}
          disabled={disabled}
          className={inp}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition p-1 disabled:opacity-50"
          title={showSecret ? 'Hide secret' : 'Show secret'}
        >
          {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {isEditing && (
        <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
          ⚠ Entering a new value will replace the existing secret
        </p>
      )}
      {value && !isEditing && (
        <p className="mt-1 text-[10px] text-[var(--text-muted)] font-medium">
          Current value is masked for security. Enter a new value to replace it.
        </p>
      )}
    </div>
  )
}
