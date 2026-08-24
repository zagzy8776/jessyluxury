'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import PromoRewardPopup, { type PromoRewardConfig } from './PromoRewardPopup'

/**
 * Client-side wrapper that fetches promo config from API
 * and renders PromoRewardPopup with that config
 */
export default function PromoRewardWrapper() {
  const pathname = usePathname()
  const [config, setConfig] = useState<PromoRewardConfig | null>(null)
  const [loading, setLoading] = useState(true)

  // Don't show popup on admin/staff pages
  const isAdminPage = pathname?.startsWith('/store-portal-jl') || 
                      pathname?.startsWith('/admin') ||
                      pathname?.startsWith('/api')
  
  if (isAdminPage) return null

  useEffect(() => {
    fetchConfig()
  }, [])

  async function fetchConfig() {
    try {
      // Add cache-busting query param to ensure fresh config
      const res = await fetch(`/api/settings/promo-popup?_t=${Date.now()}`)
      const data = await res.json()
      
      // Check if expired on client side as well
      const isExpiredNow = data.expiryDate && new Date(data.expiryDate) < new Date()
      
      // Only set config if enabled and not expired
      if (data && data.enabled && !data.isExpired && !isExpiredNow) {
        setConfig({
          enabled: data.enabled,
          title: data.title,
          message: data.message,
          discountLabel: data.discountLabel,
          couponCode: data.couponCode,
          ctaText: data.ctaText,
          displayDelay: data.displayDelay,
          minPurchase: data.minPurchase,
          expiryDate: data.expiryDate,
          displayFreqHrs: data.displayFreqHrs,
        })
      }
    } catch (error) {
      console.error('[PromoRewardWrapper] Failed to fetch config:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything while loading or if no config
  if (loading || !config) return null

  return <PromoRewardPopup config={config} />
}
