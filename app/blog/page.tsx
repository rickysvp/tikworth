import type { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import { Calendar, Clock, Tag } from 'lucide-react'

export const metadata: Metadata = {
  title: 'TokValue Blog — TikTok Creator Economy Insights & Analytics',
  description:
    'Expert guides on TikTok account valuation, brand deal pricing, creator monetization, and analytics. Data-driven insights for TikTok creators at every tier.',
  openGraph: {
    title: 'TokValue Blog — TikTok Creator Economy Insights',
    description:
      'Expert guides on TikTok account valuation, brand deal pricing, and creator monetization.',
    type: 'website',
  },
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="border-b border-neutral-800">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wider text-[#00F2EA]">
            Blog
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            The TokValue Blog
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-neutral-400">
            Data-driven guides on TikTok valuation, brand deal pricing, creator
            monetization, and analytics. No fluff — just real numbers and
            strategies that work in 2026.
          </p>
        </div>
      </section>

      {/* Posts grid */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map(post => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition hover:border-[#00F2EA]/30 hover:bg-neutral-900"
            >
              {/* Category badge */}
              <span className="inline-block rounded-full border border-[#00F2EA]/20 bg-[#00F2EA]/5 px-3 py-1 text-xs font-medium text-[#00F2EA]">
                {post.category}
              </span>

              <h2 className="mt-4 text-lg font-semibold leading-snug text-white group-hover:text-[#00F2EA] transition-colors">
                {post.title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-neutral-400 line-clamp-3">
                {post.description}
              </p>

              {/* Meta row */}
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readTime}
                </span>
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-2">
                {post.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="inline-block rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

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
