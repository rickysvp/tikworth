import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_PACKAGES, findPackage } from '@/lib/credits'
import { storeCode, cleanupExpiredCodes } from '@/lib/auth'
import { getServerDict } from '@/lib/i18n/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    await cleanupExpiredCodes()
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const packageId = String(body.packageId || 'pack10')

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: getServerDict().api.auth.INVALID_EMAIL, code: 'INVALID_EMAIL' }, { status: 400 })
    }

    const pkg = findPackage(packageId)
    if (!pkg) {
      return NextResponse.json(
        { error: getServerDict().api.auth.INVALID_PACKAGE, code: 'INVALID_PACKAGE', validPackages: CREDIT_PACKAGES.map(p => p.id) },
        { status: 400 }
      )
    }

    // Generate and store 6-digit code (10 min TTL), with per-email rate limiting
    const { code, rateLimited } = await storeCode(email, pkg.id, pkg.credits, pkg.price)
    if (rateLimited) {
      return NextResponse.json(
        { error: getServerDict().api.auth.RATE_LIMIT, code: 'RATE_LIMIT' },
        { status: 429 }
      )
    }

    // --- Email delivery ---
    let emailDelivered = false
    let devCode: string | null = null

    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'TokValue <verify@tokvalue.app>',
            to: email,
            subject: `Your TokValue verification code: ${code}`,
            html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
              <h2 style="color:#FF0050;margin:0 0 16px">TokValue Verification Code</h2>
              <p style="color:#333;font-size:16px;line-height:1.6">You purchased the ${pkg.label} package (${pkg.credits} evaluations, $${pkg.price}). Your verification code is:</p>
              <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
                <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#111">${code}</span>
              </div>
              <p style="color:#666;font-size:13px">This code is valid for 10 minutes. Do not share it with anyone.<br/>Once verified, your credits will be linked to your email and accessible across all devices.</p>
            </div>`,
          }),
        })
        emailDelivered = res.ok
        if (!res.ok) console.warn('[send-code] Resend failed:', await res.text())
      } catch (err) {
        console.warn('[send-code] Resend error:', err)
      }
    }

    if (!emailDelivered) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[send-code] DEV — code for ${email}: ${code} (package: ${pkg.id}, ${pkg.credits} credits, $${pkg.price})`)
      }
      devCode = process.env.NODE_ENV === 'development' ? code : null
    }

    return NextResponse.json({
      ok: true,
      email,
      packageId,
      devCode,
      delivered: emailDelivered,
      expiresIn: 10 * 60 * 1000,
    })
  } catch (err) {
    console.error('[send-code] error:', err)
    return NextResponse.json({ error: getServerDict().api.auth.SEND_FAILED, code: 'SEND_FAILED' }, { status: 500 })
  }
}