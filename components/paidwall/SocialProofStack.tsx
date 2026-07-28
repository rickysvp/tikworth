'use client'

import { Star, Quote, CheckCircle2 } from 'lucide-react'

// 6a 数字层
const STATS = [
  { value: '1,247', label: '已解锁创作者' },
  { value: '4.9/5', label: '用户评分' },
  { value: '92%', label: '续费率' },
]

// 6b 推荐语（多段轮播）
const TESTIMONIALS = [
  {
    quote: '用了 TikWorth 才知道我的账号估值 $45K，按品牌匹配建议找到了 3 个合作，月收入翻了一倍。',
    name: '已验证创作者',
    initial: 'S',
  },
  {
    quote: '趋势分析推荐的 3 个 BGM 全部用上去了，其中一个视频 24h 破百万播放，涨粉 2 万。',
    name: '@lifestyle_emma',
    initial: 'E',
  },
  {
    quote: '10 维雷达帮我发现了 3 个假粉信号，及时调整内容方向，账号健康度从 D 升到 A。',
    name: '@techreview_jp',
    initial: 'T',
  },
]

export function SocialProofStack() {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-5">
      {/* 6a 数字层 */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {STATS.map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-lg sm:text-xl font-black gradient-text tabular-nums leading-none">
              {stat.value}
            </div>
            <div className="text-[10px] text-neutral-500 mt-1.5 leading-tight">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 分隔 */}
      <div className="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent mb-4" />

      {/* 6b 推荐语 */}
      <div className="space-y-3">
        {TESTIMONIALS.map((t, i) => (
          <div
            key={i}
            className="relative rounded-xl border border-neutral-800/60 bg-neutral-900/40 px-4 py-3"
          >
            <Quote className="absolute -top-1.5 -left-1.5 h-5 w-5 text-[#FF0050]/30 fill-[#FF0050]/20" />
            <p className="text-xs text-neutral-300 italic leading-relaxed pl-1">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="flex items-center gap-2 mt-2.5 pl-1">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-[#FF0050] to-[#00F2EA] flex items-center justify-center text-[10px] font-bold text-white">
                {t.initial}
              </div>
              <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                {t.name}
                {t.name !== '已验证创作者' && (
                  <CheckCircle2 className="h-2.5 w-2.5 text-[#00F2EA]" />
                )}
              </span>
              <div className="flex items-center gap-0.5 ml-auto">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
