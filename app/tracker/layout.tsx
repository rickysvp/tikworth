import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TikTok Account Tracker — TokValue',
  description: 'Track TikTok account value changes over time. Monitor growth trends and compare historical evaluation data from TokValue.',
}

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return children
}
