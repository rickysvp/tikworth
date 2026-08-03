import type { Evaluation } from '@/types'
import type { NeonQueryFunction } from '@neondatabase/serverless'

const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').replace(/\s+/g, '')

let sql: NeonQueryFunction<false, false> | null = null
let initPromise: Promise<void> | null = null

async function getSql(): Promise<NeonQueryFunction<false, false>> {
  if (sql) return sql
  const { neon } = await import('@neondatabase/serverless')
  sql = neon(DATABASE_URL)
  return sql
}

async function initTable(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const s = await getSql()
      await s`
        CREATE TABLE IF NOT EXISTS shares (
          id TEXT PRIMARY KEY,
          evaluation JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await s`CREATE INDEX IF NOT EXISTS idx_shares_created ON shares(created_at)`
    })()
  }
  return initPromise
}

export async function createShare(evaluation: Evaluation): Promise<string> {
  await initTable()
  const s = await getSql()

  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 12)

  await s`
    INSERT INTO shares (id, evaluation, created_at)
    VALUES (${id}, ${JSON.stringify(evaluation)}::jsonb, NOW())
  `

  return id
}

export async function getShare(id: string): Promise<Evaluation | null> {
  await initTable()
  const s = await getSql()

  const rows = await s`SELECT evaluation FROM shares WHERE id = ${id}`
  if (!rows[0]) return null

  const raw = rows[0].evaluation as Partial<Evaluation>
  return ensureEvaluationFields(raw)
}

/**
 * Ensure all fields required by the share page exist.
 * Old share links may have been created before new fields were added,
 * so we fill in safe defaults to prevent client-side render crashes.
 */
function ensureEvaluationFields(raw: Partial<Evaluation>): Evaluation {
  return {
    ...raw,
    tier: raw.tier || 'C',
    score: raw.score || 0,
    nickname: raw.nickname || raw.username || 'Unknown',
    username: raw.username || 'unknown',
    followerCount: raw.followerCount || 0,
    followingCount: raw.followingCount || 0,
    totalLikes: raw.totalLikes || 0,
    videoCount: raw.videoCount || 0,
    verdict: raw.verdict || '',
    advice: raw.advice || '',
    dimensions: raw.dimensions || {
      reach: 0, engagement: 0, content: 0, authenticity: 0, momentum: 0,
      stability: 0, commerce: 0, monetization: 0, health: 0, influence: 0,
    },
    summary: raw.summary || { headline: '', strengths: [], weaknesses: [] },
    businessValue: raw.businessValue || {
      totalValue: { low: 0, mid: 0, high: 0 },
      components: [],
      summary: '',
    },
    incomeEstimate: raw.incomeEstimate || {
      monthlyTotal: { low: 0, mid: 0, high: 0 },
      breakdown: [],
      categoryCpm: 0,
      categoryLabel: '',
      regionLabel: '',
    },
    commerceReadiness: raw.commerceReadiness || {
      overallScore: 0,
      tier: 'Limited' as const,
      summary: '',
      channels: [],
      signals: [],
      productMatches: [],
      contentCommerceRatio: 0,
      recommendation: '',
    },
    growthPlan: raw.growthPlan || { items: [] },
    commercializationAdvice: raw.commercializationAdvice || {
      directions: [],
      primaryRecommendation: '',
      secondaryRecommendation: '',
      estimatedTotalMonthly: { low: 0, mid: 0, high: 0 },
      summary: '',
    },
  } as Evaluation
}

// Clean old shares (older than 30 days) — called periodically
export async function cleanOldShares(): Promise<void> {
  try {
    await initTable()
    const s = await getSql()
    await s`DELETE FROM shares WHERE created_at < NOW() - INTERVAL '30 days'`
  } catch (err) {
    console.warn('[share-store] cleanOldShares failed:', err)
  }
}