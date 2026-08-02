'use client'

import { I18nProvider } from '@/lib/i18n/context'

export function I18nBody({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="en">
      {children}
    </I18nProvider>
  )
}