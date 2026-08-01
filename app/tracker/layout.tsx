import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '账号追踪 - TikWorth',
  description: '追踪 TikTok 账号的商业价值变化，对比多次评估结果',
}

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return children
}
