'use client'

import { ShieldCheck, Zap, Lock } from 'lucide-react'

const REASSURANCES = [
  {
    icon: ShieldCheck,
    text: '30 天创作者激励',
    color: 'text-[#00F2EA]',
  },
  {
    icon: Zap,
    text: '1 分钟极速解锁',
    color: 'text-amber-400',
  },
  {
    icon: Lock,
    text: '支付信息加密保护',
    color: 'text-[#FF0050]',
  },
]

export function RiskReassurance() {
  return (
    <div className="rounded-2xl border border-neutral-800/60 bg-[#0a0a0a]/60 px-4 py-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {REASSURANCES.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="flex items-center gap-2 justify-center sm:justify-start">
              <Icon className={`h-3.5 w-3.5 ${item.color} shrink-0`} />
              <span className="text-[11px] text-neutral-400 font-medium">{item.text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
