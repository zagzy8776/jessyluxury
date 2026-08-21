'use client'
import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'

interface BusinessProfile {
  name: string
  phone: string
  email: string
  address: string
  hours: string
  taxId: string
}

interface BusinessProfileFormProps {
  showToast: (msg: string, type?: 'success' | 'error') => void
}

interface ValidationErrors {
  name?: string
  phone?: string
  email?: string
  address?: string
  hours?: string
}

export default function BusinessProfileForm({ showToast }: BusinessProfileFormProps) {
  const [profile, setProfile] = useState<BusinessProfile>({
    name: '',
    phone: '',
    email: '',
    address: '',
    hours: '',
    taxId: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Load business profile on mount
  useEffect(() => {
    async function loadBusinessProfile() {
      setInitialLoading(true)
      try {
        const res = await fetch('/api/settings/business-profile')
        if (res.ok) {
          const data = await res.json()
          setProfile({
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            hours: data.hours || '',
            taxId: data.taxId || '',
          })
        } else {
          const data = await res.json()
          showToast(data.error || 'Failed to load business profile', 'error')
        }
      } catch (error) {
        console.error('Failed to load business profile:', error)
        showToast('Failed to load business profile', 'error')
      } finally {
        setInitialLoading(false)
      }
    }
    loadBusinessProfile()
  }, [showToast])

  // Client-side validation (mirrors server-side validation for UX)
  function validateField(name: string, value: string): string | undefined {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Business name is required'
        break
      case 'email':
        if (!value.trim()) return 'Email is required'
        // Email format validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email format'
        }
        break
      case 'phone':
        if (!value.trim()) return 'Phone is required'
        // Phone format validation (basic international format check)
        if (!/^\+?[1-9]\d{1,14}$/.test(value.replace(/[\s-()]/g, ''))) {
          return 'Invalid phone format'
        }
        break
      case 'address':
        if (!value.trim()) return 'Address is required'
        break
      case 'hours':
        if (!value.trim()) return 'Business hours is required'
        break
    }
    return undefined
  }

  // Validate all fields
  function validateForm(): boolean {
    const errors: ValidationErrors = {}
    
    const nameError = validateField('name', profile.name)
    if (nameError) errors.name = nameError
    
    const emailError = validateField('email', profile.email)
    if (emailError) errors.email = emailError
    
    const phoneError = validateField('phone', profile.phone)
    if (phoneError) errors.phone = phoneError
    
    const addressError = validateField('address', profile.address)
    if (addressError) errors.address = addressError
    
    const hoursError = validateField('hours', profile.hours)
    if (hoursError) errors.hours = hoursError

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  function handleChange(field: keyof BusinessProfile, value: string) {
    setProfile({ ...profile, [field]: value })
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors({ ...validationErrors, [field]: undefined })
    }
  }

  function handleBlur(field: string) {
    setTouched({ ...touched, [field]: true })
    
    // Validate field on blur
    const error = validateField(field, profile[field as keyof BusinessProfile])
    if (error) {
      setValidationErrors({ ...validationErrors, [field]: error })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      address: true,
      hours: true,
    })

    // Validate form before submission
    if (!validateForm()) {
      showToast('Please fix validation errors before submitting', 'error')
      return
    }

    // Prevent duplicate submissions
    if (loading) return
    
    setLoading(true)

    try {
      const res = await fetch('/api/settings/business-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      const data = await res.json()

      if (res.ok) {
        showToast('Business profile updated successfully!')
        // Clear validation errors on success
        setValidationErrors({})
      } else {
        // Handle server validation errors
        if (data.error) {
          showToast(data.error, 'error')
          
          // Map server error to field if possible
          const errorMsg = data.error.toLowerCase()
          if (errorMsg.includes('name')) {
            setValidationErrors({ ...validationErrors, name: data.error })
          } else if (errorMsg.includes('email')) {
            setValidationErrors({ ...validationErrors, email: data.error })
          } else if (errorMsg.includes('phone')) {
            setValidationErrors({ ...validationErrors, phone: data.error })
          } else if (errorMsg.includes('address')) {
            setValidationErrors({ ...validationErrors, address: data.error })
          } else if (errorMsg.includes('hours')) {
            setValidationErrors({ ...validationErrors, hours: data.error })
          }
        }
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      showToast('Failed to save profile', 'error')
    } finally {
      setLoading(false)
    }
  }

  const inp = 'w-full rounded-xl border bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-sans font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'
  const errorClass = 'border-red-500 focus:border-red-500'
  const errorText = 'text-red-500 text-[10px] mt-1 font-medium'

  if (initialLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-[var(--text-secondary)] font-medium">Loading business profile...</div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
      <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-4">
        General Store Contact
      </h3>
      
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <label className={lbl}>Store Brand Name *</label>
          <input
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            className={`${inp} ${touched.name && validationErrors.name ? errorClass : 'border-[var(--border)]'}`}
            required
            disabled={loading}
          />
          {touched.name && validationErrors.name && (
            <p className={errorText}>{validationErrors.name}</p>
          )}
        </div>
        
        <div>
          <label className={lbl}>Business Email *</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            className={`${inp} ${touched.email && validationErrors.email ? errorClass : 'border-[var(--border)]'}`}
            required
            disabled={loading}
          />
          {touched.email && validationErrors.email && (
            <p className={errorText}>{validationErrors.email}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <label className={lbl}>Business Phone *</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            className={`${inp} ${touched.phone && validationErrors.phone ? errorClass : 'border-[var(--border)]'}`}
            required
            disabled={loading}
            placeholder="+234 800 000 0000"
          />
          {touched.phone && validationErrors.phone && (
            <p className={errorText}>{validationErrors.phone}</p>
          )}
        </div>
        
        <div>
          <label className={lbl}>Business Hours *</label>
          <input
            value={profile.hours}
            onChange={(e) => handleChange('hours', e.target.value)}
            onBlur={() => handleBlur('hours')}
            className={`${inp} ${touched.hours && validationErrors.hours ? errorClass : 'border-[var(--border)]'}`}
            required
            disabled={loading}
            placeholder="Mon – Sat, 9am – 7pm"
          />
          {touched.hours && validationErrors.hours && (
            <p className={errorText}>{validationErrors.hours}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="col-span-2">
          <label className={lbl}>Physical Business Address *</label>
          <input
            value={profile.address}
            onChange={(e) => handleChange('address', e.target.value)}
            onBlur={() => handleBlur('address')}
            className={`${inp} ${touched.address && validationErrors.address ? errorClass : 'border-[var(--border)]'}`}
            required
            disabled={loading}
          />
          {touched.address && validationErrors.address && (
            <p className={errorText}>{validationErrors.address}</p>
          )}
        </div>
      </div>

      <div>
        <label className={lbl}>Tax ID (Optional)</label>
        <input
          value={profile.taxId}
          onChange={(e) => handleChange('taxId', e.target.value)}
          className={`${inp} border-[var(--border)]`}
          placeholder="e.g. RC123456"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={15} /> {loading ? 'Saving...' : 'Save General Info'}
        </button>
      </div>
    </form>
  )
}
