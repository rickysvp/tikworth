'use client'

import { CommerceReadiness } from '@/types'
import {
  ShoppingBag, Radio, CheckCircle2, XCircle,
  Package, BarChart3, Lightbulb,
} from 'lucide-react'
import { useState } from 'react'
import { formatUsd } from '@/lib/format'
import { useI18n } from '@/lib/i18n/context'

interface Props {
  readiness: CommerceReadiness
}

type TabId = 'channels' | 'signals' | 'products'

const tierConfig: Record<CommerceReadiness['tier'], { color: string; bg: string; border: string; ring: string }> = {
  'Commerce-Ready': { color: '#00F2EA', bg: 'bg-[#00F2EA]/10', border: 'border-[#00F2EA]/30', ring: '#00F2EA' },
  'Emerging': { color: '#f59e0b', bg: 'bg-amber-500/10', border: 'border-amber-500/30', ring: '#f59e0b' },
  'Limited': { color: '#FF0050', bg: 'bg-[#FF0050]/10', border: 'border-[#FF0050]/30', ring: '#FF0050' },
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r="26" fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${score * 1.634} 163.4`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold tabular-nums" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

function ChannelRow({ channel }: { channel: CommerceReadiness['channels'][0] }) {
  const { dict } = useI18n()
  const cr = dict.evaluation.commerceReadiness
  const isCommerce = ['tiktok_shop', 'amazon_associates', 'shopify_dtc', 'live_commerce'].includes(channel.source)
  const ringColor = channel.fitScore >= 70 ? '#00F2EA' : channel.fitScore >= 40 ? '#f59e0b' : '#FF0050'

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isCommerce ? 'border-neutral-800 bg-neutral-900/50' : 'border-neutral-800/50 bg-neutral-900/20'}`}>
      {/* Icon */}
      <span className="text-xl shrink-0">{channel.icon}</span>

      {/* Label + reasoning */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-neutral-200">{channel.label}</span>
          {isCommerce && (
            <span className="inline-flex items-center rounded-full bg-[#FF0050]/10 border border-[#FF0050]/20 px-1.5 py-0.5 text-[9px] font-medium text-[#FF0050]">
              COMMERCE
            </span>
          )}
        </div>
        <p className="text-[11px] text-neutral-500 truncate">{channel.reasoning}</p>
      </div>

      {/* Monthly amount */}
      <div className="text-right shrink-0">
        {channel.eligible ? (
          <>
            <div className="text-sm font-bold text-[#00F2EA] tabular-nums">
              {formatUsd(channel.monthlyAmount.low)}–{formatUsd(channel.monthlyAmount.high)}
            </div>
            <div className="text-[9px] text-neutral-600">{cr.estMonthly}</div>
          </>
        ) : (
          <span className="text-[10px] text-neutral-600">{cr.notEligible}</span>
        )}
      </div>

      {/* Fit ring */}
      <div className="relative w-11 h-11 shrink-0">
        <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle cx="22" cy="22" r="18" fill="none" stroke={ringColor} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${channel.fitScore * 1.131} 113.1`} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold tabular-nums" style={{ color: ringColor }}>{channel.fitScore}</span>
        </div>
      </div>
    </div>
  )
}

function SignalRow({ signal }: { signal: CommerceReadiness['signals'][0] }) {
  const { dict } = useI18n()
  const cr = dict.evaluation.commerceReadiness
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-neutral-800 bg-neutral-900/40">
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${signal.detected ? 'bg-[#00F2EA]/15' : 'bg-neutral-800'}`}>
        {signal.detected
          ? <CheckCircle2 className="h-4 w-4 text-[#00F2EA]" />
          : <XCircle className="h-4 w-4 text-neutral-600" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-sm font-semibold text-neutral-200">{signal.label}</span>
          <span className={`text-[10px] font-medium ${signal.detected ? 'text-[#00F2EA]' : 'text-neutral-600'}`}>
            {signal.detected ? cr.detected : cr.notDetected}
          </span>
        </div>
        <p className="text-[11px] text-neutral-500 leading-relaxed mb-1.5">{signal.detail}</p>
        {/* Weight bar */}
        <div className="h-1 rounded-full bg-neutral-800 overflow-hidden">
          <div
            className={`h-full rounded-full ${signal.detected ? 'bg-[#00F2EA]' : 'bg-neutral-700'}`}
            style={{ width: `${Math.round(signal.weight * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: CommerceReadiness['productMatches'][0] }) {
  const { dict } = useI18n()
  const cr = dict.evaluation.commerceReadiness
  const ringColor = product.fitScore >= 70 ? '#00F2EA' : product.fitScore >= 50 ? '#f59e0b' : '#FF0050'
  return (
    <div className="rounded-xl border border-neutral-800 bg-gradient-to-br from-neutral-900/60 to-[#0f0f0f] p-4">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl shrink-0">{product.icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-neutral-100">{product.category}</h4>
          <p className="text-[11px] text-neutral-500 leading-relaxed">{product.reasoning}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-neutral-600 uppercase tracking-wider">{cr.avgOrderValue}</div>
          <div className="text-sm font-bold text-[#00F2EA] tabular-nums">${product.avgOrderValue}</div>
        </div>
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <circle cx="24" cy="24" r="20" fill="none" stroke={ringColor} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${product.fitScore * 1.256} 125.6`} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold tabular-nums" style={{ color: ringColor }}>{product.fitScore}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CommerceReadinessSection({ readiness }: Props) {
  const { dict } = useI18n()
  const cr = dict.evaluation.commerceReadiness
  const [activeTab, setActiveTab] = useState<TabId>('channels')

  const tier = tierConfig[readiness.tier]
  const tierLabel = readiness.tier === 'Commerce-Ready' ? cr.tierReady : readiness.tier === 'Emerging' ? cr.tierEmerging : cr.tierLimited

  const tabs: { id: TabId; label: string; icon: typeof BarChart3; count: number }[] = [
    { id: 'channels', label: cr.channelMatrix, icon: BarChart3, count: readiness.channels.length },
    { id: 'signals', label: cr.signalDetection, icon: Radio, count: readiness.signals.length },
    { id: 'products', label: cr.productMatch, icon: Package, count: readiness.productMatches.length },
  ]

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <ShoppingBag className="h-5 w-5 text-[#FF0050]" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{cr.title}</h3>
      </div>

      {/* Score + Tier + Summary */}
      <div className={`rounded-xl border ${tier.border} ${tier.bg} p-4 mb-5`}>
        <div className="flex items-center gap-4">
          <ScoreRing score={readiness.overallScore} color={tier.ring} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center rounded-full border ${tier.border} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider`} style={{ color: tier.color }}>
                {tierLabel}
              </span>
              <span className="text-[10px] text-neutral-600">{cr.overallScore}</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">{readiness.summary}</p>
          </div>
        </div>

        {/* Commerce Content Ratio */}
        <div className="mt-3 pt-3 border-t border-neutral-800/50">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-neutral-500">{cr.commerceContentRatio}</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: tier.color }}>{readiness.contentCommerceRatio}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(readiness.contentCommerceRatio, 100)}%`, backgroundColor: tier.color }} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 p-1 rounded-xl bg-neutral-900/60 border border-neutral-800">
        {tabs.map(tab => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#FF0050]/15 text-[#FF0050] border border-[#FF0050]/30'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50 border border-transparent'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="text-[9px] opacity-60">{tab.count}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'channels' && (
        <div className="space-y-2">
          {readiness.channels.map(ch => (
            <ChannelRow key={ch.source} channel={ch} />
          ))}
        </div>
      )}

      {activeTab === 'signals' && (
        <div className="space-y-2">
          {readiness.signals.map((sig, i) => (
            <SignalRow key={i} signal={sig} />
          ))}
        </div>
      )}

      {activeTab === 'products' && (
        <div className="grid gap-3 sm:grid-cols-3">
          {readiness.productMatches.map((prod, i) => (
            <ProductCard key={i} product={prod} />
          ))}
        </div>
      )}

      {/* Recommendation */}
      <div className="flex items-start gap-2 pt-4 mt-4 border-t border-neutral-800">
        <Lightbulb className="h-4 w-4 text-[#00F2EA] mt-0.5 shrink-0" />
        <div>
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">{cr.recommendation}</div>
          <p className="text-xs text-neutral-400 leading-relaxed">{readiness.recommendation}</p>
        </div>
      </div>
    </div>
  )
}
