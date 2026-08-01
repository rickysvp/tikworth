/**
 * Server-side credits logic — file persistence + in-memory verification codes.
 * Only import this from API routes / server components (never from client components).
 */

import fs from 'fs'
import path from 'path'
import type { CreditBalance } from './credits'
import { withFileLock, atomicWriteJson, dataDir as DATA_DIR } from '@/lib/file-lock'

const BALANCES_FILE = path.join(DATA_DIR, 'credit_balances.json')

function readAllBalances(): Record<string, CreditBalance> {
  try {
    if (fs.existsSync(BALANCES_FILE)) {
      const raw = fs.readFileSync(BALANCES_FILE, 'utf-8')
      return JSON.parse(raw)
    }
  } catch {}
  return {}
}

function writeAllBalances(all: Record<string, CreditBalance>) {
  try {
    atomicWriteJson(BALANCES_FILE, all)
  } catch (err) {
    console.error('[credits-server] failed to write balances:', err)
    throw err
  }
}

export function getBalance(email: string): CreditBalance | null {
  const key = email.toLowerCase().trim()
  if (!key) return null
  const all = readAllBalances()
  return all[key] || null
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

  return withFileLock(BALANCES_FILE, async () => {
    const all = readAllBalances()
    const bal: CreditBalance = all[key] || {
      email: key,
      credits: 0,
      totalPurchased: 0,
      purchases: [],
      verifiedAt: Date.now(),
    }
    // 幂等：同一 paymentId 不重复发放
    if (paymentId && bal.purchases.some(p => p.paymentId === paymentId)) {
      return bal
    }
    bal.credits += credits
    bal.totalPurchased += credits
    bal.purchases.unshift({ packageId, credits, amount, purchasedAt: Date.now(), paymentId })
    all[key] = bal
    writeAllBalances(all)
    return bal
  })
}

export async function consumeCredit(email: string): Promise<{ ok: boolean; balance?: CreditBalance; reason?: string }> {
  const key = email.toLowerCase().trim()
  if (!key) return { ok: false, reason: 'NOT_FOUND' }

  return withFileLock(BALANCES_FILE, async () => {
    const all = readAllBalances()
    const bal = all[key]
    if (!bal) return { ok: false, reason: 'NOT_FOUND' }
    if (bal.credits <= 0) return { ok: false, reason: 'NO_CREDITS' }
    bal.credits -= 1
    all[key] = bal
    writeAllBalances(all)
    return { ok: true, balance: bal }
  })
}

