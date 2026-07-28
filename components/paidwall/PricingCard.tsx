'use client'

import { Zap, Check } from 'lucide-react'

interface PricingCardProps {
  tier: 'onetime' | 'monthly' | 'quarterly'
  badge?: string
  price: number
  unit: string
  originalPrice?: number
  recommended?: boolean
  features: string[]
  ctaLabel: string
  onClick: () => void
}

const priceColors: Record<string, string> = {
  onetime: 'text-white',
  monthly: 'text-[#00F2EA]',
  quarterly: 'text-[#FF0050]',
}

const borderColors: Record<string, string> = {
  onetime: 'border-neutral-700 hover:border-neutral-500',
  monthly: 'border-neutral-700 hover:border-[#00F2EA]/40',
  quarterly: 'border-[#FF0050]/40 hover:border-[#FF0050]/70',
}

const bgColors: Record<string, string> = {
  onetime: 'bg-neutral-900/60',
  monthly: 'bg-neutral-900/60',
  quarterly: 'bg-[#FF0050]/5',
}

const ctaColors: Record<string, string> = {
  onetime:
    'bg-neutral-700 hover:bg-neutral-600 text-white shadow-md shadow-black/40',
  monthly:
    'bg-[#00F2EA] hover:bg-[#00d4ce] text-black shadow-lg shadow-[#00F2EA]/20',
  quarterly:
    'bg-gradient-to-r from-[#FF0050] to-[#ff3377] hover:from-[#d60043] hover:to-[#e62e6b] text-white shadow-lg glow-pink-intense',
}

export function PricingCard({
  tier,
  badge,
  price,
  unit,
  originalPrice,
  recommended = false,
  features,
  ctaLabel,
  onClick,
}: PricingCardProps) {
  return (
    <div
      className={`relative rounded-2xl border p-4 transition-colors ${borderColors[tier]} ${bgColors[tier]}`}
    >
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FF0050] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md shadow-[#FF0050]/30">
            <Zap className="h-2.5 w-2.5" />
            {badge || '推荐'}
          </span>
        </div>
      )}

      <div className="text-center">
        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">
          {tier === 'onetime' && '单次解锁'}
          {tier === 'monthly' && '月度会员'}
          {tier === 'quarterly' && '季度会员'}
        </div>

        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-3xl font-black tabular-nums ${priceColors[tier]}`}>
            ${price}
          </span>
          {originalPrice && (
            <span className="text-sm line-through text-neutral-600 tabular-nums">
              ${originalPrice}
            </span>
          )}
        </div>
        <div className="text-[10px] text-neutral-500 mt-1">{unit}</div>

        <ul className="mt-3 space-y-1 text-left">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-neutral-400">
              <Check className="h-3 w-3 mt-0.5 shrink-0 text-[#00F2EA]" />
              <span className="leading-tight">{f}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onClick}
          className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${ctaColors[tier]}`}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  )
}
