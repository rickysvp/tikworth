import { NextRequest, NextResponse } from 'next/server'
import { grantCredits } from '@/lib/credits-server'
import { verifyCode, createSessionToken } from '@/lib/auth'
import { getServerDict, t as serverT } from '@/lib/i18n/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const code = String(body.code || '').trim()

    if (!email) return NextResponse.json({ error: getServerDict().api.auth.NO_EMAIL, code: 'INVALID_EMAIL' }, { status: 400 })
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: getServerDict().api.auth.INVALID_CODE, code: 'INVALID_CODE' }, { status: 400 })
    }

    const result = await verifyCode(email, code)
    if (!result.ok) {
      const messages: Record<string, { msg: string; status: number }> = {
        expired:    { msg: getServerDict().api.auth.VERIFY_FAILED, status: 410 },
        wrong:      { msg: getServerDict().api.auth.VERIFY_FAILED, status: 401 },
        not_found:  { msg: getServerDict().api.auth.VERIFY_FAILED, status: 404 },
        too_many:   { msg: getServerDict().api.auth.VERIFY_FAILED, status: 429 },
      }
      const err = messages[result.reason] || { msg: getServerDict().api.auth.VERIFY_FAILED, status: 400 }
      return NextResponse.json({ error: err.msg, code: 'VERIFY_FAILED', reason: result.reason }, { status: err.status })
    }

    const { entry } = result
    const token = await createSessionToken(email)

    // ── Payment flow ──────────────────────────────────────────────────
    // PRODUCTION (with Stripe configured):
    //   1. Verify email → create Stripe Checkout Session with customer_email = email
    //   2. Return { checkoutUrl, token } → redirect browser to Stripe
    //   3. Stripe webhook (checkout.session.completed) triggers grantCredits
    //   4. Success page polls /api/credits/balance with token until credits appear
    //
    // DEV MODE (Stripe 未配置):
    //   直接发放额度，跳过支付。用于本地开发和测试。
    if (STRIPE_SECRET_KEY) {
      const Stripe = (await import('stripe')).default
      const stripe = new Stripe(STRIPE_SECRET_KEY)
      const session = await stripe.checkout.sessions.create({
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: entry.packageId, description: `TokValue ${entry.credits} evaluation credits` },
              unit_amount: Math.max(50, Math.round(entry.amount * 100)),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${APP_URL}/?paid=success&email=${encodeURIComponent(email)}`,
        cancel_url: `${APP_URL}/?paid=cancel&email=${encodeURIComponent(email)}`,
        metadata: {
          email,
          packageId: entry.packageId,
          credits: String(entry.credits),
          amount: String(entry.amount),
        },
      })
      return NextResponse.json({
        ok: true,
        requiresPayment: true,
        checkoutUrl: session.url,
        token,
      })
    }

    // DEV MODE: Stripe 未配置，直接发放额度模拟登录成功
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