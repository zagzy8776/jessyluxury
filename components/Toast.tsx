'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl backdrop-blur-xl animate-slide-up ${
        type === 'success'
          ? 'bg-stone-900/90 backdrop-blur-xl border-amber-500/40 text-amber-200'
          : 'bg-stone-900/90 backdrop-blur-xl border-red-500/40 text-red-300'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle size={18} className="text-green-400 shrink-0" />
      ) : (
        <AlertCircle size={18} className="text-red-400 shrink-0" />
      )}
      <p className="text-sm font-medium">{message}</p>
      <button onClick={onClose} className="ml-2 text-stone-500 hover:text-white transition">
        <X size={15} />
      </button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type })
  }

  const clearToast = () => setToast(null)

  return { toast, showToast, clearToast }
}
