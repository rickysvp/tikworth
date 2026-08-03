import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 min cache

export async function GET() {
  try {
    const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').replace(/\s+/g, '')
    if (!DATABASE_URL) {
      return NextResponse.json({ accountsEvaluated: 0, totalValueAssessed: 0, uniqueVisitors: 0 })
    }

    const sql = neon(DATABASE_URL)

    // 1. Total evaluations count
    const countRows = await sql`SELECT COUNT(*) as count FROM evaluations`
    const accountsEvaluated = Number(countRows[0]?.count || 0)

    // 2. Sum of business value highs across all evaluations
    const valueRows = await sql`
      SELECT COALESCE(SUM((business_value->'totalValue'->>'high')::numeric), 0) as total
      FROM evaluations
      WHERE business_value->'totalValue'->>'high' IS NOT NULL
    `
    const totalValueAssessed = Number(valueRows[0]?.total || 0)

    // 3. Unique visitors — ensure table exists first, then query
    let uniqueVisitors = 0
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id SERIAL PRIMARY KEY,
          event_type TEXT,
          path TEXT,
          username TEXT,
          email TEXT,
          metadata JSONB,
          ip_hash TEXT,
          user_agent TEXT,
          referrer TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
      const uvRows = await sql`SELECT COUNT(DISTINCT ip_hash) as count FROM analytics_events WHERE event_type = 'page_view' AND ip_hash IS NOT NULL`
      uniqueVisitors = Number(uvRows[0]?.count || 0)
    } catch (e) {
      console.error('[stats] analytics query failed:', e instanceof Error ? e.message : String(e))
    }

    return NextResponse.json({
      accountsEvaluated,
      totalValueAssessed,
      uniqueVisitors,
    })
  } catch (err) {
    console.error('[stats] error:', err)
    return NextResponse.json({ accountsEvaluated: 0, totalValueAssessed: 0, uniqueVisitors: 0 })
  }
}
