'use client'

import { useState, useCallback } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

let toastId = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'error') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  return { toast, toasts, dismiss }
}

export function ToastContainer({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-start gap-2 rounded-xl border p-3 shadow-lg backdrop-blur-sm animate-fade-in-up ${
            t.type === 'success'
              ? 'border-green-900/40 bg-green-950/80 text-green-200'
              : 'border-red-900/40 bg-red-950/80 text-red-200'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
          )}
          <span className="text-sm flex-1">{t.message}</span>
          <button onClick={() => dismiss(t.id)} className="text-neutral-500 hover:text-white transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
