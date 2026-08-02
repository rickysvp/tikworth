import { NextResponse } from 'next/server'

export async function GET() {
  const dbUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim()
  let pgOk = false
  let pgError = ''

  if (dbUrl) {
    try {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(dbUrl)
      const result = await sql`SELECT 1 as ok`
      pgOk = result[0]?.ok === 1
    } catch (err) {
      pgError = err instanceof Error ? err.message : String(err)
    }
  }

  return NextResponse.json({
    status: 'ok',
    vercel: !!process.env.VERCEL,
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!dbUrl,
    pgOk,
    pgError: pgError || null,
    hasResend: !!process.env.RESEND_API_KEY,
    hasCreem: !!process.env.CREEM_API_KEY,
  })
}