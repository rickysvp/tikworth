import { NextRequest, NextResponse } from 'next/server'
import {
  recordEventFromRequest,
  shouldSkipEvent,
  normalizeHostname,
  normalizeReferrer,
} from '@/lib/analytics'

export const dynamic = 'force-dynamic'

/**
 * 客户端埋点接收端点。
 * 所有 tracker（PageViewTracker、trackEvent 等）统一发到此路由，
 * 由 lib/analytics 的 recordEventFromRequest 统一写入。
 *
 * 优化：
 * - 过滤 bot/crawler，避免污染 UV/PV 数据
 * - 归一化 Vercel preview hostname 到生产域名
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ua = req.headers.get('user-agent') || ''
    const eventType = body.event_type || 'unknown'

    // Bot filtering: skip non-human traffic for page_view events
    if (eventType === 'page_view' && shouldSkipEvent(ua)) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Extract and normalize hostname from request
    const hostname = normalizeHostname(req.headers.get('host') || '')

    // Extract session_id (client sid, used for UV dedup)
    const sessionId = body.session_id || null

    // Normalize referrer — map Vercel preview URLs to production domain
    const rawReferrer = body.referrer || ''
    const normalizedReferrer = normalizeReferrer(rawReferrer)

    await recordEventFromRequest(req, {
      event_type: eventType,
      path: body.path || '/',
      username: body.username,
      email: body.email,
      metadata: {
        ...(body.metadata || {}),
        hostname,
      },
      session_id: sessionId,
      referrer: normalizedReferrer || undefined,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track] recordEvent failed:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ ok: false, error: 'track_failed' }, { status: 500 })
  }
}
