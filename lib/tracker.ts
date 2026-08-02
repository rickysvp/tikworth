import { Evaluation } from '@/types'
import { formatNumber, formatUsd } from '@/lib/format'

export interface TrackedEvaluation {
  id: string
  username: string
  nickname: string
  score: number
  tier: string
  followerCount: number
  videoCount: number
  totalLikes: number
  engagementRate: number
  avgPlays: number
  businessValue: { low: number; mid: number; high: number }
  brandMatchingValue: { low: number; mid: number; high: number }
  incomeEstimate: { low: number; mid: number; high: number }
  avatar?: string
  bio?: string
  verified?: boolean
  region?: string
  riskCount: number
  timestamp: string
}

const STORAGE_KEY = 'tokvalue_tracked_evaluations'

export function extractTrackData(evaluation: Evaluation): TrackedEvaluation {
  return {
    id: `${evaluation.username}_${Date.now()}`,
    username: evaluation.username,
    nickname: evaluation.nickname,
    score: evaluation.score,
    tier: evaluation.tier,
    followerCount: evaluation.followerCount,
    videoCount: evaluation.videoCount,
    totalLikes: evaluation.totalLikes,
    engagementRate: evaluation.metrics.engagementRate,
    avgPlays: evaluation.metrics.avgPlays,
    businessValue: {
      low: evaluation.businessValue.totalValue.low,
      mid: evaluation.businessValue.totalValue.mid,
      high: evaluation.businessValue.totalValue.high,
    },
    brandMatchingValue: {
      low: evaluation.brandMatching?.totalBrandValue?.low || 0,
      mid: evaluation.brandMatching?.totalBrandValue?.mid || 0,
      high: evaluation.brandMatching?.totalBrandValue?.high || 0,
    },
    incomeEstimate: {
      low: evaluation.incomeEstimate?.monthlyTotal?.low || 0,
      mid: evaluation.incomeEstimate?.monthlyTotal?.mid || 0,
      high: evaluation.incomeEstimate?.monthlyTotal?.high || 0,
    },
    avatar: evaluation.avatar,
    bio: evaluation.bio,
    verified: evaluation.verified,
    region: evaluation.region,
    riskCount: evaluation.riskFlags?.length || 0,
    timestamp: evaluation.computedAt,
  }
}

export function saveToTracker(evaluation: Evaluation): TrackedEvaluation {
  const data = extractTrackData(evaluation)
  const existing = loadTrackedEvaluations()

  // Replace existing entry for same username or add new
  const idx = existing.findIndex(e => e.username === data.username)
  if (idx >= 0) {
    existing[idx] = data
  } else {
    existing.unshift(data)
  }

  // Keep max 50 entries
  const trimmed = existing.slice(0, 50)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch (err) {
    console.warn('[tracker] saveToTracker failed:', err)
  }
  return data
}

export function loadTrackedEvaluations(): TrackedEvaluation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as TrackedEvaluation[]
  } catch {
    return []
  }
}

export function getTrackedByUsername(username: string): TrackedEvaluation | undefined {
  return loadTrackedEvaluations().find(e => e.username === username)
}

export function removeFromTracker(username: string): void {
  const existing = loadTrackedEvaluations()
  const filtered = existing.filter(e => e.username !== username)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (err) {
    console.warn('[tracker] removeFromTracker failed:', err)
  }
}

export function clearTracker(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (err) {
    console.warn('[tracker] clearTracker failed:', err)
  }
}

export function getLatestForUsername(username: string): TrackedEvaluation[] {
  return loadTrackedEvaluations()
    .filter(e => e.username === username)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
}

export function formatTrackUsd(n: number): string {
  return formatUsd(n)
}

export function formatTrackNumber(n: number): string {
  return formatNumber(n)
}