import { NextRequest, NextResponse } from 'next/server'
import { grantCredits } from '@/lib/credits-server'
import { getServerDict } from '@/lib/i18n/server'
import { recordEvent, hashIp } from '@/lib/analytics'
import crypto from 'crypto'

const CREEM_API_KEY = process.env.CREEM_API_KEY || ''
const CREEM_WEBHOOK_SECRET = process.env.CREEM_WEBHOOK_SECRET || ''

function verifyCreemSignature(payload: string, signature: string): boolean {
  if (!CREEM_WEBHOOK_SECRET) return false
  try {
    const computed = crypto.createHmac('sha256', CREEM_WEBHOOK_SECRET).update(payload).digest('hex')
    // timingSafeEqual crashes if buffers have different lengths — guard first
    if (computed.length !== signature.length) return false
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!CREEM_API_KEY || !CREEM_WEBHOOK_SECRET) {
      console.warn('[creem-webhook] missing API key or webhook secret')
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
      console.error('[creem-webhook] invalid JSON payload')
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    // Handle checkout.completed — grant credits to purchaser
    if (event.eventType === 'checkout.completed') {
      const obj = event.object as Record<string, unknown>
      const metadata = (obj.metadata || {}) as Record<string, string>
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
          // 幂等键统一用 checkout_id（obj.id），与 claim 路径一致，避免 webhook+claim 双发放
          const checkoutId = (obj.id as string) || event.id
          await grantCredits(email.toLowerCase(), packageId, creditsNum, parseFloat(amount || '0'), checkoutId)
          console.log('[creem-webhook] credits granted for', email, 'checkout:', checkoutId)
          // Record purchase analytics event
          // webhook 无真实用户 IP/UA，用 Creem 来源标记
          recordEvent({
            event_type: 'purchase',
            email: email.toLowerCase(),
            metadata: { package_id: packageId, credits: creditsNum, amount: parseFloat(amount || '0'), checkout_id: checkoutId, source: 'creem_webhook' },
            ip_hash: hashIp('webhook'),
          }).catch(err => console.warn('[creem-webhook] analytics record failed:', err))
        } catch (err) {
          console.error('[creem-webhook] failed to grant credits:', err)
          return NextResponse.json({ error: getServerDict().api.creem.FAILED_GRANT }, { status: 500 })
        }
      } else {
        console.warn('[creem-webhook] missing metadata fields:', { hasEmail: !!email, hasPackageId: !!packageId, hasCredits: !!credits })
      }
    } else {
      console.log('[creem-webhook] unhandled event type:', event.eventType)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[creem-webhook] CRASH:', err instanceof Error ? err.message : String(err), err instanceof Error ? err.stack : '')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}