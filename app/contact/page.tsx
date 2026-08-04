import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'
import { ArrowLeft, Clock } from 'lucide-react'
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

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      <Script
        id="contact-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-16 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors mb-10"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <header className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-neutral-300 leading-relaxed mb-4">
            Questions, feedback, partnership ideas — we read every email.
          </p>
          <div className="inline-flex items-center gap-2 text-sm text-neutral-400">
            <Clock className="h-4 w-4 text-[#00F2EA]" />
            We usually reply within 2 business days.
          </div>
        </header>

        <ContactForm />
      </div>
    </main>
  )
}
