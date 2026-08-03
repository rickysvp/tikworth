'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TIER_COLORS } from '@/lib/tier'
import { Users, Heart, MapPin, BadgeCheck, Sparkles, ArrowRight, Clock } from 'lucide-react'
import type { RecentEvaluation } from '@/app/api/recent-evaluations/route'

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${Math.round(n).toLocaleString()}`
}

function TierRing({ tier, size = 56 }: { tier: string; size?: number }) {
  const color = TIER_COLORS[tier] || '#FF0050'
  const stroke = 4
  const radius = (size - stroke) / 2
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="transparent" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={stroke} fill="transparent" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * radius * 0.85} ${2 * Math.PI * radius}`} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-extrabold uppercase leading-none" style={{ fontSize: size * 0.4, color }}>{tier}</span>
      </div>
    </div>
  )
}

interface Props {
  onSelect: (username: string) => void
}

export function RecentEvaluations({ onSelect }: Props) {
  const [items, setItems] = useState<RecentEvaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/recent-evaluations', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        if (data?.evaluations?.length) setItems(data.evaluations)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="border-b border-neutral-800 py-12">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-[#00F2EA]" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Recently Evaluated</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl border border-neutral-800 bg-[#141414] animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (items.length === 0) return null

  return (
    <section className="border-b border-neutral-800 py-12">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#00F2EA]" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">Recently Evaluated</h2>
          </div>
          <span className="text-xs text-neutral-500 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Updated live
          </span>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((acc) => {
            const tierColor = TIER_COLORS[acc.tier] || '#FF0050'
            return (
              <button
                key={acc.username}
                onClick={() => onSelect(acc.username)}
                className="group relative text-left rounded-2xl border border-neutral-800 bg-[#141414] p-4 hover:border-[#00F2EA]/40 hover:bg-[#181818] transition-all hover:-translate-y-0.5"
              >
                {/* Top row: avatar + tier ring */}
                <div className="flex items-start justify-between mb-3">
                  <div className="relative">
                    {acc.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={acc.avatar}
                        alt={acc.nickname}
                        className="w-12 h-12 rounded-full border-2 border-neutral-700 object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center text-lg font-bold text-neutral-400">
                        {acc.nickname.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {acc.verified && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#0a0a0a] flex items-center justify-center">
                        <BadgeCheck className="h-3.5 w-3.5 text-[#00F2EA]" />
                      </span>
                    )}
                  </div>
                  <TierRing tier={acc.tier} />
                </div>

                {/* Nickname + @username */}
                <div className="mb-2 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate group-hover:text-[#00F2EA] transition-colors">
                    {acc.nickname}
                  </h3>
                  <p className="text-xs text-neutral-500 truncate">@{acc.username}</p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-2.5 min-h-[20px]">
                  {acc.categories.slice(0, 2).map((cat, i) => (
                    <span key={i} className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                      {cat}
                    </span>
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {fmt(acc.followerCount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" /> {fmt(acc.totalLikes)}
                  </span>
                  {acc.region && (
                    <span className="flex items-center gap-1 ml-auto">
                      <MapPin className="h-3 w-3" /> {acc.region}
                    </span>
                  )}
                </div>

                {/* Value + hover CTA */}
                <div className="mt-3 pt-3 border-t border-neutral-800/50 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-neutral-600 uppercase tracking-wider">Est. Value</div>
                    <div className="text-xs font-bold tabular-nums" style={{ color: tierColor }}>
                      {fmtUsd(acc.businessValueHigh)}
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-600 group-hover:text-[#00F2EA] flex items-center gap-0.5 transition-colors">
                    View <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Bottom hint */}
        <p className="text-center text-xs text-neutral-600 mt-6">
          {items.length} accounts evaluated recently ·{' '}
          <Link href="/history" className="text-[#00F2EA] hover:underline">View all history</Link>
        </p>
      </div>
    </section>
  )
}
