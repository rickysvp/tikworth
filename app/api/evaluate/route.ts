import { NextRequest, NextResponse } from 'next/server'
import { fetchProfile } from '@/lib/tiktok'
import { scoreProfile } from '@/lib/scoring'
import { findEvaluation, saveEvaluation, isCacheValid } from '@/lib/db'
import { generateMockEvaluation } from '@/lib/mock'
import { generateTrendAnalysis, generateCommercializationAdvice, generateContentStrategy } from '@/lib/deepseek'
import { ApiErrorResponse, Evaluation } from '@/types'

const MOCK_MODE = process.env.MOCK_MODE === 'true' || !process.env.RAPIDAPI_KEY || process.env.RAPIDAPI_KEY === 'your_rapidapi_key_here'

function buildSnapshot(evaluation: Evaluation) {
  return {
    username: evaluation.username,
    nickname: evaluation.nickname,
    followerCount: evaluation.followerCount,
    videoCount: evaluation.videoCount,
    totalLikes: evaluation.totalLikes,
    engagementRate: evaluation.metrics.engagementRate,
    avgPlays: evaluation.metrics.avgPlays,
    playGrowth: evaluation.metrics.playGrowth,
    region: evaluation.region || 'US',
    categories: evaluation.accountProfile?.categories || ['泛娱乐'],
    tier: evaluation.tier,
    score: evaluation.score,
    videoDescriptions: evaluation.posts?.slice(0, 10).map((p) => p.desc || '').filter(Boolean) || [],
  }
}

function isValidTrendAnalysis(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false
  const t = v as Record<string, unknown>
  return Array.isArray(t.trendingTopics) && Array.isArray(t.trendingSounds) && typeof t.summary === 'string'
}

function isValidCommercializationAdvice(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false
  const c = v as Record<string, unknown>
  return Array.isArray(c.directions) && typeof c.summary === 'string'
}

function isValidContentStrategy(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false
  const c = v as Record<string, unknown>
  return Array.isArray(c.pillars) && Array.isArray(c.recommendedHashtags)
}

async function enrichWithAI(evaluation: Evaluation): Promise<Evaluation> {
  const snapshot = buildSnapshot(evaluation)

  try {
    const [trendRes, commerceRes, strategyRes] = await Promise.allSettled([
      generateTrendAnalysis(snapshot),
      generateCommercializationAdvice(snapshot),
      generateContentStrategy(snapshot),
    ])

    if (trendRes.status === 'fulfilled' && trendRes.value && isValidTrendAnalysis(trendRes.value)) {
      evaluation.trendAnalysis = trendRes.value
    }
    if (commerceRes.status === 'fulfilled' && commerceRes.value && isValidCommercializationAdvice(commerceRes.value)) {
      evaluation.commercializationAdvice = commerceRes.value
    }
    if (strategyRes.status === 'fulfilled' && strategyRes.value && isValidContentStrategy(strategyRes.value)) {
      evaluation.contentStrategy = strategyRes.value
    }
  } catch (err) {
    console.warn('[evaluate] AI enrichment failed:', err)
  }

  return evaluation
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const username = String(body.username || '').trim()

    if (!username) {
      return NextResponse.json<ApiErrorResponse>(
        { error: '请输入 TikTok 账号', code: 'INVALID_USERNAME' },
        { status: 400 }
      )
    }

    const normalized = username.replace(/^@/, '').toLowerCase()

    // 24h cache to save RapidAPI quota
    if (await isCacheValid(normalized, 24)) {
      const cached = await findEvaluation(normalized)
      if (cached) {
        return NextResponse.json({ ...cached, cached: true })
      }
    }

    if (MOCK_MODE) {
      const evaluation = generateMockEvaluation(normalized)
      const enriched = await enrichWithAI(evaluation)
      await saveEvaluation({ ...enriched, username: normalized })
      return NextResponse.json({ ...enriched, mock: true })
    }

    // Try real API, fallback to mock on failure
    let evaluation: Evaluation
    let isMock = false

    try {
      const profile = await fetchProfile(normalized)
      evaluation = scoreProfile(profile)
    } catch (err) {
      // Fallback to mock data when API fails (including USER_NOT_FOUND)
      const message = err instanceof Error ? err.message : String(err)
      console.warn(`[evaluate] API failed for @${normalized}: ${message}`)
      evaluation = generateMockEvaluation(normalized)
      isMock = true
    }

    const enriched = await enrichWithAI(evaluation)

    // Only cache real API results for 24h; mock fallback should not be cached long
    if (!isMock) {
      await saveEvaluation(enriched)
    }

    return NextResponse.json({ ...enriched, ...(isMock ? { mock: true } : {}) })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (message === 'INVALID_USERNAME') {
      return NextResponse.json<ApiErrorResponse>(
        { error: '请输入有效的 TikTok 账号', code: 'INVALID_USERNAME' },
        { status: 400 }
      )
    }
    if (message === 'USER_NOT_FOUND') {
      return NextResponse.json<ApiErrorResponse>(
        { error: '未找到该 TikTok 账号，请检查用户名是否正确', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }
    if (message === 'RATE_LIMIT') {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'API 速率受限，请稍后再试', code: 'RATE_LIMIT' },
        { status: 429 }
      )
    }

    console.error('[evaluate] error', err)
    return NextResponse.json<ApiErrorResponse>(
      { error: '评估服务暂时不可用，请稍后再试', code: 'API_ERROR' },
      { status: 500 }
    )
  }
}
