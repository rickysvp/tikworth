'use client'

import { TrendingUp, Shield, Building2, Lightbulb, Lock, type LucideIcon } from 'lucide-react'

interface PreviewItem {
  icon: LucideIcon
  title: string
  desc: string
  tag: string
}

const ITEMS: PreviewItem[] = [
  {
    icon: TrendingUp,
    title: '收入 5 渠道明细 + 12 个月路线图',
    desc: '品牌赞助 / 创作者基金 / 订阅 / Shop / LIVE 礼物完整拆解',
    tag: '5 渠道',
  },
  {
    icon: Shield,
    title: '10 维雷达评分 + 风险检测',
    desc: '限流 / 异常波动 / 假粉信号一图看清',
    tag: '10 维度',
  },
  {
    icon: Building2,
    title: '品牌匹配清单 + 报价单',
    desc: '匹配品类、示例品牌、单条合作区间',
    tag: '报价单',
  },
  {
    icon: Lightbulb,
    title: '趋势分析 + 商业化建议',
    desc: '热门话题、BGM、创作方向、变现路径',
    tag: '可执行',
  },
]

export function BlurredPreview() {
  return (
    <div className="relative">
      {/* 顶部标签 */}
      <div className="flex items-center gap-2 mb-3">
        <Lock className="h-3.5 w-3.5 text-[#FF0050]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          再往下 4 块独家内容
        </span>
      </div>

      {/* 卡片堆叠容器 */}
      <div className="relative rounded-2xl border border-neutral-800 bg-[#0f0f0f]/80 overflow-hidden">
        <div className="divide-y divide-neutral-800/60">
          {ITEMS.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className="relative flex items-start gap-3 px-4 py-3.5"
              >
                <div className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#00F2EA]/10 border border-[#00F2EA]/20">
                  <Icon className="h-4 w-4 text-[#00F2EA]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{item.title}</span>
                    <span className="inline-flex items-center rounded-full border border-[#00F2EA]/30 bg-[#00F2EA]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#00F2EA]">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 渐变遮罩 + 锁标 */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/85 to-transparent pointer-events-none" />

        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-4 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FF0050]/40 bg-[#0a0a0a]/90 px-3 py-1 shadow-lg shadow-[#FF0050]/20">
            <Lock className="h-3 w-3 text-[#FF0050]" />
            <span className="text-[10px] font-bold text-[#FF0050] uppercase tracking-wider">
              解锁全部
            </span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-2 text-center px-4">
            选择下方套餐一次性解锁所有内容
          </p>
        </div>
      </div>
    </div>
  )
}
