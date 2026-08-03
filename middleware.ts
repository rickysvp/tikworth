import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware is intentionally minimal.
 * Admin API routes (/api/tiktokmaster/*) use verifyAdminRequest() internally
 * via lib/admin-api-utils.ts for real JWT verification.
 * No token check is done here to avoid duplicating verification logic
 * across middleware and route handlers.
 */
export async function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
