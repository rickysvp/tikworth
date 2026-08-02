import { NextRequest, NextResponse } from 'next/server'
import { claimPendingPurchase } from '@/lib/credits-server'
import { getBearerToken, verifySessionToken } from '@/lib/auth'
import { getServerDict } from '@/lib/i18n/server'
import { recordEvent } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = getBearerToken(req)
    if (!token) {
      return NextResponse.json({ error: getServerDict().api.balance.UNAUTHORIZED, code: 'UNAUTHORIZED' }, { status: 401 })
    }
    const payload = await verifySessionToken(token)
    if (!payload) {
      return NextResponse.json({ error: getServerDict().api.balance.SESSION_EXPIRED, code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const email = payload.email.toLowerCase().trim()
    const balance = await claimPendingPurchase(email)

    if (!balance) {
      // No pending purchase — return current balance
      return NextResponse.json({
        claimed: false,
        email,
        credits: 0,
        totalPurchased: 0,
      })
    }

    // Track purchase event
    recordEvent({
      event_type: 'purchase',
      email,
      metadata: { claimed_via: 'success_page' },
    }).catch(() => {})

    return NextResponse.json({
      claimed: true,
      email: balance.email,
      credits: balance.credits,
      totalPurchased: balance.totalPurchased,
    })
  } catch (err) {
    console.error('[claim] error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: getServerDict().api.balance.BALANCE_ERROR, code: 'CLAIM_ERROR' }, { status: 500 })
  }
}