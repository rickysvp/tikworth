import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { Mail, ArrowLeft, Target, Scale, Eye, Users, Code2, BarChart3, Megaphone, BadgeCheck, AlertTriangle } from 'lucide-react'

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

const teamMembers = [
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

const beliefs = [
  {
    icon: Scale,
    title: 'Neutrality',
    description:
      'We don\'t take sides between buyers and sellers. We don\'t set prices — we analyze data and reflect what the market is actually paying.',
  },
  {
    icon: Target,
    title: 'Data Over Guesswork',
    description:
      'Every valuation is driven by analysis of publicly available data, not opinions or hunches. No black boxes — each dimension of an estimate is explainable.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    description:
      'You should be able to see why an account is valued the way it is. We break estimates down into interpretable dimensions so you can judge them yourself.',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Script id="about-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-20">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Hero */}
        <header className="mb-14">
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
            <BadgeCheck className="h-4 w-4" />
            Founding Members of the TikTok Creator Alliance
          </div>
        </header>

        {/* Our Story */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Our Story</h2>
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
        <section className="mb-14">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Who We Are</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {teamMembers.map((m) => (
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
        </section>

        {/* What We Believe */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold tracking-tight mb-6">What We Believe</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {beliefs.map((b) => (
              <div key={b.title} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
                <b.icon className="h-6 w-6 text-[#00F2EA] mb-3" />
                <h3 className="font-semibold mb-2">{b.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mb-14 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
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
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Contact Us</h2>
          <p className="text-neutral-300 leading-relaxed mb-4">
            Questions, feedback, partnership ideas — we read every email.
          </p>
          <a
            href="mailto:connect@tokvalue.com"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#00F2EA] text-black font-semibold hover:bg-[#00F2EA]/90 transition-colors"
          >
            <Mail className="h-4 w-4" />
            connect@tokvalue.com
          </a>
        </section>
      </div>
    </main>
  )
}
