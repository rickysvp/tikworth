import { NextRequest, NextResponse } from 'next/server'
import { grantCredits } from '@/lib/credits-server'
import { verifyCode, createSessionToken } from '@/lib/auth'
import { getServerDict, t as serverT } from '@/lib/i18n/server'

const CREEM_API_KEY = process.env.CREEM_API_KEY || ''
const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000'

// Creem product ID mapping: packageId → product_id
const PRODUCT_ID_MAP: Record<string, string> = {
  pack1: process.env.CREEM_PRODUCT_ID_PACK1 || '',
  pack6: process.env.CREEM_PRODUCT_ID_PACK6 || '',
  pack30: process.env.CREEM_PRODUCT_ID_PACK30 || '',
}

function getCreemApiBase(): string {
  // Creem key prefix determines environment: creem_test_ → test, creem_ → live
  if (CREEM_API_KEY.startsWith('creem_test_')) {
    return 'https://test-api.creem.io'
  }
  return 'https://api.creem.io'
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const code = String(body.code || '').trim()

    if (!email) return NextResponse.json({ error: getServerDict().api.auth.NO_EMAIL, code: 'INVALID_EMAIL' }, { status: 400 })
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: getServerDict().api.auth.INVALID_CODE, code: 'INVALID_CODE' }, { status: 400 })
    }

    const storeUsed = (process.env.DATABASE_URL || process.env.POSTGRES_URL) ? 'postgres' : 'file'
    console.log(`[verify-code] store=${storeUsed} email=${email} code=${code}`)

    const result = await verifyCode(email, code)
    if (!result.ok) {
      const messages: Record<string, { msg: string; status: number }> = {
        expired:    { msg: getServerDict().api.auth.VERIFY_EXPIRED, status: 410 },
        wrong:      { msg: getServerDict().api.auth.VERIFY_WRONG, status: 401 },
        not_found:  { msg: getServerDict().api.auth.VERIFY_NOT_FOUND, status: 404 },
        too_many:   { msg: getServerDict().api.auth.VERIFY_TOO_MANY, status: 429 },
      }
      const err = messages[result.reason] || { msg: getServerDict().api.auth.VERIFY_FAILED, status: 400 }
      console.log(`[verify-code] ${result.reason} for ${email}: input=${code}`)
      return NextResponse.json({ error: err.msg, code: 'VERIFY_FAILED', reason: result.reason }, { status: err.status })
    }

    const { entry } = result
    const token = await createSessionToken(email)

    // ── Payment flow ──────────────────────────────────────────────────
    // PRODUCTION (with Creem configured):
    //   1. Verify email → create Creem Checkout Session
    //   2. Return { checkoutUrl, token } → redirect browser to Creem
    //   3. Creem webhook (checkout.completed) triggers grantCredits
    //   4. Success page polls /api/credits/balance with token until credits appear
    //
    // DEV MODE (NEXT_PUBLIC_DEV_SKIP_PAYMENT=true 或 Creem API key 未配置):
    //   直接发放额度，跳过支付。用于本地开发和测试。
    const skipPayment = process.env.NEXT_PUBLIC_DEV_SKIP_PAYMENT === 'true'
    if (CREEM_API_KEY && CREEM_WEBHOOK_SECRET && !skipPayment) {
      const productId = PRODUCT_ID_MAP[entry.packageId]
      if (!productId) {
        console.error(`[verify-code] No Creem product ID mapped for package: ${entry.packageId}`)
        return NextResponse.json({ error: getServerDict().api.creem.NOT_CONFIGURED, code: 'CREEM_CONFIG_ERROR' }, { status: 503 })
      }

      const apiBase = getCreemApiBase()
      const creemRes = await fetch(`${apiBase}/v1/checkouts`, {
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
            packageId: entry.packageId,
            credits: String(entry.credits),
            amount: String(entry.amount),
          },
        }),
      })

      if (!creemRes.ok) {
        const errBody = await creemRes.text()
        console.error('[verify-code] Creem checkout creation failed:', creemRes.status, errBody)
        return NextResponse.json({ error: getServerDict().api.creem.CHECKOUT_FAILED, code: 'CREEM_CHECKOUT_FAILED' }, { status: 502 })
      }

      const session = await creemRes.json()
      return NextResponse.json({
        ok: true,
        requiresPayment: true,
        checkoutUrl: session.checkout_url,
        token,
      })
    }

    // DEV MODE: Creem 未配置，直接发放额度模拟登录成功
    const balance = await grantCredits(email, entry.packageId, entry.credits, entry.amount)
    return NextResponse.json({
      ok: true,
      email,
      granted: entry.credits,
      packageId: entry.packageId,
      balance: balance.credits,
      token,
      message: serverT(getServerDict().api.auth.VERIFY_SUCCESS, { count: entry.credits }),
    })
  } catch (err) {
    console.error('[verify-code] error:', err)
    return NextResponse.json({ error: getServerDict().api.auth.VERIFY_ERROR, code: 'VERIFY_ERROR' }, { status: 500 })
  }
}