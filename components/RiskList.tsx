'use client'

import { Evaluation } from '@/types'
import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

export function RiskList({ risks }: { risks: Evaluation['riskFlags'] }) {
  const { dict } = useI18n()

  if (!risks.length) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-900/40 bg-green-950/20 p-4">
        <ShieldCheck className="h-5 w-5 text-green-400" />
        <span className="text-sm text-green-100">{dict.evaluation.risk.noSignals}</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {risks.map((risk, idx) => (
        <div
          key={idx}
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            risk.level === 'high'
              ? 'border-red-900/40 bg-red-950/20'
              : risk.level === 'medium'
              ? 'border-amber-900/40 bg-amber-950/20'
              : 'border-blue-900/40 bg-blue-950/20'
          }`}
        >
          <AlertTriangle
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              risk.level === 'high' ? 'text-red-400' : risk.level === 'medium' ? 'text-amber-400' : 'text-blue-400'
            }`}
          />
          <div>
            <div className="text-sm font-medium text-neutral-100">{risk.label}</div>
            <div className="mt-0.5 text-sm text-neutral-400">{risk.detail}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
