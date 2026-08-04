import type { Metadata } from 'next'
import Script from 'next/script'
import { ShieldCheck, Target, Eye, Scale, Mail, ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getAllAuthors } from '@/lib/blog'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://tokvalue.com/#organization',
      name: 'TokValue',
      url: 'https://tokvalue.com',
      email: 'connect@tokvalue.com',
      logo: 'https://tokvalue.com/tokvalue.png',
      foundingLocation: 'International',
      description:
        'Independent third-party TikTok account valuation tool. We analyze public data to estimate what the market is actually paying for a TikTok account.',
    },
    {
      '@type': 'AboutPage',
      '@id': 'https://tokvalue.com/about#webpage',
      url: 'https://tokvalue.com/about',
      name: 'About Us | TokValue',
      isPartOf: { '@id': 'https://tokvalue.com/#website' },
      about: { '@id': 'https://tokvalue.com/#organization' },
      description:
        'Why we built TokValue — bringing transparency to TikTok account valuation through data-driven analysis and neutral third-party estimates.',
    },
    {
      '@type': 'WebSite',
      '@id': 'https://tokvalue.com/#website',
      url: 'https://tokvalue.com',
      name: 'TokValue',
      publisher: { '@id': 'https://tokvalue.com/#organization' },
    },
  ],
}

export const metadata: Metadata = {
  title: 'About TokValue | Transparent TikTok Account Valuation',
  description:
    'Why we built TokValue — bringing transparency to TikTok account valuation through data-driven analysis and neutral third-party estimates.',
  alternates: {
    canonical: '/about',
  },
}

export default function AboutPage() {
  const authors = getAllAuthors()

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      <SiteHeader />
      <Script id="about-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="flex-1">
        {/* Hero — Product Mission */}
        <section className="border-b border-neutral-800 bg-gradient-to-b from-neutral-900/60 via-transparent to-transparent">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 sm:py-24">
            <p className="text-xs font-semibold text-[#00F2EA] uppercase tracking-widest mb-4">About TokValue</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
              Bringing Transparency to TikTok Account Valuation
            </h1>
            <p className="text-lg text-neutral-300 leading-relaxed mb-6">
              TokValue exists because the TikTok account market was broken. Buyers, sellers, and creators 
              were negotiating in the dark — with no objective reference point for what an account was 
              actually worth. We built a tool that analyzes public data to estimate market value, 
              giving everyone a neutral starting point for fair deals.
            </p>
            <p className="text-base text-neutral-400 leading-relaxed">
              We don&apos;t broker accounts. We don&apos;t take sides. We measure what the market is paying 
              and make that data accessible to anyone.
            </p>
          </div>
        </section>

        {/* The Problem */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 border-b border-neutral-800">
          <h2 className="text-2xl font-bold tracking-tight mb-6">The Problem We Saw</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                title: 'No Standard Pricing',
                desc: 'The same account could get quotes ranging from $5,000 to $50,000 depending on who you asked. No objective benchmark existed.',
              },
              {
                title: 'Information Asymmetry',
                desc: 'MCNs and agencies had internal data. Individual creators and buyers were flying blind, relying on gut feeling.',
              },
              {
                title: 'Opaque Valuations',
                desc: 'When valuations were provided, the methodology was hidden. You couldn\'t see how the number was calculated or challenge it.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Our Approach */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 border-b border-neutral-800">
          <h2 className="text-2xl font-bold tracking-tight mb-6">How We Solve It</h2>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00F2EA]/10 text-[#00F2EA]">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Data-Driven Estimates</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  We analyze publicly available TikTok metrics — follower count, engagement rates, content performance, 
                  niche benchmarks — to generate valuation estimates grounded in observable market signals.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00F2EA]/10 text-[#00F2EA]">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Neutral Third Party</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  We don&apos;t buy, sell, or broker accounts. We have no stake in any transaction. 
                  Our only goal is accurate measurement — not pushing deals in any direction.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00F2EA]/10 text-[#00F2EA]">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Transparent Methodology</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Every valuation breaks down into interpretable dimensions. You can see exactly 
                  what factors drove the estimate — and judge for yourself whether they apply to your situation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Are — Minimal Team */}
        <section className="border-y border-neutral-800 bg-neutral-900/20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
            <h2 className="text-2xl font-bold tracking-tight mb-4">Who We Are</h2>
            <p className="text-neutral-400 leading-relaxed mb-8 max-w-2xl">
              We&apos;re a small team of TikTok creators, data analysts, and developers who saw a broken market 
              and decided to fix it. Our backgrounds span the creator economy, digital advertising, 
              and data science — giving us perspective from every side of the table.
            </p>
            
            {/* Team cards — minimal */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {authors.map((a) => (
                <a
                  key={a.slug}
                  href={`/authors/${a.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 transition-colors hover:border-[#00F2EA]/40"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D78] to-[#00F2EA] text-xs font-bold text-white">
                    {a.avatarInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium group-hover:text-[#00F2EA] transition-colors truncate">{a.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{a.role}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* What We Believe */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6">What We Believe</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Neutrality',
                desc: 'We don\'t take sides between buyers and sellers. We don\'t set prices — we analyze data and reflect what the market is actually paying.',
              },
              {
                title: 'Data Over Guesswork',
                desc: 'Every valuation is driven by analysis of publicly available data, not opinions or hunches. Each dimension is explainable.',
              },
              {
                title: 'Transparency',
                desc: 'You should be able to see why an account is valued the way it is. We break estimates down so you can judge them yourself.',
              },
            ].map((b) => (
              <div key={b.title} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
                <h3 className="font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold">Important Disclaimer</h2>
            </div>
            <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
              <p>
                <span className="font-semibold text-white">Estimates, not financial advice.</span>{' '}
                All valuations and reports provided by TokValue are estimates for reference purposes
                only, based on our analysis of publicly available third-party data. Actual account
                values vary based on specific transactions, negotiations, and market conditions.
                Nothing on this site constitutes financial, investment, or business advice. Conduct
                your own due diligence before any transaction.
              </p>
              <p>
                <span className="font-semibold text-white">Third-party data.</span> All account data
                is sourced from publicly available third-party information and APIs, and is provided
                for informational and reference purposes only.
              </p>
              <p>
                <span className="font-semibold text-white">Trademarks.</span> TokValue is an
                independent, third-party service. We are not affiliated with, endorsed by, or
                sponsored by ByteDance Ltd. <span className="font-semibold text-white">TikTok® is a registered trademark of
                ByteDance Ltd.</span> and is used for identification purposes only.
              </p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="border-t border-neutral-800 bg-gradient-to-b from-transparent to-neutral-900/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-4">Questions or Feedback?</h2>
            <p className="text-neutral-300 leading-relaxed mb-6 max-w-lg mx-auto">
              We read every message. Whether you have a question about our methodology, 
              a partnership idea, or just want to say hello — get in touch.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00F2EA] text-black font-semibold hover:bg-[#00F2EA]/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contact Us
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
