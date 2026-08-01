/**
 * Credits system — shared types, constants, and pure helpers.
 * No fs / localStorage / window references here — safe for both server and client.
 */

export interface CreditBalance {
  email: string
  credits: number
  totalPurchased: number
  purchases: Array<{
    packageId: string
    credits: number
    amount: number       // USD
    purchasedAt: number  // epoch ms
    paymentId?: string   // Stripe session id in production
  }>
  verifiedAt: number
}

export interface CreditPackage {
  id: 'pack3' | 'pack10' | 'pack100'
  label: string
  credits: number
  price: number       // USD
  perUnit: string     // display
  badge?: string
  highlight?: boolean
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pack3', label: '轻量体验', credits: 3, price: 9, perUnit: '$3/次' },
  { id: 'pack10', label: '常用推荐', credits: 10, price: 19, perUnit: '$1.9/次', badge: '最受欢迎', highlight: true },
  { id: 'pack100', label: '重度创作者', credits: 100, price: 69, perUnit: '$0.69/次' },
]

export function findPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find(p => p.id === id)
}
