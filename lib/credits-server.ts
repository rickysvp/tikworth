/**
 * Server-side credits logic — PostgreSQL persistence.
 * Only import this from API routes / server components (never from client components).
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

  // Use a transaction via SELECT ... FOR UPDATE to prevent race conditions
  const rows = await s`SELECT * FROM credit_balances WHERE email = ${key} FOR UPDATE`
  const existing = rows[0] ? rowToBalance(rows[0]) : null

  const purchases = existing?.purchases || []

  // 幂等：同一 paymentId 不重复发放
  if (paymentId && purchases.some(p => p.paymentId === paymentId)) {
    return existing!
  }

  const newPurchase = { packageId, credits, amount, purchasedAt: Date.now(), paymentId }
  const newPurchases = [newPurchase, ...purchases]

  if (existing) {
    await s`
      UPDATE credit_balances
      SET credits = credits + ${credits},
          total_purchased = total_purchased + ${credits},
          purchases = ${JSON.stringify(newPurchases)}::jsonb
      WHERE email = ${key}
    `
    return {
      ...existing,
      credits: existing.credits + credits,
      totalPurchased: existing.totalPurchased + credits,
      purchases: newPurchases,
    }
  } else {
    await s`
      INSERT INTO credit_balances (email, credits, total_purchased, purchases, verified_at)
      VALUES (${key}, ${credits}, ${credits}, ${JSON.stringify(newPurchases)}::jsonb, ${Date.now()})
    `
    return {
      email: key,
      credits,
      totalPurchased: credits,
      purchases: newPurchases,
      verifiedAt: Date.now(),
    }
  }
}

export async function consumeCredit(email: string): Promise<{ ok: boolean; balance?: CreditBalance; reason?: string }> {
  const key = email.toLowerCase().trim()
  if (!key) return { ok: false, reason: 'NOT_FOUND' }

  await initTable()
  const s = await getSql()

  // Use SELECT ... FOR UPDATE to prevent race conditions
  const rows = await s`SELECT * FROM credit_balances WHERE email = ${key} FOR UPDATE`
  if (!rows[0]) return { ok: false, reason: 'NOT_FOUND' }

  const bal = rowToBalance(rows[0])
  if (bal.credits <= 0) return { ok: false, reason: 'NO_CREDITS' }

  const newCredits = bal.credits - 1
  await s`
    UPDATE credit_balances
    SET credits = ${newCredits}
    WHERE email = ${key}
  `

  return {
    ok: true,
    balance: { ...bal, credits: newCredits },
  }
}