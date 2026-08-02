import { NextRequest, NextResponse } from 'next/server'
import { getAuditLog } from '@/lib/analytics'
import { verifyAdminRequest } from '@/lib/admin-api-utils'

export async function GET(req: NextRequest) {
  const authError = await verifyAdminRequest(req)
  if (authError) return authError
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)

  try {
    const result = await getAuditLog(limit, offset, 'grant_credits')
    return NextResponse.json(result)
  } catch (err) {
    console.error('[credits-history] error:', err)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}