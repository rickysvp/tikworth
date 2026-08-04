import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My History — TokValue',
  description: 'View your TikTok account evaluation history on TokValue.',
  robots: 'noindex, follow',
}

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return children
}
