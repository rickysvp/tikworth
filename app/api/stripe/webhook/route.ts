import { NextRequest, NextResponse } from 'next/server'
import { grantCredits } from '@/lib/credits-server'
import { getServerDict } from '@/lib/i18n/server'
import { recordEvent } from '@/lib/analytics'
import crypto from 'crypto'

const CREEM_API_KEY = process.env.CREEM_API_KEY || ''
const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || ''

function verifyCreemSignature(payload: string, signature: string): boolean {
  if (!CREEM_WEBHOOK_SECRET) return false
  const computed = crypto.createHmac('sha256', CREEM_WEBHOOK_SECRET).update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
}

export async function POST(req: NextRequest) {
  if (!CREEM_API_KEY || !CREEM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: getServerDict().api.creem.NOT_CONFIGURED }, { status: 503 })
  }

  const payload = await req.text()
  const sig = req.headers.get('creem-signature') || ''

  if (!sig || !verifyCreemSignature(payload, sig)) {
    console.warn('[creem-webhook] signature verification failed')
    return NextResponse.json({ error: getServerDict().api.creem.SIGNATURE_FAILED }, { status: 400 })
  }

  let event: { id: string; eventType: string; object: Record<string, unknown> }
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // Handle checkout.completed — grant credits to purchaser
  if (event.eventType === 'checkout.completed') {
    const obj = event.object as Record<string, unknown>
    const metadata = (obj.metadata || {}) as Record<string, string>
    const order = obj.order as Record<string, unknown> | undefined
    const email = metadata.email || ''
    const packageId = metadata.packageId || ''
    const credits = metadata.credits || ''
    const amount = metadata.amount || ''

    if (email && packageId && credits) {
      const creditsNum = parseInt(credits, 10)
      if (!Number.isFinite(creditsNum) || creditsNum <= 0) {
        console.warn('[creem-webhook] invalid credits in metadata:', credits)
        return NextResponse.json({ error: getServerDict().api.creem.INVALID_CREDITS }, { status: 400 })
      }
      try {
        // Use order ID (or checkout ID) as paymentId for idempotency
        const paymentId = (order?.id as string) || (obj.id as string) || event.id
        await grantCredits(email.toLowerCase(), packageId, creditsNum, parseFloat(amount || '0'), paymentId)
        console.log('[creem-webhook] granted credits to', email, packageId, credits)
        // Record purchase analytics event
        recordEvent({
          event_type: 'purchase',
          email: email.toLowerCase(),
          metadata: { package_id: packageId, credits: creditsNum, amount: parseFloat(amount || '0') },
        }).catch(err => console.warn('[creem-webhook] analytics record failed:', err))
      } catch (err) {
        console.error('[creem-webhook] failed to grant credits:', err)
        return NextResponse.json({ error: getServerDict().api.creem.FAILED_GRANT }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}