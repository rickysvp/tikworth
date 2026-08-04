import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/auth'
import { storePendingPurchase } from '@/lib/credits-server'
import { findPackage } from '@/lib/credits'
import { getServerDict } from '@/lib/i18n/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

const CREEM_API_KEY = process.env.CREEM_API_KEY || ''
const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || ''
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'))

const IS_DEV = process.env.NODE_ENV === 'development'
const SKIP_PAYMENT = IS_DEV && process.env.DEV_SKIP_PAYMENT === 'true'

const PRODUCT_ID_MAP: Record<string, string> = {
  pack1: process.env.CREEM_PRODUCT_ID_PACK1 || '',
  pack6: process.env.CREEM_PRODUCT_ID_PACK6 || '',
  pack30: process.env.CREEM_PRODUCT_ID_PACK30 || '',
}

function getCreemApiBase(): string {
  if (CREEM_API_KEY.startsWith('creem_test_')) {
    return 'https://test-api.creem.io'
  }
  return 'https://api.creem.io'
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const packageId = String(body.packageId || '').trim()

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID required', code: 'INVALID_PACKAGE' }, { status: 400 })
    }

    // Verify JWT token
    const auth = req.headers.get('authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required', code: 'UNAUTHORIZED' }, { status: 401 })
    }
    const token = auth.slice(7)
    const payload = await verifySessionToken(token)
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid or expired session', code: 'UNAUTHORIZED' }, { status: 401 })
    }

    const email = payload.email.toLowerCase().trim()

    // Resolve package
    const pkg = findPackage(packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Invalid package', code: 'INVALID_PACKAGE' }, { status: 400 })
    }

    // ── Payment flow ──────────────────────────────────────────────────
    if (!SKIP_PAYMENT && (!CREEM_API_KEY || !CREEM_WEBHOOK_SECRET)) {
      console.error('[checkout] Creem not configured')
      return NextResponse.json({ error: 'Payment service not configured', code: 'CREEM_CONFIG_ERROR' }, { status: 503 })
    }

    if (!SKIP_PAYMENT) {
      const productId = PRODUCT_ID_MAP[packageId]
      if (!productId) {
        console.error('[checkout] No Creem product ID for package:', packageId)
        return NextResponse.json({ error: getServerDict().api.creem.NOT_CONFIGURED, code: 'CREEM_CONFIG_ERROR' }, { status: 503 })
      }

      const apiBase = getCreemApiBase()
      let creemRes: Response
      try {
        creemRes = await fetchWithTimeout(`${apiBase}/v1/checkouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': CREEM_API_KEY,
          },
          body: JSON.stringify({
            product_id: productId,
            success_url: `${APP_URL}/?paid=success&email=${encodeURIComponent(email)}`,
            customer: { email },
            metadata: {
              email,
              packageId,
              credits: String(pkg.credits),
              amount: String(pkg.price),
            },
          }),
        })
      } catch (fetchErr) {
        console.error('[checkout] Creem fetch error:', fetchErr)
        return NextResponse.json({ error: 'Payment service temporarily unavailable', code: 'CREEM_TIMEOUT' }, { status: 502 })
      }

      if (!creemRes.ok) {
        const errBody = await creemRes.text().catch(() => '')
        console.error('[checkout] Creem checkout failed:', creemRes.status, errBody)
        return NextResponse.json({ error: getServerDict().api.creem.CHECKOUT_FAILED, code: 'CREEM_CHECKOUT_FAILED' }, { status: 502 })
      }

      const session = await creemRes.json()
      console.log('[checkout] Creem checkout created:', JSON.stringify({
        id: session.id,
        checkout_url: session.checkout_url ? '(present)' : '(missing)',
      }))

      const checkoutId = session.id || ''
      if (checkoutId) {
        await storePendingPurchase({
          email,
          packageId,
          credits: pkg.credits,
          amount: pkg.price,
          checkoutId,
          createdAt: Date.now(),
        })
        console.log('[checkout] Pending purchase stored for:', email, 'checkoutId:', checkoutId)
      }

      return NextResponse.json({
        ok: true,
        checkoutUrl: session.checkout_url,
      })
    }

    // DEV MODE: directly grant credits
    return NextResponse.json({
      ok: true,
      devMode: true,
      message: 'Dev mode — no checkout needed',
    })
  } catch (err) {
    console.error('[checkout] CRASH:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Checkout failed', code: 'CHECKOUT_ERROR' }, { status: 500 })
  }
}
