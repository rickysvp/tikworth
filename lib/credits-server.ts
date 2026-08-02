/**
 * Server-side credits logic — PostgreSQL persistence.
 * Only import this from API routes / server components (never from client components).
 *
 * NOTE: Neon Serverless uses HTTP fetch, each SQL call is a separate request.
 * Do NOT use SELECT ... FOR UPDATE or RETURNING — they require transaction context.
 * Use atomic INSERT ON CONFLICT / UPDATE WHERE, then SELECT separately.
 */

import type { CreditBalance } from './credits'
import type { NeonQueryFunction } from '@neondatabase/serverless'

const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').replace(/\s+/g, '')

let sql: NeonQueryFunction<false, false> | null = null
let initPromise: Promise<void> | null = null

async function getSql(): Promise<NeonQueryFunction<false, false>> {
  if (sql) return sql
  const { neon } = await import('@neondatabase/serverless')
  sql = neon(DATABASE_URL)
  return sql
}

async function initTable(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const s = await getSql()
      await s`
        CREATE TABLE IF NOT EXISTS credit_balances (
          email TEXT PRIMARY KEY,
          credits INTEGER NOT NULL DEFAULT 0,
          total_purchased INTEGER NOT NULL DEFAULT 0,
          purchases JSONB NOT NULL DEFAULT '[]'::jsonb,
          verified_at BIGINT NOT NULL DEFAULT 0
        )
      `
    })()
  }
  return initPromise
}

function rowToBalance(row: Record<string, unknown>): CreditBalance {
  return {
    email: String(row.email),
    credits: Number(row.credits),
    totalPurchased: Number(row.total_purchased),
    purchases: Array.isArray(row.purchases) ? row.purchases as CreditBalance['purchases'] : [],
    verifiedAt: Number(row.verified_at),
  }
}

export async function getBalance(email: string): Promise<CreditBalance | null> {
  const key = email.toLowerCase().trim()
  if (!key) return null
  await initTable()
  const s = await getSql()
  const rows = await s`SELECT * FROM credit_balances WHERE email = ${key}`
  return rows[0] ? rowToBalance(rows[0]) : null
}

export async function grantCredits(
  email: string,
  packageId: string,
  credits: number,
  amount: number,
  paymentId?: string,
): Promise<CreditBalance> {
  const key = email.toLowerCase().trim()
  if (!key || !Number.isFinite(credits) || credits <= 0) {
    throw new Error('Invalid grant credits request')
  }

  await initTable()
  const s = await getSql()

  // 幂等检查：同一 paymentId 不重复发放
  if (paymentId) {
    const existing = await s`SELECT purchases FROM credit_balances WHERE email = ${key}`
    if (existing[0]) {
      const purchases = Array.isArray(existing[0].purchases)
        ? existing[0].purchases as Array<{ paymentId?: string }>
        : []
      if (purchases.some(p => p.paymentId === paymentId)) {
        return getBalance(key) as Promise<CreditBalance>
      }
    }
  }

  const newPurchase = { packageId, credits, amount, purchasedAt: Date.now(), paymentId }
  const now = Date.now()

  // Atomic upsert: INSERT if new, UPDATE if exists
  await s`
    INSERT INTO credit_balances (email, credits, total_purchased, purchases, verified_at)
    VALUES (${key}, ${credits}, ${credits}, ${JSON.stringify([newPurchase])}::jsonb, ${now})
    ON CONFLICT (email) DO UPDATE SET
      credits = credit_balances.credits + ${credits},
      total_purchased = credit_balances.total_purchased + ${credits},
      purchases = ${JSON.stringify([newPurchase])}::jsonb || credit_balances.purchases
  `

  // Read back the updated row
  return getBalance(key) as Promise<CreditBalance>
}

export async function consumeCredit(email: string): Promise<{ ok: boolean; balance?: CreditBalance; reason?: string }> {
  const key = email.toLowerCase().trim()
  if (!key) return { ok: false, reason: 'NOT_FOUND' }

  await initTable()
  const s = await getSql()

  // Check current credits first
  const current = await s`SELECT credits FROM credit_balances WHERE email = ${key}`
  if (!current[0]) return { ok: false, reason: 'NOT_FOUND' }
  if (Number(current[0].credits) <= 0) return { ok: false, reason: 'NO_CREDITS' }

  // Atomic: decrement only if credits > 0
  await s`
    UPDATE credit_balances
    SET credits = credits - 1
    WHERE email = ${key} AND credits > 0
  `

  // Read back the updated row
  const balance = await getBalance(key)
  return { ok: true, balance: balance! }
}