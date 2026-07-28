'use client'

import { EngagementQuality } from '@/types'
import { MessageCircle, Share2, Bookmark, Zap } from 'lucide-react'

export function EngagementQualitySection({ quality }: { quality: EngagementQuality }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">互动质量分析</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Metric icon={<MessageCircle className="h-5 w-5" />} label="评论深度" value={`${quality.conversationDepth}`} />
        <Metric icon={<Share2 className="h-5 w-5" />} label="分享率" value={`${quality.shareRatio}%`} />
        <Metric icon={<Bookmark className="h-5 w-5" />} label="收藏率 proxy" value={`${quality.saveRatio}%`} />
        <Metric icon={<Zap className="h-5 w-5" />} label="病毒系数" value={`${quality.viralCoefficient}x`} />
      </div>

      <p className="text-sm text-neutral-300 mb-4">{quality.qualityReasoning}</p>

      {quality.topEngagers.length > 0 && (
        <div>
          <div className="text-sm font-medium text-neutral-300 mb-2">Top 互动粉丝</div>
          <div className="space-y-2">
            {quality.topEngagers.map((engager, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
                <div className="flex items-center gap-3">
                  <img src={engager.avatarUrl} alt={engager.name} className="h-8 w-8 rounded-full" />
                  <div>
                    <div className="text-sm font-medium">{engager.name}</div>
                    <div className="text-xs text-neutral-500">{engager.handle}</div>
                  </div>
                </div>
                <div className="text-sm text-neutral-300">{engager.interactions} 互动</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-4 text-center">
      <div className="mb-2 flex justify-center text-neutral-500">{icon}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </div>
  )
}
