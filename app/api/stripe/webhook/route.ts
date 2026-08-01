import { NextRequest, NextResponse } from 'next/server'
import { grantCredits } from '@/lib/credits-server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const payload = await req.text()
  const sig = req.headers.get('stripe-signature') || ''

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(STRIPE_SECRET_KEY)
  let event: import('stripe').Stripe.Event

  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
  }

  try {
    event = stripe.webhooks.constructEvent(payload, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[stripe-webhook] signature verification failed:', msg)
    return NextResponse.json({ error: `Webhook signature verification failed: ${msg}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as import('stripe').Stripe.Checkout.Session
    const { email, packageId, credits, amount } = session.metadata || {}
    if (email && packageId && credits) {
      const creditsNum = parseInt(credits, 10)
      if (!Number.isFinite(creditsNum) || creditsNum <= 0) {
        console.warn('[stripe-webhook] invalid credits in metadata:', credits)
        return NextResponse.json({ error: 'Invalid credits' }, { status: 400 })
      }
      try {
        await grantCredits(email.toLowerCase(), packageId, creditsNum, parseFloat(amount || '0'), session.id)
        console.log('[stripe-webhook] granted credits to', email, packageId, credits)
      } catch (err) {
        console.error('[stripe-webhook] failed to grant credits:', err)
        return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
