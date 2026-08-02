'use client'

import { I18nProvider } from '@/lib/i18n/context'
import { PageViewTracker } from '@/components/PageViewTracker'

export function I18nBody({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="en">
      <PageViewTracker />
      {children}
    </I18nProvider>
  )
}