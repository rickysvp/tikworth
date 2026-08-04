import type { Metadata } from 'next'
import HomePage from '@/components/HomePageClient'
import { getServerDict } from '@/lib/i18n/server'

const d = getServerDict()

export const metadata: Metadata = {
  title: d.seo.title,
  description: d.seo.description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: d.seo.title,
    description: d.seo.shortDescription,
    url: 'https://tokvalue.com/',
  },
  twitter: {
    title: d.seo.title,
    description: d.seo.shortDescription,
  },
}

export default HomePage
