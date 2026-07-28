'use client'

import { CheckCircle2 } from 'lucide-react'

export function UnlockBanner() {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#00F2EA]/30 bg-[#00F2EA]/5 px-4 py-3">
      <CheckCircle2 className="h-5 w-5 text-[#00F2EA] shrink-0" />
      <div className="flex-1">
        <span className="text-sm font-medium text-[#00F2EA]">已解锁完整报告</span>
        <span className="text-xs text-neutral-500 ml-2">包含收入预估、增长计划、账号健康诊断等全部深度分析</span>
      </div>
    </div>
  )
}