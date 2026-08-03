import { NextRequest, NextResponse } from 'next/server'
import { validatePassword, signAdminToken, checkRateLimit } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rateLimit.retryAfterSec} seconds.` },
      { status: 429 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const password = String(body.password || '')

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = await signAdminToken()
    return NextResponse.json({ token })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal error'
    // 如果是 JWT secret 未配置，返回明确的配置错误提示
    if (msg.includes('ADMIN_JWT_SECRET')) {
      console.error('[admin-auth] config error:', msg)
      return NextResponse.json(
        { error: 'Server is missing ADMIN_JWT_SECRET configuration. Please contact the administrator.' },
        { status: 500 }
      )
    }
    console.error('[admin-auth] login error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}