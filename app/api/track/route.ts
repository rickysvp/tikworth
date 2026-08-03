import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').replace(/\s+/g, '')
    if (!DATABASE_URL) return NextResponse.json({ ok: true })

    const sql = neon(DATABASE_URL)

    // Ensure table exists
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

    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)

    await sql`
      INSERT INTO analytics_events (event_type, path, username, email, metadata, ip_hash, user_agent, referrer)
      VALUES (
        ${body.event_type || 'unknown'},
        ${body.path || null},
        ${body.username || null},
        ${body.email || null},
        ${JSON.stringify(body.metadata || {})}::jsonb,
        ${ipHash},
        ${req.headers.get('user-agent') || null},
        ${body.referrer || null}
      )
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
