import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-3xl border border-neutral-800 bg-[#141414] p-8 text-center">
        <div className="text-6xl font-black gradient-text mb-4">404</div>
        <h2 className="text-xl font-bold mb-2">页面未找到</h2>
        <p className="text-sm text-neutral-400 mb-6">
          您访问的页面不存在或已被移除。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF0050] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#d60043] transition-colors"
        >
          <Home className="h-4 w-4" />
          返回首页
        </Link>
      </div>
    </main>
  )
}
