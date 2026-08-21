'use client'

import { useEffect } from 'react'

export default function OneSignalInit() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    if (!appId || appId === 'YOUR_APP_ID_HERE') return
    if (typeof window === 'undefined') return

    // Load OneSignal SDK script dynamically
    const script = document.createElement('script')
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    script.defer = true
    script.onload = () => {
      ;(window as any).OneSignalDeferred = (window as any).OneSignalDeferred || []
      ;(window as any).OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          await OneSignal.init({
            appId,
            safari_web_id: undefined,
            notifyButton: {
              enable: false,
            },
            allowLocalhostAsSecureOrigin: true,
          })

          // Helper function to sync push token with our backend database
          const syncPushSubscription = async (token: string) => {
            try {
              await fetch('/api/push-subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pushToken: token, deviceType: 'WebBrowser' }),
              })
            } catch (err) {
              console.warn('[OneSignal] Failed to sync push subscription to DB:', err)
            }
          }

          // Initial sync if already subscribed
          if (OneSignal.User?.pushSubscription?.id) {
            syncPushSubscription(OneSignal.User.pushSubscription.id)
          }

          // Listen for subscription changes
          OneSignal.User?.pushSubscription?.addEventListener('change', (event: any) => {
            if (event.current?.id) {
              syncPushSubscription(event.current.id)
            }
          })

          // Expose trigger globally so our custom storefront prompter can invoke it
          ;(window as any).triggerPushSubscriptionPrompt = async () => {
            try {
              console.log('[OneSignal] User initiated push subscription request')
              await OneSignal.Notifications.requestPermission()
              
              // If permission granted, register and sync immediately
              if (OneSignal.User?.pushSubscription?.id) {
                await syncPushSubscription(OneSignal.User.pushSubscription.id)
              }
            } catch (err) {
              console.error('[OneSignal] Error requesting permission:', err)
            }
          }
        } catch (err) {
          console.warn('[OneSignal] Initialization skipped or failed:', err)
        }
      })
    }
    document.head.appendChild(script)
  }, [])

  return null
}
