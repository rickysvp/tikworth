import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/admin-api-utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authError = await verifyAdminRequest(req)
  if (authError) return authError

  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit')) || 100, 200)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)

  try {
    const dbUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').replace(/\s+/g, '')
    if (!dbUrl) {
      return NextResponse.json({ items: [], total: 0, error: '数据库未配置' })
    }

    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(dbUrl)

    // 查询最近的事件日志（含用户行为 + 支付 + 系统）
    const rows = await sql`
      SELECT
        id,
        event_type,
        path,
        username,
        email,
        metadata,
        ip_hash,
        user_agent,
        created_at
      FROM analytics_events
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    ` as Array<Record<string, unknown>>

    const countRow = await sql`SELECT COUNT(*) as total FROM analytics_events`
    const total = Number(countRow[0]?.total || 0)

    const items = rows.map(r => ({
      id: Number(r.id),
      eventType: String(r.event_type || ''),
      path: String(r.path || ''),
      username: String(r.username || ''),
      email: String(r.email || ''),
      metadata: r.metadata || null,
      ipHash: String(r.ip_hash || ''),
      userAgent: String(r.user_agent || ''),
      createdAt: String(r.created_at),
    }))

    return NextResponse.json({ items, total })
  } catch (err) {
    console.error('[admin-logs] error:', err)
    return NextResponse.json({ items: [], total: 0, error: '获取日志失败' }, { status: 500 })
  }
}