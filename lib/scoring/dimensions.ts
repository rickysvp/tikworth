import { RawProfile, DimensionScores, Metrics, Post } from '../../types'
import { ClassifiedPost, calcMaturePlayCV } from './metrics'
import {
  ENGAGEMENT_TIERS,
  RISK_THRESHOLDS,
  COMMERCE_INTENT_KEYWORDS,
  MONETIZATION_THRESHOLDS,
  getPeerBenchmarks,
  clamp,
} from './config'

export function scoreReach(
  followerCount: number,
  effectiveAvgPlays: number
): number {
  const f = Math.max(followerCount, 100)
  const followerScore = clamp((Math.log10(f / 1000) / Math.log10(100000)) * 100, 0, 100)
  const reachRatio = Math.max(effectiveAvgPlays / Math.max(followerCount, 1), 0.05)
  const reachScore = clamp(reachRatio * 100, 0, 100)
  return Math.round(reachScore * 0.6 + followerScore * 0.4)
}

export function scoreEngagement(
  maturePosts: ClassifiedPost[],
  growingPosts: ClassifiedPost[]
): number {
  const relevant = [...maturePosts, ...growingPosts]
  if (!relevant.length) return 0

  let totalPlays = 0, totalLikes = 0, totalComments = 0, totalInteractions = 0
  for (const { post } of relevant) {
    if (post.playCount > 0) {
      totalPlays += post.playCount
      totalLikes += post.likeCount || 0
      totalComments += post.commentCount || 0
      totalInteractions += (post.likeCount || 0) + (post.commentCount || 0) + (post.shareCount || 0)
    }
  }
  if (totalPlays <= 0) return 0
  const er = (totalInteractions / totalPlays) * 100

  let baseScore = 0
  for (const tier of ENGAGEMENT_TIERS) {
    if (er >= tier.min) {
      baseScore = tier.multiplier >= 1.6 ? 95 : tier.multiplier >= 1.4 ? 80 : tier.multiplier >= 1.2 ? 65 : tier.multiplier >= 1.0 ? 45 : 15
      break
    }
  }

  const commentLikeRatio = totalLikes > 0 ? totalComments / totalLikes : 0
  const depthBonus = clamp(commentLikeRatio * 150, 0, 15)

  return Math.round(clamp(baseScore + depthBonus, 0, 100))
}

export function scoreContent(
  profile: RawProfile,
  metrics: Metrics
): number {
  const { effectiveAvgPlays, effectivePeakPlays } = metrics
  if (!profile.posts.length || effectiveAvgPlays <= 0) return 0

  const breakoutRatio = effectivePeakPlays / effectiveAvgPlays
  const breakoutScore = clamp((breakoutRatio - 1) / 4 * 100, 0, 100)

  const tagCounts: Record<string, number> = {}
  let totalTags = 0
  for (const post of profile.posts) {
    const tags = (post.desc || '').match(/#\w+/g) || []
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
      totalTags += 1
    }
  }
  let verticality = 0
  if (totalTags) {
    const maxTag = Math.max(...Object.values(tagCounts))
    verticality = maxTag / totalTags * 100
  }

  const allPlays = profile.posts.map(p => p.playCount || 0)
  const maxPlay = allPlays.length ? Math.max(...allPlays) : 0
  const spikeRatio = effectiveAvgPlays > 0 ? maxPlay / effectiveAvgPlays : 0
  const spikeScore = clamp(spikeRatio / 10 * 100, 0, 100)

  return Math.round(breakoutScore * 0.55 + verticality * 0.25 + spikeScore * 0.20)
}

export function scoreAuthenticity(
  followerCount: number,
  followingCount: number,
  engagementRate: number,
  maturePosts: ClassifiedPost[]
): number {
  const frRatio = followerCount / Math.max(followingCount, 1)
  const clampedRatio = clamp(frRatio, 0.05, 50)
  let score = ((clampedRatio - 0.05) / (50 - 0.05)) * 100

  if (maturePosts.length >= 3) {
    const cv = calcMaturePlayCV(maturePosts)
    if (cv > 1.5) score -= 20
    else if (cv > 1.0) score -= 10
  }

  if (followerCount > 100000 && engagementRate < 1) score -= 35
  if (followerCount > 500000 && engagementRate < 2) score -= 20
  if (frRatio < 0.5) score -= 30

  return Math.round(clamp(score, 0, 100))
}

export function scoreMomentum(playGrowth: number): number {
  return Math.round(clamp(50 + playGrowth * 50, 0, 100))
}

export function scoreStability(
  maturePosts: ClassifiedPost[],
  daysSinceLastPost: number
): number {
  let cv = 1.0
  if (maturePosts.length >= 3) {
    cv = calcMaturePlayCV(maturePosts)
  }

  let score = 100 - clamp(cv * 50, 0, 70)

  if (daysSinceLastPost > RISK_THRESHOLDS.inactiveDaysCritical) score -= 40
  else if (daysSinceLastPost > RISK_THRESHOLDS.inactiveDaysWarning) score -= 20

  return Math.round(clamp(score, 0, 100))
}

export function scoreCommerce(posts: Post[]): number {
  if (!posts.length) return 0
  const keywords = [...COMMERCE_INTENT_KEYWORDS.en, ...COMMERCE_INTENT_KEYWORDS.zh]
  let hits = 0
  for (const post of posts) {
    const desc = (post.desc || '').toLowerCase()
    if (keywords.some(w => desc.includes(w.toLowerCase()))) hits += 1
  }
  const hitRate = hits / posts.length
  return Math.round(clamp(hitRate * 250, 0, 100))
}

export function scoreMonetization(
  followerCount: number,
  videoCount: number,
  effectiveAvgPlays: number,
  postsPerMonth: number,
  engagementRate: number
): number {
  let score = 0
  const monthlyViews = effectiveAvgPlays * postsPerMonth

  if (followerCount >= MONETIZATION_THRESHOLDS.creatorFundFollowers && videoCount >= 10) score += 25
  if (
    followerCount >= MONETIZATION_THRESHOLDS.creativityBetaFollowers &&
    monthlyViews >= MONETIZATION_THRESHOLDS.creativityBetaMonthlyViews &&
    effectiveAvgPlays >= MONETIZATION_THRESHOLDS.creativityBetaPerVideoViews
  ) score += 25
  if (followerCount >= MONETIZATION_THRESHOLDS.tiktokShopFollowers) score += 15
  if (followerCount >= MONETIZATION_THRESHOLDS.subscriptionFollowers) score += 10
  if (followerCount >= MONETIZATION_THRESHOLDS.liveGiftFollowers) score += 10

  score += clamp(engagementRate * 3, 0, 15)

  return Math.round(clamp(score, 0, 100))
}

export function scoreHealth(
  followerCount: number,
  followingCount: number,
  metrics: Metrics
): number {
  let score = 100
  const { engagementRate, cvPlays, daysSinceLastPost } = metrics

  if (engagementRate < RISK_THRESHOLDS.engagementRateCritical) score -= 30
  else if (engagementRate < RISK_THRESHOLDS.engagementRateWarning) score -= 15

  if (cvPlays > RISK_THRESHOLDS.cvPlaysCritical) score -= 25
  else if (cvPlays > RISK_THRESHOLDS.cvPlaysWarning) score -= 15

  if (daysSinceLastPost > RISK_THRESHOLDS.inactiveDaysCritical) score -= 30
  else if (daysSinceLastPost > RISK_THRESHOLDS.inactiveDaysWarning) score -= 15

  const frRatio = followerCount / Math.max(followingCount, 1)
  if (frRatio < RISK_THRESHOLDS.followerFollowingCritical) score -= 30
  else if (frRatio < RISK_THRESHOLDS.followerFollowingWarning) score -= 15

  return Math.round(clamp(score, 0, 100))
}

export function scoreInfluence(
  followerCount: number,
  engagementRate: number,
  effectiveAvgPlays: number
): number {
  const peers = getPeerBenchmarks(followerCount)
  const playsRatio = followerCount > 0 ? effectiveAvgPlays / followerCount : 0

  let score = 50

  if (engagementRate >= peers.top10ER) score += 25
  else if (engagementRate >= peers.avgER) score += 10
  else score -= 15

  if (playsRatio >= peers.avgPlaysRatio * 1.8) score += 25
  else if (playsRatio >= peers.avgPlaysRatio) score += 10
  else score -= 15

  return Math.round(clamp(score, 0, 100))
}

export interface ComputeDimsInput {
  profile: RawProfile
  metrics: Metrics
  classified: {
    mature: ClassifiedPost[]
    growing: ClassifiedPost[]
  }
  postsPerMonth: number
}

export function computeDimensions(input: ComputeDimsInput): DimensionScores {
  const { profile, metrics, classified, postsPerMonth } = input
  return {
    reach: scoreReach(profile.followerCount, metrics.effectiveAvgPlays),
    engagement: scoreEngagement(classified.mature, classified.growing),
    content: scoreContent(profile, metrics),
    authenticity: scoreAuthenticity(profile.followerCount, profile.followingCount, metrics.engagementRate, classified.mature),
    momentum: scoreMomentum(metrics.playGrowth / 100),
    stability: scoreStability(classified.mature, metrics.daysSinceLastPost),
    commerce: scoreCommerce(profile.posts),
    monetization: scoreMonetization(profile.followerCount, profile.videoCount, metrics.effectiveAvgPlays, postsPerMonth, metrics.engagementRate),
    health: scoreHealth(profile.followerCount, profile.followingCount, metrics),
    influence: scoreInfluence(profile.followerCount, metrics.engagementRate, metrics.effectiveAvgPlays),
  }
}
