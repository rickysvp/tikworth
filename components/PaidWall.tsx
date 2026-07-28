'use client'

import { Lock, TrendingUp, DollarSign, Shield, BarChart3, Lightbulb, Building2, Calendar, Star, Activity, Target, ShoppingBag, Zap } from 'lucide-react'
import type { Evaluation } from '@/types'

interface PaidWallProps {
  onUnlock: () => void
  result?: Evaluation | null
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return '$' + Math.round(n).toString()
}

export function PaidWall({ onUnlock, result }: PaidWallProps) {
  const incomeEstimate = result?.incomeEstimate
  const peerRanking = result?.peerRanking
  const brandMatching = result?.brandMatching
  const revenueRoadmap = result?.revenueRoadmap
  const username = result?.username || ''

  return (
    <div className="rounded-3xl border border-neutral-800 bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] overflow-hidden">
      {/* Social proof badge */}
      <div className="flex justify-center pt-4 pb-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#00F2EA]/30 bg-[#0f0f0f] px-4 py-1.5 shadow-lg shadow-[#00F2EA]/10">
          <Star className="h-3.5 w-3.5 text-[#00F2EA]" />
          <span className="text-xs text-neutral-400">
            已为 <span className="text-[#00F2EA] font-semibold">1,247</span> 个账号提供评估
          </span>
        </div>
      </div>

      {/* Content area: blur preview + gradient + CTA share the same grid cell */}
      <div className="grid grid-cols-1">
        {/* Blurred preview of locked content */}
        <div className="col-start-1 row-start-1 px-6 sm:px-8 pb-6 filter blur-[6px] select-none pointer-events-none opacity-25">
        {/* Income preview */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-neutral-300 mb-2">收入与增长</div>
          {incomeEstimate ? (
            <div className="mb-3">
              <div className="text-2xl font-black text-[#00F2EA]">
                {formatUsd(incomeEstimate.monthlyTotal.low)} - {formatUsd(incomeEstimate.monthlyTotal.high)}
              </div>
              <div className="text-xs text-neutral-400 mt-1">月收入预估</div>
            </div>
          ) : (
            <div className="h-10 w-40 bg-neutral-700 rounded-xl mb-3" />
          )}
          <div className="flex gap-2 mb-3">
            {incomeEstimate?.breakdown.slice(0, 4).map((src, i) => (
              <div key={i} className="rounded-full border border-neutral-700 bg-neutral-800/50 px-2.5 py-1 text-xs text-neutral-400">
                {src.label}
              </div>
            ))}
          </div>
          {/* Roadmap timeline */}
          <div className="flex gap-4">
            {revenueRoadmap?.projections.slice(0, 3).map((m, i) => (
              <div key={i} className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
                <div className="text-xs text-neutral-500">{m.label}</div>
                <div className="text-sm font-bold text-[#00F2EA]">{formatUsd(m.revenue.mid)}</div>
                <div className="text-[10px] text-neutral-600 mt-1">{m.milestone}</div>
              </div>
            )) || (
              <>
                <div className="flex-1 h-16 bg-neutral-800 rounded-xl" />
                <div className="flex-1 h-16 bg-neutral-800 rounded-xl" />
                <div className="flex-1 h-16 bg-neutral-800 rounded-xl" />
              </>
            )}
          </div>
        </div>

        {/* Brand + Content preview */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-neutral-300 mb-2">品牌匹配与内容策略</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="text-xs text-neutral-500 mb-2">品牌合作匹配</div>
              {brandMatching?.matches.slice(0, 3).map((m, i) => (
                <div key={i} className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-neutral-300">{m.category}</span>
                  <span className="text-[#00F2EA] font-semibold">{formatUsd(m.estimatedDealRange.low)}-{formatUsd(m.estimatedDealRange.high)}</span>
                </div>
              )) || <div className="h-20 bg-neutral-800 rounded-xl" />}
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="text-xs text-neutral-500 mb-2">内容策略</div>
              {result?.contentStrategy?.pillars.slice(0, 3).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-xs mb-1.5">
                  <Activity className="h-3 w-3 text-[#FF0050]" />
                  <span className="text-neutral-300">{p.type}</span>
                  <span className="text-neutral-600 ml-auto">{p.frequency}</span>
                </div>
              )) || <div className="h-20 bg-neutral-800 rounded-xl" />}
            </div>
          </div>
        </div>

        {/* Radar & Risk preview */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-neutral-300 mb-2">评分与风险</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="text-xs text-neutral-500 mb-2">10 维度雷达评分</div>
              {peerRanking ? (
                <div className="text-center">
                  <div className="text-3xl font-black text-[#00F2EA]">{peerRanking.tierLabel}</div>
                  <div className="text-xs text-neutral-500 mt-1">{peerRanking.peerGroupDescription}</div>
                </div>
              ) : (
                <div className="h-20 bg-neutral-800 rounded-xl" />
              )}
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
              <div className="text-xs text-neutral-500 mb-2">风险信号</div>
              {result?.riskFlags.slice(0, 3).map((r, i) => (
                <div key={i} className="flex items-center gap-2 text-xs mb-1.5">
                  <span className={`h-2 w-2 rounded-full ${r.level === 'high' ? 'bg-red-500' : r.level === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <span className="text-neutral-300">{r.label}</span>
                </div>
              )) || <div className="h-20 bg-neutral-800 rounded-xl" />}
            </div>
          </div>
        </div>

        {/* Deep analysis preview */}
        <div className="mb-4">
          <div className="text-sm font-semibold text-neutral-300 mb-2">深度分析</div>
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-center">
              <div className="text-sm font-bold text-[#00F2EA]">{result?.metrics.engagementRate}%</div>
              <div className="text-[10px] text-neutral-500 mt-1">互动率</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-center">
              <div className="text-sm font-bold text-[#00F2EA]">{result?.metrics.avgPlays ? (result.metrics.avgPlays >= 1000 ? (result.metrics.avgPlays / 1000).toFixed(1) + 'K' : result.metrics.avgPlays) : '-'}</div>
              <div className="text-[10px] text-neutral-500 mt-1">平均播放</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-center">
              <div className="text-sm font-bold text-[#00F2EA]">{result?.accountHealth?.overallScore}</div>
              <div className="text-[10px] text-neutral-500 mt-1">健康分</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-center">
              <div className="text-sm font-bold text-[#00F2EA]">{result?.peerBenchmark?.percentile}%</div>
              <div className="text-[10px] text-neutral-500 mt-1">百分位</div>
            </div>
          </div>
        </div>
      </div>

        {/* Gradient fade over blur */}
        <div className="col-start-1 row-start-1 bg-gradient-to-b from-transparent via-[#0f0f0f]/50 to-[#0f0f0f]" />

        {/* Overlay CTA */}
        <div className="col-start-1 row-start-1 z-10 flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center max-w-lg">
          {/* Lock icon with glow */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-2xl bg-[#FF0050]/20 blur-xl" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF0050] to-[#ff3377] shadow-lg shadow-[#FF0050]/25">
              <Lock className="h-7 w-7 text-white" />
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold mb-3">
            {username ? `解锁 @${username} 的完整商业报告` : '解锁完整分析报告'}
          </h3>
          <p className="text-sm text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            查看收入预估、品牌匹配清单、增长路线图 — 让账号价值提升 3 倍
          </p>

          {/* Feature grid - 2 rows x 5 cols */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-8">
            <div className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <DollarSign className="h-5 w-5 text-[#00F2EA]" />
              <span className="text-[11px] text-neutral-400">收入预估</span>
              <span className="text-[10px] text-neutral-600">5个渠道</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <Calendar className="h-5 w-5 text-[#00F2EA]" />
              <span className="text-[11px] text-neutral-400">收益路线图</span>
              <span className="text-[10px] text-neutral-600">12月预测</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <Target className="h-5 w-5 text-[#00F2EA]" />
              <span className="text-[11px] text-neutral-400">商业化方向</span>
              <span className="text-[10px] text-neutral-600">8大路径</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <BarChart3 className="h-5 w-5 text-[#00F2EA]" />
              <span className="text-[11px] text-neutral-400">同行排名</span>
              <span className="text-[10px] text-neutral-600">百分位</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <Shield className="h-5 w-5 text-[#00F2EA]" />
              <span className="text-[11px] text-neutral-400">风险检测</span>
              <span className="text-[10px] text-neutral-600">10维度</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <Building2 className="h-5 w-5 text-[#FF0050]" />
              <span className="text-[11px] text-neutral-400">品牌匹配</span>
              <span className="text-[10px] text-neutral-600">报价单</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <Lightbulb className="h-5 w-5 text-[#FF0050]" />
              <span className="text-[11px] text-neutral-400">内容策略</span>
              <span className="text-[10px] text-neutral-600">标签推荐</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <TrendingUp className="h-5 w-5 text-[#FF0050]" />
              <span className="text-[11px] text-neutral-400">趋势分析</span>
              <span className="text-[10px] text-neutral-600">热门话题</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <ShoppingBag className="h-5 w-5 text-[#FF0050]" />
              <span className="text-[11px] text-neutral-400">变现路径</span>
              <span className="text-[10px] text-neutral-600">带货+直播</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <Activity className="h-5 w-5 text-[#FF0050]" />
              <span className="text-[11px] text-neutral-400">深度分析</span>
              <span className="text-[10px] text-neutral-600">4大模块</span>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3">
            <p className="text-xs text-neutral-500 italic leading-relaxed">
              &ldquo;用了 TikWorth 才知道我的账号估值 $45K，按品牌匹配建议找到了 3 个合作，月收入翻了一倍。&rdquo;
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-5 w-5 rounded-full bg-[#FF0050]/20 flex items-center justify-center">
                <Star className="h-3 w-3 text-[#FF0050]" />
              </div>
              <span className="text-[10px] text-neutral-600">来自已验证用户</span>
            </div>
          </div>

          {/* CTA button */}
          <button
            onClick={onUnlock}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF0050] to-[#ff3377] px-8 py-3.5 font-semibold text-white hover:from-[#d60043] hover:to-[#e62e6b] transition-all shadow-lg shadow-[#FF0050]/25"
          >
            <Lock className="h-4 w-4" />
            解锁完整报告 — $9.9
          </button>

          {/* Price anchor */}
          <p className="text-xs text-neutral-600 mt-3">
            对比竞品 $69-299/月，我们仅需 $9.9 解锁全部
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            高质量账号养成，提升账号权重，获取更多浏览，从而获得更多创作者收益
          </p>

          {/* Multi-tier pricing */}
          <div className="grid grid-cols-2 gap-3 mt-6 max-w-md mx-auto">
            <div className="rounded-xl border border-neutral-700 bg-neutral-900/60 p-3 text-center hover:border-[#00F2EA]/30 transition-colors">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">月度会员</div>
              <div className="text-lg font-bold text-[#00F2EA]">$19.9<span className="text-xs font-normal text-neutral-500">/月</span></div>
              <div className="text-[10px] text-neutral-500 mt-1">5次评估 · 追踪 · PDF</div>
            </div>
            <div className="rounded-xl border border-[#FF0050]/30 bg-[#FF0050]/5 p-3 text-center relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#FF0050] px-2 py-0.5 text-[9px] font-semibold text-white">
                  <Zap className="h-2.5 w-2.5" />推荐
                </span>
              </div>
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1 mt-1">季度会员</div>
              <div className="text-lg font-bold text-[#FF0050]">$39.9<span className="text-xs font-normal text-neutral-500">/季</span></div>
              <div className="text-[10px] text-neutral-500 mt-1">10次评估 · 全部功能</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}