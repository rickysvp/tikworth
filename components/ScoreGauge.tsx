'use client'

import { useMemo } from 'react'

interface ScoreGaugeProps {
  score: number
  tier: string
  size?: number
  stroke?: number
  showLabel?: boolean
}

const tierColors: Record<string, string> = {
  S: '#00F2EA',
  A: '#00F2EA',
  B: '#22c55e',
  C: '#f59e0b',
  D: '#f97316',
  E: '#ef4444',
  F: '#dc2626',
}

const tierLabels: Record<string, string> = {
  S: '顶级账号 · 值得高价合作',
  A: '优质账号 · 推荐合作',
  B: '合格账号 · 可谈价合作',
  C: '一般账号 · 有提升空间',
  D: '问题账号 · 暂不建议合作',
  E: '高风险账号 · 真实度存疑',
  F: '不建议合作 · 质量严重不足',
}

export function ScoreGauge({ score, tier, size = 160, stroke = 12, showLabel = false }: ScoreGaugeProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = useMemo(() => clamp(score / 100, 0, 1) * circumference, [score, circumference])
  const color = tierColors[tier] || '#FF0050'

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n))
  }

  // Auto-scale font size based on ring dimensions
  const tierFontSize = Math.round(size * 0.38)

  return (
    <div className="inline-flex flex-col items-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={stroke}
            fill="transparent"
            className="text-neutral-800"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-extrabold uppercase tracking-tighter leading-none" style={{ fontSize: tierFontSize, color }}>
            {tier}
          </span>
        </div>
      </div>
      {showLabel && (
        <p className="text-xs text-neutral-500 text-center mt-1 truncate max-w-full">
          {tierLabels[tier] || ''}
        </p>
      )}
    </div>
  )
}
