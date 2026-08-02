'use client'

import { ContentStrategy } from '@/types'
import { Lightbulb, Hash, Clock, Users, BookOpen, Camera, TrendingUp, ArrowRight } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Props {
  strategy: ContentStrategy
}

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="h-4 w-4" />,
  Camera: <Camera className="h-4 w-4" />,
  TrendingUp: <TrendingUp className="h-4 w-4" />,
}

const volumeColors: Record<string, string> = {
  high: 'text-green-400 border-green-900/50 bg-green-950/20',
  medium: 'text-amber-400 border-amber-900/50 bg-amber-950/20',
  low: 'text-neutral-400 border-neutral-700 bg-neutral-800/50',
}

export function ContentStrategySection({ strategy }: Props) {
  const { dict } = useI18n()
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="h-5 w-5 text-[#FF0050]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{dict.evaluation.contentStrategy.title}</h3>
      </div>

      {/* Content Pillars */}
      <div className="mb-6">
        <div className="text-xs text-neutral-500 mb-3 uppercase tracking-wider">{dict.evaluation.contentStrategy.contentPillars}</div>
        <div className="grid gap-3 sm:grid-cols-3">
          {strategy.pillars.map((pillar, idx) => (
            <div key={idx} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#FF0050]">{iconMap[pillar.icon] || <BookOpen className="h-4 w-4" />}</span>
                <span className="text-sm font-semibold">{pillar.type}</span>
              </div>
              <div className="text-[11px] text-neutral-500 mb-2">{pillar.frequency} · Est. {pillar.expectedEngagement}</div>
              <div className="space-y-1 mb-2">
                {pillar.examples.map((ex, ei) => (
                  <div key={ei} className="text-[11px] text-neutral-400 flex items-start gap-1">
                    <span className="text-neutral-600 mt-0.5">·</span>
                    {ex}
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-neutral-500 italic">{pillar.why}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Hashtags */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Hash className="h-4 w-4 text-neutral-500" />
          <span className="text-xs text-neutral-500 uppercase tracking-wider">{dict.evaluation.contentStrategy.hashtags}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {strategy.recommendedHashtags.map((tag, idx) => (
            <span key={idx} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${volumeColors[tag.volume]}`}>
              {tag.tag}
              <span className="opacity-60">· {tag.relevance}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* Optimal Schedule */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-neutral-500" />
          <span className="text-xs text-neutral-500 uppercase tracking-wider">{dict.evaluation.contentStrategy.bestPostTimes}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {strategy.optimalSchedule.map((slot, idx) => (
            <div key={idx} className="rounded-xl border border-neutral-800 bg-neutral-900/50 px-3 py-2 text-center">
              <div className="text-xs font-semibold">{slot.day}</div>
              <div className="text-lg font-bold text-[#00F2EA] tabular-nums">{slot.time}</div>
              <div className="text-[10px] text-neutral-500">{slot.format}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Collaboration Ideas */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-neutral-500" />
          <span className="text-xs text-neutral-500 uppercase tracking-wider">{dict.evaluation.contentStrategy.collaborationIdeas}</span>
        </div>
        <div className="space-y-2">
          {strategy.collaborationIdeas.map((idea, idx) => (
            <div key={idx} className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
              <span className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${idea.potential === 'high' ? 'bg-[#00F2EA]/20 text-[#00F2EA]' : 'bg-amber-500/20 text-amber-400'}`}>
                {idea.potential === 'high' ? dict.evaluation.contentStrategy.potentialHigh : dict.evaluation.contentStrategy.potentialMed}
              </span>
              <div>
                <div className="text-sm font-medium">{idea.type}</div>
                <div className="text-xs text-neutral-400 mt-0.5">{idea.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-start gap-2 pt-4 border-t border-neutral-800">
        <ArrowRight className="h-4 w-4 text-[#FF0050] mt-0.5 shrink-0" />
        <p className="text-xs text-neutral-500">{strategy.summary}</p>
      </div>
    </div>
  )
}