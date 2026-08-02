import { NextRequest, NextResponse } from 'next/server'
import { getPendingPurchase, claimPendingPurchase } from '@/lib/credits-server'
import { getBearerToken, verifySessionToken } from '@/lib/auth'
import { getServerDict } from '@/lib/i18n/server'
import { recordEvent } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

const CREEM_API_KEY = process.env.CREEM_API_KEY || ''

function getCreemApiBase(): string {
  if (CREEM_API_KEY.startsWith('creem_test_')) {
    return 'https://test-api.creem.io'
  }
  return 'https://api.creem.io'
}

async function verifyCreemCheckout(checkoutId: string): Promise<boolean> {
  if (!CREEM_API_KEY) {
    console.warn('[claim] No CREEM_API_KEY configured')
    return false
  }
  try {
    const apiBase = getCreemApiBase()
    // Creem API uses query parameter, NOT path parameter
    const url = `${apiBase}/v1/checkouts?checkout_id=${encodeURIComponent(checkoutId)}`
    console.log('[claim] Verifying checkout:', url)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const res = await fetch(url, {
        headers: { 'x-api-key': CREEM_API_KEY },
        signal: controller.signal,
      })
      if (!res.ok) {
        const errBody = await res.text().catch(() => '')
        console.warn('[claim] Creem checkout lookup failed:', res.status, errBody)
        return false
      }
      const data = await res.json()
      console.log('[claim] Creem checkout response:', JSON.stringify({
        id: data.id,
        status: data.status,
        orderStatus: data.order?.status,
        orderAmount: data.order?.amount,
      }))

      // checkout.status is "completed" even before payment
      // real payment status is in order.status: "pending" → "paid"
      const orderStatus = data.order?.status || ''
      const checkoutStatus = data.status || ''

      if (orderStatus === 'paid') {
        console.log('[claim] Payment verified: order.status=paid')
        return true
      }

      // Fallback: some one-time payments may not have order.status
      // Check if checkout is completed AND order exists
      if (checkoutStatus === 'completed' && data.order && orderStatus !== 'pending') {
        console.log('[claim] Payment verified: checkout completed + order not pending')
        return true
      }

      console.warn('[claim] Payment NOT verified:', { checkoutStatus, orderStatus })
      return false
    } finally {
      clearTimeout(timer)
    }
  } catch (err) {
    console.error('[claim] Creem verification error:', err instanceof Error ? err.message : String(err))
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[claim] POST received')

    const token = getBearerToken(req)
    if (!token) {
      console.warn('[claim] No session token')
      return NextResponse.json({ error: getServerDict().api.balance.UNAUTHORIZED, code: 'UNAUTHORIZED' }, { status: 401 })
    }
    const payload = await verifySessionToken(token)
    if (!payload) {
      console.warn('[claim] Invalid/expired session token')
      return NextResponse.json({ error: getServerDict().api.balance.SESSION_EXPIRED, code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const email = payload.email.toLowerCase().trim()
    console.log('[claim] Checking pending purchase for:', email)

    // Step 1: Look up pending purchase
    const pending = await getPendingPurchase(email)
    if (!pending) {
      console.log('[claim] No pending purchase found for:', email)
      return NextResponse.json({
        claimed: false,
        email,
        credits: 0,
        totalPurchased: 0,
      })
    }

    console.log('[claim] Found pending purchase:', {
      checkoutId: pending.checkoutId,
      packageId: pending.packageId,
      credits: pending.credits,
    })

    // Step 2: Verify payment with Creem before granting credits
    const isPaid = await verifyCreemCheckout(pending.checkoutId)
    if (!isPaid) {
      console.warn('[claim] Creem checkout not paid for', email, 'checkout:', pending.checkoutId)
      return NextResponse.json({
        claimed: false,
        email,
        credits: 0,
        totalPurchased: 0,
        reason: 'PAYMENT_NOT_VERIFIED',
      })
    }

    // Step 3: Grant credits
    console.log('[claim] Granting credits for:', email)
    const balance = await claimPendingPurchase(email)
    if (!balance) {
      console.warn('[claim] claimPendingPurchase returned null for:', email)
      return NextResponse.json({
        claimed: false,
        email,
        credits: 0,
        totalPurchased: 0,
      })
    }

    console.log('[claim] Credits granted successfully:', {
      email: balance.email,
      credits: balance.credits,
    })

    // Track purchase event
    recordEvent({
      event_type: 'purchase',
      email,
      metadata: { package_id: pending.packageId, credits: pending.credits, amount: pending.amount, claimed_via: 'success_page' },
    }).catch(() => {})

    return NextResponse.json({
      claimed: true,
      email: balance.email,
      credits: balance.credits,
      totalPurchased: balance.totalPurchased,
    })
  } catch (err) {
    console.error('[claim] CRASH:', err instanceof Error ? err.message : String(err), err instanceof Error ? err.stack : '')
    return NextResponse.json({ error: getServerDict().api.balance.BALANCE_ERROR, code: 'CLAIM_ERROR' }, { status: 500 })
  }
}