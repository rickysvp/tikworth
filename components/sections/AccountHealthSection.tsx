'use client'

import { AccountHealth } from '@/types'
import { AlertTriangle, CheckCircle, Activity } from 'lucide-react'

export function AccountHealthSection({ health }: { health: AccountHealth }) {
  const riskColor = health.shadowbanRisk === 'high' ? 'text-red-400' : health.shadowbanRisk === 'medium' ? 'text-amber-400' : 'text-green-400'
  const RiskIcon = health.shadowbanRisk === 'low' ? CheckCircle : AlertTriangle

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">账号健康诊断</h3>
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-3xl font-bold tabular-nums">{health.overallScore}</div>
          <div className="text-xs text-neutral-500 mt-1">健康分</div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <RiskIcon className={`h-6 w-6 ${riskColor}`} />
          <div>
            <div className={`text-sm font-semibold ${riskColor}`}>
              限流风险 {health.shadowbanRisk === 'high' ? '高' : health.shadowbanRisk === 'medium' ? '中' : '低'}
            </div>
            <div className="text-xs text-neutral-500">{health.shadowbanSignals.length} 个信号</div>
          </div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-3xl font-bold tabular-nums">{health.fakeFollowerEstimate}%</div>
          <div className="text-xs text-neutral-500 mt-1">估算假粉</div>
        </div>
      </div>

      {health.shadowbanSignals.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-neutral-300 mb-2">风险信号</div>
          <div className="flex flex-wrap gap-2">
            {health.shadowbanSignals.map((signal, i) => (
              <span key={i} className="rounded-full border border-red-900/50 bg-red-950/30 px-3 py-1 text-xs text-red-300">
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-[#141414] p-4">
        <Activity className="mt-0.5 h-5 w-5 shrink-0 text-[#00F2EA]" />
        <p className="text-sm text-neutral-300">{health.healthReasoning}</p>
      </div>
    </div>
  )
}
