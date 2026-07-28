'use client'

import { DollarSign, Shield, Building2, TrendingUp } from 'lucide-react'
import type { Evaluation } from '@/types'

interface Props {
  result: Evaluation
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return '$' + Math.round(n)
}

export function FreeHookPreview({ result }: Props) {
  const monthly = result.incomeEstimate?.monthlyTotal
  const tierLabel = result.peerRanking?.tierLabel
  const brandCount = result.brandMatching?.matches?.length ?? 0
  const trendCount = result.trendAnalysis?.trendingTopics?.length ?? 0

  const items: { icon: typeof DollarSign; label: string; value: string }[] = [
    {
      icon: DollarSign,
      label: '月收入预估',
      value: monthly ? `${formatUsd(monthly.low)}–${formatUsd(monthly.high)}` : '计算中',
    },
    {
      icon: Shield,
      label: '账号等级',
      value: tierLabel || '待评估',
    },
    {
      icon: Building2,
      label: '品牌匹配',
      value: brandCount > 0 ? `${brandCount} 个品类` : '匹配中',
    },
    {
      icon: TrendingUp,
      label: '热门话题',
      value: trendCount > 0 ? `${trendCount} 个待用` : '分析中',
    },
  ]

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-700/40 bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
          预览
        </span>
        <span className="text-xs text-neutral-500">以下数据基于您的账号实时计算</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => {
          const Icon = item.icon
          return (
            <div
              key={i}
              className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3"
            >
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">
                <Icon className="h-3 w-3 text-[#00F2EA]" />
                {item.label}
              </div>
              <div className="text-sm font-bold text-[#00F2EA] tabular-nums truncate">
                {item.value}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
