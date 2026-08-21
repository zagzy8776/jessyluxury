'use client'
import { useState, useEffect } from 'react'
import { Users, Plus, Edit2, Trash2, XCircle } from 'lucide-react'

interface StaffAccount {
  id: number
  name: string
  email: string
  role: 'Owner' | 'Manager' | 'Fulfillment' | 'Catalog'
  permissions: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

interface StaffAccountsManagerProps {
  showToast: (msg: string, type?: 'success' | 'error') => void
}

const VALID_ROLES = ['Owner', 'Manager', 'Fulfillment', 'Catalog'] as const
const VALID_PERMISSIONS = [
  'orders',
  'products',
  'customers',
  'analytics',
  'settings',
  'catalog',
  'fulfillment',
  'notifications',
  'marketing',
  'shipping'
] as const

export default function StaffAccountsManager({ showToast }: StaffAccountsManagerProps) {
  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Manager' as StaffAccount['role'],
    permissions: [] as string[],
    active: true,
    password: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadStaffAccounts()
  }, [])

  async function loadStaffAccounts() {
    try {
      setLoading(true)
      const res = await fetch('/api/settings/staff-accounts')
      if (res.ok) {
        const data = await res.json()
        setStaffAccounts(data || [])
      } else {
        showToast('Failed to load staff accounts', 'error')
      }
    } catch {
      showToast('Error loading staff accounts', 'error')
    } finally {
      setLoading(false)
    }
  }

  function openCreateDialog() {
    setDialogMode('create')
    setFormData({
      name: '',
      email: '',
      role: 'Manager',
      permissions: [],
      active: true,
      password: ''
    })
    setEditingId(null)
    setShowDialog(true)
  }

  function openEditDialog(account: StaffAccount) {
    setDialogMode('edit')
    setFormData({
      name: account.name,
      email: account.email,
      role: account.role,
      permissions: [...account.permissions],
      active: account.active,
      password: ''
    })
    setEditingId(account.id)
    setShowDialog(true)
  }

  function closeDialog() {
    setShowDialog(false)
    setFormData({
      name: '',
      email: '',
      role: 'Manager',
      permissions: [],
      active: true,
      password: ''
    })
    setEditingId(null)
  }

  function togglePermission(permission: string) {
    if (formData.permissions.includes(permission)) {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => p !== permission)
      })
    } else {
      setFormData({
        ...formData,
        permissions: [...formData.permissions, permission]
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Client-side validation
    if (!formData.name.trim()) {
      showToast('Staff name is required', 'error')
      return
    }
    if (!formData.email.trim()) {
      showToast('Email is required', 'error')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast('Invalid email format', 'error')
      return
    }
    if (formData.permissions.length === 0) {
      showToast('At least one permission is required', 'error')
      return
    }
    if (dialogMode === 'create' && formData.password && formData.password.length < 12) {
      showToast('Password must be at least 12 characters long', 'error')
      return
    }

    setSubmitting(true)
    try {
      const url = dialogMode === 'create'
        ? '/api/settings/staff-accounts'
        : `/api/settings/staff-accounts/${editingId}`
      
      const method = dialogMode === 'create' ? 'POST' : 'PUT'
      
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        permissions: formData.permissions,
        active: formData.active
      }

      // Only include password if provided
      if (formData.password) {
        payload.password = formData.password
      }
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        showToast(
          dialogMode === 'create' ? 'Staff account created successfully' : 'Staff account updated successfully',
          'success'
        )
        closeDialog()
        await loadStaffAccounts()
      } else {
        const data = await res.json()
        showToast(data.error || 'Operation failed', 'error')
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(staffId: number) {
    setDeleting(true)
    try {
      const res = await fetch(`/api/settings/staff-accounts/${staffId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast('Staff account deleted successfully', 'success')
        setDeleteConfirm(null)
        await loadStaffAccounts()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to delete staff account', 'error')
        setDeleteConfirm(null)
      }
    } catch {
      showToast('An unexpected error occurred', 'error')
      setDeleteConfirm(null)
    } finally {
      setDeleting(false)
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'Owner':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
      case 'Manager':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
      case 'Fulfillment':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30'
      case 'Catalog':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
      default:
        return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30'
    }
  }

  function formatPermissions(permissions: string[]) {
    if (permissions.length === 0) return 'No permissions'
    if (permissions.length <= 3) {
      return permissions.join(', ')
    }
    return `${permissions.slice(0, 3).join(', ')} +${permissions.length - 3} more`
  }

  const inp = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] text-xs outline-none transition focus:border-amber-500 font-sans font-medium shadow-sm'
  const lbl = 'block text-[11px] font-bold text-[var(--text-secondary)] mb-1 uppercase tracking-wider'

  // Note: Self-editing restrictions are enforced server-side
  // The UI shows hints, but the API will return 403 errors for violations

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm">
        <p className="text-xs text-[var(--text-secondary)] font-medium">Loading staff accounts...</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Staff Accounts &amp; Permissions</h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium">Grant individual staff accounts access to specific modules</p>
          </div>
          <button
            onClick={openCreateDialog}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10"
          >
            <Plus size={14} /> Add Staff
          </button>
        </div>

        {staffAccounts.length === 0 ? (
          <div className="py-12 text-center">
            <Users size={48} className="mx-auto text-[var(--text-muted)] mb-3" />
            <p className="text-sm font-bold text-[var(--text-primary)] mb-1">No staff accounts yet</p>
            <p className="text-xs text-[var(--text-secondary)] font-medium mb-4">
              Create your first staff account to start managing permissions
            </p>
            <button
              onClick={openCreateDialog}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10"
            >
              <Plus size={14} /> Add First Staff Account
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--text-primary)]">
              <thead className="border-b border-[var(--border)] bg-[var(--table-header-bg)] uppercase tracking-wider text-[var(--text-secondary)] text-[11px] font-bold">
                <tr>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Permissions</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {staffAccounts.map((staff) => (
                  <tr key={staff.id} className="hover:bg-[var(--table-row-hover)] transition">
                    <td className="py-3.5 px-4 font-bold text-[var(--text-primary)]">
                      {staff.name}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)] font-mono font-medium">{staff.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${getRoleBadgeColor(staff.role)}`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)] font-medium">
                      {formatPermissions(staff.permissions)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {staff.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-0.5 text-[10px] font-bold border border-red-500/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditDialog(staff)}
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition p-2"
                          title="Edit staff account"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(staff.id)}
                          className="text-red-500 hover:text-red-600 transition p-2"
                          title="Delete staff account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl my-8">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border)] pb-3">
              {dialogMode === 'create' ? 'Add New Staff Account' : 'Edit Staff Account'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Staff Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className={inp}
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className={lbl}>Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. john@example.com"
                    className={`${inp} font-mono`}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as StaffAccount['role'] })}
                    className={inp}
                    disabled={submitting}
                  >
                    {VALID_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={lbl}>Password {dialogMode === 'edit' && '(Optional)'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={dialogMode === 'edit' ? 'Leave blank to keep current' : 'Min 12 characters'}
                    className={inp}
                    disabled={submitting}
                  />
                  <p className="mt-1 text-[10px] text-[var(--text-muted)] font-medium">
                    {dialogMode === 'create' ? 'Optional: Staff can set password on first login' : 'Leave blank to keep current password'}
                  </p>
                </div>
              </div>

              <div>
                <label className={lbl}>Permissions *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {VALID_PERMISSIONS.map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center gap-2 rounded-xl bg-[var(--bg-primary)] p-3 border border-[var(--border)]"
                    >
                      <input
                        type="checkbox"
                        id={`permission-${permission}`}
                        checked={formData.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="w-4 h-4 rounded border-[var(--border)] text-amber-500 focus:ring-amber-500"
                        disabled={submitting}
                      />
                      <label
                        htmlFor={`permission-${permission}`}
                        className="text-xs font-medium text-[var(--text-primary)] cursor-pointer capitalize"
                      >
                        {permission}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-[var(--bg-primary)] p-3 border border-[var(--border)]">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border)] text-amber-500 focus:ring-amber-500"
                  disabled={submitting}
                />
                <label htmlFor="active" className="text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                  Account Active
                  <span className="block text-[10px] text-[var(--text-muted)] font-normal mt-0.5">
                    Inactive accounts cannot log in to the system
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={submitting}
                  className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/10 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : (dialogMode === 'create' ? 'Create Account' : 'Save Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-500/10 p-2">
                <XCircle size={20} className="text-red-500" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Delete Staff Account?</h3>
            </div>

            <p className="text-xs text-[var(--text-secondary)] font-medium mb-4">
              Are you sure you want to delete this staff account? This action cannot be undone and the staff member will lose all access to the system.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-600 transition shadow-md shadow-red-500/10 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
