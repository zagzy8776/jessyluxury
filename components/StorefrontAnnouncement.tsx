'use client'
import { useState, useEffect } from 'react'
import { Megaphone, X, Bell, Sparkles, ArrowRight } from 'lucide-react'

export default function StorefrontAnnouncement() {
  const [announcement, setAnnouncement] = useState<any>(null)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [showPushPrompt, setShowPushPrompt] = useState(false)
  const [pathname, setPathname] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPathname(window.location.pathname)

    // 1. Fetch active announcement
    const fetchActiveAnnouncement = async () => {
      try {
        const res = await fetch('/api/store-announcements/active')
        if (res.ok) {
          const data = await res.json()
          if (data && data.id) {
            // Check dismissal in localStorage
            const dismissed = localStorage.getItem(`jessy_announcement_dismissed_${data.id}`)
            if (!dismissed) {
              setAnnouncement(data)
              setShowAnnouncement(true)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load active announcement:', err)
      }
    }

    // 2. Check Push Notification Status
    const checkPushStatus = () => {
      // Delay push prompt slightly to let user browse
      setTimeout(() => {
        const dismissed = localStorage.getItem('jessy_push_prompt_dismissed')
        if (dismissed) return

        const OneSignal = (window as any).OneSignal
        if (OneSignal && OneSignal.Notifications) {
          if (OneSignal.Notifications.permission === 'default') {
            setShowPushPrompt(true)
          }
        } else {
          // If OneSignal not loaded yet, retry shortly
          const checkInterval = setInterval(() => {
            const os = (window as any).OneSignal
            if (os && os.Notifications) {
              clearInterval(checkInterval)
              if (os.Notifications.permission === 'default') {
                setShowPushPrompt(true)
              }
            }
          }, 3000)
          setTimeout(() => clearInterval(checkInterval), 15000)
        }
      }, 8000)
    }

    // Run checks if not on admin dashboard or checkout paths
    const currentPath = window.location.pathname
    const isExcludedPath =
      currentPath.startsWith('/store-portal-jl') ||
      currentPath.startsWith('/checkout') ||
      currentPath.startsWith('/cart')

    if (!isExcludedPath) {
      fetchActiveAnnouncement()
      checkPushStatus()
    }
  }, [])

  const handleDismissAnnouncement = () => {
    if (announcement) {
      localStorage.setItem(`jessy_announcement_dismissed_${announcement.id}`, 'true')
      setShowAnnouncement(false)
    }
  }

  const handleDismissPushPrompt = () => {
    localStorage.setItem('jessy_push_prompt_dismissed', 'true')
    setShowPushPrompt(false)
  }

  const handleAllowPush = () => {
    setShowPushPrompt(false)
    localStorage.setItem('jessy_push_prompt_dismissed', 'true')
    if (typeof (window as any).triggerPushSubscriptionPrompt === 'function') {
      ;(window as any).triggerPushSubscriptionPrompt()
    }
  }

  // Do not render anything on admin or checkout paths
  if (
    pathname.startsWith('/store-portal-jl') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/cart')
  ) {
    return null
  }

  return (
    <div className="pointer-events-none fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 lg:bottom-6">
      {/* 1. Push Subscription opt-in prompter */}
      {showPushPrompt && (
        <div className="animate-slide-up pointer-events-auto overflow-hidden rounded-2xl border border-[var(--champagne)]/30 bg-[var(--charcoal)]/95 text-white shadow-2xl backdrop-blur-md">
          <div className="flex gap-3 p-4">
            <div className="h-fit shrink-0 rounded-full border border-[var(--champagne)]/40 bg-white/5 p-2 text-[var(--champagne)]">
              <Bell size={17} />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--champagne)]">
                  Stay in the know
                </h4>
                <button
                  onClick={handleDismissPushPrompt}
                  aria-label="Dismiss"
                  className="-mr-1 -mt-1 rounded-full p-1 text-stone-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-300">
                Be first to hear about new fragrances, private offers and flash sales.
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  onClick={handleAllowPush}
                  className="rounded-full bg-[var(--champagne)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#241a08] transition hover:brightness-110"
                >
                  Notify me
                </button>
                <button
                  onClick={handleDismissPushPrompt}
                  className="px-2 py-2 text-[10px] font-semibold text-stone-400 transition hover:text-white"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Store Marketing Announcement banner */}
      {showAnnouncement && announcement && (
        <div className="animate-slide-up pointer-events-auto overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card-bg)]/95 shadow-2xl backdrop-blur-md">
          {announcement.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="max-h-36 w-full object-cover"
            />
          )}
          <div className="flex gap-3 p-4">
            <div className="h-fit shrink-0 rounded-full border border-[var(--accent)]/20 bg-[var(--accent-soft)] p-2 text-[var(--accent)]">
              {announcement.type === 'PROMOTION' ? <Sparkles size={16} /> : <Megaphone size={16} />}
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                  {String(announcement.type).replace('_', ' ')}
                </p>
                {announcement.dismissible && (
                  <button
                    onClick={handleDismissAnnouncement}
                    aria-label="Dismiss announcement"
                    className="-mr-1 -mt-1 rounded-full p-1 text-[var(--text-muted)] transition hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <h3 className="font-display text-base font-bold leading-snug text-[var(--text-primary)]">
                {announcement.title}
              </h3>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{announcement.message}</p>

              {announcement.actionLabel && announcement.actionUrl && (
                <a
                  href={announcement.actionUrl}
                  className="group mt-1 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[var(--accent-strong)]"
                >
                  {announcement.actionLabel}
                  <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
