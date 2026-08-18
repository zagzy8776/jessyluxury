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
        await OneSignal.init({
          appId,
          safari_web_id: undefined, // Add Safari Push ID if you have one
          notifyButton: {
            enable: false, // We control the bell ourselves in the admin UI
          },
          allowLocalhostAsSecureOrigin: true, // Allow testing on localhost
        })
      })
    }
    document.head.appendChild(script)
  }, [])

  return null
}
