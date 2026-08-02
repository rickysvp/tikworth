import en from './dictionaries/en'
import type { EnDict } from './dictionaries/en'

export type Locale = 'en'

/**
 * Get the dictionary (server-side safe, no React dependency).
 */
export function getServerDict(_locale: Locale = 'en'): EnDict {
  return en
}

/**
 * Simple template interpolation: replace {key} with values.
 */
export function t(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key]
    return val !== undefined ? String(val) : `{${key}}`
  })
}