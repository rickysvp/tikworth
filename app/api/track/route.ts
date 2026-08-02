import { NextRequest, NextResponse } from 'next/server'
import { recordEvent } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await recordEvent({
      event_type: body.event_type,
      username: body.username,
      path: body.path,
      metadata: body.metadata,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}