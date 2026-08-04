import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const rawUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '')
  const dbUrl = rawUrl.replace(/\s+/g, '')
  let pgOk = false
  let pgError = ''
  let creditTableExists = false
  let creditTableError = ''

  if (dbUrl) {
    try {
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(dbUrl)
      const result = await sql`SELECT 1 as ok`
      pgOk = result[0]?.ok === 1

      if (pgOk) {
        try {
          const tableCheck = await sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_name = 'credit_balances'
            ) as exists
          `
          creditTableExists = tableCheck[0]?.exists === true
        } catch (err) {
          creditTableError = err instanceof Error ? err.message : String(err)
        }
      }
    } catch (err) {
      pgError = err instanceof Error ? err.message : String(err)
    }
  }

  return NextResponse.json({
    status: 'ok',
    vercel: !!process.env.VERCEL,
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!dbUrl,
    dbUrlLength: rawUrl.length,
    dbUrlNeedsClean: rawUrl.length !== dbUrl.length,
    pgOk,
    pgError: pgError || null,
    creditTableExists,
    creditTableError: creditTableError || null,
    hasResend: !!process.env.RESEND_API_KEY,
    hasCreem: !!process.env.CREEM_API_KEY,
    skipPayment: process.env.DEV_SKIP_PAYMENT === 'true',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  })
}