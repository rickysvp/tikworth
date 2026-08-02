import { NextRequest, NextResponse } from 'next/server'
import { createShare, getShare } from '@/lib/share-store'
import { findEvaluation } from '@/lib/db'

// POST /api/share — create a share link for an evaluation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { username } = body

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const normalized = String(username).trim().replace(/^@/, '').toLowerCase()
    const evaluation = await findEvaluation(normalized)

    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 })
    }

    const shareId = await createShare(evaluation)
    const shareUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}/share/${shareId}`

    return NextResponse.json({ shareId, shareUrl })
  } catch (err) {
    console.error('[share] POST error:', err)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

// GET /api/share?id=xxx — get a shared evaluation by ID
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
    }

    const evaluation = await getShare(id)
    if (!evaluation) {
      return NextResponse.json({ error: 'Share not found or expired' }, { status: 404 })
    }

    return NextResponse.json(evaluation)
  } catch (err) {
    console.error('[share] GET error:', err)
    return NextResponse.json({ error: 'Failed to get share' }, { status: 500 })
  }
}