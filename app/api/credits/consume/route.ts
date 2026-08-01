import { NextRequest, NextResponse } from 'next/server'
import { consumeCredit } from '@/lib/credits-server'
import { getBearerToken, verifySessionToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return NextResponse.json({ error: '请先登录', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    const payload = await verifySessionToken(token)
    if (!payload) {
      return NextResponse.json({ error: '登录已过期，请重新验证', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const result = await consumeCredit(payload.email)
    if (!result.ok) {
      const msgs: Record<string, { msg: string; status: number }> = {
        NOT_FOUND:  { msg: '未找到该邮箱的积分记录', status: 404 },
        NO_CREDITS: { msg: '积分不足，请先购买额度', status: 402 },
      }
      const err = msgs[result.reason || ''] || { msg: '消费失败', status: 400 }
      return NextResponse.json({ error: err.msg, code: result.reason }, { status: err.status })
    }
    if (!result.balance) {
      return NextResponse.json({ error: '内部错误', code: 'CONSUME_ERROR' }, { status: 500 })
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
    return NextResponse.json({ error: '消费失败，请稍后再试', code: 'CONSUME_ERROR' }, { status: 500 })
  }
}
