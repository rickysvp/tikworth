import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, ChevronRight, Mail, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | TokValue',
  description: 'TokValue Terms of Service — the terms governing use of our TikTok account valuation service.',
}

const sections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: `By accessing or using TokValue ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you should not use the Service. These Terms apply to all visitors, users, and others who access or use the Service.`,
  },
  {
    id: 'description-of-service',
    title: 'Description of Service',
    content: `TokValue provides TikTok account commercial valuation and analytics services. The Service includes, but is not limited to:`,
    bullets: [
      'Account Valuation: Estimating the commercial value of TikTok accounts based on publicly available data.',
      'Performance Analytics: Analyzing account performance metrics including engagement, growth trends, and content quality.',
      'Revenue Estimation: Projecting potential earnings based on account metrics, niche, and market conditions.',
      'Brand Matching: Suggesting potential brand partnership opportunities based on account demographics and content.',
      'Export & Sharing: Generating exportable reports (PDF, PNG) and shareable links for evaluation results.',
    ],
  },
  {
    id: 'user-accounts',
    title: 'User Accounts',
    content: `When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the credentials that you use to access the Service and for any activities or actions under your credentials, whether your credentials are with our Service or a third-party service.`,
    bullets: [
      'You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.',
      'You must not use another user\'s account without permission.',
      'We reserve the right to suspend or terminate accounts that violate these Terms or that engage in fraudulent or abusive behavior.',
    ],
  },
  {
    id: 'user-conduct',
    title: 'User Conduct & Prohibited Use',
    content: `You agree not to use the Service in any way that:`,
    bullets: [
      'Violates any applicable federal, state, local, or international law or regulation.',
      'Infringes upon the intellectual property rights or other rights of any third party.',
      'Attempts to reverse engineer, decompile, or disassemble any part of the Service.',
      'Uses automated scripts, bots, or crawlers to access the Service without our prior written consent.',
      'Attempts to gain unauthorized access to any portion of the Service or any systems or networks connected to the Service.',
      'Uses the Service to harass, abuse, or harm another person, or to impersonate any person or entity.',
      'Attempts to resell, sublicense, or redistribute evaluations or credit access to third parties.',
    ],
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    content: `The Service and its original content, features, and functionality are and will remain the exclusive property of TokValue and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign jurisdictions. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.`,
    bullets: [
      'The TikTok name, logo, and related trademarks are the property of ByteDance Ltd. TokValue is not affiliated with, endorsed by, or sponsored by TikTok or ByteDance.',
      'All evaluation reports, including exported PDFs and images, are for personal or internal business use only. Redistribution or commercial resale of reports is prohibited.',
      'You retain ownership of any TikTok account data you search for, but you grant us a non-exclusive license to process and analyze that data for the purpose of providing the Service.',
    ],
  },
  {
    id: 'payments-and-credits',
    title: 'Payments & Credits',
    content: `TokValue operates on a credit-based system. You purchase credits that can be redeemed for account evaluations.`,
    bullets: [
      'Credits are non-refundable once consumed or unlocked.',
      'Pricing is displayed on the pricing page and may be updated from time to time.',
      'Payments are processed by Creem, our third-party payment provider. By making a purchase, you agree to Creem\'s terms of service and privacy policy.',
      'We are not responsible for any fees charged by your payment method provider.',
      'We reserve the right to modify credit pricing, package sizes, and features at any time.',
      'Promotional credits or referral rewards are non-transferable and may have expiration dates.',
    ],
  },
  {
    id: 'refund-policy',
    title: 'Refund Policy',
    content: `All sales are final. Credits are non-refundable once they have been consumed (i.e., once an evaluation has been performed using those credits). Unused credits may be eligible for refund within 14 days of purchase if the Service is not functioning as described. To request a refund, contact us at connect@tokvalue.com with your order details and reason for the request. Refund requests are reviewed on a case-by-case basis.`,
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    content: `Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, and non-infringement.`,
    bullets: [
      'Valuations are estimates based on publicly available data and proprietary algorithms. They do not constitute financial, investment, or legal advice.',
      'We do not guarantee the accuracy, completeness, or timeliness of any evaluation results.',
      'We do not guarantee that the Service will be uninterrupted, error-free, or secure.',
      'The Service relies on third-party APIs for data sourcing, and we are not responsible for data availability or accuracy from those sources.',
    ],
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of Liability',
    content: `In no event shall TokValue, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.`,
  },
  {
    id: 'termination',
    title: 'Termination',
    content: `We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason including without limitation: a breach of the Terms, a court order, or a request by law enforcement or government agencies. If your account is terminated, your access to purchased credits and evaluation history may be permanently lost.`,
  },
  {
    id: 'changes-to-terms',
    title: 'Changes to Terms',
    content: `We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.`,
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    content: `These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which TokValue is registered, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be deemed a waiver of such right.`,
  },
  {
    id: 'contact-us',
    title: 'Contact Us',
    content: `If you have any questions about these Terms, please contact us:`,
    bullets: [
      'By email: connect@tokvalue.com',
      'By visiting this page on our website: https://tokvalue.com/terms',
    ],
  },
]

export default function TermsPage() {
  const lastUpdated = 'August 2, 2026'

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-neutral-800">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <Image src="/tokvalue.png" alt="TokValue" width={120} height={32} className="h-8 w-auto object-contain" />
          </Link>
          <div className="flex-1" />
          <Link href="/privacy" className="text-xs text-neutral-500 hover:text-[#00F2EA] transition-colors">
            Privacy Policy
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF0050]/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-xl bg-[#FF0050]/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-[#FF0050]" />
            </div>
            <span className="text-xs font-medium text-[#FF0050] uppercase tracking-wider">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-sm text-neutral-500 max-w-2xl leading-relaxed">
            Last updated: {lastUpdated}. Please read these terms carefully before using TokValue. By using our service, you agree to these terms.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="grid lg:grid-cols-[200px_1fr] gap-10">
          {/* Table of Contents */}
          <nav className="hidden lg:block sticky top-24 self-start">
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Contents</h3>
            <ul className="space-y-2">
              {sections.map(s => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-[#FF0050] transition-colors"
                  >
                    <ChevronRight className="h-3 w-3" />
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map(s => (
              <article key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <span className="w-1 h-5 bg-gradient-to-b from-[#FF0050] to-[#00F2EA] rounded-full" />
                  {s.title}
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">{s.content}</p>
                {s.bullets && (
                  <ul className="mt-3 space-y-2">
                    {s.bullets.map((b, i) => (
                      <li key={i} className="flex gap-3 text-sm text-neutral-400 leading-relaxed">
                        <span className="mt-2 h-1 w-1 rounded-full bg-[#FF0050] shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-[#0a0a0a]">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image src="/tokvalue.png" alt="TokValue" width={120} height={32} className="h-8 w-auto object-contain" />
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-500">
              <Link href="/" className="hover:text-[#00F2EA] transition-colors">Home</Link>
              <Link href="/privacy" className="hover:text-[#00F2EA] transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-[#FF0050]">Terms of Service</Link>
              <a href="mailto:connect@tokvalue.com" className="hover:text-[#00F2EA] transition-colors flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Contact
              </a>
            </div>
          </div>
          <p className="mt-6 text-xs text-neutral-600 text-center">
            © {new Date().getFullYear()} TokValue. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}
