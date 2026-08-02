'use client'

import { PeerRanking } from '@/types'
import { BarChart3, Trophy, TrendingUp } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Props {
  ranking: PeerRanking
}

export function PeerRankingSection({ ranking }: Props) {
  const { dict } = useI18n()
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-5 w-5 text-[#00F2EA]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{dict.evaluation.peerRanking.title}</h3>
      </div>

      {/* Overall Rank Hero */}
      <div className="rounded-xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] to-[#141414] p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00F2EA]/20 to-[#00F2EA]/5 flex items-center justify-center border border-[#00F2EA]/20">
              <Trophy className="h-7 w-7 text-[#00F2EA]" />
            </div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">{ranking.peerGroupDescription}</div>
            <div className="text-3xl font-black text-[#00F2EA]">{ranking.tierLabel}</div>
            <div className="text-xs text-neutral-500 mt-1">{dict.evaluation.peerRanking.overallPercentile}</div>
          </div>
        </div>
      </div>

      {/* Ranking Breakdown */}
      <div className="mb-4">
        <div className="text-xs text-neutral-500 mb-4 uppercase tracking-wider">{dict.evaluation.peerRanking.dimensionBreakdown}</div>
        <div className="space-y-3">
          {ranking.rankingBreakdown.map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-neutral-300">{item.metric}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">{item.value}</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color: item.barColor }}>
                    Top {Math.round(item.percentile)}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${item.percentile}%`,
                    backgroundColor: item.barColor,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insight */}
      <div className="flex items-start gap-2 pt-4 border-t border-neutral-800">
        <TrendingUp className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
        <p className="text-xs text-neutral-500">{ranking.insight}</p>
      </div>
    </div>
  )
}