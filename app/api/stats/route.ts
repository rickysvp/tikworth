import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getPVUV } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').replace(/\s+/g, '')
    if (!DATABASE_URL) {
      return NextResponse.json(
        { accountsEvaluated: 0, totalValueAssessed: 0, uniqueVisitors: 0 },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
      )
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

    // 3. Unique visitors — 统一走 lib/analytics（不再自己建表）
    let uniqueVisitors = 0
    try {
      const pvuv = await getPVUV()
      uniqueVisitors = pvuv.totalUV
    } catch (e) {
      console.error('[stats] analytics query failed:', e instanceof Error ? e.message : String(e))
    }

    return NextResponse.json(
      { accountsEvaluated, totalValueAssessed, uniqueVisitors },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (err) {
    console.error('[stats] error:', err)
    return NextResponse.json(
      { accountsEvaluated: 0, totalValueAssessed: 0, uniqueVisitors: 0 },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  }
}
