import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Mail, ShieldCheck, BarChart3, Users, Megaphone, Code2, ArrowRight } from 'lucide-react'
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
        'Meet the team behind TokValue — TikTok creators, senior developers, data analysts, and ad-agency marketing leads building transparent, data-driven TikTok account valuation.',
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
  title: 'About Us | TokValue',
  description:
    'Meet the team behind TokValue — TikTok creators, senior developers, data analysts, and ad-agency marketing leads building transparent, data-driven TikTok account valuation.',
  alternates: {
    canonical: '/about',
  },
}

const teamRoles = [
  {
    icon: Megaphone,
    title: 'Ad-Agency Marketing Leads',
    description:
      'Former operators from digital advertising agencies who understand how brands allocate budgets, calculate CPMs, and evaluate creator pricing — the buyer\'s side of every deal.',
  },
  {
    icon: Users,
    title: 'TikTok Creators',
    description:
      'We create on the platform ourselves. We know content, growth, and monetization from the inside — and the gap creators feel when negotiating their worth.',
  },
  {
    icon: BarChart3,
    title: 'Data Analysts',
    description:
      'We turn publicly available account data into interpretable valuation signals — separating signal from noise, and explaining why an account is worth what it is.',
  },
  {
    icon: Code2,
    title: 'Senior Independent Developers',
    description:
      'Experienced engineers building a reliable, transparent valuation engine you can run any account through and get a consistent, reproducible result.',
  },
]

export default function AboutPage() {
  const authors = getAllAuthors()

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      <SiteHeader />
      <Script id="about-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-neutral-800 bg-gradient-to-b from-neutral-900/60 via-transparent to-transparent">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 sm:py-24">
            <p className="text-xs font-semibold text-[#00F2EA] uppercase tracking-widest mb-4">About TokValue</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
              The Team Behind TokValue
            </h1>
            <p className="text-lg text-neutral-300 leading-relaxed mb-6">
              We&apos;re a small team of TikTok creators, senior independent developers, data
              analysts, and ad-agency marketing leads. We built TokValue to bring transparency to
              TikTok account valuation — by analyzing public data, we estimate what the market is
              actually paying for a TikTok account.
            </p>
            <p className="text-base text-neutral-400 leading-relaxed">
              We are an independent, third-party valuation tool. We don&apos;t buy, sell, or broker
              accounts — we simply measure.
            </p>
            <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full border border-[#00F2EA]/30 bg-[#00F2EA]/5 text-sm text-[#00F2EA]">
              <ShieldCheck className="h-4 w-4" />
              Founding Members of the TikTok Creator Alliance
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Our Story</h2>
          <div className="space-y-4 text-neutral-300 leading-relaxed">
            <p>
              When we started evaluating TikTok accounts, we saw the same problem again and again:
              the market for account valuation was deeply opaque. The same account could get wildly
              different quotes depending on who was asked — MCNs, agencies, and individual buyers
              were all pricing on gut feeling, with no objective reference point.
            </p>
            <p>
              TokValue is our answer. We don&apos;t set prices for anyone. We use AI and data
              analysis over publicly available information to estimate the range the market is
              actually paying for an account, and present it as a neutral, third-party reference.
            </p>
            <p>
              The tool is built for both sides of the table: <span className="text-white font-medium">MCNs and ad agencies</span> use
              it for batch evaluation and decision reference; <span className="text-white font-medium">creators</span> use it to
              understand their real market value when negotiating.
            </p>
          </div>
        </section>

        {/* Who We Are */}
        <section className="border-y border-neutral-800 bg-neutral-900/20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
            <h2 className="text-2xl font-bold tracking-tight mb-6">Who We Are</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {teamRoles.map((m) => (
                <div
                  key={m.title}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00F2EA]/10 text-[#00F2EA]">
                      <m.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold">{m.title}</h3>
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed">{m.description}</p>
                </div>
              ))}
            </div>

            {/* Team members from blog authors */}
            <div className="mt-10">
              <h3 className="text-lg font-semibold mb-5">The People Writing About Valuations</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {authors.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/authors/${a.slug}`}
                    className="group rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 transition-colors hover:border-[#00F2EA]/40"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D78] to-[#00F2EA] text-sm font-bold text-white">
                        {a.avatarInitial}
                      </div>
                      <div>
                        <p className="font-semibold group-hover:text-[#00F2EA] transition-colors">{a.name}</p>
                        <p className="text-xs text-neutral-500">{a.role}</p>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-400 leading-relaxed">{a.bio}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#00F2EA]">
                      View articles <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                ))}
              </div>
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
                description: 'We don\'t take sides between buyers and sellers. We don\'t set prices — we analyze data and reflect what the market is actually paying.',
              },
              {
                title: 'Data Over Guesswork',
                description: 'Every valuation is driven by analysis of publicly available data, not opinions or hunches. No black boxes — each dimension of an estimate is explainable.',
              },
              {
                title: 'Transparency',
                description: 'You should be able to see why an account is valued the way it is. We break estimates down into interpretable dimensions so you can judge them yourself.',
              },
            ].map((b) => (
              <div key={b.title} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
                <h3 className="font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{b.description}</p>
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
                ByteDance Ltd.</span> and is used for identification purposes only. All other
                trademarks belong to their respective owners.
              </p>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="border-t border-neutral-800 bg-gradient-to-b from-transparent to-neutral-900/40">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 text-center">
            <h2 className="text-2xl font-bold tracking-tight mb-4">Get in Touch</h2>
            <p className="text-neutral-300 leading-relaxed mb-6 max-w-lg mx-auto">
              Questions, feedback, partnership ideas — we read every email.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#00F2EA] text-black font-semibold hover:bg-[#00F2EA]/90 transition-colors"
            >
              <Mail className="h-4 w-4" />
              Contact Us
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
