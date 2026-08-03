import { NextRequest, NextResponse } from 'next/server'
import { recordEventFromRequest } from '@/lib/analytics'

/**
 * 客户端埋点接收端点。
 * 所有 tracker（PageViewTracker、trackEvent 等）统一发到此路由，
 * 由 lib/analytics 的 recordEventFromRequest 统一写入，确保
 * ip_hash/user_agent/referrer 字段与表结构一致。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await recordEventFromRequest(req, {
      event_type: body.event_type || 'unknown',
      path: body.path || '/',
      username: body.username,
      email: body.email,
      metadata: body.metadata,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.warn('[track] error:', err instanceof Error ? err.message : String(err))
    // 埋点失败不阻塞主流程
    return NextResponse.json({ ok: true })
  }
}
