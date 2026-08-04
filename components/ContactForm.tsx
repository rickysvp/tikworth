'use client'

import { useState } from 'react'
import { Send, Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react'

const TOPICS = ['General', 'Partnership', 'Media & Press', 'Data Request', 'Feedback', 'Other']

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('General')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !message) {
      setStatus('error')
      setError('Please fill in your email and message.')
      return
    }
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus('error')
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }
      setStatus('success')
      setName('')
      setEmail('')
      setTopic('General')
      setMessage('')
    } catch {
      setStatus('error')
      setError('Network error. Please try again.')
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Name <span className="text-neutral-500">(optional)</span>
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="Your name"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-[#00F2EA]"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Email <span className="text-[#00F2EA]">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-[#00F2EA]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="contact-topic" className="mb-1.5 block text-sm font-medium text-neutral-300">
            Topic
          </label>
          <select
            id="contact-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#00F2EA]"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t} className="bg-neutral-900">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-neutral-300">
            Message <span className="text-[#00F2EA]">*</span>
          </label>
          <textarea
            id="contact-message"
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minLength={10}
            maxLength={5000}
            rows={6}
            placeholder="How can we help?"
            className="w-full resize-y rounded-lg border border-neutral-700 bg-neutral-900 px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors focus:border-[#00F2EA]"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex items-center gap-2 rounded-lg bg-[#00F2EA] px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-[#00F2EA]/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'sending' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send Message
            </>
          )}
        </button>

        {status === 'success' && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Thanks for reaching out! We&apos;ll get back to you within 2 business days.</span>
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      <div className="mt-6 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4">
        <p className="text-sm text-neutral-400">
          Prefer email? Write to us directly at{' '}
          <a
            href="mailto:connect@tokvalue.com"
            className="inline-flex items-center gap-1 font-medium text-[#00F2EA] hover:underline"
          >
            <Mail className="h-3.5 w-3.5" />
            connect@tokvalue.com
          </a>
        </p>
      </div>
    </div>
  )
}
