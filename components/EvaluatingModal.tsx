'use client'

import { useEffect, useMemo } from 'react'
import { Download, FileSearch, BarChart3, DollarSign, Sparkles, Check, XCircle } from 'lucide-react'

export type EvaluatingStatus = 'evaluating' | 'completing' | 'error'

interface EvaluatingModalProps {
  open: boolean
  username: string
  status: EvaluatingStatus
  currentStage: number       // 0-4
  errorMessage?: string
  onComplete: () => void
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
const RING_SIZE = 240
const RING_STROKE = 6

export function EvaluatingModal({
  open,
  username,
  status,
  currentStage,
  errorMessage,
  onComplete,
  labels,
}: EvaluatingModalProps) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    if (status === 'completing') {
      const t = setTimeout(onComplete, 1100)
      return () => clearTimeout(t)
    }
    if (status === 'error') {
      const t = setTimeout(onComplete, 1800)
      return () => clearTimeout(t)
    }
  }, [open, status, onComplete])

  const isCompleting = status === 'completing'
  const isError = status === 'error'
  const effectiveStage = isCompleting ? 5 : currentStage
  const progressPct = Math.round((effectiveStage / 5) * 100)

  // SVG ring geometry
  const radius = (RING_SIZE - RING_STROKE) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = useMemo(
    () => circumference - (Math.max(0, Math.min(progressPct, 100)) / 100) * circumference,
    [circumference, progressPct]
  )

  if (!open) return null

  const CurrentIcon = STAGE_ICONS[Math.min(currentStage, 4)]
  const currentColor = isCompleting ? '#00F2EA' : isError ? '#ef4444' : STAGE_COLORS[Math.min(currentStage, 4)]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-lg animate-fade-in p-4 overflow-hidden">
      {/* ===== 大气背景层 ===== */}
      <div className="pointer-events-none absolute inset-0">
        {/* 网格底纹 */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40" />
        {/* 四角光晕 */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#FF0050]/20 blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#00F2EA]/15 blur-[100px]" />
        {/* 两侧数据流 */}
        <div className="absolute left-8 top-0 bottom-0 w-px overflow-hidden opacity-50">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-[#00F2EA] to-transparent" style={{ animation: 'data-flow 3s linear infinite' }} />
        </div>
        <div className="absolute right-8 top-0 bottom-0 w-px overflow-hidden opacity-50">
          <div className="w-px h-20 bg-gradient-to-b from-transparent via-[#FF0050] to-transparent" style={{ animation: 'data-flow 3s linear infinite 1.2s' }} />
        </div>
        <div className="absolute left-16 top-0 bottom-0 w-px overflow-hidden opacity-30">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#00F2EA] to-transparent" style={{ animation: 'data-flow 4s linear infinite 0.5s' }} />
        </div>
        <div className="absolute right-16 top-0 bottom-0 w-px overflow-hidden opacity-30">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#FF0050] to-transparent" style={{ animation: 'data-flow 4s linear infinite 2s' }} />
        </div>
      </div>

      {/* ===== 主弹窗 ===== */}
      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="relative rounded-3xl border border-neutral-800 bg-[#0a0a0a]/90 backdrop-blur-xl overflow-hidden">
          {/* 顶部细线渐变 */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FF0050] to-transparent" />

          {/* === 顶部账号栏 === */}
          <div className="relative flex items-center gap-3 px-6 py-4 border-b border-neutral-900">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF0050] to-[#00F2EA] flex items-center justify-center text-white font-black text-sm">
                {username.charAt(0).toUpperCase()}
              </div>
              {!isCompleting && !isError && (
                <span className="absolute -inset-1 rounded-full border border-[#00F2EA]/40 animate-pulse-cyan" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">@{username}</div>
              <div className="text-[11px] text-neutral-500 tracking-wide uppercase">{labels.subtitle}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-2xl font-black tabular-nums gradient-text leading-none">{progressPct}%</div>
            </div>
          </div>

          {/* === 中央扫描环 === */}
          <div className="relative flex flex-col items-center justify-center py-8">
            {/* 环外光晕 */}
            <div
              className="absolute w-[260px] h-[260px] rounded-full blur-3xl opacity-40 transition-colors duration-500"
              style={{ backgroundColor: currentColor }}
            />

            <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
              <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90 relative z-10">
                <defs>
                  <linearGradient id="eval-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00F2EA" />
                    <stop offset="100%" stopColor="#FF0050" />
                  </linearGradient>
                  <linearGradient id="eval-ring-grad-error" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
                {/* 外层轨道 */}
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={radius}
                  stroke="#1a1a1a"
                  strokeWidth={RING_STROKE}
                  fill="transparent"
                />
                {/* 进度弧 */}
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={radius}
                  stroke={isError ? 'url(#eval-ring-grad-error)' : 'url(#eval-ring-grad)'}
                  strokeWidth={RING_STROKE}
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
                />
                {/* 刻度装饰点 */}
                {Array.from({ length: 60 }).map((_, i) => {
                  const angle = (i / 60) * 2 * Math.PI
                  const inner = radius - 14
                  const outer = radius - 8
                  const x1 = RING_SIZE / 2 + inner * Math.cos(angle)
                  const y1 = RING_SIZE / 2 + inner * Math.sin(angle)
                  const x2 = RING_SIZE / 2 + outer * Math.cos(angle)
                  const y2 = RING_SIZE / 2 + outer * Math.sin(angle)
                  return (
                    <line
                      key={i}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke={i % 5 === 0 ? '#333' : '#1f1f1f'}
                      strokeWidth={1}
                    />
                  )
                })}
              </svg>

              {/* 旋转扫描线（仅评估中） */}
              {!isCompleting && !isError && (
                <div className="absolute inset-0 z-20 animate-scan-rotate">
                  <div
                    className="absolute top-1/2 left-1/2 origin-left h-px"
                    style={{
                      width: radius,
                      background: `linear-gradient(to right, ${currentColor}, transparent)`,
                      boxShadow: `0 0 8px ${currentColor}`,
                    }}
                  />
                </div>
              )}

              {/* 中心内容 */}
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center">
                {isCompleting ? (
                  <div className="animate-burst flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00F2EA] to-[#FF0050] flex items-center justify-center glow-pink-intense">
                      <Check className="h-9 w-9 text-white" strokeWidth={3} />
                    </div>
                  </div>
                ) : isError ? (
                  <div className="animate-burst flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-red-950/60 border border-red-800 flex items-center justify-center">
                      <XCircle className="h-9 w-9 text-red-400" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center animate-scan-pulse"
                      style={{
                        backgroundColor: `${currentColor}1a`,
                        border: `1px solid ${currentColor}40`,
                      }}
                    >
                      <CurrentIcon className="h-7 w-7" style={{ color: currentColor }} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 阶段名（大字） */}
            <div className="mt-6 text-center min-h-[2.5rem]">
              {isCompleting ? (
                <div className="text-xl font-black gradient-text tracking-tight">{labels.completing}</div>
              ) : isError ? (
                <div className="text-xl font-black text-red-400 tracking-tight">{labels.error}</div>
              ) : (
                <>
                  <div className="text-xl font-bold text-white tracking-tight">
                    {labels.stages[Math.min(currentStage, 4)]}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1 tracking-wider uppercase">
                    Stage {Math.min(currentStage + 1, 5)} / 5
                  </div>
                </>
              )}
            </div>
          </div>

          {/* === 底部时间线 === */}
          <div className="relative px-6 pb-6">
            <div className="relative flex items-center justify-between">
              {/* 连接线 */}
              <div className="absolute left-5 right-5 top-1/2 -translate-y-1/2 h-px bg-neutral-800" />
              <div
                className="absolute left-5 top-1/2 -translate-y-1/2 h-px transition-all duration-500"
                style={{
                  width: `calc((100% - 40px) * ${effectiveStage / 5})`,
                  background: 'linear-gradient(to right, #00F2EA, #FF0050)',
                }}
              />
              {/* 5 个节点 */}
              {labels.stages.map((_, idx) => {
                const Icon = STAGE_ICONS[idx]
                const color = STAGE_COLORS[idx]
                const isDone = effectiveStage > idx
                const isActive = !isCompleting && !isError && effectiveStage === idx
                return (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-1.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isDone || isActive ? 'border' : 'border border-neutral-800'
                      }`}
                      style={{
                        borderColor: isDone || isActive ? color : undefined,
                        backgroundColor: isActive ? `${color}20` : isDone ? `${color}10` : '#0f0f0f',
                        boxShadow: isActive ? `0 0 20px -4px ${color}` : undefined,
                      }}
                    >
                      {isDone ? (
                        <Check className="h-4 w-4" style={{ color }} />
                      ) : isActive ? (
                        <Icon className="h-4 w-4" style={{ color }} />
                      ) : (
                        <Icon className="h-4 w-4 text-neutral-700" />
                      )}
                    </div>
                    {isActive && (
                      <span className="absolute -bottom-1 w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 错误信息 */}
          {isError && errorMessage && (
            <div className="px-6 pb-5 -mt-2">
              <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-2.5 text-center text-xs text-red-300/90 line-clamp-2">
                {errorMessage}
              </div>
            </div>
          )}

          {/* 底部细线渐变 */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00F2EA]/50 to-transparent" />
        </div>
      </div>
    </div>
  )
}
