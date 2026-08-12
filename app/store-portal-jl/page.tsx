'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'

const SESSION_KEY = 'jl_admin_session'
const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'jessyluxuryadmin2024'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const session = localStorage.getItem(SESSION_KEY)
      if (session === 'authenticated') {
        router.replace('/store-portal-jl/dashboard')
      }
    }
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Small artificial delay for security feel
    await new Promise((r) => setTimeout(r, 600))

    // Validate against env var OR a fixed fallback
    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      localStorage.setItem(SESSION_KEY, 'authenticated')
      router.replace('/store-portal-jl/dashboard')
    } else {
      setError('Incorrect password. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6">
      {/* Background grain */}
      <div className="grain fixed inset-0 opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-5">
            <Sparkles size={28} className="text-amber-400" />
          </div>
          <h1 className="font-display text-2xl tracking-widest text-stone-100">
            JESSY <span className="text-amber-400">LUXURY</span>
          </h1>
          <p className="mt-2 text-xs text-stone-500 tracking-wider">STORE MANAGER PORTAL</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-stone-800 bg-stone-900/80 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={15} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-stone-200">Enter your admin password</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoFocus
                className="w-full rounded-xl border border-stone-700 bg-stone-950 py-3.5 pl-4 pr-12 text-sm text-stone-200 outline-none transition placeholder:text-stone-600 focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3.5 top-3.5 text-stone-500 hover:text-stone-300 transition"
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-stone-950 transition hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-stone-950/40 border-t-stone-950 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  Enter Dashboard
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-stone-600">
          This is a private area. Unauthorised access is prohibited.
        </p>
      </div>
    </div>
  )
}
