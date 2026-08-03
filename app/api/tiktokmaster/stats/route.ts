import { NextRequest, NextResponse } from 'next/server'
import { getStatsOverview, getRevenueByDay, getRevenueByPackage, getPVUV, getUsersList, getTrafficSources } from '@/lib/analytics'
import { verifyAdminRequest } from '@/lib/admin-api-utils'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authError = await verifyAdminRequest(req)
  if (authError) return authError
  const url = new URL(req.url)
  const period = url.searchParams.get('period') || '30d'
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30

  const noStore = { 'Cache-Control': 'no-store, max-age=0' }

  try {
    const [overview, byDay, byPackage, pvuv, users, sources] = await Promise.all([
      getStatsOverview(),
      getRevenueByDay(days),
      getRevenueByPackage(days),
      getPVUV(),
      getUsersList(),
      getTrafficSources(days),
    ])

    return NextResponse.json({
      overview,
      revenue: { byDay, byPackage },
      pvuv,
      users,
      sources,
    }, { headers: noStore })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[stats] error:', msg, err)
    return NextResponse.json({ error: 'Failed to fetch stats', detail: msg }, { status: 500, headers: noStore })
  }
}