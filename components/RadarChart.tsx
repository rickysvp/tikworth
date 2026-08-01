'use client'

import { DimensionScores } from '@/types'
import {
  Radar,
  RadarChart as ReRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'

const dimensionMeta: { key: keyof DimensionScores; label: string }[] = [
  { key: 'reach', label: '流量触达' },
  { key: 'engagement', label: '互动健康' },
  { key: 'content', label: '内容爆款' },
  { key: 'authenticity', label: '粉丝真实' },
  { key: 'momentum', label: '增长势能' },
  { key: 'stability', label: '流量稳定' },
  { key: 'commerce', label: '商业适配' },
  { key: 'monetization', label: '变现潜力' },
  { key: 'health', label: '账号健康' },
  { key: 'influence', label: '行业位势' },
]

export function RadarChart({ dimensions }: { dimensions: DimensionScores }) {
  const data = dimensionMeta.map(({ key, label }) => ({
    dimension: label,
    score: dimensions[key],
    fullMark: 100,
  }))

  return (
    <div className="w-full h-[420px] sm:h-[480px]" role="img" aria-label="10维度雷达评分图">
      <ResponsiveContainer width="100%" height="100%">
        <ReRadarChart data={data} outerRadius="65%">
          <PolarGrid stroke="#27272a" strokeWidth={0.5} />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: '#a3a3a3', fontSize: 12, fontWeight: 500 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#525252', fontSize: 10 }}
            axisLine={false}
            tickCount={6}
          />
          <Radar
            name="评分"
            dataKey="score"
            stroke="#FF0050"
            fill="#FF0050"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ r: 3, fill: '#FF0050', stroke: 'none' }}
            activeDot={{ r: 5, fill: '#FF0050', stroke: '#0a0a0a', strokeWidth: 2 }}
          />
        </ReRadarChart>
      </ResponsiveContainer>
    </div>
  )
}