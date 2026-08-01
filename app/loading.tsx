import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F2EA]" />
        <p className="text-sm text-neutral-500">加载中...</p>
      </div>
    </main>
  )
}
