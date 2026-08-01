'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app-error]', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-3xl border border-neutral-800 bg-[#141414] p-8 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">页面出错了</h2>
        <p className="text-sm text-neutral-400 mb-6">
          抱歉，页面加载时发生了错误。请尝试重新加载，如果问题持续请联系客服。
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF0050] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#d60043] transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          重新加载
        </button>
      </div>
    </main>
  )
}
