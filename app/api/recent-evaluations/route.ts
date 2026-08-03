import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export interface RecentEvaluation {
  username: string
  nickname: string
  avatar: string | null
  tier: string
  score: number
  followerCount: number
  totalLikes: number
  videoCount: number
  region: string | null
  verified: boolean
  categories: string[]
  personaType: string | null
  businessValueHigh: number
  computedAt: string
}

export async function GET() {
  try {
    const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').replace(/\s+/g, '')
    if (!DATABASE_URL) {
      return NextResponse.json({ evaluations: [] }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
    }

    const sql = neon(DATABASE_URL)

    // 最近 12 个评估（按 created_at 降序），只取展示所需字段（脱敏）
    const rows = await sql`
      SELECT
        username,
        nickname,
        avatar,
        tier,
        score,
        follower_count,
        total_likes,
        video_count,
        region,
        verified,
        account_profile,
        business_value->'totalValue'->>'high' as bv_high,
        computed_at
      FROM evaluations
      WHERE username IS NOT NULL
        AND follower_count > 1000
      ORDER BY created_at DESC
      LIMIT 12
    `

    const evaluations: RecentEvaluation[] = rows.map((r: Record<string, unknown>) => {
      const profile = (r.account_profile || {}) as {
        categories?: string[]
        personaType?: string
      }
      return {
        username: String(r.username || ''),
        nickname: String(r.nickname || r.username || ''),
        avatar: r.avatar ? String(r.avatar) : null,
        tier: String(r.tier || 'C'),
        score: Number(r.score || 0),
        followerCount: Number(r.follower_count || 0),
        totalLikes: Number(r.total_likes || 0),
        videoCount: Number(r.video_count || 0),
        region: r.region ? String(r.region) : null,
        verified: Boolean(r.verified),
        categories: Array.isArray(profile.categories) ? profile.categories.slice(0, 3) : [],
        personaType: profile.personaType || null,
        businessValueHigh: Number(r.bv_high || 0),
        computedAt: String(r.computed_at || ''),
      }
    })

    return NextResponse.json(
      { evaluations },
      { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } }
    )
  } catch (err) {
    console.error('[recent-evaluations] error:', err)
    return NextResponse.json(
      { evaluations: [] },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }
}
