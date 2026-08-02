import { NextRequest, NextResponse } from 'next/server'
import { getStatsOverview, getFunnel, getRevenueByDay, getRevenueByPackage, getPVUV, getUsersList } from '@/lib/analytics'
import { verifyAdminRequest } from '@/lib/admin-api-utils'

export async function GET(req: NextRequest) {
  const authError = await verifyAdminRequest(req)
  if (authError) return authError
  const url = new URL(req.url)
  const period = url.searchParams.get('period') || '30d'
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30

  try {
    const [overview, funnel, byDay, byPackage, pvuv, users] = await Promise.all([
      getStatsOverview(),
      getFunnel(days),
      getRevenueByDay(days),
      getRevenueByPackage(days),
      getPVUV(),
      getUsersList(),
    ])

    return NextResponse.json({
      overview,
      funnel,
      revenue: { byDay, byPackage },
      pvuv,
      users,
      operations: {
        apiCalls: 0,
        apiErrors: 0,
        cacheHitRate: 0,
        avgResponseTime: 0,
      },
    })
  } catch (err) {
    console.error('[stats] error:', err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}