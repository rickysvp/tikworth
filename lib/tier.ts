import { getServerDict } from '@/lib/i18n/server'

export const TIER_COLORS: Record<string, string> = {
  S: '#00F2EA',
  A: '#00F2EA',
  B: '#22c55e',
  C: '#f59e0b',
  D: '#f97316',
  E: '#ef4444',
  F: '#dc2626',
}

export function tierLabel(tier: string): string {
  return (getServerDict().tiers as unknown as Record<string, string>)[tier] || ''
}

export function tierColor(tier: string): string {
  return TIER_COLORS[tier] || '#FF0050'
}