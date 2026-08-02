/**
 * Admin credit operations — grant credits with audit logging.
 */

import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { withFileLock, atomicWriteJson, dataDir as DATA_DIR } from '@/lib/file-lock'
import { recordAuditLog } from '@/lib/analytics'
import type { CreditBalance } from '@/lib/credits'

const BALANCES_FILE = path.join(DATA_DIR, 'credit_balances.json')

function readAllBalances(): Record<string, CreditBalance> {
  try {
    if (existsSync(BALANCES_FILE)) {
      return JSON.parse(readFileSync(BALANCES_FILE, 'utf-8'))
    }
  } catch {}
  return {}
}

export async function adminGrantCredits(
  emails: string[],
  credits: number,
  reason: string,
): Promise<{ success: boolean; granted: number; totalCredits: number }> {
  let totalGranted = 0

  for (const email of emails) {
    const key = email.toLowerCase().trim()
    if (!key) continue

    await withFileLock(BALANCES_FILE, async () => {
      const all = readAllBalances()
      const bal: CreditBalance = all[key] || {
        email: key,
        credits: 0,
        totalPurchased: 0,
        purchases: [],
        verifiedAt: Date.now(),
      }
      bal.credits += credits
      // Don't increment totalPurchased for admin grants
      all[key] = bal
      atomicWriteJson(BALANCES_FILE, all)
    })

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