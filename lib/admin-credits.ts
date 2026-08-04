/**
 * Admin credit operations — grant credits with audit logging.
 * Uses PostgreSQL for persistence.
 */

import type { NeonQueryFunction } from '@neondatabase/serverless'
import { recordAuditLog } from '@/lib/analytics'
import { initUsageLogTable } from '@/lib/credits-server'

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
  await initUsageLogTable()
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

    // Read back actual balance after UPDATE
    const updated = await s`SELECT credits FROM credit_balances WHERE email = ${key}`
    const balanceAfter = Number(updated[0]?.credits || 0)

    // Write usage log for audit trail
    await s`
      INSERT INTO credit_usage_logs (email, action, username, credits, balance_after, reason)
      VALUES (${key}, 'grant', null, ${credits}, ${balanceAfter}, ${reason})
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

// ── 扣减评估次数 ──
export async function adminDeductCredits(
  email: string,
  credits: number,
  reason: string,
): Promise<{ success: boolean; remainingCredits: number }> {
  await initTable()
  await initUsageLogTable()
  const s = await getSql()
  const key = email.toLowerCase().trim()
  if (!key) throw new Error('Invalid email')

  // 原子扣减：只扣到0，不会变负数
  await s`
    UPDATE credit_balances
    SET credits = GREATEST(credits - ${credits}, 0)
    WHERE email = ${key}
  `

  // Read back actual balance after UPDATE
  const updated = await s`SELECT credits FROM credit_balances WHERE email = ${key}`
  const balanceAfter = Number(updated[0]?.credits || 0)

  // Write usage log for audit trail
  await s`
    INSERT INTO credit_usage_logs (email, action, username, credits, balance_after, reason)
    VALUES (${key}, 'admin_deduct', null, ${credits}, ${balanceAfter}, ${reason})
  `

  await recordAuditLog({
    action: 'deduct_credits',
    target_email: key,
    credits: -credits,
    reason,
  })

  return { success: true, remainingCredits: balanceAfter }
}

// ── 禁用用户 ──
export async function adminDisableUser(email: string, reason: string): Promise<{ success: boolean }> {
  await initTable()
  const s = await getSql()
  const key = email.toLowerCase().trim()
  if (!key) throw new Error('Invalid email')

  await s`UPDATE credit_balances SET disabled = true WHERE email = ${key}`

  await recordAuditLog({
    action: 'disable_user',
    target_email: key,
    credits: 0,
    reason,
  })

  return { success: true }
}

// ── 解禁用户 ──
export async function adminEnableUser(email: string, reason: string): Promise<{ success: boolean }> {
  await initTable()
  const s = await getSql()
  const key = email.toLowerCase().trim()
  if (!key) throw new Error('Invalid email')

  await s`UPDATE credit_balances SET disabled = false WHERE email = ${key}`

  await recordAuditLog({
    action: 'enable_user',
    target_email: key,
    credits: 0,
    reason,
  })

  return { success: true }
}

// ── 删除用户 ──
export async function adminDeleteUser(email: string, reason: string): Promise<{ success: boolean }> {
  await initTable()
  const s = await getSql()
  const key = email.toLowerCase().trim()
  if (!key) throw new Error('Invalid email')

  await s`DELETE FROM credit_balances WHERE email = ${key}`

  await recordAuditLog({
    action: 'delete_user',
    target_email: key,
    credits: 0,
    reason,
  })

  return { success: true }
}