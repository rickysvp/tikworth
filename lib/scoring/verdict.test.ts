import { describe, it, expect } from 'vitest'
import { buildVerdict, buildSummary, tierFromScore, tierFromBusinessValue } from './verdict'
import { DimensionScores, Metrics, AccountHealth, RiskFlag } from '../../types'

const baseDims: DimensionScores = {
  reach: 70, engagement: 80, content: 60, authenticity: 90, momentum: 50,
  stability: 70, commerce: 40, monetization: 60, health: 90, influence: 75,
}

const baseMetrics: Metrics = {
  engagementRate: 5.7, avgPlays: 160000, avgLikes: 8000, avgComments: 800, avgShares: 320,
  likesPerVideo: 8000, followerFollowingRatio: 100, recentMedianPlays: 160000, olderMedianPlays: 150000,
  playGrowth: 5, cvPlays: 0.3, daysSinceLastPost: 1, topPostPlays: 250000, topPostLikes: 12500,
  matureMedianPlays: 160000, matureWeightedAvgPlays: 160000, historicalImpliedPlays: 160000,
  immatureVideoCount: 0, growingVideoCount: 0, likePlayRatio: 0.05, effectivePlaysSource: 'mature-only',
  effectiveAvgPlays: 160000, effectivePeakPlays: 170000,
}

const baseHealth: AccountHealth = {
  overallScore: 90, shadowbanRisk: 'low', shadowbanSignals: [], growthAnomaly: 'normal',
  growthAnomalyReason: '正常', engagementAuthenticity: 90, fakeFollowerEstimate: 10,
  healthReasoning: '健康',
}

const noRisks: RiskFlag[] = []

describe('tierFromScore', () => {
  it('maps scores to tiers correctly', () => {
    expect(tierFromScore(90)).toBe('S')
    expect(tierFromScore(75)).toBe('A')
    expect(tierFromScore(60)).toBe('B')
    expect(tierFromScore(45)).toBe('C')
    expect(tierFromScore(30)).toBe('D')
    expect(tierFromScore(15)).toBe('E')
    expect(tierFromScore(5)).toBe('F')
  })
})

describe('tierFromBusinessValue', () => {
  it('S tier for business value > $1M', () => {
    const result = tierFromBusinessValue(2_000_000, 50_000_000, noRisks)
    expect(result.tier).toBe('S')
  })

  it('S tier for followers > 10M with no high risk', () => {
    const result = tierFromBusinessValue(500_000, 20_000_000, noRisks)
    expect(result.tier).toBe('S')
  })

  it('A tier for business value > $100K', () => {
    const result = tierFromBusinessValue(200_000, 500_000, noRisks)
    expect(result.tier).toBe('A')
  })

  it('B tier for business value > $10K', () => {
    const result = tierFromBusinessValue(50_000, 50_000, noRisks)
    expect(result.tier).toBe('B')
  })

  it('C tier for business value > $1K', () => {
    const result = tierFromBusinessValue(5_000, 10_000, noRisks)
    expect(result.tier).toBe('C')
  })

  it('D tier for business value > $100', () => {
    const result = tierFromBusinessValue(500, 5_000, noRisks)
    expect(result.tier).toBe('D')
  })

  it('F tier for severe risk (2+ high risks)', () => {
    const risks: RiskFlag[] = [
      { level: 'high', label: '疑似买粉', detail: '互动率极低' },
      { level: 'high', label: '疑似互关刷量', detail: '粉关比异常' },
    ]
    const result = tierFromBusinessValue(500_000, 100_000, risks)
    expect(result.tier).toBe('F')
  })

  it('downgrades one tier for single high risk', () => {
    const risks: RiskFlag[] = [
      { level: 'high', label: '疑似买粉', detail: '互动率极低' },
    ]
    const result = tierFromBusinessValue(200_000, 500_000, risks)
    expect(result.tier).toBe('B') // A → B due to risk downgrade
  })
})

describe('buildVerdict', () => {
  it('labels high engagement as excellent', () => {
    const result = buildVerdict({
      score: 75, tier: 'A', tierReason: '商业价值超过 $100K', nickname: 'Creator',
      metrics: { ...baseMetrics, engagementRate: 7 },
      health: baseHealth, dims: baseDims, risks: noRisks, categories: ['健身运动'],
      businessValueMid: 200_000,
    })
    expect(result.verdict).toContain('excellent engagement')
  })

  it('labels low engagement as low', () => {
    const result = buildVerdict({
      score: 30, tier: 'D', tierReason: '入门级', nickname: 'Creator',
      metrics: { ...baseMetrics, engagementRate: 0.5 },
      health: baseHealth, dims: baseDims, risks: noRisks, categories: ['健身运动'],
      businessValueMid: 500,
    })
    expect(result.verdict).toContain('below-average engagement')
  })

  it('B tier advice points to weakest dimension', () => {
    const dims = { ...baseDims, content: 20 }
    const result = buildVerdict({
      score: 60, tier: 'B', tierReason: '有稳定变现', nickname: 'Creator',
      metrics: baseMetrics,
      health: baseHealth, dims, risks: noRisks, categories: ['健身运动'],
      businessValueMid: 50_000,
    })
    expect(result.advice).toContain('content virality')
  })

  it('prioritizes high risks over tier advice', () => {
    const result = buildVerdict({
      score: 75, tier: 'A', tierReason: '优质账号', nickname: 'Creator',
      metrics: baseMetrics,
      health: { ...baseHealth, shadowbanRisk: 'high' },
      dims: baseDims,
      risks: [{ level: 'high', label: '疑似买粉', detail: '互动率极低' }],
      categories: ['健身运动'],
      businessValueMid: 200_000,
    })
    expect(result.advice).toContain('High-risk signals detected')
  })
})

describe('buildSummary', () => {
  it('includes tier and categories in headline', () => {
    const summary = buildSummary({
      profile: { nickname: 'Creator', followerCount: 50000 },
      dims: baseDims, metrics: baseMetrics, tier: 'A', tierReason: '优质变现账号',
      categories: ['健身运动'], percentile: 74, businessValueMid: 200_000,
    })
    expect(summary.headline).toContain('Tier A')
    expect(summary.headline).toContain('健身运动')
    expect(summary.headline).toContain('74%')
  })
})