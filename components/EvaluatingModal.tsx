'use client'

import { useEffect } from 'react'
import { Download, FileSearch, BarChart3, DollarSign, Sparkles, Check, Loader2, AlertCircle, XCircle } from 'lucide-react'

export type EvaluatingStatus = 'evaluating' | 'completing' | 'error'

interface EvaluatingModalProps {
  open: boolean
  username: string
  status: EvaluatingStatus
  currentStage: number       // 0-4
  errorMessage?: string
  onComplete: () => void
  /** i18n 文案注入（由父组件从 dict 取出传入，保持组件无 i18n 依赖） */
  labels: {
    title: string
    subtitle: string
    stages: [string, string, string, string, string]
    completing: string
    error: string
  }
}

const STAGE_ICONS = [Download, FileSearch, BarChart3, DollarSign, Sparkles]
const STAGE_COLORS = ['#00F2EA', '#00F2EA', '#FF0050', '#FF0050', '#00F2EA']

export function EvaluatingModal({
  open,
  username,
  status,
  currentStage,
  errorMessage,
  onComplete,
  labels,
}: EvaluatingModalProps) {
  // 锁定滚动
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  // 收尾/错误状态自动关闭
  useEffect(() => {
    if (!open) return
    if (status === 'completing') {
      const t = setTimeout(onComplete, 900)
      return () => clearTimeout(t)
    }
    if (status === 'error') {
      const t = setTimeout(onComplete, 1600)
      return () => clearTimeout(t)
    }
  }, [open, status, onComplete])

  if (!open) return null

  // 收尾状态：所有阶段视为已完成
  const effectiveStage = status === 'completing' ? 5 : currentStage
  const isCompleting = status === 'completing'
  const isError = status === 'error'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[#FF0050]/30 bg-[#0a0a0a] overflow-hidden animate-scale-in">
        {/* 顶部渐变光晕 */}
        <div className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-[#FF0050]/20 via-[#00F2EA]/10 to-transparent blur-2xl" />

        {/* 顶部账号信息 */}
        <div className="relative px-6 pt-6 pb-4 border-b border-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF0050] to-[#00F2EA] flex items-center justify-center text-white font-bold text-sm">
              @{username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-white truncate">@{username}</div>
              <div className="text-xs text-neutral-500">{labels.subtitle}</div>
            </div>
            {!isCompleting && !isError && (
              <Loader2 className="h-4 w-4 animate-spin text-[#00F2EA]" />
            )}
          </div>
        </div>

        {/* 阶段列表 */}
        <div className="relative px-6 py-5 space-y-3">
          {labels.stages.map((label, idx) => {
            const Icon = STAGE_ICONS[idx]
            const color = STAGE_COLORS[idx]
            const isDone = effectiveStage > idx
            const isActive = !isCompleting && !isError && effectiveStage === idx
            const isDimmed = isError

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 transition-opacity duration-300 ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
              >
                {/* 图标圆圈 */}
                <div
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isDone
                      ? 'border'
                      : isActive
                      ? 'border-2'
                      : 'border border-neutral-800'
                  }`}
                  style={{
                    borderColor: isDone || isActive ? color : undefined,
                    backgroundColor: isActive ? `${color}1a` : isDone ? `${color}10` : undefined,
                  }}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" style={{ color }} />
                  ) : isActive ? (
                    <>
                      <Icon className="h-4 w-4 relative z-10" style={{ color }} />
                      <span
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{ backgroundColor: `${color}30` }}
                      />
                    </>
                  ) : (
                    <Icon className="h-4 w-4 text-neutral-600" />
                  )}
                </div>

                {/* 阶段名 */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium truncate transition-colors duration-300 ${
                      isDone ? 'text-neutral-400' : isActive ? 'text-white' : 'text-neutral-600'
                    }`}
                  >
                    {label}
                  </div>
                </div>

                {/* 右侧状态 */}
                <div className="shrink-0">
                  {isDone ? (
                    <Check className="h-4 w-4" style={{ color }} />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color }} />
                  ) : (
                    <span className="block w-1.5 h-1.5 rounded-full bg-neutral-700" />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 底部进度条 */}
        <div className="relative px-6 pb-5">
          <div className="flex gap-1.5">
            {labels.stages.map((_, idx) => {
              const isDone = effectiveStage > idx
              const isActive = !isCompleting && !isError && effectiveStage === idx
              const color = STAGE_COLORS[idx]
              return (
                <div
                  key={idx}
                  className="h-1 flex-1 rounded-full overflow-hidden bg-neutral-800 transition-all duration-500"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isActive ? 'animate-pulse' : ''
                    }`}
                    style={{
                      width: isDone ? '100%' : isActive ? '60%' : '0%',
                      backgroundColor: isDone || isActive ? color : undefined,
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* 收尾状态覆盖层 */}
        {(isCompleting || isError) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a]/95 backdrop-blur-sm animate-scale-in px-6">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                isCompleting
                  ? 'bg-gradient-to-br from-[#FF0050] to-[#00F2EA]'
                  : 'bg-red-950/50 border border-red-900'
              }`}
            >
              {isCompleting ? (
                <Check className="h-8 w-8 text-white" strokeWidth={3} />
              ) : (
                <XCircle className="h-8 w-8 text-red-400" />
              )}
            </div>
            <div className={`text-lg font-bold ${isCompleting ? 'text-white' : 'text-red-300'}`}>
              {isCompleting ? labels.completing : labels.error}
            </div>
            {isError && errorMessage && (
              <div className="mt-2 text-xs text-red-400/80 text-center max-w-xs line-clamp-2">
                {errorMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
