import { NextRequest, NextResponse } from 'next/server'
import { recordEvent, hashIp } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    await recordEvent({
      event_type: body.event_type,
      username: body.username,
      path: body.path,
      metadata: body.metadata,
      ip_hash: hashIp(ip),
      user_agent: req.headers.get('user-agent') || undefined,
      referrer: body.referrer || undefined,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}