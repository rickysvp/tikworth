import { getServerDict } from '@/lib/i18n/server'

export const TIER_COLORS: Record<string, string> = {
  S: '#FF0050',
  A: '#FF0050',
  B: '#00F2EA',
  C: '#00F2EA',
  D: '#f97316',
  E: '#f97316',
  F: '#ffffff',
}

export function tierLabel(tier: string): string {
  return (getServerDict().tiers as unknown as Record<string, string>)[tier] || ''
}

export function tierColor(tier: string): string {
  return TIER_COLORS[tier] || '#FF0050'
}