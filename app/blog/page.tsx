import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts, getFeaturedPost } from '@/lib/blog'
import BlogIndexClient from './blog-index-client'

export const metadata: Metadata = {
  title: 'TokValue Blog — TikTok Creator Economy Insights',
  description:
    'Expert guides on TikTok account valuation, brand deal pricing, creator monetization, and analytics. Data-driven insights for TikTok creators at every tier.',
  openGraph: {
    title: 'TokValue Blog',
    description: 'Expert guides on TikTok creator economy, brand deals, and analytics.',
    type: 'website',
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()
  const featured = getFeaturedPost()

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="border-b border-neutral-800">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-[#00F2EA]">Blog</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Creator Economy Intelligence
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-neutral-400 leading-relaxed">
            Data-driven guides on TikTok valuation, brand deal pricing, creator monetization, and analytics.
            No fluff — just real numbers and strategies that work in 2026.
          </p>
        </div>
      </section>

      <BlogIndexClient posts={posts} featured={featured} />

      {/* CTA */}
      <section className="border-t border-neutral-800 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Ready to find out what your account is worth?</h2>
          <p className="mt-3 text-neutral-400">
            Get a complete business valuation with detailed brand deal estimates, monetization analysis, and growth projections.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#00F2EA] px-8 py-3 text-sm font-semibold text-black transition hover:bg-[#00D4CE]"
          >
            Evaluate Your Account →
          </Link>
        </div>
      </section>
    </main>
  )
}
