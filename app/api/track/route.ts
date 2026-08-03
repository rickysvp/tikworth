import { NextRequest, NextResponse } from 'next/server'
import { recordEventFromRequest } from '@/lib/analytics'

/**
 * 客户端埋点接收端点。
 * 所有 tracker（PageViewTracker、trackEvent 等）统一发到此路由，
 * 由 lib/analytics 的 recordEventFromRequest 统一写入。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // 提取 session_id（客户端 sid，用于 UV 去重）
    const sessionId = body.session_id || null
    await recordEventFromRequest(req, {
      event_type: body.event_type || 'unknown',
      path: body.path || '/',
      username: body.username,
      email: body.email,
      metadata: body.metadata || {},
      session_id: sessionId,
      // 客户端 document.referrer 是真实外部来源，优先于 fetch 自动设置的 Referer header
      referrer: body.referrer || undefined,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    // 返回 500 以便服务端监控能捕获写入失败（客户端 .catch 已静默处理，不影响用户体验）
    console.error('[track] recordEvent failed:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ ok: false, error: 'track_failed' }, { status: 500 })
  }
}
