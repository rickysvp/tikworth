'use client'

import { CheckCircle2, XCircle, Lock, TrendingUp } from 'lucide-react'
import { useI18n, t } from '@/lib/i18n'

interface MonetizationChecklistProps {
  followerCount: number
  videoCount: number
  region?: string
  isUnlocked: boolean
  hasHighRisk?: boolean
}

interface Requirement {
  label: string
  required: string
  current: string
  met: boolean
}

export function MonetizationChecklist({ followerCount, videoCount, region, isUnlocked, hasHighRisk }: MonetizationChecklistProps) {
  const { dict } = useI18n()
  // TikTok Creator Rewards Program requirements (2026)
  // - 10K+ followers
  // - 100K+ video views in last 30 days
  // - 18+ years old
  // - Account at least 30 days old
  // - Follow community guidelines
  // - Region must be eligible (US, UK, DE, FR, ES, IT, etc.)

  const eligibleRegions = ['US', 'UK', 'DE', 'FR', 'ES', 'IT', 'JP', 'KR', 'BR', 'ID', 'TH', 'VN', 'PH', 'MY', 'SG']
  const regionEligible = !region || eligibleRegions.some(r => region.toUpperCase().includes(r))

  const requirements: Requirement[] = [
    {
      label: dict.evaluation.monetization.followersRequirement,
      required: '10,000',
      current: followerCount >= 1000 ? (followerCount >= 1000000 ? (followerCount / 1000000).toFixed(1) + 'M' : (followerCount / 1000).toFixed(1) + 'K') : String(followerCount),
      met: followerCount >= 10000,
    },
    {
      label: dict.evaluation.monetization.videosRequirement,
      required: '5',
      current: String(videoCount),
      met: videoCount >= 5,
    },
    {
      label: dict.evaluation.monetization.regionRequirement,
      required: 'Supported',
      current: regionEligible ? (region || dict.evaluation.monetization.statusEligible) : (region || dict.evaluation.monetization.statusUnknown),
      met: regionEligible,
    },
    {
      label: dict.evaluation.monetization.guidelinesRequirement,
      required: dict.common.noViolations,
      current: hasHighRisk ? dict.evaluation.monetization.statusFlagged : dict.evaluation.monetization.statusClean,
      met: !hasHighRisk,
    },
  ]

  const metCount = requirements.filter(r => r.met).length
  const allMet = metCount === requirements.length

  return (
    <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] to-[#141414] p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-[#00F2EA]" />
        <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{dict.evaluation.monetization.title}</h4>
        <span className="ml-auto text-xs text-neutral-600">
          {t(dict.evaluation.monetization.metCount, { met: metCount, total: requirements.length })}
        </span>
      </div>

      <div className="space-y-2.5 mb-4">
        {requirements.map((req, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
              req.met
                ? 'border-green-900/40 bg-green-950/20'
                : 'border-neutral-800 bg-neutral-900/40'
            }`}
          >
            {req.met ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0 text-neutral-600" />
            )}
            <span className={`text-xs flex-1 ${req.met ? 'text-neutral-300' : 'text-neutral-500'}`}>
              {req.label}
            </span>
            <span className={`text-xs font-mono ${req.met ? 'text-green-400' : 'text-neutral-600'}`}>
              {req.current}
              {!req.met && <span className="text-neutral-700"> / {req.required}</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Locked hint */}
      {!isUnlocked && (
        <div className="rounded-xl border border-[#FF0050]/20 bg-[#FF0050]/5 p-3 flex items-center gap-3">
          <Lock className="h-4 w-4 shrink-0 text-[#FF0050]" />
          <div className="flex-1">
            <p className="text-xs text-neutral-400">
              {allMet
                ? dict.evaluation.monetization.allMetUnlock
                : dict.evaluation.monetization.notMetUnlock}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}