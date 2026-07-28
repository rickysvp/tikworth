'use client'

import { PeerBenchmark } from '@/types'
import { Users } from 'lucide-react'

export function PeerBenchmarkSection({ benchmark }: { benchmark: PeerBenchmark }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">同业对标</h3>
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-3xl font-bold tabular-nums">{benchmark.percentile}%</div>
          <div className="text-xs text-neutral-500 mt-1">同体量百分位</div>
        </div>
        <div className="flex items-center justify-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-center">
            <div className="text-lg font-semibold">{benchmark.peerGroupSize}</div>
            <div className="text-xs text-neutral-500 mt-1">同体量分组</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm font-medium text-neutral-300 mb-3">关键指标对比</div>
        <div className="space-y-2">
          {benchmark.benchmarks.map((b, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 text-sm rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
              <span className="text-neutral-400">{b.metric}</span>
              <span className={b.status === 'above' ? 'text-green-400' : b.status === 'below' ? 'text-red-400' : 'text-amber-400'}>{b.userValue}</span>
              <span className="text-neutral-500">均值 {b.peerAvg}</span>
              <span className="text-neutral-500">Top10% {b.peerTop10}</span>
            </div>
          ))}
        </div>
      </div>

      {benchmark.similarCreators.length > 0 && (
        <div>
          <div className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> 相似创作者</div>
          <div className="space-y-2">
            {benchmark.similarCreators.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
                <div className="flex items-center gap-3">
                  <img src={c.avatarUrl} alt={c.name} className="h-8 w-8 rounded-full" />
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-neutral-500">{c.handle}</div>
                  </div>
                </div>
                <div className="text-right text-xs text-neutral-400">
                  <div>{c.followers.toLocaleString()} 粉丝</div>
                  <div>重合度 {c.overlap}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
