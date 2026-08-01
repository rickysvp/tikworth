import { NextRequest, NextResponse } from 'next/server'
import { getBalance } from '@/lib/credits-server'
import { getBearerToken, verifySessionToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return NextResponse.json({ error: '请先登录', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    const payload = await verifySessionToken(token)
    if (!payload) {
      return NextResponse.json({ error: '登录已过期，请重新验证', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const balance = getBalance(payload.email)
    if (!balance) {
      return NextResponse.json({
        email: payload.email,
        credits: 0,
        totalPurchased: 0,
      })
    }

    return NextResponse.json({
      email: balance.email,
      credits: balance.credits,
      totalPurchased: balance.totalPurchased,
    })
  } catch (err) {
    console.error('[balance] error:', err)
    return NextResponse.json({ error: '查询失败，请稍后再试', code: 'BALANCE_ERROR' }, { status: 500 })
  }
}
