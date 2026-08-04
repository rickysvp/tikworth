import type { Metadata } from 'next'
import Script from 'next/script'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Shield, ChevronRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | TokValue',
  description: 'TokValue Privacy Policy — how we collect, use, and protect your personal information.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | TokValue',
    description: 'TokValue Privacy Policy — how we collect, use, and protect your personal information.',
    url: 'https://tokvalue.com/privacy',
  },
}

const sections = [
  {
    id: 'overview',
    title: 'Overview',
    content: `TokValue ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website tokvalue.com (the "Service"). Please read this Privacy Policy carefully. By using the Service, you agree to the practices described in this policy.`,
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    content: `We collect information in the following ways:`,
    bullets: [
      'Account Information: When you register for an account, we collect your email address and a password. We also store your credit balance and evaluation history.',
      'Usage Data: When you access the Service, we automatically collect certain information about your device, including your web browser type, IP address, time zone, and some of the cookies that are installed on your device.',
      'Search & Evaluation Data: When you perform a TikTok account evaluation, we collect the TikTok username you provide and the resulting analysis data (account metrics, scoring, and commercial value estimates).',
      'Transaction Data: When you purchase evaluations via our payment provider, we receive information related to your purchase, such as your payment details (which are processed entirely by our payment partner and never stored on our servers).',
      'Analytics Data: We use privacy-friendly analytics to understand how visitors engage with our website. This may include page views, referral sources, and interaction patterns.',
    ],
  },
  {
    id: 'how-we-use-your-information',
    title: 'How We Use Your Information',
    content: `We use the information we collect in the following ways:`,
    bullets: [
      'To provide, maintain, and improve our Service, including processing evaluations and delivering results.',
      'To process transactions and deliver purchased evaluations to your account.',
      'To send you service-related communications, such as verification codes, evaluation results, and updates.',
      'To provide customer support and respond to your inquiries.',
      'To detect, prevent, and address technical issues, security incidents, and fraudulent activity.',
      'To comply with legal obligations and enforce our terms of service.',
    ],
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    content: `We retain your information for as long as necessary to fulfill the purposes described in this Privacy Policy, unless a longer retention period is required or permitted by law. Specifically:`,
    bullets: [
      'Account data (email, credits) is retained as long as your account is active.',
      'Evaluation results are stored for 24 months to allow you to revisit your analysis history.',
      'Verification codes are temporarily stored and automatically expire after 10 minutes.',
      'Payment and transaction records are retained for 7 years as required by tax and accounting regulations.',
      'Analytics data is retained in aggregated, anonymized form for up to 26 months.',
    ],
  },
  {
    id: 'data-security',
    title: 'Data Security',
    content: `We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure. Although we do our best to protect your personal information, we cannot guarantee the security of your personal information stored or transmitted on our Service.`,
    bullets: [
      'All data is transmitted over TLS 1.3 encryption.',
      'Sensitive data is stored encrypted at rest using AES-256.',
      'We use Neon Serverless Postgres with automatic point-in-time recovery.',
      'Access to personal data is restricted to authorized personnel on a need-to-know basis.',
      'We regularly audit our security practices and conduct penetration testing.',
    ],
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services',
    content: `We use the following third-party services, which may process your information:`,
    bullets: [
      'Creem (payment processing): Processes your payment transactions. Read their privacy policy at creem.io.',
      'Resend (email delivery): Sends verification codes and transactional emails on our behalf.',
      'RapidAPI (data sourcing): Provides TikTok account data through API calls when you perform an evaluation.',
      'Neon (database hosting): Stores your account data and evaluation history on secure cloud infrastructure.',
      'Vercel (hosting): Hosts our website and serves your requests through their global edge network.',
    ],
  },
  {
    id: 'cookies',
    title: 'Cookies and Tracking',
    content: `We use cookies and similar tracking technologies to track the activity on our Service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you choose to refuse cookies, you may not be able to use some portions of our Service.`,
  },
  {
    id: 'your-rights',
    title: 'Your Data Rights',
    content: `Depending on your location, you may have the following rights regarding your personal information:`,
    bullets: [
      'Access: You may request copies of the personal information we hold about you.',
      'Correction: You may request that we correct information you believe is inaccurate.',
      'Deletion: You may request that we delete your personal information, subject to certain legal exceptions.',
      'Portability: You may request a copy of your personal data in a structured, commonly used, machine-readable format.',
      'Objection: You may object to certain processing of your personal information.',
      'Restriction: You may request restriction of processing of your personal information.',
    ],
  },
  {
    id: 'childrens-privacy',
    title: "Children's Privacy",
    content: `Our Service does not address anyone under the age of 13 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your Child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from anyone under the age of 13 without verification of parental consent, we take steps to remove that information from our servers.`,
  },
  {
    id: 'international-transfers',
    title: 'International Data Transfers',
    content: `Your information may be processed, stored, and transferred between computers located in various countries, which may not be located in your state, province, country, or other governmental jurisdiction. By using our Service, you consent to this transfer.`,
  },
  {
    id: 'changes-to-this-policy',
    title: 'Changes to This Privacy Policy',
    content: `We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date at the top of this policy. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.`,
  },
  {
    id: 'contact-us',
    title: 'Contact Us',
    content: `If you have any questions about this Privacy Policy, or if you would like to exercise your data rights, please contact us:`,
    bullets: [
      'By email: connect@tokvalue.com',
      'By visiting this page on our website: https://tokvalue.com/privacy',
    ],
  },
]

export default function PrivacyPage() {
  const lastUpdated = 'August 2, 2026'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': 'https://tokvalue.com/privacy/#article',
    url: 'https://tokvalue.com/privacy',
    headline: 'Privacy Policy | TokValue',
    description:
      'How TokValue collects, uses, discloses, and protects your personal information.',
    datePublished: '2026-08-02',
    dateModified: lastUpdated,
    isPartOf: { '@id': 'https://tokvalue.com/#website' },
    publisher: { '@id': 'https://tokvalue.com/#publisher' },
  }

  return (
    <>
      <Script
        id="privacy-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-neutral-100">
            <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#00F2EA]/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-4xl px-4 py-16 sm:py-20 relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-xl bg-[#00F2EA]/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-[#00F2EA]" />
            </div>
            <span className="text-xs font-medium text-[#00F2EA] uppercase tracking-wider">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-sm text-neutral-500 max-w-2xl leading-relaxed">
            Last updated: {lastUpdated}. This policy explains how we collect, use, and protect your personal information when you use TokValue.
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
                    className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-[#00F2EA] transition-colors"
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
                        <span className="mt-2 h-1 w-1 rounded-full bg-[#00F2EA] shrink-0" />
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

            <SiteFooter />
    </div>
    </>
  )
}
