'use client'

import { CommercializationAdvice } from '@/types'
import {
  Building2, ShoppingBag, Radio, Gift, Coins, BookOpen, Users, Store,
  TrendingUp, ArrowRight, DollarSign, Target, Shield, Zap, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useState } from 'react'
import { formatUsd } from '@/lib/format'
import { useI18n } from '@/lib/i18n/context'

interface Props {
  advice: CommercializationAdvice
}

const iconMap: Record<string, React.ReactNode> = {
  Building2: <Building2 className="h-5 w-5" />,
  ShoppingBag: <ShoppingBag className="h-5 w-5" />,
  Radio: <Radio className="h-5 w-5" />,
  Gift: <Gift className="h-5 w-5" />,
  Coins: <Coins className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Store: <Store className="h-5 w-5" />,
}

const difficultyColors: Record<string, string> = {
  low: 'text-green-400 border-green-900/50 bg-green-950/30',
  medium: 'text-amber-400 border-amber-900/50 bg-amber-950/30',
  high: 'text-red-400 border-red-900/50 bg-red-950/30',
}

const revenueColors: Record<string, string> = {
  high: 'text-green-400',
  medium: 'text-amber-400',
  low: 'text-neutral-500',
}

function DirectionCard({ direction, rank }: { direction: CommercializationAdvice['directions'][0]; rank: number }) {
  const [expanded, setExpanded] = useState(rank === 0)
  const { dict } = useI18n()

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-neutral-900/80 transition-colors text-left"
      >
        {/* Rank badge */}
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold shrink-0 ${
          rank === 0 ? 'bg-[#FF0050] text-white' :
          rank === 1 ? 'bg-[#FF0050]/30 text-[#FF0050]' :
          'bg-neutral-800 text-neutral-500'
        }`}>
          {rank + 1}
        </span>

        {/* Icon + Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-neutral-400">{iconMap[direction.icon] || <Target className="h-5 w-5" />}</span>
            <span className="text-sm font-semibold">{direction.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${difficultyColors[direction.difficulty]}`}>
              {direction.difficulty === 'low' ? dict.evaluation.monetizationAdvice.easy : direction.difficulty === 'medium' ? dict.evaluation.monetizationAdvice.moderate : dict.evaluation.monetizationAdvice.hard}
            </span>
            <span className={`text-[10px] ${revenueColors[direction.revenuePotential]}`}>
              {direction.revenuePotential === 'high' ? dict.evaluation.monetizationAdvice.highPotential : direction.revenuePotential === 'medium' ? dict.evaluation.monetizationAdvice.mediumPotential : dict.evaluation.monetizationAdvice.lowPotential}
            </span>
          </div>
        </div>

        {/* Revenue + Fit */}
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-[#00F2EA] tabular-nums">
            {formatUsd(direction.estimatedMonthlyRevenue.low)} - {formatUsd(direction.estimatedMonthlyRevenue.high)}
          </div>
          <div className="text-[10px] text-neutral-500">{dict.evaluation.monetizationAdvice.estMonthly}</div>
        </div>

        {/* Fit score ring */}
        <div className="relative w-12 h-12 shrink-0">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle
              cx="24" cy="24" r="20" fill="none"
              stroke={direction.fitScore >= 80 ? '#00F2EA' : direction.fitScore >= 60 ? '#f59e0b' : '#FF0050'}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${direction.fitScore * 1.256} 125.6`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-neutral-300 tabular-nums">{direction.fitScore}%</span>
          </div>
        </div>

        {expanded ? (
          <ChevronUp className="h-4 w-4 text-neutral-600 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-neutral-600 shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-neutral-800">
          <div className="pt-4 space-y-4">
            {/* Description */}
            <p className="text-xs text-neutral-400 leading-relaxed">{direction.description}</p>

            {/* Why */}
            <div className="flex items-start gap-2 rounded-xl border border-[#00F2EA]/20 bg-[#00F2EA]/5 p-3">
              <Zap className="h-4 w-4 text-[#00F2EA] mt-0.5 shrink-0" />
              <p className="text-xs text-neutral-300">{direction.why}</p>
            </div>

            {/* Prerequisites */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider">{dict.evaluation.monetizationAdvice.prerequisites}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {direction.prerequisites.map((pre, i) => (
                  <span key={i} className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-800/50 px-2 py-0.5 text-[10px] text-neutral-400">
                    {pre}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Steps */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-3.5 w-3.5 text-[#FF0050]" />
                <span className="text-[11px] text-neutral-500 uppercase tracking-wider">{dict.evaluation.monetizationAdvice.actionSteps}</span>
              </div>
              <div className="space-y-2">
                {direction.actionSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FF0050]/10 text-[10px] font-bold text-[#FF0050] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-xs text-neutral-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function CommercializationSection({ advice }: Props) {
  const { dict } = useI18n()
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="h-5 w-5 text-[#FF0050]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{dict.evaluation.monetizationAdvice.title}</h3>
      </div>

      {/* Primary & Secondary Recommendation */}
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <div className="rounded-xl border border-[#FF0050]/20 bg-gradient-to-br from-[#FF0050]/5 to-[#0f0f0f] p-4">
          <div className="text-[10px] text-[#FF0050] uppercase tracking-wider mb-1">{dict.evaluation.monetizationAdvice.primaryPick}</div>
          <div className="text-xs text-neutral-300 leading-relaxed">{advice.primaryRecommendation}</div>
        </div>
        <div className="rounded-xl border border-[#00F2EA]/20 bg-gradient-to-br from-[#00F2EA]/5 to-[#0f0f0f] p-4">
          <div className="text-[10px] text-[#00F2EA] uppercase tracking-wider mb-1">{dict.evaluation.monetizationAdvice.secondaryPick}</div>
          <div className="text-xs text-neutral-300 leading-relaxed">{advice.secondaryRecommendation}</div>
        </div>
      </div>

      {/* Total Revenue Overview */}
      <div className="rounded-xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] to-[#141414] p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#00F2EA]" />
            <span className="text-xs text-neutral-500">{dict.evaluation.monetizationAdvice.estCombinedMonthly}</span>
          </div>
          <div className="text-xl font-bold text-[#00F2EA] tabular-nums">
            {formatUsd(advice.estimatedTotalMonthly.low)} - {formatUsd(advice.estimatedTotalMonthly.high)}
          </div>
        </div>
      </div>

      {/* Direction Cards */}
      <div className="space-y-3 mb-4">
        {advice.directions.map((direction, idx) => (
          <DirectionCard key={idx} direction={direction} rank={idx} />
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-start gap-2 pt-4 border-t border-neutral-800">
        <ArrowRight className="h-4 w-4 text-[#FF0050] mt-0.5 shrink-0" />
        <p className="text-xs text-neutral-500">{advice.summary}</p>
      </div>
    </div>
  )
}