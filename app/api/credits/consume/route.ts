import { NextRequest, NextResponse } from 'next/server'
import { consumeCredit } from '@/lib/credits-server'
import { getBearerToken, verifySessionToken } from '@/lib/auth'
import { getServerDict } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return NextResponse.json({ error: getServerDict().api.consume.UNAUTHORIZED, code: 'UNAUTHORIZED' }, { status: 401 })
    }
    const payload = await verifySessionToken(token)
    if (!payload) {
      return NextResponse.json({ error: getServerDict().api.consume.SESSION_EXPIRED, code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const result = await consumeCredit(payload.email)
    if (!result.ok) {
      const msgs: Record<string, { msg: string; status: number }> = {
        NOT_FOUND:  { msg: getServerDict().api.errors.NO_CREDITS, status: 404 },
        NO_CREDITS: { msg: getServerDict().api.errors.NO_CREDITS, status: 402 },
      }
      const err = msgs[result.reason || ''] || { msg: getServerDict().api.consume.CONSUME_ERROR, status: 400 }
      return NextResponse.json({ error: err.msg, code: result.reason }, { status: err.status })
    }
    if (!result.balance) {
      return NextResponse.json({ error: getServerDict().api.consume.CONSUME_ERROR, code: 'CONSUME_ERROR' }, { status: 500 })
    }
    return NextResponse.json({
      ok: true,
      balance: {
        email: result.balance.email,
        credits: result.balance.credits,
        totalPurchased: result.balance.totalPurchased,
      },
    })
  } catch (err) {
    console.error('[consume] error:', err)
    return NextResponse.json({ error: getServerDict().api.consume.CONSUME_ERROR, code: 'CONSUME_ERROR' }, { status: 500 })
  }
}