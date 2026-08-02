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
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}