import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin API route protection ──
  if (pathname.startsWith('/api/tiktokmaster/')) {
    // Allow auth endpoint without token
    if (pathname === '/api/tiktokmaster/auth') {
      return NextResponse.next()
    }
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Delegate token verification to the API route itself
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}