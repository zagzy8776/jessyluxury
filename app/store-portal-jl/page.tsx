'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff } from 'lucide-react'



export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [infoMessage, setInfoMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('message') === 'changed') {
        setInfoMessage('Password changed successfully. Please sign in again.')
      }
    }
    
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin-auth')
        const data = await res.json()
        if (data.authenticated) {
          router.replace('/store-portal-jl/dashboard')
        }
      } catch {
        // ignore
      }
    }
    checkAuth()
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    await new Promise((r) => setTimeout(r, 600))

    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.replace('/store-portal-jl/dashboard')
    } else if (res.status === 429) {
      setError('Too many login attempts. Please try again later.')
      setLoading(false)
    } else {
      setError('Incorrect password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6 text-[var(--text-primary)]">
      <div className="grain fixed inset-0 opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold tracking-widest text-[var(--text-primary)]">
            JESSY <span className="text-amber-500">LUXURY</span>
          </h1>
          <p className="mt-1 text-xs text-[var(--text-secondary)] font-bold tracking-wider">STORE MANAGER PORTAL</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--card-bg)] p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Enter admin password</h2>
          </div>

          {infoMessage && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 mb-4 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {infoMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoFocus
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] py-3.5 pl-4 pr-12 text-sm font-medium text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-500 shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3.5 top-3.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition"
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-500 font-bold flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 py-3.5 text-xs font-bold tracking-wider text-stone-950 transition hover:bg-amber-400 shadow-md shadow-amber-500/10 disabled:opacity-60"
            >
              {loading ? 'UNLOCKING…' : 'UNLOCK PORTAL'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
