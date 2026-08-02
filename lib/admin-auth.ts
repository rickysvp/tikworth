/**
 * Admin authentication — JWT sign/verify + in-memory rate limiting.
 * Only import from API routes / server components.
 */

import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || ADMIN_PASSWORD || 'admin-jwt-fallback-min-32-bytes!!'
)

if (!ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
  console.warn('[admin-auth] ADMIN_PASSWORD is not set. Admin login is disabled.')
}

const TOKEN_MAX_AGE = '24h'

// ── Rate limiting (in-memory, per-IP) ──
const attempts = new Map<string, { count: number; lockedUntil: number }>()

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}

export function checkRateLimit(request: Request): { allowed: boolean; retryAfterSec: number } {
  const ip = getClientIp(request)
  const now = Date.now()
  const entry = attempts.get(ip)

  if (entry && entry.lockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000) }
  }

  if (!entry || entry.lockedUntil < now) {
    attempts.set(ip, { count: 1, lockedUntil: 0 })
  } else {
    entry.count++
    if (entry.count > 5) {
      entry.lockedUntil = now + 15 * 60 * 1000 // 15 min lockout
    }
  }

  return { allowed: true, retryAfterSec: 0 }
}

// ── Admin JWT ──

export interface AdminPayload {
  role: 'admin'
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' as const })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_MAX_AGE)
    .setJti(crypto.randomUUID())
    .sign(ADMIN_JWT_SECRET)
}

export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET)
    if (payload.role === 'admin') {
      return { role: 'admin' }
    }
    return null
  } catch {
    return null
  }
}

export function validatePassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(ADMIN_PASSWORD)
  )
}