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
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track] recordEvent failed:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ ok: true })
  }
}
