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
    } else if (res.status === 400) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Bad request — check server logs.')
      setLoading(false)
    } else {
      setError('Incorrect password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--admin-sidebar-bg)] p-6">
      <div className="grain pointer-events-none fixed inset-0 opacity-20" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold tracking-[0.2em] text-white">
            JESSY <span className="text-[#c9a35d]">LUXURY</span>
          </h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">
            Store Manager Portal
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#211c17] p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-2">
            <Lock size={15} className="text-[#c9a35d]" />
            <h2 className="text-sm font-bold text-stone-100">Enter admin password</h2>
          </div>

          {infoMessage && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-400">
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
                className="w-full rounded-lg border border-white/10 bg-black/30 py-3.5 pl-4 pr-12 text-sm font-medium text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-[#c9a35d]"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3.5 top-3.5 text-stone-500 transition hover:text-stone-200"
                aria-label={show ? 'Hide password' : 'Show password'}
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && (
              <p className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#c9a35d] py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-[#241a08] transition hover:brightness-110 disabled:opacity-60"
            >
              {loading ? 'Unlocking…' : 'Unlock Portal'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[10px] font-medium text-stone-500">
          Authorized staff only · All access is logged
        </p>
      </div>
    </div>
  )
}
