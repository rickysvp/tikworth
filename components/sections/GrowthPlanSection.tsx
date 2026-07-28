'use client'

import { GrowthPlan } from '@/types'

export function GrowthPlanSection({ plan }: { plan: GrowthPlan }) {
  return (
    <div className="rounded-2xl border border-[#FF0050]/30 bg-[#FF0050]/5 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[#FF0050] mb-2">成长优化计划</h3>
      <p className="text-sm text-neutral-300 mb-6">{plan.summary}</p>

      <div className="space-y-3">
        {plan.items.map((item, i) => (
          <div key={i} className="rounded-xl border border-neutral-800 bg-[#0f0f0f] p-4">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${item.priority === 'high' ? 'bg-red-500/20 text-red-400' : item.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{item.area}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${item.priority === 'high' ? 'border-red-900/50 text-red-400' : item.priority === 'medium' ? 'border-amber-900/50 text-amber-400' : 'border-green-900/50 text-green-400'}`}>
                    {item.priority === 'high' ? '高优先级' : item.priority === 'medium' ? '中优先级' : '低优先级'}
                  </span>
                </div>
                <p className="text-sm text-neutral-300 mb-1">{item.action}</p>
                <p className="text-xs text-neutral-500">预期效果：{item.expectedImpact}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
