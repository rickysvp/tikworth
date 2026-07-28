'use client'

import { TrendingUp, Shield, Building2, Lightbulb, type LucideIcon } from 'lucide-react'

interface ValueItem {
  icon: LucideIcon
  title: string
  desc: string
  highlight: string
}

const ITEMS: ValueItem[] = [
  {
    icon: TrendingUp,
    title: '收入 5 渠道明细 + 12 个月路线图',
    desc: '品牌赞助 / 创作者基金 / 订阅 / Shop / LIVE 礼物完整拆解',
    highlight: '5 渠道',
  },
  {
    icon: Shield,
    title: '10 维雷达评分 + 风险检测',
    desc: '限流 / 异常波动 / 假粉信号一图看清',
    highlight: '10 维度',
  },
  {
    icon: Building2,
    title: '品牌匹配清单 + 报价单',
    desc: '匹配品类、示例品牌、单条合作区间',
    highlight: '报价单',
  },
  {
    icon: Lightbulb,
    title: '趋势分析 + 商业化建议',
    desc: '热门话题、BGM、创作方向、变现路径',
    highlight: '可执行',
  },
]

export function ValueStack() {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-4 w-4 text-[#00F2EA]" />
        <h4 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
          解锁后独家获得
        </h4>
      </div>
      <ul className="space-y-3">
        {ITEMS.map((item, i) => {
          const Icon = item.icon
          return (
            <li key={i} className="flex items-start gap-3">
              <div className="shrink-0 mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#00F2EA]/10 border border-[#00F2EA]/20">
                <Icon className="h-4 w-4 text-[#00F2EA]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{item.title}</span>
                  <span className="inline-flex items-center rounded-full border border-[#00F2EA]/30 bg-[#00F2EA]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#00F2EA]">
                    {item.highlight}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
