import type { Metadata } from 'next'
import Script from 'next/script'
import { Clock, Mail, MessageSquare, Handshake, Database, Lightbulb } from 'lucide-react'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ContactForm } from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact Us | TokValue',
  description:
    'Get in touch with the TokValue team — questions, feedback, partnership ideas. We read every email and usually reply within 2 business days.',
  alternates: {
    canonical: '/contact',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  '@id': 'https://tokvalue.com/contact#webpage',
  url: 'https://tokvalue.com/contact',
  name: 'Contact Us | TokValue',
  isPartOf: { '@id': 'https://tokvalue.com/#website' },
  description:
    'Get in touch with the TokValue team — questions, feedback, partnership ideas.',
}

const contactOptions = [
  {
    icon: Handshake,
    title: 'Partnerships',
    description: 'MCNs, agencies, and brands looking to work with us on valuation, data, or content.',
  },
  {
    icon: Database,
    title: 'Data Requests',
    description: 'Researchers and media citing our valuation data or methodology.',
  },
  {
    icon: Lightbulb,
    title: 'Feedback',
    description: 'Found a bug, or have an idea that would make TokValue better? Tell us.',
  },
  {
    icon: MessageSquare,
    title: 'General',
    description: 'Anything else — we read everything that lands in this inbox.',
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-white">
      <SiteHeader />
      <Script
        id="contact-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-neutral-800 bg-gradient-to-b from-neutral-900/60 via-transparent to-transparent">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20 text-center">
            <p className="text-xs font-semibold text-[#00F2EA] uppercase tracking-widest mb-4">Contact</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Talk to Us
            </h1>
            <p className="text-lg text-neutral-300 leading-relaxed mb-4">
              Questions, feedback, partnership ideas — we read every email.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-neutral-400">
              <Clock className="h-4 w-4 text-[#00F2EA]" />
              We usually reply within 2 business days.
            </div>
          </div>
        </section>

        {/* Form + options */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 py-14">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
            {/* Form */}
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-6">Send a Message</h2>
              <ContactForm />
            </div>

            {/* What to contact us about */}
            <div>
              <h2 className="text-xl font-bold tracking-tight mb-6">What We Can Help With</h2>
              <div className="space-y-3">
                {contactOptions.map((o) => (
                  <div
                    key={o.title}
                    className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#00F2EA]/10 text-[#00F2EA]">
                      <o.icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{o.title}</h3>
                      <p className="mt-1 text-xs text-neutral-400 leading-relaxed">{o.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
                <h3 className="text-sm font-semibold mb-2">Prefer Email?</h3>
                <p className="text-sm text-neutral-400 mb-3">
                  Write to us directly at
                </p>
                <a
                  href="mailto:connect@tokvalue.com"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#00F2EA] hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  connect@tokvalue.com
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Response promise */}
        <section className="border-t border-neutral-800 bg-neutral-900/20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-[#00F2EA] mt-0.5 shrink-0" />
              <div>
                <h2 className="font-semibold mb-1">What Happens Next</h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Your message goes straight to our team inbox. We reply to every message — usually
                  within 2 business days. If it&apos;s urgent, mention it in the message and we&apos;ll
                  prioritise it.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
