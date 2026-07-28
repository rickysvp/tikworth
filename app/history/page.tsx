import Link from 'next/link'
import { findRecentEvaluations } from '@/lib/db'
import { ArrowLeft, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const evaluations = await findRecentEvaluations(50)

  return (
    <main className="min-h-screen mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-[#FF0050] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回评估
        </Link>
        <h1 className="mt-4 text-3xl font-bold">评估历史</h1>
        <p className="mt-2 text-neutral-500">最近评估过的 TikTok 账号，同账号 24 小时内重复评估不扣额度。</p>
      </div>

      {evaluations.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-neutral-600 mb-4" />
          <p className="text-neutral-400">暂无评估记录</p>
          <Link href="/" className="mt-4 inline-block text-[#FF0050] hover:underline">
            去评估第一个账号
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map(item => (
            <Link
              key={item.username}
              href={`/?u=${item.username}`}
              className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-[#141414] p-5 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                {item.avatar ? (
                  <img src={item.avatar} alt={item.nickname} className="h-12 w-12 rounded-full border border-neutral-700" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-neutral-800 flex items-center justify-center font-bold">
                    {item.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold">{item.nickname}</div>
                  <div className="text-sm text-neutral-500">@{item.username}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold tabular-nums">{item.score}</div>
                <div
                  className="text-sm font-semibold"
                  style={{ color: tierColor(item.tier) }}
                >
                  {item.tier} 级
                </div>
                {item.brandPotential?.brandScore ? (
                  <div className="text-xs text-neutral-500 mt-1">品牌分 {item.brandPotential.brandScore}</div>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}

function tierColor(tier: string): string {
  if (tier === 'S' || tier === 'A') return '#00F2EA'
  if (tier === 'B') return '#22c55e'
  if (tier === 'C') return '#f59e0b'
  return '#ef4444'
}
