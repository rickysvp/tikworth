/**
 * Client-side credits helpers — localStorage + API calls.
 * Safe to import from client components only.
 */

import type { CreditBalance } from './credits'

const ACTIVE_EMAIL_KEY = 'tikworth_active_email'
const TOKEN_KEY = 'tikworth_session_token'
const CODES_KEY = 'tikworth_codes_v1'

export function getActiveEmail(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(ACTIVE_EMAIL_KEY)
  } catch { return null }
}

export function setActiveEmail(email: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (email) localStorage.setItem(ACTIVE_EMAIL_KEY, email)
    else localStorage.removeItem(ACTIVE_EMAIL_KEY)
  } catch {}
}

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch { return null }
}

export function setSessionToken(token: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {}
}

function authHeaders() {
  const token = getSessionToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function fetchBalance(email?: string | null): Promise<CreditBalance | null> {
  try {
    const e = (email || getActiveEmail())?.toLowerCase().trim()
    if (!e) return null
    const res = await fetch('/api/credits/balance', {
      headers: authHeaders(),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.email) setActiveEmail(data.email)
    return data || null
  } catch { return null }
}

export async function consumeCreditApi(): Promise<{ ok: boolean; balance?: CreditBalance; error?: string }> {
  try {
    if (!getSessionToken()) return { ok: false, error: 'NO_SESSION' }
    const res = await fetch('/api/credits/consume', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error || 'CONSUME_FAILED' }
    return { ok: true, balance: data.balance }
  } catch { return { ok: false, error: 'NETWORK_ERROR' } }
}

// Client-side tracking of pending verification state
export function setPendingEmail(email: string, packageId: string) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(CODES_KEY, JSON.stringify({ email, packageId, sentAt: Date.now() }))
  } catch {}
}

export function getPendingEmail(): { email: string; packageId: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(CODES_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function clearPendingEmail() {
  if (typeof window === 'undefined') return
  try { sessionStorage.removeItem(CODES_KEY) } catch {}
}
