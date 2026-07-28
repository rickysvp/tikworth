import {
  DimensionScores, Metrics, RiskFlag, ReportSummary,
  AccountHealth,
} from '../../types'
import { TIER_THRESHOLDS } from './config'

const DIM_LABELS: Record<keyof DimensionScores, { name: string; strength: string; weakness: string }> = {
  reach: { name: '流量触达', strength: '流量触达力强，粉丝规模与播放量表现优异', weakness: '流量触达力不足，建议扩大粉丝基础或提升播放量' },
  engagement: { name: '互动健康', strength: '互动健康度高，粉丝活跃且评论深度好', weakness: '互动健康度低，需优化前3秒钩子与评论引导' },
  content: { name: '内容爆款', strength: '内容爆款力强，垂直度高、有爆款视频', weakness: '内容爆款力弱，建议聚焦垂直方向提升爆款率' },
  authenticity: { name: '粉丝真实', strength: '粉丝真实度高，非僵尸粉，互动可信', weakness: '粉丝真实性存疑，可能有互关/刷量行为' },
  momentum: { name: '增长势能', strength: '增长势能强，近期播放持续上升', weakness: '增长势能不足，近期播放有所下滑' },
  stability: { name: '流量稳定', strength: '流量稳定，播放波动小，可预期', weakness: '流量不稳定，播放波动大，影响合作可靠性' },
  commerce: { name: '商业适配', strength: '商业适配度高，有带货意图，品牌匹配好', weakness: '商业适配度低，缺乏带货意图或品牌关联' },
  monetization: { name: '变现潜力', strength: '变现潜力强，已满足变现平台门槛', weakness: '变现潜力低，未满足主要变现门槛' },
  health: { name: '账号健康', strength: '账号健康，无明显风险信号', weakness: '账号健康度低，存在限流或假粉风险' },
  influence: { name: '行业位势', strength: '行业位势高，高于同体量平均', weakness: '行业位势低，低于同体量平均' },
}

export function tierFromScore(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
  if (score >= TIER_THRESHOLDS.S) return 'S'
  if (score >= TIER_THRESHOLDS.A) return 'A'
  if (score >= TIER_THRESHOLDS.B) return 'B'
  if (score >= TIER_THRESHOLDS.C) return 'C'
  if (score >= TIER_THRESHOLDS.D) return 'D'
  if (score >= TIER_THRESHOLDS.E) return 'E'
  return 'F'
}

function formatPlays(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0).replace(/\.0$/, '') + 'K'
  return String(Math.round(n))
}

export interface PriceAdviceInput {
  perVideoLow: number
  perVideoMid: number
  perVideoHigh: number
  effectiveAvgPlays: number
  categoryLabel: string
  cpm: number
  engagementMult: number
  regionLabel: string
  regionMult: number
  risks: RiskFlag[]
}

export function buildPriceAdvice(input: PriceAdviceInput): string {
  const { perVideoLow, perVideoMid, perVideoHigh, effectiveAvgPlays, categoryLabel, cpm, engagementMult, regionLabel, regionMult, risks } = input
  const playsN = formatPlays(effectiveAvgPlays)
  const em = engagementMult.toFixed(1)
  const rm = regionMult.toFixed(2)

  let text = `参考行情价：每条合作视频 $${perVideoLow.toLocaleString()} - $${perVideoHigh.toLocaleString()}（中值 $${perVideoMid.toLocaleString()}）。计算依据：成熟视频均播 ${playsN} × ${categoryLabel} CPM $${cpm} × 互动系数 ${em} × ${regionLabel}系数 ${rm}。建议结合内容制作成本、排他条款、使用期限上下调整 20-30%。`

  const highRisks = risks.filter(r => r.level === 'high')
  if (highRisks.length > 0) {
    const riskLabels = highRisks.map(r => r.label).join('、')
    text += ` ⚠️ 账号检测到 ${riskLabels}，建议先修复再接合作，实际价格可能下浮 30-50%。`
  }

  return text
}

const TIER_TEXT: Record<string, string> = {
  S: '顶级账号，互动率与流量稳定性俱佳',
  A: '优质账号，综合表现高于行业平均',
  B: '合格账号，有明显可谈价/提升空间',
  C: '一般账号，部分指标存在短板',
  D: '问题账号，多维度表现不佳',
  E: '高风险账号，数据真实性存疑',
  F: '不建议合作，账号质量严重不足',
}

export interface VerdictInput {
  score: number
  tier: string
  nickname: string
  metrics: Metrics
  health: AccountHealth
  dims: DimensionScores
  risks: RiskFlag[]
  categories: string[]
}

export function buildVerdict(input: VerdictInput): { verdict: string; advice: string } {
  const { score, tier, nickname, metrics, health, dims, risks } = input
  const engagementLabel = metrics.engagementRate >= 6 ? '互动率健康' : metrics.engagementRate >= 3 ? '互动率一般' : '互动率偏低'
  const healthLabel = health.shadowbanRisk === 'high' ? '，存在明显健康风险' : health.shadowbanRisk === 'medium' ? '，有轻微风险信号' : ''
  const verdict = `${nickname} 综合评级 ${tier} 级（${score}分），${engagementLabel}。${TIER_TEXT[tier] || ''}${healthLabel}。`

  const hasHighRisk = risks.some(r => r.level === 'high')
  let advice = ''

  if (hasHighRisk) {
    const riskLabels = risks.filter(r => r.level === 'high').map(r => r.label).join('、')
    advice = `发现高风险信号：${riskLabels}。建议先排查风险，确认账号健康后再考虑合作或变现。`
  } else if (tier === 'S' || tier === 'A') {
    if (metrics.playGrowth > 20) {
      advice = '账号正处于流量上升期，建议创作者保持更新节奏并尝试更多变现方式；品牌方可尽快锁定合作档期。'
    } else {
      advice = '账号综合质量良好，创作者可重点优化内容垂直度和互动率以提升报价；品牌方合作时重点确认内容与品牌调性匹配。'
    }
  } else if (tier === 'B') {
    advice = `账号有商业潜力但存在提升空间。创作者可优先优化${dims.engagement < 50 ? '内容互动' : dims.stability < 50 ? '流量稳定性' : '内容垂直度'}；品牌方谈判时可参考当前互动率 ${metrics.engagementRate.toFixed(1)}% 和播放波动 CV ${metrics.cvPlays.toFixed(2)} 适度议价。`
  } else if (tier === 'C') {
    advice = '数据表现平平，创作者建议优先优化完播和互动质量，暂不适合大额付费合作；品牌方可待数据改善后再考虑。'
  } else if (tier === 'D') {
    advice = '多维度表现不佳，创作者需先排查账号问题并优化内容质量；品牌方不建议合作。'
  } else {
    advice = '当前数据商业价值极低。创作者建议从零开始重新规划内容和发布策略；品牌方强烈不建议合作。'
  }

  return { verdict, advice }
}

export interface SummaryInput {
  profile: { nickname: string; followerCount: number }
  dims: DimensionScores
  metrics: Metrics
  tier: string
  categories: string[]
  percentile: number
}

export function buildSummary(input: SummaryInput): ReportSummary {
  const { dims, tier, metrics, categories, percentile } = input
  const strengths: string[] = []
  const weaknesses: string[] = []

  const sorted = (Object.entries(dims) as [keyof DimensionScores, number][]).sort((a, b) => b[1] - a[1])

  for (let i = 0; i < sorted.length && strengths.length < 3; i++) {
    const [key, val] = sorted[i]
    if (val >= 70) {
      strengths.push(`${DIM_LABELS[key].strength}（${val}分）`)
    }
  }

  for (let i = sorted.length - 1; i >= 0 && weaknesses.length < 3; i--) {
    const [key, val] = sorted[i]
    if (val < 40) {
      weaknesses.push(`${DIM_LABELS[key].weakness}（${val}分）`)
    }
  }

  let targetAudience = ''
  if (tier === 'S' || tier === 'A') {
    targetAudience = '品牌方（值得付费合作）、创作者（自身价值高，可持续提价）'
  } else if (tier === 'B') {
    targetAudience = '品牌方（可适度预算合作）、创作者（有提升空间，方向明确）'
  } else if (tier === 'C') {
    targetAudience = '创作者（需重点优化内容与互动，暂不建议品牌方付费）'
  } else if (tier === 'D') {
    targetAudience = '创作者（需排查账号问题并优化内容，暂不具备商业合作条件）'
  } else {
    targetAudience = '创作者（建议从零开始重新规划，暂不具备商业合作条件）'
  }

  let bestAction = ''
  if (strengths.length === 0 && weaknesses.length > 0) {
    bestAction = `优先改进：${weaknesses[0].split('（')[0]}`
  } else if (metrics.engagementRate < 2) {
    bestAction = '优先优化前3秒钩子和评论引导，提升互动率后再考虑商业化'
  } else if (dims.monetization < 40) {
    bestAction = '持续稳定输出垂直内容，先达到主要变现门槛'
  } else if (metrics.playGrowth > 20 && metrics.engagementRate >= 3) {
    bestAction = '账号处于上升期，创作者可加速更新并尝试新变现方式，品牌方可尽快锁定合作'
  } else {
    bestAction = '维持现有节奏，重点提升内容质量与品牌适配度'
  }

  const catLabel = categories.length ? categories.slice(0, 2).join('/') : '泛生活'
  const headline = `${tier} 级账号 | ${catLabel} | 超越同体量 ${percentile}% 账号`

  return { headline, strengths, weaknesses, targetAudience, bestAction }
}
