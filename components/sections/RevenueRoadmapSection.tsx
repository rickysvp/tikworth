'use client'

import { RevenueRoadmap } from '@/types'
import { TrendingUp, ArrowRight, Milestone } from 'lucide-react'
import { formatUsd } from '@/lib/format'
import { useI18n } from '@/lib/i18n/context'

interface Props {
  roadmap: RevenueRoadmap
}

export function RevenueRoadmapSection({ roadmap }: Props) {
  const { dict } = useI18n()
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-[#00F2EA]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{dict.evaluation.revenueRoadmap.title}</h3>
      </div>

      {/* Current Monthly */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-neutral-500 mb-1">{dict.evaluation.revenueRoadmap.estCurrentMonthly}</div>
            <div className="text-2xl font-bold text-[#00F2EA] tabular-nums">
              {formatUsd(roadmap.currentMonthly.low)} - {formatUsd(roadmap.currentMonthly.high)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-500 mb-1">{dict.evaluation.revenueRoadmap.twelveMonthTotal}</div>
            <div className="text-lg font-semibold tabular-nums">
              {formatUsd(roadmap.total12Month.low)} - {formatUsd(roadmap.total12Month.high)}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-3 bottom-3 w-px bg-neutral-800" />

        <div className="space-y-6">
          {roadmap.projections.map((proj, idx) => (
            <div key={idx} className="relative pl-12">
              {/* Timeline dot */}
              <div className="absolute left-0 top-1.5 w-[39px] flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#00F2EA] ring-4 ring-[#00F2EA]/20" />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{proj.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#00F2EA]/10 text-[#00F2EA] border border-[#00F2EA]/20">
                      {proj.milestone}
                    </span>
                  </div>
                  <div className="text-lg font-semibold tabular-nums text-[#00F2EA] mb-2">
                    {formatUsd(proj.revenue.low)} - {formatUsd(proj.revenue.high)}
                    <span className="text-xs text-neutral-500 font-normal"> / mo</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.unlocks.map((u, ui) => (
                      <span key={ui} className="inline-flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-800/50 rounded-full px-2 py-0.5">
                        <ArrowRight className="h-3 w-3 text-[#00F2EA]" />
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-neutral-800">
        <div className="flex items-start gap-2">
          <Milestone className="h-4 w-4 text-neutral-500 mt-0.5 shrink-0" />
          <p className="text-xs text-neutral-500">{roadmap.summary}</p>
        </div>
      </div>
    </div>
  )
}