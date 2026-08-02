/**
 * Auth utilities: verification codes with file persistence, rate limiting,
 * and lightweight JWT session tokens (JWS HS256).
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import { withFileLock, atomicWriteJson, dataDir as DATA_DIR } from '@/lib/file-lock'

const CODES_FILE = path.join(DATA_DIR, 'verification_codes.json')

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-jwt-secret-min-32-bytes-long!' : '')
)

if (JWT_SECRET.length < 32 && process.env.NODE_ENV !== 'development') {
  console.warn('[auth] JWT_SECRET is too short or missing. Sessions are insecure.')
}

const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60 // 7 days

export interface PendingCode {
  code: string
  email: string
  packageId: string
  credits: number
  amount: number
  expiresAt: number
  attempts: number
  createdAt: number
  sendCount24h: number
}

export interface AuthPayload {
  email: string
}

// ── File helpers ──

function readCodes(): Record<string, PendingCode> {
  try {
    if (fs.existsSync(CODES_FILE)) {
      return JSON.parse(fs.readFileSync(CODES_FILE, 'utf-8'))
    }
  } catch {}
  return {}
}

function writeCodes(codes: Record<string, PendingCode>) {
  atomicWriteJson(CODES_FILE, codes)
}

// ── Verification codes ──

export function generateCode(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

const MAX_ATTEMPTS = 5
const CODE_TTL_MS = 10 * 60 * 1000
const MAX_SENDS_PER_24H = 5
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000

export async function storeCode(
  email: string,
  packageId: string,
  credits: number,
  amount: number,
): Promise<{ code: string; sendCount24h: number; rateLimited: boolean }> {
  const key = email.toLowerCase().trim()
  const code = generateCode()
  const now = Date.now()

  return withFileLock(CODES_FILE, async () => {
    const all = readCodes()
    const existing = all[key]
    const windowStart = now - RATE_LIMIT_WINDOW_MS
    const previousSends = existing && existing.createdAt > windowStart ? existing.sendCount24h : 0

    if (previousSends >= MAX_SENDS_PER_24H) {
      return { code, sendCount24h: previousSends, rateLimited: true }
    }

    all[key] = {
      code,
      email: key,
      packageId,
      credits,
      amount,
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
      createdAt: now,
      sendCount24h: previousSends + 1,
    }
    writeCodes(all)
    return { code, sendCount24h: previousSends + 1, rateLimited: false }
  })
}

export async function cleanupExpiredCodes(): Promise<void> {
  try {
    await withFileLock(CODES_FILE, async () => {
      const all = readCodes()
      const now = Date.now()
      let changed = false
      for (const [key, entry] of Object.entries(all)) {
        if (entry.expiresAt < now) {
          delete all[key]
          changed = true
        }
      }
      if (changed) writeCodes(all)
    })
  } catch (err) {
    console.warn('[auth] cleanupExpiredCodes failed:', err)
  }
}

export async function verifyCode(
  email: string,
  code: string,
): Promise<{ ok: true; entry: PendingCode } | { ok: false; reason: 'expired' | 'wrong' | 'not_found' | 'too_many' }> {
  const key = email.toLowerCase().trim()
  const trimmedCode = code.trim()

  return withFileLock(CODES_FILE, async () => {
    const all = readCodes()
    const entry = all[key]
    if (!entry) return { ok: false, reason: 'not_found' }

    if (Date.now() > entry.expiresAt) {
      delete all[key]
      writeCodes(all)
      return { ok: false, reason: 'expired' }
    }
    if (entry.attempts >= MAX_ATTEMPTS) {
      delete all[key]
      writeCodes(all)
      return { ok: false, reason: 'too_many' }
    }
    entry.attempts += 1
    if (entry.code !== trimmedCode) {
      writeCodes(all)
      console.log(`[auth] verifyCode WRONG for ${key}: stored='${entry.code}' input='${trimmedCode}'`)
      return { ok: false, reason: 'wrong' }
    }
    delete all[key]
    writeCodes(all)
    return { ok: true, entry }
  })
}

// ── JWT session tokens ──

export async function createSessionToken(email: string): Promise<string> {
  if (JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 bytes')
  }
  return new SignJWT({ email: email.toLowerCase().trim() })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_MAX_AGE_SECONDS}s`)
    .sign(JWT_SECRET)
}

export async function verifySessionToken(token: string): Promise<AuthPayload | null> {
  if (JWT_SECRET.length < 32) return null
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] })
    if (typeof payload.email !== 'string' || !payload.email) return null
    return { email: payload.email.toLowerCase().trim() }
  } catch (err) {
    console.warn('[auth] token verification failed:', err instanceof Error ? err.message : err)
    return null
  }
}

export function getBearerToken(req: { headers: { get: (name: string) => string | null } }): string | null {
  const auth = req.headers.get('authorization') || ''
  const match = auth.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}
