/**
 * Credits system — shared types, constants, and pure helpers.
 * No fs / localStorage / window references here — safe for both server and client.
 */

import { getServerDict } from '@/lib/i18n/server'

export interface CreditBalance {
  email: string
  credits: number
  totalPurchased: number
  purchases: Array<{
    packageId: string
    credits: number
    amount: number       // USD
    purchasedAt: number  // epoch ms
    paymentId?: string   // Creem checkout/order id in production
  }>
  verifiedAt: number
}

export interface CreditPackage {
  id: 'pack1' | 'pack6' | 'pack30'
  label: string
  credits: number
  price: number       // USD
  perUnit: string     // display
  badge?: string
  highlight?: boolean
}

const dict = getServerDict()

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pack1', label: dict.creditPackages.pack1.label, credits: 1, price: 9, perUnit: '$9/eval' },
  { id: 'pack6', label: dict.creditPackages.pack6.label, credits: 6, price: 29, perUnit: '$4.83/eval', badge: dict.creditPackages.pack6.badge, highlight: true },
  { id: 'pack30', label: dict.creditPackages.pack30.label, credits: 30, price: 99, perUnit: '$3.30/eval' },
]

export function findPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(p => p.id === id)
}