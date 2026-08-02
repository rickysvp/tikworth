'use client'

import { IncomeEstimate, IncomeSource } from '@/types'
import { DollarSign, TrendingUp, Briefcase, Play, Users, ShoppingBag, Gift, Info } from 'lucide-react'
import { formatUsd } from '@/lib/format'
import { useI18n } from '@/lib/i18n/context'

const iconMap: Record<string, React.ReactNode> = {
  Briefcase: <Briefcase className="h-4 w-4" />,
  Play: <Play className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  ShoppingBag: <ShoppingBag className="h-4 w-4" />,
  Gift: <Gift className="h-4 w-4" />,
}

const confidenceColors: Record<string, string> = {
  high: 'border-green-800/50 bg-green-950/30',
  medium: 'border-amber-800/50 bg-amber-950/30',
  low: 'border-neutral-800 bg-[#0f0f0f]',
}

const confidenceDots: Record<string, string> = {
  high: 'bg-green-400',
  medium: 'bg-amber-400',
  low: 'bg-neutral-600',
}

export function IncomeBreakdownSection({ estimate }: { estimate: IncomeEstimate }) {
  const { dict } = useI18n()
  const total = estimate.monthlyTotal
  const hasIncome = total.mid > 0

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">{dict.evaluation.income.estMonthlyIncome}</h3>
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span>{estimate.categoryLabel} · {estimate.regionLabel}</span>
          <span className="text-neutral-700">|</span>
          <span>CPM ${estimate.categoryCpm} · RPM ${estimate.categoryRpm.toFixed(2)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="mb-6 rounded-2xl border border-[#00F2EA]/20 bg-gradient-to-br from-[#00F2EA]/5 to-[#FF0050]/5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">{dict.evaluation.income.estMonthlyRange}</div>
            <div className="text-3xl font-bold">
              {hasIncome ? `${formatUsd(total.low)} - ${formatUsd(total.high)}` : '$0'}
            </div>
            {hasIncome && (
              <div className="text-sm text-neutral-400 mt-1">
                {dict.evaluation.income.median} {formatUsd(total.mid)}
              </div>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2">
            <TrendingUp className="h-4 w-4 text-[#00F2EA]" />
            <span className="text-sm text-neutral-400">
              {dict.evaluation.income.regionMultiplier} {estimate.regionMultiplier.toFixed(2)}x
            </span>
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3 mb-4">
        {estimate.breakdown.map((source, idx) => (
          <IncomeRow key={idx} source={source} totalMid={total.mid} />
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-[#141414] p-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
        <p className="text-sm text-neutral-400">{estimate.summary}</p>
      </div>
    </div>
  )
}

function IncomeRow({ source, totalMid }: { source: IncomeSource; totalMid: number }) {
  const { dict } = useI18n()
  const hasIncome = source.monthlyAmount.mid > 0
  const barWidth = totalMid > 0 ? Math.max(2, (source.monthlyAmount.mid / totalMid) * 100) : 0

  return (
    <div className={`rounded-xl border p-4 ${confidenceColors[source.confidence]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">{iconMap[source.icon] || <DollarSign className="h-4 w-4" />}</span>
          <span className="text-sm font-medium">{source.label}</span>
          <span className={`inline-block h-2 w-2 rounded-full ${confidenceDots[source.confidence]}`} />
          <span className="text-xs text-neutral-500">
            {source.confidence === 'high' ? dict.evaluation.income.highConfidence : source.confidence === 'medium' ? dict.evaluation.income.mediumConfidence : dict.evaluation.income.lowConfidence}
          </span>
        </div>
        <div className="text-right">
          {hasIncome ? (
            <>
              <span className="text-sm font-bold tabular-nums">
                {formatUsd(source.monthlyAmount.low)} - {formatUsd(source.monthlyAmount.high)}
              </span>
              {source.percentage > 0 && (
                <span className="ml-2 text-xs text-neutral-500">{source.percentage}%</span>
              )}
            </>
          ) : (
            <span className="text-sm text-neutral-600">{dict.common.notAvailable}</span>
          )}
        </div>
      </div>

      {/* Bar */}
      <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-[#FF0050] to-[#00F2EA] rounded-full transition-all"
          style={{ width: `${barWidth}%` }}
        />
      </div>

      <p className="text-xs text-neutral-500">{source.detail}</p>
    </div>
  )
}