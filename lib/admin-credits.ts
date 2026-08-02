/**
 * Admin credit operations — grant credits with audit logging.
 * Uses PostgreSQL for persistence.
 */

import type { NeonQueryFunction } from '@neondatabase/serverless'
import { recordAuditLog } from '@/lib/analytics'

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

export async function adminGrantCredits(
  emails: string[],
  credits: number,
  reason: string,
): Promise<{ success: boolean; granted: number; totalCredits: number }> {
  await initTable()
  const s = await getSql()
  let totalGranted = 0

  for (const email of emails) {
    const key = email.toLowerCase().trim()
    if (!key) continue

    // Use INSERT ... ON CONFLICT to upsert atomically
    await s`
      INSERT INTO credit_balances (email, credits, total_purchased, purchases, verified_at)
      VALUES (${key}, ${credits}, 0, '[]'::jsonb, ${Date.now()})
      ON CONFLICT (email) DO UPDATE SET
        credits = credit_balances.credits + ${credits}
    `

    // Record audit log
    await recordAuditLog({
      action: emails.length > 1 ? 'batch_grant_credits' : 'grant_credits',
      target_email: key,
      credits,
      reason,
    })

    totalGranted++
  }

  return { success: true, granted: totalGranted, totalCredits: totalGranted * credits }
}