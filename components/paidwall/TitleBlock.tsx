'use client'

import { Lock, Sparkles } from 'lucide-react'

interface TitleBlockProps {
  username?: string
  totalBlocks?: number
}

export function TitleBlock({ username, totalBlocks = 4 }: TitleBlockProps) {
  return (
    <div className="text-center max-w-xl mx-auto">
      {/* 3D 锁图标 + 渐变光斑 */}
      <div className="relative inline-flex mb-5 animate-float">
        {/* 外层光斑 */}
        <div className="absolute -inset-4 rounded-3xl bg-[#FF0050]/20 blur-2xl" />
        <div className="absolute -inset-2 rounded-3xl bg-[#FF0050]/10 blur-xl" />

        {/* 主图标 */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF0050] via-[#ff1a5f] to-[#ff3377] shadow-2xl shadow-[#FF0050]/40 ring-1 ring-white/10">
          <Lock className="h-7 w-7 text-white drop-shadow-lg" strokeWidth={2.5} />
        </div>

        {/* 装饰光点 */}
        <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#00F2EA] shadow-lg shadow-[#00F2EA]/50" />
        <div className="absolute -bottom-1 -left-1 h-1.5 w-1.5 rounded-full bg-[#FF0050] shadow-lg shadow-[#FF0050]/50" />
      </div>

      {/* 标签 */}
      <div className="inline-flex items-center gap-1.5 rounded-full border border-[#FF0050]/30 bg-[#FF0050]/5 px-3 py-1 mb-4">
        <Sparkles className="h-3 w-3 text-[#FF0050]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF0050]">
          完整商业化报告
        </span>
      </div>

      {/* 主标题 */}
      <h3 className="text-2xl sm:text-3xl font-black leading-tight mb-3 text-balance">
        {username ? (
          <>
            解锁{' '}
            <span className="gradient-text-cyan">@{username}</span>{' '}
            的商业价值
          </>
        ) : (
          <span className="gradient-text-pink">解锁完整分析报告</span>
        )}
      </h3>

      {/* 副标题 */}
      <p className="text-sm text-neutral-400 leading-relaxed max-w-md mx-auto">
        {totalBlocks} 块独家内容 · 12 个月路线图 · 真实可落地的变现建议
      </p>
    </div>
  )
}
