'use client'

import { createContext, useContext } from 'react'
import en from './dictionaries/en'
import type { EnDict } from './dictionaries/en'

export type Locale = 'en'

const dictionaries: Record<Locale, EnDict> = { en }

// Simple template interpolation: replace {key} with values
export function t(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key]
    return val !== undefined ? String(val) : `{${key}}`
  })
}

interface I18nContextValue {
  locale: Locale
  dict: EnDict
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  dict: en,
})

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const dict = dictionaries[locale] || en
  return (
    <I18nContext.Provider value={{ locale, dict }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

/**
 * Get the dictionary for a given locale (server-side safe).
 */
export function getDict(locale: Locale = 'en'): EnDict {
  return dictionaries[locale] || en
}