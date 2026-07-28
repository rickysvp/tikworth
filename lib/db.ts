import type { Evaluation } from '@/types'
import type { NeonQueryFunction } from '@neondatabase/serverless'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data')
const DATA_PATH = join(DATA_DIR, 'evaluations.json')
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL

type Store = 'postgres' | 'file' | 'memory'

let storeType: Store = 'memory'
let memoryFallback: Evaluation[] = []
let sql: NeonQueryFunction<false, false> | null = null

function getSql(): NeonQueryFunction<false, false> {
  if (!sql) throw new Error('[db] Postgres not initialized')
  return sql
}

async function initStore(): Promise<Store> {
  if (storeType !== 'memory') return storeType

  if (DATABASE_URL) {
    try {
      const { neon } = await import('@neondatabase/serverless')
      sql = neon(DATABASE_URL)
      await getSql()`
        CREATE TABLE IF NOT EXISTS evaluations (
          username TEXT PRIMARY KEY,
        nickname TEXT,
        score INTEGER,
        tier TEXT,
        dimensions JSONB,
        summary JSONB,
        metrics JSONB,
        risk_flags JSONB,
        verdict TEXT,
        advice TEXT,
        price_advice TEXT,
        computed_at TIMESTAMPTZ,
        avatar TEXT,
        bio TEXT,
        follower_count INTEGER,
        following_count INTEGER,
        total_likes INTEGER,
        video_count INTEGER,
        verified BOOLEAN,
        region TEXT,
        posts JSONB,
        account_profile JSONB,
        account_health JSONB,
        content_cadence JSONB,
        engagement_quality JSONB,
        peer_benchmark JSONB,
        brand_potential JSONB,
        monetization_path JSONB,
        growth_plan JSONB,
        income_estimate JSONB,
        business_value JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
      `
      storeType = 'postgres'
      return storeType
    } catch (err) {
      console.warn('[db] Postgres init failed, falling back to file/memory', err)
    }
  }

  try {
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
    if (!existsSync(DATA_PATH)) writeFileSync(DATA_PATH, '[]', 'utf-8')
    storeType = 'file'
  } catch (err) {
    console.warn('[db] File persistence not available, using in-memory fallback', err)
    storeType = 'memory'
  }
  return storeType
}

function readFileStore(): Evaluation[] {
  try {
    const raw = readFileSync(DATA_PATH, 'utf-8')
    return JSON.parse(raw) as Evaluation[]
  } catch (err) {
    console.warn('[db] Failed to read file store', err)
    return []
  }
}

function writeFileStore(data: Evaluation[]) {
  try {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.warn('[db] Failed to write file store, falling back to memory', err)
    storeType = 'memory'
    memoryFallback = data
  }
}

async function readStore(): Promise<Evaluation[]> {
  const type = await initStore()
  if (type === 'postgres') {
    const rows = await getSql()`SELECT * FROM evaluations ORDER BY computed_at DESC`
    return rows.map(rowToEvaluation)
  }
  if (type === 'file') return readFileStore()
  return memoryFallback
}

async function writeStore(data: Evaluation[]) {
  const type = await initStore()
  if (type === 'postgres') {
    // Postgres writes are handled per-row in saveEvaluation
    return
  }
  if (type === 'file') {
    writeFileStore(data)
  } else {
    memoryFallback = data
  }
}

export async function findEvaluation(username: string): Promise<Evaluation | null> {
  const normalized = username.trim().replace(/^@/, '').toLowerCase()
  const type = await initStore()
  if (type === 'postgres') {
    const rows = await getSql()`SELECT * FROM evaluations WHERE username = ${normalized}`
    return rows[0] ? rowToEvaluation(rows[0]) : null
  }
  const store = type === 'file' ? readFileStore() : memoryFallback
  const found = store.find(e => e.username === normalized)
  return found ? normalizeEvaluation(found) : null
}

export async function findRecentEvaluations(limit = 50): Promise<Evaluation[]> {
  const type = await initStore()
  if (type === 'postgres') {
    const rows = await getSql()`SELECT * FROM evaluations ORDER BY computed_at DESC LIMIT ${limit}`
    return rows.map(rowToEvaluation)
  }
  const store = type === 'file' ? readFileStore() : memoryFallback
  return [...store].sort((a, b) => +new Date(b.computedAt) - +new Date(a.computedAt)).slice(0, limit).map(normalizeEvaluation)
}

export async function saveEvaluation(evaluation: Evaluation): Promise<Evaluation> {
  const type = await initStore()
  if (type === 'postgres') {
    await getSql()`
      INSERT INTO evaluations
        (username, nickname, score, tier, dimensions, summary, metrics, risk_flags, verdict, advice, price_advice,
         account_health, content_cadence, engagement_quality, peer_benchmark, brand_potential, monetization_path, growth_plan,
         income_estimate,
         business_value,
         computed_at, avatar, bio, follower_count, following_count, total_likes, video_count, verified, region, posts, account_profile)
      VALUES
        (${evaluation.username}, ${evaluation.nickname}, ${evaluation.score}, ${evaluation.tier},
         ${JSON.stringify(evaluation.dimensions)}::jsonb, ${JSON.stringify(evaluation.summary)}::jsonb,
         ${JSON.stringify(evaluation.metrics)}::jsonb,
         ${JSON.stringify(evaluation.riskFlags)}::jsonb,
         ${evaluation.verdict}, ${evaluation.advice}, ${evaluation.priceAdvice},
         ${JSON.stringify(evaluation.accountHealth)}::jsonb, ${JSON.stringify(evaluation.contentCadence)}::jsonb,
         ${JSON.stringify(evaluation.engagementQuality)}::jsonb, ${JSON.stringify(evaluation.peerBenchmark)}::jsonb,
         ${JSON.stringify(evaluation.brandPotential)}::jsonb, ${JSON.stringify(evaluation.monetizationPath)}::jsonb,
         ${JSON.stringify(evaluation.growthPlan)}::jsonb,
         ${JSON.stringify(evaluation.incomeEstimate)}::jsonb,
         ${JSON.stringify(evaluation.businessValue)}::jsonb,
         ${evaluation.computedAt}, ${evaluation.avatar || null}, ${evaluation.bio || null},
         ${evaluation.followerCount}, ${evaluation.followingCount}, ${evaluation.totalLikes}, ${evaluation.videoCount},
         ${evaluation.verified ?? null}, ${evaluation.region || null}, ${JSON.stringify(evaluation.posts || [])}::jsonb,
         ${JSON.stringify(evaluation.accountProfile)}::jsonb)
      ON CONFLICT (username) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        score = EXCLUDED.score,
        tier = EXCLUDED.tier,
        dimensions = EXCLUDED.dimensions,
        summary = EXCLUDED.summary,
        metrics = EXCLUDED.metrics,
        risk_flags = EXCLUDED.risk_flags,
        verdict = EXCLUDED.verdict,
        advice = EXCLUDED.advice,
        price_advice = EXCLUDED.price_advice,
        account_health = EXCLUDED.account_health,
        content_cadence = EXCLUDED.content_cadence,
        engagement_quality = EXCLUDED.engagement_quality,
        peer_benchmark = EXCLUDED.peer_benchmark,
        brand_potential = EXCLUDED.brand_potential,
        monetization_path = EXCLUDED.monetization_path,
        growth_plan = EXCLUDED.growth_plan,
        income_estimate = EXCLUDED.income_estimate,
        business_value = EXCLUDED.business_value,
        computed_at = EXCLUDED.computed_at,
        avatar = EXCLUDED.avatar,
        bio = EXCLUDED.bio,
        follower_count = EXCLUDED.follower_count,
        following_count = EXCLUDED.following_count,
        total_likes = EXCLUDED.total_likes,
        video_count = EXCLUDED.video_count,
        verified = EXCLUDED.verified,
        region = EXCLUDED.region,
        posts = EXCLUDED.posts,
        account_profile = EXCLUDED.account_profile
    `
    return evaluation
  }

  const store = await readStore()
  const idx = store.findIndex(e => e.username === evaluation.username)
  if (idx >= 0) store[idx] = evaluation
  else store.push(evaluation)
  await writeStore(store)
  return evaluation
}

export async function isCacheValid(username: string, ttlHours = 24): Promise<boolean> {
  const found = await findEvaluation(username)
  if (!found) return false

  // Invalidate cached results that predate the structured accountProfile/categories field.
  const categories = found.accountProfile?.categories
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return false
  }

  const hours = (Date.now() - new Date(found.computedAt).getTime()) / 36e5
  return hours < ttlHours
}

function normalizeEvaluation(evaluation: Partial<Evaluation>): Evaluation {
  return {
    username: String(evaluation.username),
    nickname: String(evaluation.nickname),
    score: Number(evaluation.score),
    tier: String(evaluation.tier) as Evaluation['tier'],
    dimensions: evaluation.dimensions || { reach: 0, engagement: 0, content: 0, authenticity: 0, momentum: 0, stability: 0, commerce: 0, monetization: 0, health: 0, influence: 0 },
    summary: evaluation.summary || { headline: '', strengths: [], weaknesses: [], targetAudience: '', bestAction: '' },
    metrics: evaluation.metrics || {
      engagementRate: 0,
      avgPlays: 0,
      avgLikes: 0,
      avgComments: 0,
      avgShares: 0,
      likesPerVideo: 0,
      followerFollowingRatio: 0,
      recentMedianPlays: 0,
      olderMedianPlays: 0,
      playGrowth: 0,
      cvPlays: 0,
      daysSinceLastPost: 0,
      topPostPlays: 0,
      topPostLikes: 0,
    },
    riskFlags: Array.isArray(evaluation.riskFlags) ? evaluation.riskFlags : [],
    verdict: String(evaluation.verdict),
    advice: String(evaluation.advice),
    priceAdvice: String(evaluation.priceAdvice ?? ''),
    accountHealth: evaluation.accountHealth || {
      overallScore: 0,
      shadowbanRisk: 'low',
      shadowbanSignals: [],
      growthAnomaly: 'normal',
      growthAnomalyReason: '',
      engagementAuthenticity: 0,
      fakeFollowerEstimate: 0,
      healthReasoning: '',
    },
    contentCadence: evaluation.contentCadence || {
      postingRhythm: 'irregular',
      avgPostsPerDay: 0,
      avgPostsPerWeek: 0,
      bestTimeSlots: [],
      bestWeekdays: [],
      consistencyScore: 0,
      cadenceAdvice: '',
    },
    engagementQuality: evaluation.engagementQuality || {
      conversationDepth: 0,
      shareRatio: 0,
      saveRatio: 0,
      completionRate: 0,
      viralCoefficient: 0,
      topEngagers: [],
      qualityReasoning: '',
    },
    peerBenchmark: evaluation.peerBenchmark || {
      percentile: 0,
      peerGroupSize: '',
      benchmarks: [],
      similarCreators: [],
    },
    brandPotential: evaluation.brandPotential || {
      brandScore: 0,
      estimatedCPM: 0,
      audienceSpendingPower: 'low',
      suitableCategories: [],
      collaborationTypes: [],
      brandReasoning: '',
    },
    monetizationPath: evaluation.monetizationPath || {
      eligiblePrograms: [],
      nearestThreshold: null,
      estimatedMonthlyUsd: { low: 0, mid: 0, high: 0 },
      pathReasoning: '',
    },
    growthPlan: evaluation.growthPlan || {
      items: [],
      summary: '',
    },
    incomeEstimate: evaluation.incomeEstimate || {
      monthlyTotal: { low: 0, mid: 0, high: 0 },
      breakdown: [],
      categoryCpm: 0, categoryRpm: 0, regionMultiplier: 1,
      categoryLabel: '', regionLabel: '', summary: '',
    },
    businessValue: evaluation.businessValue || {
      totalValue: { low: 0, mid: 0, high: 0 },
      components: [],
      summary: '',
    },
    accountProfile: evaluation.accountProfile || {
      categories: [], personaType: '', postingRhythm: '', audienceRegion: '', contentStyle: '',
    },
    posts: Array.isArray(evaluation.posts) ? evaluation.posts : [],
    revenueRoadmap: evaluation.revenueRoadmap || {
      currentMonthly: { low: 0, mid: 0, high: 0 },
      projections: [],
      total12Month: { low: 0, mid: 0, high: 0 },
      summary: '',
    },
    contentStrategy: evaluation.contentStrategy || {
      pillars: [], recommendedHashtags: [], optimalSchedule: [], collaborationIdeas: [], summary: '',
    },
    peerRanking: evaluation.peerRanking || {
      overallPercentile: 0, tierLabel: '', peerGroupDescription: '', rankingBreakdown: [], insight: '',
    },
    brandMatching: evaluation.brandMatching || {
      matches: [], totalBrandValue: { low: 0, mid: 0, high: 0 }, summary: '',
    },
    trendAnalysis: evaluation.trendAnalysis || {
      trendingTopics: [], trendingSounds: [], contentPredictions: [], bestPostTimes: [], summary: '',
    },
    commercializationAdvice: evaluation.commercializationAdvice || {
      directions: [], primaryRecommendation: '', secondaryRecommendation: '', estimatedTotalMonthly: { low: 0, mid: 0, high: 0 }, summary: '',
    },
    computedAt: String(evaluation.computedAt),
    avatar: evaluation.avatar || undefined,
    bio: evaluation.bio || undefined,
    followerCount: Number(evaluation.followerCount),
    followingCount: Number(evaluation.followingCount),
    totalLikes: Number(evaluation.totalLikes),
    videoCount: Number(evaluation.videoCount),
    verified: evaluation.verified ?? undefined,
    region: evaluation.region || undefined,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseJson(value: unknown): any {
  if (!value) return undefined
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  return value
}

function rowToEvaluation(row: Record<string, unknown>): Evaluation {
  return {
    username: String(row.username),
    nickname: String(row.nickname),
    score: Number(row.score),
    tier: String(row.tier) as Evaluation['tier'],
    dimensions: typeof row.dimensions === 'string' ? JSON.parse(row.dimensions) : row.dimensions as Evaluation['dimensions'],
    summary: typeof row.summary === 'string' ? JSON.parse(row.summary) : (row.summary as Evaluation['summary']) || { headline: '', strengths: [], weaknesses: [], targetAudience: '', bestAction: '' },
    metrics: typeof row.metrics === 'string'
      ? JSON.parse(row.metrics)
      : (row.metrics as Evaluation['metrics']) || {
          engagementRate: 0,
          avgPlays: 0,
          avgLikes: 0,
          avgComments: 0,
          avgShares: 0,
          likesPerVideo: 0,
          followerFollowingRatio: 0,
          recentMedianPlays: 0,
          olderMedianPlays: 0,
          playGrowth: 0,
          cvPlays: 0,
          daysSinceLastPost: 0,
          topPostPlays: 0,
          topPostLikes: 0,
        },
    riskFlags: Array.isArray(row.risk_flags)
      ? row.risk_flags as Evaluation['riskFlags']
      : typeof row.risk_flags === 'string'
      ? JSON.parse(row.risk_flags)
      : (row.riskFlags as Evaluation['riskFlags']) || [],
    verdict: String(row.verdict),
    advice: String(row.advice),
    priceAdvice: String(row.price_advice ?? row.priceAdvice ?? ''),
    accountHealth: parseJson(row.account_health),
    contentCadence: parseJson(row.content_cadence),
    engagementQuality: parseJson(row.engagement_quality),
    peerBenchmark: parseJson(row.peer_benchmark),
    brandPotential: parseJson(row.brand_potential),
    monetizationPath: parseJson(row.monetization_path),
    growthPlan: parseJson(row.growth_plan),
    incomeEstimate: parseJson(row.income_estimate) || {
      monthlyTotal: { low: 0, mid: 0, high: 0 },
      breakdown: [],
      categoryCpm: 0, categoryRpm: 0, regionMultiplier: 1,
      categoryLabel: '', regionLabel: '', summary: '',
    },
    businessValue: parseJson(row.business_value) || {
      totalValue: { low: 0, mid: 0, high: 0 },
      components: [],
      summary: '',
    },
    accountProfile: parseJson(row.account_profile) || {
      categories: [], personaType: '', postingRhythm: '', audienceRegion: '', contentStyle: '',
    },
    revenueRoadmap: parseJson(row.revenue_roadmap) || {
      currentMonthly: { low: 0, mid: 0, high: 0 },
      projections: [],
      total12Month: { low: 0, mid: 0, high: 0 },
      summary: '',
    },
    contentStrategy: parseJson(row.content_strategy) || {
      pillars: [], recommendedHashtags: [], optimalSchedule: [], collaborationIdeas: [], summary: '',
    },
    peerRanking: parseJson(row.peer_ranking) || {
      overallPercentile: 0, tierLabel: '', peerGroupDescription: '', rankingBreakdown: [], insight: '',
    },
    brandMatching: parseJson(row.brand_matching) || {
      matches: [], totalBrandValue: { low: 0, mid: 0, high: 0 }, summary: '',
    },
    trendAnalysis: parseJson(row.trend_analysis) || {
      trendingTopics: [], trendingSounds: [], contentPredictions: [], bestPostTimes: [], summary: '',
    },
    commercializationAdvice: parseJson(row.commercialization_advice) || {
      directions: [], primaryRecommendation: '', secondaryRecommendation: '', estimatedTotalMonthly: { low: 0, mid: 0, high: 0 }, summary: '',
    },
    computedAt: String(row.computed_at ?? row.computedAt),
    avatar: row.avatar ? String(row.avatar) : undefined,
    bio: row.bio ? String(row.bio) : undefined,
    followerCount: Number(row.follower_count ?? row.followerCount),
    followingCount: Number(row.following_count ?? row.followingCount),
    totalLikes: Number(row.total_likes ?? row.totalLikes),
    videoCount: Number(row.video_count ?? row.videoCount),
    verified: row.verified != null ? Boolean(row.verified) : undefined,
    region: row.region ? String(row.region) : undefined,
    posts: Array.isArray(parseJson(row.posts)) ? parseJson(row.posts) : [],
  }
}
