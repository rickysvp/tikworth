'use client'

import { Users, Sparkles } from 'lucide-react'
import type { Evaluation } from '@/types'
import { LiveTickerBar } from './paidwall/LiveTickerBar'
import { TitleBlock } from './paidwall/TitleBlock'
import { FreeHookPreview } from './paidwall/FreeHookPreview'
import { BlurredPreview } from './paidwall/BlurredPreview'
import { SocialProofStack } from './paidwall/SocialProofStack'
import { PricingCard } from './paidwall/PricingCard'
import { RiskReassurance } from './paidwall/RiskReassurance'

interface PaidWallProps {
  onUnlock: () => void
  result?: Evaluation | null
}

export function PaidWall({ onUnlock, result }: PaidWallProps) {
  const username = result?.username || ''

  return (
    <div className="relative rounded-3xl border border-neutral-800 bg-[#0a0a0a] overflow-hidden bg-mesh-gradient-strong bg-grid-pattern isolate animate-fade-in-up">
      {/* 顶部光斑装饰 */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-[#FF0050]/10 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-20 w-64 h-64 bg-[#00F2EA]/5 rounded-full blur-3xl" />

      {/* ① 顶部实时动态条 */}
      <LiveTickerBar />

      {/* 主内容 */}
      <div className="relative px-6 sm:px-10 pt-8 pb-10">
        {/* ② 标题区 */}
        <TitleBlock username={username} totalBlocks={4} />

        {/* ③ 免费钩子预览 */}
        {result && (
          <div className="mt-7">
            <FreeHookPreview result={result} />
          </div>
        )}

        {/* ④ 半遮罩预览层 */}
        <div className="mt-5">
          <BlurredPreview />
        </div>

        {/* ⑤ 社会证明三段式 */}
        <div className="mt-5">
          <SocialProofStack />
        </div>

        {/* ⑥ 价格锚定 + 三档套餐 */}
        <div className="mt-7">
          {/* 价格锚定标题 */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-1.5 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-[#FF0050]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                选择解锁方式
              </span>
              <Sparkles className="h-3.5 w-3.5 text-[#FF0050]" />
            </div>
            <div className="text-sm font-semibold text-white">
              一次性解锁全部 Layer 3 + Layer 4 + 雷达风险
            </div>
            <div className="text-[10px] text-neutral-500 mt-1.5">
              对比同行工具单月 $69 起 · TikWorth 不到 1/3
            </div>
          </div>

          {/* 三档定价 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PricingCard
              tier="onetime"
              price={9.9}
              unit="一次性解锁当前报告"
              originalPrice={39.9}
              features={['解锁当前账号完整报告', '含 12 个月路线图', 'PDF 高清导出']}
              ctaLabel="单次解锁 $9.9"
              onClick={onUnlock}
            />
            <PricingCard
              tier="monthly"
              price={19.9}
              unit="/月 · 5 次评估"
              features={['每月 5 次评估', '无限追踪账号', 'PDF 高清导出', '优先体验新功能']}
              ctaLabel="开通月度"
              onClick={onUnlock}
            />
            <PricingCard
              tier="quarterly"
              price={39.9}
              unit="/季 · 平均 $13.3/月"
              recommended
              badge="最受欢迎"
              features={[
                '每季 10 次评估',
                '全部高级功能解锁',
                '趋势分析 + 商业化',
                '24h 优先支持',
              ]}
              ctaLabel="开通季度（推荐）"
              onClick={onUnlock}
            />
          </div>
        </div>

        {/* ⑦ 风险消除层 */}
        <div className="mt-5">
          <RiskReassurance />
        </div>

        {/* ⑧ 底部价值闭环 */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-1.5 text-[10px] text-neutral-500 leading-relaxed">
            <Users className="h-3 w-3 text-[#00F2EA]" />
            <span>
              高质量账号养成 · 提升账号权重 · 获取更多浏览 ·{' '}
              <span className="text-[#00F2EA] font-semibold">获得更多创作者收益</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
