import { NextRequest, NextResponse } from 'next/server'
import { CREDIT_PACKAGES, findPackage } from '@/lib/credits'
import { storeCode, cleanupExpiredCodes } from '@/lib/auth'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    await cleanupExpiredCodes()
    const body = await req.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    const packageId = String(body.packageId || 'pack10')

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: '请输入有效的邮箱地址', code: 'INVALID_EMAIL' }, { status: 400 })
    }

    const pkg = findPackage(packageId)
    if (!pkg) {
      return NextResponse.json(
        { error: '无效的套餐', code: 'INVALID_PACKAGE', validPackages: CREDIT_PACKAGES.map(p => p.id) },
        { status: 400 }
      )
    }

    // Generate and store 6-digit code (10 min TTL), with per-email rate limiting
    const { code, rateLimited } = await storeCode(email, pkg.id, pkg.credits, pkg.price)
    if (rateLimited) {
      return NextResponse.json(
        { error: '该邮箱今日验证码发送次数已达上限，请 24 小时后重试', code: 'RATE_LIMIT' },
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
            from: 'TikWorth <verify@tikworth.app>',
            to: email,
            subject: `Your TikWorth verification code: ${code}`,
            html: `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;">
              <h2 style="color:#FF0050;margin:0 0 16px">TikWorth 验证码</h2>
              <p style="color:#333;font-size:16px;line-height:1.6">您购买 ${pkg.label} 套餐（${pkg.credits} 次评估，$${pkg.price}）的验证码为：</p>
              <div style="background:#f5f5f5;border-radius:12px;padding:24px;text-align:center;margin:24px 0">
                <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#111">${code}</span>
              </div>
              <p style="color:#666;font-size:13px">验证码 10 分钟内有效，请勿告知他人。<br/>验证通过后额度将自动发放至您的邮箱，支持跨设备找回。</p>
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
    return NextResponse.json({ error: '发送失败，请稍后再试', code: 'SEND_FAILED' }, { status: 500 })
  }
}
