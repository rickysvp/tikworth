'use client'

import { BrandMatching } from '@/types'
import { Building2, TrendingUp, Sparkles, Shirt, Smartphone, Heart, DollarSign } from 'lucide-react'
import { formatUsd } from '@/lib/format'
import { useI18n } from '@/lib/i18n/context'

interface Props {
  matching: BrandMatching
}

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-4 w-4" />,
  Shirt: <Shirt className="h-4 w-4" />,
  Smartphone: <Smartphone className="h-4 w-4" />,
  Heart: <Heart className="h-4 w-4" />,
}

export function BrandMatchingSection({ matching }: Props) {
  const { dict } = useI18n()
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="h-5 w-5 text-[#FF0050]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{dict.evaluation.brandMatching.title}</h3>
      </div>

      {/* Total Brand Value */}
      <div className="rounded-xl border border-neutral-800 bg-gradient-to-br from-[#FF0050]/5 to-[#0f0f0f] p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-500 mb-1">{dict.evaluation.brandMatching.estTotalBrandValue}</div>
            <div className="text-xl font-bold text-[#FF0050] tabular-nums">
              {formatUsd(matching.totalBrandValue.low)} - {formatUsd(matching.totalBrandValue.high)}
            </div>
          </div>
          <div className="text-right text-xs text-neutral-500">
            Based on {matching.matches.length} {matching.matches.length === 1 ? dict.evaluation.brandMatching.category : dict.evaluation.brandMatching.categories}
            <br />{dict.evaluation.brandMatching.perCollaboration}
          </div>
        </div>
      </div>

      {/* Brand Matches */}
      <div className="space-y-3 mb-4">
        {matching.matches.map((match, idx) => (
          <div key={idx} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[#FF0050]">{iconMap[match.icon] || <Building2 className="h-4 w-4" />}</span>
                <div>
                  <div className="text-sm font-semibold">{match.category}</div>
                  <div className="text-[11px] text-neutral-500">{match.collaborationType}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-[#00F2EA] tabular-nums">
                  {formatUsd(match.estimatedDealRange.low)} - {formatUsd(match.estimatedDealRange.high)}
                </div>
                <div className="text-[10px] text-neutral-500">{dict.evaluation.brandMatching.perDeal}</div>
              </div>
            </div>

            {/* Fit score bar */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-neutral-500 w-10">{dict.evaluation.brandMatching.fit}</span>
              <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF0050] to-[#00F2EA]"
                  style={{ width: `${match.fitScore}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-neutral-400 tabular-nums">{match.fitScore}%</span>
            </div>

            {/* Example brands */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] text-neutral-500">{dict.evaluation.brandMatching.examples}</span>
              <div className="flex flex-wrap gap-1">
                {match.exampleBrands.map((brand, bi) => (
                  <span key={bi} className="text-[10px] text-neutral-400 bg-neutral-800 rounded px-1.5 py-0.5">
                    {brand}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-1 text-[10px] text-neutral-500">
              <DollarSign className="h-3 w-3 mt-0.5 shrink-0" />
              {match.reasoning}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex items-start gap-2 pt-4 border-t border-neutral-800">
        <TrendingUp className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
        <p className="text-xs text-neutral-500">{matching.summary}</p>
      </div>
    </div>
  )
}