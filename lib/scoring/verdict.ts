import {
  DimensionScores, Metrics, RiskFlag, ReportSummary,
  AccountHealth,
} from '../../types'
import { TIER_THRESHOLDS } from './config'

const DIM_LABELS: Record<keyof DimensionScores, { name: string; strength: string; weakness: string }> = {
  reach: { name: 'Reach', strength: 'Strong reach — follower count and play volume perform well', weakness: 'Limited reach — consider growing follower base or improving play volume' },
  engagement: { name: 'Engagement', strength: 'Healthy engagement — active followers with good comment depth', weakness: 'Low engagement — optimize hook in first 3 seconds and comment prompts' },
  content: { name: 'Content Virality', strength: 'Strong viral potential — high niche focus with viral hits', weakness: 'Weak viral potential — focus on a vertical niche to boost hit rate' },
  authenticity: { name: 'Authenticity', strength: 'High follower authenticity — genuine engagement, no bot activity', weakness: 'Questionable authenticity — possible follow-for-follow or bot activity' },
  momentum: { name: 'Momentum', strength: 'Strong growth momentum — recent plays trending upward', weakness: 'Weak momentum — recent plays declining' },
  stability: { name: 'Stability', strength: 'Stable traffic — low play volatility, predictable performance', weakness: 'Unstable traffic — high play volatility, affecting partnership reliability' },
  commerce: { name: 'Commerce Fit', strength: 'High commerce fit — clear purchase intent, strong brand alignment', weakness: 'Low commerce fit — lacks purchase intent or brand association' },
  monetization: { name: 'Monetization', strength: 'Strong monetization potential — meets platform monetization thresholds', weakness: 'Low monetization potential — not meeting key monetization thresholds' },
  health: { name: 'Account Health', strength: 'Healthy account — no significant risk signals detected', weakness: 'Poor account health — potential shadowban or fake follower risks' },
  influence: { name: 'Influence', strength: 'High industry standing — above peer average for this tier', weakness: 'Low industry standing — below peer average for this tier' },
}

// ========== Score-based Tier System ==========

export interface TierResult {
  tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  reason: string
}

/**
 * Score-based tier system
 * Tier reflects overall account quality across 10 dimensions (reach, engagement, content, etc.)
 * Business value is a display metric, not a tier determinant — prevents "high followers + low plays" from getting S tier
 */
export function tierFromScore(score: number, risks: RiskFlag[]): TierResult {
  const hasHighRisk = risks.some(r => r.level === 'high')
  const highRiskCount = risks.filter(r => r.level === 'high').length

  // Critical risk → straight to F
  if (highRiskCount >= 2) {
    return {
      tier: 'F' as const,
      reason: 'Critical risk signals detected — not recommended for any commercial partnership',
    }
  }

  let tier: 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  let reason: string

  if (score >= TIER_THRESHOLDS.S) {
    tier = 'S'
    reason = `Score ${score} — top-tier account with exceptional performance across all dimensions`
  } else if (score >= TIER_THRESHOLDS.A) {
    tier = 'A'
    reason = `Score ${score} — premium account with above-average performance`
  } else if (score >= TIER_THRESHOLDS.B) {
    tier = 'B'
    reason = `Score ${score} — solid account with stable performance and growth room`
  } else if (score >= TIER_THRESHOLDS.C) {
    tier = 'C'
    reason = `Score ${score} — growing account with potential, not yet at stable level`
  } else if (score >= TIER_THRESHOLDS.D) {
    tier = 'D'
    reason = `Score ${score} — entry-level account, multiple dimensions need improvement`
  } else if (score >= TIER_THRESHOLDS.E) {
    tier = 'E'
    reason = `Score ${score} — below-average performance with risk signals`
  } else {
    tier = 'F'
    reason = `Score ${score} — minimal commercial value, not ready for partnerships`
  }

  // Risk downgrade: high risk signals → force downgrade one tier
  if (hasHighRisk && tier !== 'F' && tier !== 'E') {
    const tierOrder = ['S', 'A', 'B', 'C', 'D', 'E', 'F'] as const
    const idx = tierOrder.indexOf(tier)
    if (idx >= 0 && idx < tierOrder.length - 1) {
      const downgradedTier = tierOrder[idx + 1]
      reason += ` (downgraded from ${tier} to ${downgradedTier} due to risk signals)`
      tier = downgradedTier
    }
  }

  return { tier, reason }
}

/**
 * @deprecated Use tierFromScore instead
 * Business value-based tier — kept for backward compatibility, no longer used in scoreProfile
 */
export function tierFromBusinessValue(
  _businessValueMid: number,
  _followerCount: number,
  risks: RiskFlag[],
): TierResult {
  return tierFromScore(0, risks)
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

  let text = `Market rate reference: $${perVideoLow.toLocaleString()} – $${perVideoHigh.toLocaleString()} per sponsored video (median $${perVideoMid.toLocaleString()}). Based on: mature avg plays ${playsN} × ${categoryLabel} CPM $${cpm} × engagement factor ${em} × ${regionLabel} multiplier ${rm}. Adjust ±20-30% based on content production cost, exclusivity terms, and usage duration.`

  const highRisks = risks.filter(r => r.level === 'high')
  if (highRisks.length > 0) {
    const riskLabels = highRisks.map(r => r.label).join(', ')
    text += ` ⚠️ Detected: ${riskLabels}. Remediate before accepting partnerships. Actual pricing may be 30-50% lower.`
  }

  return text
}

const TIER_TEXT: Record<string, string> = {
  S: 'Top-tier account, exceptional commercial value — brand partnerships and IP assets are the core value drivers',
  A: 'Premium account, high commercial value — above-average performance across all dimensions',
  B: 'Solid account with stable monetization — clear room for growth and optimization',
  C: 'Growing account with potential — not yet at stable monetization level',
  D: 'Entry-level account — multiple dimensions need improvement, focus on content quality first',
  E: 'At-risk account — concerning risk signals require attention',
  F: 'Not recommended for partnerships — significant quality issues or critical risks',
}

export interface VerdictInput {
  score: number
  tier: string
  tierReason: string
  nickname: string
  metrics: Metrics
  health: AccountHealth
  dims: DimensionScores
  risks: RiskFlag[]
  categories: string[]
  businessValueMid: number
}

export function buildVerdict(input: VerdictInput): { verdict: string; advice: string } {
  const { score, tier, nickname, metrics, health, dims, risks, businessValueMid } = input

  const engagementLabel = metrics.engagementRate >= 6 ? 'excellent engagement'
    : metrics.engagementRate >= 3 ? 'healthy engagement'
    : metrics.engagementRate >= 1 ? 'average engagement'
    : 'below-average engagement'

  const healthLabel = health.shadowbanRisk === 'high' ? ', with notable health risks' : health.shadowbanRisk === 'medium' ? ', with minor risk signals' : ''

  const bvFormatted = businessValueMid >= 1_000_000
    ? `$${(businessValueMid / 1_000_000).toFixed(1)}M`
    : businessValueMid >= 1_000
    ? `$${(businessValueMid / 1_000).toFixed(0)}K`
    : `$${Math.round(businessValueMid)}`

  const verdict = `${nickname} — Tier ${tier} (${score}pts), ${engagementLabel}. Estimated business value: ${bvFormatted}. ${TIER_TEXT[tier] || ''}${healthLabel}.`

  const hasHighRisk = risks.some(r => r.level === 'high')
  let advice = ''

  if (hasHighRisk) {
    const riskLabels = risks.filter(r => r.level === 'high').map(r => r.label).join(', ')
    advice = `High-risk signals detected: ${riskLabels}. Address these risks before pursuing partnerships or monetization.`
  } else if (tier === 'S' || tier === 'A') {
    if (metrics.playGrowth > 20) {
      advice = 'Account is in a growth surge — commercial value is rising. Creator: maintain posting cadence and explore additional revenue streams. Brands: lock in partnerships now while rates are competitive.'
    } else {
      advice = 'Excellent overall quality with high commercial value. Creator: optimize your brand partnership pricing structure. Brands: ensure content alignment with your brand identity before booking.'
    }
  } else if (tier === 'B') {
    const weakAreas: { key: keyof DimensionScores; label: string }[] = [
      { key: 'engagement', label: 'engagement rate' },
      { key: 'content', label: 'content virality' },
      { key: 'stability', label: 'traffic stability' },
      { key: 'reach', label: 'reach' },
      { key: 'authenticity', label: 'follower authenticity' },
      { key: 'momentum', label: 'growth momentum' },
      { key: 'commerce', label: 'commerce fit' },
    ]
    const weakest = weakAreas
      .map(a => ({ ...a, score: dims[a.key] }))
      .filter(a => a.score < 55)
      .sort((a, b) => a.score - b.score)[0]
    const focus = weakest?.label || 'overall content quality'
    advice = `Solid commercial potential with room to grow. Creator: prioritize improving ${focus}. Brands: negotiate based on current engagement rate of ${metrics.engagementRate.toFixed(1)}% and play volatility CV of ${metrics.cvPlays.toFixed(2)}.`
  } else if (tier === 'C') {
    advice = 'Average performance metrics. Creator: focus on improving completion rate and engagement quality before pursuing paid partnerships. Brands: wait for data improvement before committing.'
  } else if (tier === 'D') {
    advice = 'Multiple dimensions need improvement. Creator: audit account health and optimize content quality. Brands: not recommended for partnership at this stage.'
  } else {
    advice = 'Minimal commercial value in current state. Creator: consider rebuilding content strategy from scratch. Brands: strongly not recommended for partnership.'
  }

  return { verdict, advice }
}

export interface SummaryInput {
  profile: { nickname: string; followerCount: number }
  dims: DimensionScores
  metrics: Metrics
  tier: string
  tierReason: string
  categories: string[]
  percentile: number
  businessValueMid: number
}

export function buildSummary(input: SummaryInput): ReportSummary {
  const { dims, tier, metrics, categories, percentile, businessValueMid } = input
  const strengths: string[] = []
  const weaknesses: string[] = []

  const sorted = (Object.entries(dims) as [keyof DimensionScores, number][]).sort((a, b) => b[1] - a[1])

  for (let i = 0; i < sorted.length && strengths.length < 3; i++) {
    const [key, val] = sorted[i]
    if (val >= 70) {
      strengths.push(`${DIM_LABELS[key].strength} (${val}pts)`)
    }
  }

  for (let i = sorted.length - 1; i >= 0 && weaknesses.length < 3; i--) {
    const [key, val] = sorted[i]
    if (val < 40) {
      weaknesses.push(`${DIM_LABELS[key].weakness} (${val}pts)`)
    }
  }

  let targetAudience = ''
  if (tier === 'S' || tier === 'A') {
    targetAudience = 'Brands (worth premium partnerships), Creators (high value, can raise rates)'
  } else if (tier === 'B') {
    targetAudience = 'Brands (moderate budget partnerships), Creators (clear growth path)'
  } else if (tier === 'C') {
    targetAudience = 'Creators (focus on improving content & engagement, not yet brand-ready)'
  } else if (tier === 'D') {
    targetAudience = 'Creators (audit account issues & optimize content, not partnership-ready)'
  } else {
    targetAudience = 'Creators (consider rebuilding from scratch, not partnership-ready)'
  }

  let bestAction = ''
  if (strengths.length === 0 && weaknesses.length > 0) {
    bestAction = `Priority fix: ${weaknesses[0].split(' (')[0]}`
  } else if (metrics.engagementRate < 2) {
    bestAction = 'Optimize first-3-second hook and comment prompts to boost engagement before monetizing'
  } else if (dims.monetization < 40) {
    bestAction = 'Consistently publish niche content to reach key monetization thresholds'
  } else if (metrics.playGrowth > 20 && metrics.engagementRate >= 3) {
    bestAction = 'Account is trending up — creator: accelerate posting & explore new revenue streams. Brands: lock in now.'
  } else {
    bestAction = 'Maintain current cadence, focus on improving content quality and brand alignment'
  }

  const catLabel = categories.length ? categories.slice(0, 2).join('/') : 'General Lifestyle'
  const bvFormatted = businessValueMid >= 1_000_000
    ? `$${(businessValueMid / 1_000_000).toFixed(1)}M`
    : businessValueMid >= 1_000
    ? `$${(businessValueMid / 1_000).toFixed(0)}K`
    : `$${Math.round(businessValueMid)}`
  const headline = `Tier ${tier} | ${catLabel} | Business Value ${bvFormatted} | Top ${percentile}% in Peer Group`

  return { headline, strengths, weaknesses, targetAudience, bestAction }
}