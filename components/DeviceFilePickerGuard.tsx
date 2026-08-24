'use client'

import { useEffect } from 'react'

/**
 * Some mobile browsers treat <input type="file" capture="environment">
 * as an instruction to launch the camera immediately. Storefront/admin
 * image uploads should let the user choose an existing photo first.
 *
 * This guard removes a forced capture hint from dynamically rendered
 * file inputs as a safety net while individual upload controls are fixed.
 */
export default function DeviceFilePickerGuard() {
  useEffect(() => {
    const removeForcedCapture = () => {
      document.querySelectorAll<HTMLInputElement>('input[type="file"][capture]').forEach((input) => {
        input.removeAttribute('capture')
      })
    }

    removeForcedCapture()

    const observer = new MutationObserver(removeForcedCapture)
    observer.observe(document.documentElement, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return null
}
