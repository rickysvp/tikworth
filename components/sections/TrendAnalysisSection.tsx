'use client'

import { TrendAnalysis } from '@/types'
import { TrendingUp, Music, Zap, Clock, ArrowRight, Hash, Flame } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

interface Props {
  trendAnalysis: TrendAnalysis
}

export function TrendAnalysisSection({ trendAnalysis }: Props) {
  const { dict } = useI18n()
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="h-5 w-5 text-[#FF0050]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{dict.evaluation.trendAnalysis.title}</h3>
      </div>

      {/* Trending Topics */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Flame className="h-4 w-4 text-[#FF0050]" />
          <span className="text-xs text-neutral-500 uppercase tracking-wider">{dict.evaluation.trendAnalysis.trendingTopics}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {trendAnalysis.trendingTopics.map((topic, idx) => (
            <div key={idx} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 hover:border-[#FF0050]/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-semibold">{topic.topic}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-950/50 border border-green-900/40 px-2 py-0.5 text-[10px] text-green-400">
                  <TrendingUp className="h-3 w-3" />
                  +{topic.growth}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#00F2EA]/30 bg-[#00F2EA]/10 px-2 py-0.5 text-[11px] text-[#00F2EA]">
                  <Hash className="h-3 w-3" />
                  {topic.hashtag}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF0050] to-[#00F2EA]"
                    style={{ width: `${topic.relevance}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-500 tabular-nums">{topic.relevance}% {dict.evaluation.trendAnalysis.match}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Sounds */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Music className="h-4 w-4 text-[#00F2EA]" />
          <span className="text-xs text-neutral-500 uppercase tracking-wider">{dict.evaluation.trendAnalysis.trendingSounds}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {trendAnalysis.trendingSounds.map((sound, idx) => (
            <div key={idx} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold">{sound.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-950/50 border border-green-900/40 px-2 py-0.5 text-[10px] text-green-400">
                  +{sound.growth}%
                </span>
              </div>
              <div className="text-xs text-neutral-500">{sound.artist}</div>
              <div className="text-[11px] text-neutral-600 mt-1">{sound.usageCount} {dict.evaluation.trendAnalysis.uses}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Content Predictions */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-400" />
          <span className="text-xs text-neutral-500 uppercase tracking-wider">{dict.evaluation.trendAnalysis.contentPredictions}</span>
        </div>
        <div className="space-y-3">
          {trendAnalysis.contentPredictions.map((pred, idx) => (
            <div key={idx} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1">{pred.direction}</div>
                  <div className="text-xs text-neutral-500">{pred.why}</div>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <div className="text-lg font-bold text-[#00F2EA] tabular-nums">{pred.confidence}%</div>
                  <div className="text-[10px] text-neutral-500">{dict.evaluation.trendAnalysis.confidence}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-[#00F2EA]"
                    style={{ width: `${pred.confidence}%` }}
                  />
                </div>
                <span className="text-[10px] text-neutral-500">{pred.expectedEngagement}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Post Times */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-neutral-500" />
          <span className="text-xs text-neutral-500 uppercase tracking-wider">{dict.evaluation.trendAnalysis.bestPostTimes}</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {trendAnalysis.bestPostTimes.map((slot, idx) => {
            const intensity = Math.min(slot.score / 100, 1)
            const bgOpacity = 0.1 + intensity * 0.4
            return (
              <div
                key={idx}
                className="rounded-xl border border-neutral-800 p-2 text-center"
                style={{
                  background: `rgba(0, 242, 234, ${bgOpacity})`,
                  borderColor: intensity > 0.7 ? 'rgba(0, 242, 234, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="text-[10px] text-neutral-500">{slot.day}</div>
                <div className="text-sm font-bold text-[#00F2EA] tabular-nums">
                  {String(slot.hour).padStart(2, '0')}:00
                </div>
                <div className="text-[10px] text-neutral-600">{slot.score.toFixed(2)}{dict.evaluation.trendAnalysis.points}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-start gap-2 pt-4 border-t border-neutral-800">
        <ArrowRight className="h-4 w-4 text-[#FF0050] mt-0.5 shrink-0" />
        <p className="text-xs text-neutral-500">{trendAnalysis.summary}</p>
      </div>
    </div>
  )
}