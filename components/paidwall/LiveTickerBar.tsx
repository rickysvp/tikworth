'use client'

import { Flame } from 'lucide-react'

// 实时解锁动态 mock 数据（生产环境可接入 analytics）
const TICKER_ITEMS = [
  { user: 'sarah_creator', action: '解锁了完整报告', time: '2 分钟前', region: 'US' },
  { user: 'mia_dance', action: '升级了季度会员', time: '3 分钟前', region: 'UK' },
  { user: 'techreview_jp', action: '解锁了完整报告', time: '5 分钟前', region: 'JP' },
  { user: 'foodie_max', action: '解锁了完整报告', time: '7 分钟前', region: 'DE' },
  { user: 'lifestyle_emma', action: '升级了季度会员', time: '9 分钟前', region: 'CA' },
  { user: 'fitness_kai', action: '解锁了完整报告', time: '12 分钟前', region: 'AU' },
  { user: 'baking_lila', action: '解锁了完整报告', time: '14 分钟前', region: 'US' },
  { user: 'travel_neo', action: '升级了季度会员', time: '18 分钟前', region: 'SG' },
]

export function LiveTickerBar() {
  // 复制一份实现无缝滚动
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div className="relative overflow-hidden border-b border-[#FF0050]/20 bg-gradient-to-r from-[#FF0050]/[0.04] via-[#0a0a0a] to-[#00F2EA]/[0.04] py-2.5">
      {/* 渐隐遮罩 */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10" />

      {/* 左侧火焰徽章 */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 rounded-full bg-[#FF0050] px-2 py-0.5 shadow-lg shadow-[#FF0050]/30 animate-pulse-pink">
        <Flame className="h-3 w-3 text-white" />
        <span className="text-[10px] font-bold text-white uppercase tracking-wider">LIVE</span>
      </div>

      {/* 滚动内容 */}
      <div className="flex animate-marquee whitespace-nowrap pl-20">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 mx-6">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#00F2EA]/30 to-[#FF0050]/30 text-[9px] font-bold text-white">
              {item.region}
            </span>
            <span className="text-xs text-neutral-400">
              <span className="text-white font-semibold">@{item.user}</span>
              <span className="mx-1.5 text-neutral-600">·</span>
              <span className="text-[#00F2EA]">{item.action}</span>
              <span className="mx-1.5 text-neutral-600">·</span>
              <span className="text-neutral-500">{item.time}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
