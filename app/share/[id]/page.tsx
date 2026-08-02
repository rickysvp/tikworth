'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Evaluation } from '@/types'
import { Loader2, TrendingUp, BarChart3, DollarSign, ExternalLink, Share2, Check, Copy } from 'lucide-react'

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${Math.round(n).toLocaleString()}`
}

function fmtUsdRange(low: number, high: number): string {
  return `${fmtUsd(low)} – ${fmtUsd(high)}`
}

export default function SharePage() {
  const params = useParams()
  const id = params.id as string
  const [result, setResult] = useState<Evaluation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch(`/api/share?id=${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Share not found')
        return res.json()
      })
      .then((data: Evaluation) => setResult(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#00F2EA] animate-spin" />
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-4">
        <div className="text-6xl">🔍</div>
        <h1 className="text-2xl font-bold text-white">Share Not Found</h1>
        <p className="text-neutral-400 text-center max-w-md">
          This share link may have expired or is invalid. Share links are valid for 30 days.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00F2EA] px-6 py-3 text-sm font-semibold text-black hover:bg-[#00d4cc] transition-colors"
        >
          Evaluate Your Account
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  const { businessValue } = result

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Bar */}
      <header className="border-b border-neutral-800 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/tokvalue.png"
              alt="TokValue"
              width={100}
              height={22}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-[#00F2EA] hover:text-[#00F2EA] transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#00F2EA] px-4 py-1.5 text-xs font-semibold text-black hover:bg-[#00d4cc] transition-colors"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Evaluate Yours
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00F2EA]/20 bg-[#00F2EA]/5 text-[#00F2EA] text-xs font-medium mb-4">
            <Share2 className="h-3 w-3" />
            Shared Report
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {result.nickname}&apos;s TikTok Account Value
          </h1>
          <p className="text-neutral-400">
            @{result.username} · Powered by <Link href="/" className="text-[#00F2EA] hover:underline">TokValue.com</Link>
          </p>
        </div>

        {/* Account Card */}
        <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6 mb-6">
          <div className="flex items-center gap-4">
            {result.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.avatar} alt={result.nickname} className="w-16 h-16 rounded-full border-2 border-neutral-700" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-2xl font-bold text-neutral-400">
                {result.nickname.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{result.nickname}</h2>
                {result.verified && <span className="text-[#00F2EA] text-sm">✓</span>}
              </div>
              <p className="text-neutral-400 text-sm">@{result.username}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-neutral-300">
                <span><strong>{fmt(result.followerCount)}</strong> followers</span>
                <span><strong>{fmt(result.totalLikes)}</strong> likes</span>
                <span><strong>{result.videoCount}</strong> videos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business Valuation Card */}
        <div className="rounded-2xl border border-[#00F2EA]/20 bg-[#00F2EA]/5 p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-[#00F2EA]" />
            <span className="text-xs font-semibold text-[#00F2EA] uppercase tracking-wider">Business Valuation</span>
          </div>
          <div className="text-4xl md:text-5xl font-bold text-[#00F2EA] mb-4">
            {fmtUsdRange(businessValue.totalValue.low, businessValue.totalValue.high)}
          </div>
          <p className="text-neutral-400 text-sm mb-6">Estimated total account value</p>

          {/* Value Components */}
          <div className="grid grid-cols-5 gap-2">
            {businessValue.components.map((comp, i) => {
              const colors = ['#FF0050', '#00F2EA', '#f59e0b', '#22c55e', '#a855f7']
              return (
                <div key={i} className="rounded-xl bg-[#0a0a0a] border border-neutral-800 p-3 text-center">
                  <div className="text-xs text-neutral-500 mb-1">{comp.label}</div>
                  <div className="text-sm font-bold text-white mb-1">
                    {fmtUsd(comp.amount.low)}–{fmtUsd(comp.amount.high)}
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${comp.percentage}%`, backgroundColor: colors[i] || colors[0] }}
                    />
                  </div>
                  <div className="text-[10px] text-neutral-600 mt-1">{Math.round(comp.percentage)}%</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Assessment Conclusion */}
        <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-[#FF0050]" />
            <span className="text-xs font-semibold text-[#FF0050] uppercase tracking-wider">Assessment Conclusion</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-4">{result.summary.headline}</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-green-400 mb-3">Strengths</h4>
              <ul className="space-y-2">
                {result.summary.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-400 mb-3">Weaknesses</h4>
              <ul className="space-y-2">
                {result.summary.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-[#00F2EA]/10 border border-[#00F2EA]/20">
            <p className="text-sm font-semibold text-[#00F2EA]">{result.verdict}</p>
            <p className="text-sm text-neutral-300 mt-1">{result.advice}</p>
          </div>
        </div>

        {/* Income Estimate */}
        <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Income & Growth</span>
          </div>
          <div className="text-3xl font-bold text-white mb-4">
            {fmtUsdRange(result.incomeEstimate.monthlyTotal.low, result.incomeEstimate.monthlyTotal.high)}
            <span className="text-sm font-normal text-neutral-500 ml-2">/ month</span>
          </div>

          <div className="space-y-3">
            {result.incomeEstimate.breakdown.map((src, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-neutral-300">{src.label}</span>
                  <span className="text-white font-semibold">{fmtUsdRange(src.monthlyAmount.low, src.monthlyAmount.high)}</span>
                </div>
                <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${src.percentage}%`,
                      backgroundColor: src.confidence === 'high' ? '#22c55e' : src.confidence === 'medium' ? '#f59e0b' : '#525252',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-[#0f0f0f] to-[#1a1a1a] p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            What&apos;s Your TikTok Account Worth?
          </h2>
          <p className="text-neutral-400 mb-6 max-w-lg mx-auto">
            Get a full 10-dimension analysis, brand matching, revenue forecast, and growth strategy for your TikTok account.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00F2EA] px-8 py-3 text-sm font-semibold text-black hover:bg-[#00d4cc] transition-colors"
          >
            <BarChart3 className="h-4 w-4" />
            Evaluate Your Account Now
          </Link>
          <p className="text-xs text-neutral-600 mt-4">
            Powered by <Link href="/" className="text-[#00F2EA] hover:underline">TokValue.com</Link> — TikTok Account Value Calculator
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/tokvalue.png"
              alt="TokValue"
              width={80}
              height={18}
              className="h-5 w-auto object-contain opacity-60"
            />
          </Link>
          <p className="text-xs text-neutral-600">
            TokValue.com · TikTok Account Value Calculator
          </p>
        </div>
      </footer>
    </div>
  )
}