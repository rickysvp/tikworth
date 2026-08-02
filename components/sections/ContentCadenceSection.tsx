'use client'

import { ContentCadence } from '@/types'
import { Clock, Calendar } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

export function ContentCadenceSection({ cadence }: { cadence: ContentCadence }) {
  const { dict } = useI18n()
  const rhythmLabel = cadence.postingRhythm === 'daily' ? dict.evaluation.contentCadence.daily : cadence.postingRhythm === 'weekly' ? dict.evaluation.contentCadence.weekly : dict.evaluation.contentCadence.irregular

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">{dict.evaluation.contentCadence.title}</h3>
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-2xl font-bold">{rhythmLabel}</div>
          <div className="text-xs text-neutral-500 mt-1">{dict.evaluation.contentCadence.postingRhythm}</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-2xl font-bold">{cadence.avgPostsPerWeek}</div>
          <div className="text-xs text-neutral-500 mt-1">{dict.evaluation.contentCadence.avgPerWeek}</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-2xl font-bold">{cadence.consistencyScore}</div>
          <div className="text-xs text-neutral-500 mt-1">{dict.evaluation.contentCadence.consistency}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-4">
        <div>
          <div className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2"><Clock className="h-4 w-4" /> {dict.evaluation.contentCadence.bestHours}</div>
          <div className="space-y-2">
            {cadence.bestTimeSlots.map((slot, i) => (
              <div key={i} className="flex justify-between text-sm rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
                <span className="text-neutral-400">{slot.hour}:00</span>
                <span className="font-medium">{slot.engagementRate.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> {dict.evaluation.contentCadence.bestDays}</div>
          <div className="space-y-2">
            {cadence.bestWeekdays.map((day, i) => (
              <div key={i} className="flex justify-between text-sm rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
                <span className="text-neutral-400">{day.weekday}</span>
                <span className="font-medium">{day.engagementRate.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-neutral-300">{cadence.cadenceAdvice}</p>
    </div>
  )
}
