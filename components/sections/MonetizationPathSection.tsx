'use client'

import { MonetizationPath } from '@/types'
import { Wallet, Target } from 'lucide-react'

export function MonetizationPathSection({ path }: { path: MonetizationPath }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">变现路径与门槛</h3>

      {path.eligiblePrograms.length > 0 ? (
        <div className="mb-6">
          <div className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2"><Wallet className="h-4 w-4" /> 已满足门槛</div>
          <div className="flex flex-wrap gap-2">
            {path.eligiblePrograms.map((program, i) => (
              <span key={i} className="rounded-full border border-green-900/50 bg-green-950/30 px-3 py-1 text-xs text-green-400">
                {program}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-amber-900/50 bg-amber-950/30 p-4">
          <div className="text-sm font-medium text-amber-400 flex items-center gap-2"><Target className="h-4 w-4" /> 最近门槛</div>
          <div className="text-sm text-neutral-300 mt-1">{path.nearestThreshold?.program} — {path.nearestThreshold?.gap}</div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-xl font-bold">${path.estimatedMonthlyUsd.low}</div>
          <div className="text-xs text-neutral-500 mt-1">保守月收益</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-xl font-bold">${path.estimatedMonthlyUsd.mid}</div>
          <div className="text-xs text-neutral-500 mt-1">预期月收益</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-xl font-bold">${path.estimatedMonthlyUsd.high}</div>
          <div className="text-xs text-neutral-500 mt-1">理想月收益</div>
        </div>
      </div>

      <p className="text-sm text-neutral-300">{path.pathReasoning}</p>
    </div>
  )
}
