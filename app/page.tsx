'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Evaluation } from '@/types'
import { ScoreGauge } from '@/components/ScoreGauge'
import { RadarChart } from '@/components/RadarChart'
import { RiskList } from '@/components/RiskList'
import { Search, Loader2, History, Download, TrendingUp, Shield, Users, DollarSign, ThumbsUp, AlertTriangle, Lightbulb, Target, BadgeCheck, MapPin, Star, Briefcase, Film, Zap, Tag, Clock, UserCheck, BarChart3, Building2, BookmarkPlus, FileText, Image as ImageIcon, ChevronDown, Activity, Play, Gift, ShoppingBag, CheckCircle2, User, Rocket, FileDown, Mail, Flame, ArrowRight, Eye, Globe, Layers, LineChart, MessageCircle, Radio, RefreshCw, Scale, Sparkles, Trophy, Wallet, Share2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { GrowthPlanSection } from '@/components/sections/GrowthPlanSection'
import { IncomeBreakdownSection } from '@/components/sections/IncomeBreakdownSection'
import { RevenueRoadmapSection } from '@/components/sections/RevenueRoadmapSection'
import { ContentStrategySection } from '@/components/sections/ContentStrategySection'
import { PeerRankingSection } from '@/components/sections/PeerRankingSection'
import { BrandMatchingSection } from '@/components/sections/BrandMatchingSection'
import { MonetizationChecklist } from '@/components/sections/MonetizationChecklist'
import { TrendAnalysisSection } from '@/components/sections/TrendAnalysisSection'
import { CommercializationSection } from '@/components/sections/CommercializationSection'
import { PaidWall } from '@/components/PaidWall'
import { DeepAnalysisSection } from '@/components/DeepAnalysisSection'
import { SectionHeader } from '@/components/SectionHeader'
import { saveToTracker, getTrackedByUsername } from '@/lib/tracker'
import { downloadPdf } from '@/lib/export-pdf'
import { APP_VERSION } from '@/lib/version'
import { formatNumber } from '@/lib/format'
import { useToast, ToastContainer } from '@/components/Toast'
import type { CreditBalance } from '@/lib/credits'

import { useI18n, t } from '@/lib/i18n'
import { CREDIT_PACKAGES } from '@/lib/credits'
import { getActiveEmail, setActiveEmail, fetchBalance, getSessionToken } from '@/lib/credits-client'
import { ParticleBackground } from '@/components/ParticleBackground'
import { VerifyEmailModal } from '@/components/VerifyEmailModal'

// Client-side analytics tracking helper
function trackEvent(event_type: string, metadata?: Record<string, unknown>) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type, metadata }),
  }).catch(() => {})
}

const examples = ['charlidamelio', 'mrbeast', 'khaby.lame', 'zachking']

function HomePageContent() {
  const { dict } = useI18n()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Evaluation | null>(null)
  const [error, setError] = useState('')
  const reportRef = useRef<HTMLDivElement>(null)
  const lockedRef = useRef<HTMLDivElement>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const { toast, toasts, dismiss } = useToast()
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [needPurchase, setNeedPurchase] = useState(false)
  const pendingUsername = useRef<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const paidHandled = useRef(false)
  const lastEvaluatedU = useRef<string | null>(null)

  // Load credit balance on mount
  useEffect(() => {
    const email = getActiveEmail()
    if (email) {
      setBalanceLoading(true)
      fetchBalance(email).then(b => { if (b) setCreditBalance(b) }).finally(() => setBalanceLoading(false))
    }
  }, [])

  // Auto-dismiss payment success banner
  useEffect(() => {
    if (paymentSuccess) {
      const t = setTimeout(() => setPaymentSuccess(false), 3000)
      return () => clearTimeout(t)
    }
  }, [paymentSuccess])

  // Close export menu on click-outside or Escape
  useEffect(() => {
    if (!showExportMenu) return
    function handleClick(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowExportMenu(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showExportMenu])

  // Track paywall_view when needPurchase becomes true
  useEffect(() => {
    if (needPurchase) {
      trackEvent('paywall_view', { username: pendingUsername.current || username })
    }
  }, [needPurchase, username])

  // Handle unlock: 购买成功后自动重新评估
  async function handleUnlock() {
    setIsUnlocking(true)

    // Track paywall_click
    trackEvent('paywall_click', { username: pendingUsername.current || username })

    try {
      // 刷新余额
      const email = getActiveEmail()
      if (email) {
        const fresh = await fetchBalance(email)
        if (fresh) setCreditBalance(fresh)
      }
      // 关闭付费墙，用新额度重新评估
      setNeedPurchase(false)
      const target = pendingUsername.current || username
      if (target) {
        await handleEvaluate(target)
      }
    } finally {
      setIsUnlocking(false)
    }
  }

  // Check if current result is already tracked
  useEffect(() => {
    if (result) {
      const tracked = getTrackedByUsername(result.username)
      setIsSaved(!!tracked)
    }
  }, [result])

  function handleSaveToTracker() {
    if (!result) return
    saveToTracker(result)
    setIsSaved(true)
  }

  async function handleExportPdf() {
    if (!result || !reportRef.current) return
    setShowExportMenu(false)
    try {
      await downloadPdf(result, reportRef.current)
    } catch (err) {
      console.error('[export-pdf] failed:', err)
      toast(dict.toast.pdfExportFailed + (err instanceof Error ? err.message : String(err)))
    }
  }

  async function handleShareLink() {
    if (!result) return
    setShowExportMenu(false)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: result.username }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create share link')
      await navigator.clipboard.writeText(data.shareUrl)
      toast(dict.evaluation.shareLinkCopied)
    } catch (err) {
      console.error('[share-link] failed:', err)
      toast(dict.evaluation.shareLinkError)
    }
  }

  const handleEvaluate = useCallback(async (name?: string) => {
    const target = (name ?? username).trim()
    if (!target) return

    setLoading(true)
    setError('')
    setResult(null)
    setNeedPurchase(false)

    // Track search event
    trackEvent('search', { username: target })

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000)

      const token = getSessionToken()
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ username: target }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 402) {
          // 额度不足或未购买：显示付费墙，记住待评估的用户名
          pendingUsername.current = target
          setNeedPurchase(true)
        } else {
          setError(data.error || dict.errors.evaluationFailed)
        }
      } else {
        setResult(data)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError(dict.errors.requestTimeout)
      } else {
        setError(dict.errors.networkError)
      }
    } finally {
      setLoading(false)
    }
  }, [username, dict.errors.networkError, dict.errors.requestTimeout, dict.errors.evaluationFailed])

  // Handle URL params: ?paid=success (Stripe callback) and ?u=username (client navigation)
  useEffect(() => {
    const paid = searchParams.get('paid')
    const paidEmail = searchParams.get('email')
    if (paid === 'success' && paidEmail && !paidHandled.current) {
      paidHandled.current = true
      setActiveEmail(paidEmail)
      setPaymentSuccess(true)
      fetchBalance(paidEmail).then(b => { if (b) setCreditBalance(b) })
      router.replace('/')
      return
    }
    const u = searchParams.get('u')
    if (u && u !== lastEvaluatedU.current) {
      lastEvaluatedU.current = u
      setUsername(u)
      handleEvaluate(u)
    }
  }, [searchParams, handleEvaluate, router])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    handleEvaluate()
  }

  async function handleExportPng() {
    if (!reportRef.current || !result) return
    setShowExportMenu(false)
    try {
      const canvas = await html2canvas(reportRef.current, { backgroundColor: '#0a0a0a', scale: 2 })
      const link = document.createElement('a')
      link.download = `tokvalue-${result.username}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('[export-png] failed:', err)
      toast(dict.toast.pngExportFailed + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <main className="min-h-screen pb-20">
      {/* TopBar */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00F2EA]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-[#00F2EA]/[0.03] pointer-events-none" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="group shrink-0">
            <Image src="/tokvalue.png" alt="TokValue" width={160} height={40} className="h-10 w-auto object-contain" />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
            {[
              { label: dict.nav.tracker, href: '/tracker', icon: BarChart3 },
              { label: dict.nav.history, href: '/history', icon: Clock },
              { label: dict.nav.pricing, href: '#pricing', icon: Zap },
              { label: dict.nav.howItWorks, href: '#capabilities', icon: Lightbulb },
            ].map(item => (
              <a
                key={item.label}
                href={item.href}
                className="group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-neutral-400 hover:text-white transition-colors"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
                <span className="absolute inset-x-2 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-[#00F2EA]/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform" />
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center justify-end gap-2 min-w-0 w-[160px] sm:w-auto">
            {paymentSuccess && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-300 animate-fade-in-up">
                <CheckCircle2 className="h-3 w-3" />
                {dict.nav.creditsAdded}
              </div>
            )}

            {balanceLoading && !creditBalance ? (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="hidden sm:inline">{dict.nav.loadingCredits}</span>
              </div>
            ) : creditBalance ? (
              <>
                {/* Credit badge */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00F2EA]/40 to-[#FF0050]/30 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-1.5 rounded-full border border-[#00F2EA]/40 bg-[#0a0a0a] px-3 py-1">
                    <Zap className="h-3 w-3 text-[#00F2EA]" fill="#00F2EA" />
                    <span className="text-xs font-bold text-[#00F2EA] tabular-nums">{creditBalance.credits}</span>
                    <span className="text-[10px] text-neutral-500">{dict.common.evaluations}</span>
                  </div>
                </div>

                {/* User info */}
                <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-900/60 py-0.5 pl-0.5 pr-2.5 min-w-0">
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[#FF0050] to-[#00F2EA] flex items-center justify-center text-[10px] font-bold text-black shrink-0">
                    {(creditBalance.email[0] || '?').toUpperCase()}
                  </div>
                  <span className="text-[11px] text-neutral-400 truncate max-w-[120px]" title={creditBalance.email}>
                    {creditBalance.email}
                  </span>
                  <button
                    onClick={() => { setCreditBalance(null); setActiveEmail(null) }}
                    className="ml-0.5 text-neutral-600 hover:text-neutral-300 transition-colors shrink-0"
                    aria-label={dict.common.switchAccount}
                  >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => setShowVerifyModal(true)}
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#FF0050] to-[#ff2d6a] px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-[#FF0050]/20 hover:shadow-xl hover:shadow-[#FF0050]/30 transition-all"
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {dict.nav.verifyEmail}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </button>
            )}
          </div>
        </div>
      </header>
      {/* Hero / Tool */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF0050]/10 via-transparent to-transparent" />
        <ParticleBackground />
        <div className="mx-auto max-w-3xl px-4 py-20 sm:py-24 relative">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
              {dict.home.hero.title}
            </h1>
            <p className="text-lg text-neutral-400 max-w-xl mx-auto">
              {dict.home.hero.subtitle}
            </p>
          </div>

          <form onSubmit={onSubmit} className="relative">
            <div className="flex items-center rounded-2xl border border-neutral-700 bg-neutral-900/80 backdrop-blur px-4 py-3 glow-pink focus-within:border-[#FF0050] transition-colors">
              <span className="text-neutral-500 text-lg mr-3">@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={dict.home.hero.placeholder}
                aria-label={dict.home.hero.ariaLabel}
                autoComplete="off"
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-neutral-600"
              />
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex items-center gap-2 rounded-xl bg-[#FF0050] px-5 py-2.5 font-semibold text-white hover:bg-[#d60043] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? dict.common.analyzing : dict.common.evaluate}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 rounded-xl border border-red-900/40 bg-red-950/20 p-4 text-center text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-neutral-500">
            {examples.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => { setUsername(name); handleEvaluate(name) }}
                className="rounded-full border border-neutral-700 px-3 py-1 hover:border-[#FF0050] hover:text-[#FF0050] transition-colors"
              >
                @{name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Landing Page Sections (shown when no result) */}
      {!result && !loading && !needPurchase && (
        <>
          {/* Social Proof */}
          <section className="border-b border-neutral-800 bg-[#0a0a0a] py-12">
            <div className="mx-auto max-w-5xl px-4">
              <div className="grid grid-cols-3 gap-8 text-center">
                {[
                  { value: '12,847+', label: dict.home.socialProof.accountsEvaluated },
                  { value: '$2.4B+', label: dict.home.socialProof.totalValueAssessed },
                  { value: '98.2%', label: dict.home.socialProof.satisfactionRate },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">{stat.value}</div>
                    <div className="mt-1 text-xs sm:text-sm text-neutral-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Use Cases */}
          <section className="border-b border-neutral-800 py-16">
            <div className="mx-auto max-w-5xl px-4">
              <h2 className="text-2xl font-bold text-center mb-10">{dict.home.useCases.title}</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    icon: Building2, title: dict.home.useCases.brands.title,
                    desc: dict.home.useCases.brands.desc,
                    cta: dict.home.useCases.brands.cta,
                    action: () => document.querySelector('input')?.focus(),
                  },
                  {
                    icon: User, title: dict.home.useCases.creators.title,
                    desc: dict.home.useCases.creators.desc,
                    cta: dict.home.useCases.creators.cta,
                    action: () => { setUsername(''); document.querySelector('input')?.focus() },
                  },
                  {
                    icon: Users, title: dict.home.useCases.agencies.title,
                    desc: dict.home.useCases.agencies.desc,
                    cta: dict.home.useCases.agencies.cta,
                    action: () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }),
                  },
                ].map((item, i) => {
                  const Icon = item.icon
                  return (
                    <div key={i} className="group rounded-2xl border border-neutral-800 bg-[#141414] p-6 hover:border-[#00F2EA]/30 transition-all hover:-translate-y-1">
                      <div className="w-11 h-11 rounded-xl bg-[#00F2EA]/10 flex items-center justify-center mb-4">
                        <Icon className="h-5 w-5 text-[#00F2EA]" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-sm text-neutral-400 leading-relaxed mb-4">{item.desc}</p>
                      <button onClick={item.action} className="text-sm font-medium text-[#FF0050] hover:text-[#ff2d6a] transition-colors">
                        {item.cta} →
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Core Capabilities */}
          <section id="capabilities" className="border-b border-neutral-800 py-20">
            <div className="mx-auto max-w-5xl px-4">
              <div className="text-center mb-14">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#00F2EA]/20 bg-[#00F2EA]/5 px-4 py-1.5 text-xs font-medium text-[#00F2EA] mb-4">
                  <Sparkles className="h-3.5 w-3.5" />
                  {dict.home.capabilities.badge}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                  {dict.home.capabilities.title}
                </h2>
                <p className="text-neutral-500 text-sm max-w-2xl mx-auto leading-relaxed">
                  {dict.home.capabilities.description}
                </p>
              </div>

              {/* 1. BUSINESS VALUATION — Wide Card */}
              <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] via-[#0f0f0f] to-[#FF0050]/[0.04] p-6 sm:p-8 mb-5 hover:border-[#FF0050]/30 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
                  <div className="lg:w-[340px] shrink-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF0050]/10 border border-[#FF0050]/20 px-3 py-1 text-[10px] font-semibold text-[#FF0050] uppercase tracking-wider mb-4">
                      <DollarSign className="h-3 w-3" /> {dict.home.capabilities.valuation.badge}
                    </span>
                    <h3 className="text-xl font-bold mb-2">{dict.home.capabilities.valuation.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed mb-5">
                      {dict.home.capabilities.valuation.desc}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FF0050]/5 border border-[#FF0050]/10">
                        <DollarSign className="h-5 w-5 text-[#FF0050] shrink-0" />
                        <div>
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{dict.home.capabilities.valuation.rangeLabel}</div>
                          <div className="text-base font-bold text-[#FF0050]">{dict.home.capabilities.valuation.rangeValue}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FF0050]/5 border border-[#FF0050]/10">
                        <Globe className="h-5 w-5 text-[#FF0050] shrink-0" />
                        <div>
                          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{dict.home.capabilities.valuation.coverageLabel}</div>
                          <div className="text-sm font-semibold text-white">{dict.home.capabilities.valuation.coverageValue}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 grid gap-3 sm:grid-cols-2">
                    <CapFeature icon={<DollarSign className="h-4 w-4" />} color="pink" title={dict.home.capabilities.valuation.features.incomeBreakdown.title} items={dict.home.capabilities.valuation.features.incomeBreakdown.items} />
                    <CapFeature icon={<TrendingUp className="h-4 w-4" />} color="pink" title={dict.home.capabilities.valuation.features.revenueRoadmap.title} items={dict.home.capabilities.valuation.features.revenueRoadmap.items} />
                    <CapFeature icon={<Layers className="h-4 w-4" />} color="pink" title={dict.home.capabilities.valuation.features.valueBreakdown.title} items={dict.home.capabilities.valuation.features.valueBreakdown.items} />
                    <CapFeature icon={<Trophy className="h-4 w-4" />} color="pink" title={dict.home.capabilities.valuation.features.peerBenchmarking.title} items={dict.home.capabilities.valuation.features.peerBenchmarking.items} />
                  </div>
                </div>
              </div>

              {/* 2. AUTHORITY & RISK — Wide Card */}
              <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] via-[#0f0f0f] to-[#00F2EA]/[0.04] p-6 sm:p-8 mb-5 hover:border-[#00F2EA]/30 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
                  <div className="lg:w-[340px] shrink-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00F2EA]/10 border border-[#00F2EA]/20 px-3 py-1 text-[10px] font-semibold text-[#00F2EA] uppercase tracking-wider mb-4">
                      <Shield className="h-3 w-3" /> {dict.home.capabilities.authority.badge}
                    </span>
                    <h3 className="text-xl font-bold mb-2">{dict.home.capabilities.authority.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed mb-5">
                      {dict.home.capabilities.authority.desc}
                    </p>
                    <div className="mb-4 space-y-2">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">{dict.home.capabilities.authority.valueLevels.title}</div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/15">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mt-0.5">
                          <Trophy className="h-4 w-4 text-amber-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-amber-300">{dict.home.capabilities.authority.valueLevels.premium.label}</div>
                          <div className="text-[11px] text-neutral-400 leading-relaxed">{dict.home.capabilities.authority.valueLevels.premium.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-[#00F2EA]/10 to-[#00F2EA]/5 border border-[#00F2EA]/15">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-[#00F2EA]/20 flex items-center justify-center mt-0.5">
                          <TrendingUp className="h-4 w-4 text-[#00F2EA]" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#00F2EA]">{dict.home.capabilities.authority.valueLevels.growth.label}</div>
                          <div className="text-[11px] text-neutral-400 leading-relaxed">{dict.home.capabilities.authority.valueLevels.growth.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/15">
                        <div className="shrink-0 w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mt-0.5">
                          <Sparkles className="h-4 w-4 text-purple-400" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-purple-300">{dict.home.capabilities.authority.valueLevels.developing.label}</div>
                          <div className="text-[11px] text-neutral-400 leading-relaxed">{dict.home.capabilities.authority.valueLevels.developing.desc}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-[#00F2EA]/5 border border-[#00F2EA]/10">
                      <Eye className="h-5 w-5 text-[#00F2EA] shrink-0" />
                      <div className="text-xs text-neutral-400">
                        {t(dict.home.capabilities.authority.brandCheck, { pct: '85' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 grid gap-3 sm:grid-cols-2">
                    <CapFeature icon={<Scale className="h-4 w-4" />} color="cyan" title={dict.home.capabilities.authority.features.radarScoring.title} items={dict.home.capabilities.authority.features.radarScoring.items} />
                    <CapFeature icon={<AlertTriangle className="h-4 w-4" />} color="cyan" title={dict.home.capabilities.authority.features.riskIntelligence.title} items={dict.home.capabilities.authority.features.riskIntelligence.items} />
                    <CapFeature icon={<Building2 className="h-4 w-4" />} color="cyan" title={dict.home.capabilities.authority.features.brandSuitability.title} items={dict.home.capabilities.authority.features.brandSuitability.items} />
                    <CapFeature icon={<Activity className="h-4 w-4" />} color="cyan" title={dict.home.capabilities.authority.features.accountHealth.title} items={dict.home.capabilities.authority.features.accountHealth.items} />
                  </div>
                </div>
              </div>

              {/* 3. GROWTH & MONETIZATION — Wide Card */}
              <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] via-[#0f0f0f] to-[#FF0050]/[0.04] p-6 sm:p-8 mb-5 hover:border-[#FF0050]/30 transition-all group">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
                  <div className="lg:w-[340px] shrink-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF0050]/10 border border-[#FF0050]/20 px-3 py-1 text-[10px] font-semibold text-[#FF0050] uppercase tracking-wider mb-4">
                      <Rocket className="h-3 w-3" /> {dict.home.capabilities.growth.badge}
                    </span>
                    <h3 className="text-xl font-bold mb-2">{dict.home.capabilities.growth.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed mb-5">
                      {dict.home.capabilities.growth.desc}
                    </p>
                    <div className="space-y-2 text-xs">
                      {dict.home.capabilities.growth.guarantees.map((text, i) => (
                        <div key={i} className="flex items-center gap-2 text-neutral-400">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#00F2EA] shrink-0" />
                          <span>{text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 grid gap-3 sm:grid-cols-2">
                    <CapFeature icon={<Lightbulb className="h-4 w-4" />} color="pink" title={dict.home.capabilities.growth.features.contentStrategy.title} items={dict.home.capabilities.growth.features.contentStrategy.items} />
                    <CapFeature icon={<Rocket className="h-4 w-4" />} color="pink" title={dict.home.capabilities.growth.features.monetizationBlueprint.title} items={dict.home.capabilities.growth.features.monetizationBlueprint.items} />
                    <CapFeature icon={<Flame className="h-4 w-4" />} color="pink" title={dict.home.capabilities.growth.features.trendForecasting.title} items={dict.home.capabilities.growth.features.trendForecasting.items} />
                    <CapFeature icon={<MessageCircle className="h-4 w-4" />} color="pink" title={dict.home.capabilities.growth.features.engagementDeepDive.title} items={dict.home.capabilities.growth.features.engagementDeepDive.items} />
                  </div>
                </div>
              </div>

              {/* Additional Capabilities Summary */}
              <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] to-[#141414] p-6 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <Radio className="h-4 w-4 text-[#FF0050]" />
                  <h4 className="text-sm font-semibold text-neutral-300">{dict.home.capabilities.alsoIncluded.title}</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {dict.home.capabilities.alsoIncluded.items.map((item, i) => {
                    const icons = [FileDown, RefreshCw, Globe, BarChart3, LineChart, Wallet]
                    const Icon = icons[i] || Radio
                    return (
                    <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 hover:border-[#FF0050]/30 transition-colors text-center">
                      <Icon className="h-4 w-4 text-[#00F2EA]" />
                      <span className="text-[11px] font-medium text-neutral-300">{item.label}</span>
                      <span className="text-[10px] text-neutral-500">{item.desc}</span>
                    </div>
                    )
                  })}
                </div>
              </div>

              {/* CTA Banner */}
              <div className="text-center mt-8">
                <p className="text-sm text-neutral-500 mb-4">{dict.home.capabilities.ctaHint}</p>
                <button
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('input[placeholder*="username"]')
                    if (input) { input.focus(); input.scrollIntoView({ behavior: 'smooth', block: 'center' }) }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF0050] to-[#e60049] px-6 py-3 text-sm font-semibold text-white hover:from-[#e60049] hover:to-[#cc0040] transition-all shadow-lg shadow-[#FF0050]/25"
                >
                  {dict.home.capabilities.cta}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Pricing Preview */}
          <section id="pricing" className="border-b border-neutral-800 py-16">
            <div className="mx-auto max-w-3xl px-4">
              <h2 className="text-2xl font-bold text-center mb-2">{dict.home.pricing.title}</h2>
              <p className="text-neutral-500 text-center mb-10 text-sm">{dict.home.pricing.subtitle}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {CREDIT_PACKAGES.map(pkg => (
                  <div key={pkg.id} className={`relative rounded-2xl border-2 p-5 text-center transition-all ${
                    pkg.highlight ? 'border-[#FF0050] bg-[#FF0050]/5' : 'border-neutral-800 bg-[#141414]'
                  }`}>
                    {pkg.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FF0050] px-2.5 py-0.5 text-[10px] font-bold text-white">
                          <Star className="h-2.5 w-2.5" />{dict.creditPackages[pkg.id as keyof typeof dict.creditPackages]?.badge ?? pkg.badge}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2">{dict.creditPackages[pkg.id as keyof typeof dict.creditPackages]?.label ?? pkg.label}</div>
                    <div className="flex items-baseline justify-center gap-0.5">
                      <span className="text-neutral-400">$</span>
                      <span className="text-4xl font-black text-white">{pkg.price}</span>
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">{pkg.credits} evaluations</div>
                    <div className="text-xs text-neutral-600 mt-0.5">{pkg.perUnit}</div>
                    <button
                      onClick={() => { setShowVerifyModal(true) }}
                      className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                        pkg.highlight
                          ? 'bg-[#FF0050] text-white hover:bg-[#e60049]'
                          : 'border border-neutral-700 text-neutral-300 hover:border-[#FF0050] hover:text-[#FF0050]'
                      }`}
                    >
                      {dict.common.getStarted}
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center gap-5 text-[10px] text-neutral-600">
                {dict.home.pricing.footer.map((text, i) => (
                  <span key={i}>{text}</span>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="border-b border-neutral-800 py-16">
            <div className="mx-auto max-w-2xl px-4">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#00F2EA]/20 bg-[#00F2EA]/5 px-4 py-1.5 text-xs font-medium text-[#00F2EA] mb-4">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {dict.home.faq.badge}
                </div>
                <h2 className="text-2xl font-bold">{dict.home.faq.title}</h2>
              </div>

              {Object.entries(dict.home.faq.questions).map(([key, item]) => (
                <FAQItem key={key} question={item.q} answer={item.a} />
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-neutral-800 bg-[#0a0a0a]">
            <div className="mx-auto max-w-5xl px-4 py-12">
              {/* Disclaimer Banner */}
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 mb-10">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">{dict.home.footer.disclaimer.title}</h4>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {dict.home.footer.disclaimer.text}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-4">
                {/* Brand */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Image src="/tokvalue.png" alt="TokValue" width={140} height={36} className="h-9 w-auto object-contain" />
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed mb-3">
                    {dict.home.footer.tagline}
                  </p>
                  <span className="text-[10px] text-neutral-600">v{APP_VERSION}</span>
                </div>

                {/* Product */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">{dict.home.footer.product}</h4>
                  <ul className="space-y-2">
                    <li><a href="#capabilities" className="text-xs text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.home.footer.capabilities}</a></li>
                    <li><a href="#pricing" className="text-xs text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.nav.pricing}</a></li>
                    <li><Link href="/tracker" className="text-xs text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.nav.tracker}</Link></li>
                    <li><Link href="/history" className="text-xs text-neutral-500 hover:text-[#00F2EA] transition-colors">{dict.nav.history}</Link></li>
                  </ul>
                </div>

                {/* Data & Methodology */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">{dict.home.footer.dataMethodology}</h4>
                  <ul className="space-y-2">
                    {dict.home.footer.methodologyItems.map((item, i) => (
                      <li key={i}><span className="text-xs text-neutral-500">{item}</span></li>
                    ))}
                  </ul>
                </div>

                {/* Legal */}
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">{dict.home.footer.legal}</h4>
                  <ul className="space-y-2">
                    {dict.home.footer.legalItems.map((item, i) => (
                      <li key={i}><span className="text-xs text-neutral-500">{item}</span></li>
                    ))}
                    <li><span className="text-xs text-neutral-600">{t('© {year} TokValue. All rights reserved.', { year: new Date().getFullYear() })}</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Purchase required: needs credits to evaluate */}
      {needPurchase && !result && (
        <section className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-[#FF0050]/30 bg-[#FF0050]/5 p-4 mb-6 text-center">
            <p className="text-sm text-neutral-300">
              {dict.evaluation.purchaseRequired.usesCredit}
              <br />
              <span className="text-xs text-neutral-500">{dict.evaluation.purchaseRequired.purchaseToView}</span>
            </p>
          </div>
          <PaidWall onUnlock={handleUnlock} result={null} existingBalance={creditBalance} isUnlocking={isUnlocking} balanceLoading={balanceLoading} />
        </section>
      )}

      {/* Result */}
      {result && (
        <section className="mx-auto max-w-5xl px-4 py-10">
          <div ref={reportRef} className="rounded-3xl border border-neutral-800 bg-[#141414] p-6 sm:p-10">
            {/* Header - Account Info */}
            <div className="flex items-start gap-5 mb-8 pb-6 border-b border-neutral-800">
              {result.avatar ? (
                <Image src={result.avatar} alt={result.nickname} width={64} height={64} className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-neutral-700 shrink-0 object-cover" />
              ) : (
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold shrink-0">
                  {result.nickname.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold">{result.nickname}</h2>
                  {result.verified && (
                    <BadgeCheck className="h-5 w-5 text-[#00F2EA] shrink-0" />
                  )}
                  {result.mock && (
                    <span className="inline-block rounded-full border border-amber-700/50 bg-amber-950/30 px-2.5 py-0.5 text-xs text-amber-400">
                      {dict.common.mockData}
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500">@{result.username}</p>
                {result.bio && (
                  <p className="text-sm text-neutral-400 mt-1 line-clamp-1">{result.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                  <span><span className="font-semibold tabular-nums">{formatNumber(result.followerCount)}</span> <span className="text-neutral-500">{dict.common.followers}</span></span>
                  <span><span className="font-semibold tabular-nums">{formatNumber(result.followingCount)}</span> <span className="text-neutral-500">{dict.common.following}</span></span>
                  <span><span className="font-semibold tabular-nums">{formatNumber(result.totalLikes)}</span> <span className="text-neutral-500">{dict.common.totalLikes}</span></span>
                  <span><span className="font-semibold tabular-nums">{result.videoCount}</span> <span className="text-neutral-500">{dict.common.videos}</span></span>
                  {result.region && (
                    <span className="inline-flex items-center gap-1 text-neutral-500">
                      <MapPin className="h-3 w-3" />
                      {result.region}
                    </span>
                  )}
                </div>
                {/* Account Profile Tags */}
                {result.accountProfile && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {result.accountProfile.categories.map((cat, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full border border-[#00F2EA]/30 bg-[#00F2EA]/10 px-2 py-0.5 text-xs text-[#00F2EA]">
                        <Tag className="h-3 w-3" />
                        {cat}
                      </span>
                    ))}
                    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800/50 px-2 py-0.5 text-xs text-neutral-400">
                      <UserCheck className="h-3 w-3" />
                      {result.accountProfile.personaType}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800/50 px-2 py-0.5 text-xs text-neutral-400">
                      <Clock className="h-3 w-3" />
                      {result.accountProfile.postingRhythm}
                    </span>
                  </div>
                )}
              </div>
              {/* Right: Score Gauge */}
              <div data-pdf="score-gauge"><ScoreGauge score={result.score} tier={result.tier} size={100} showLabel /></div>
            </div>

            {/* ===== Layer 1: Business Value Banner (商业价值首屏) ===== */}
            <SectionHeader step="01" title={dict.evaluation.sections.businessValuation} icon={<Star className="h-4 w-4" />} />
            <div className="mb-10 rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] to-[#141414] p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                {/* Left: Dollar Value Hero */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-4 w-4 text-[#FF0050]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{dict.evaluation.valuation.label}</span>
                  </div>
                  <span className="text-5xl sm:text-6xl font-black tracking-tight text-[#00F2EA]">
                    ${formatNumber(result.businessValue.totalValue.low)} - ${formatNumber(result.businessValue.totalValue.high)}
                  </span>

                  {/* Value Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
                    {result.businessValue.components.map((comp, idx) => (
                      <div
                        key={idx}
                        className={`rounded-xl border p-3 ${
                          idx === 4
                            ? 'border-purple-500/30 bg-gradient-to-br from-purple-950/30 to-neutral-900/50'
                            : 'border-neutral-800 bg-neutral-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {valueIcon(comp.icon)}
                          <span className="text-xs text-neutral-400">{comp.label}</span>
                        </div>
                        <div className="text-sm font-bold tabular-nums">${formatNumber(comp.amount.low)}-${formatNumber(comp.amount.high)}</div>
                        <div className="mt-1.5 h-1 w-full rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${comp.percentage}%`,
                              background: idx === 0 ? 'linear-gradient(to right, #FF0050, #ff6b8a)' :
                                         idx === 1 ? 'linear-gradient(to right, #00F2EA, #66f7f3)' :
                                         idx === 2 ? 'linear-gradient(to right, #f59e0b, #fbbf24)' :
                                         idx === 3 ? 'linear-gradient(to right, #22c55e, #86efac)' :
                                         'linear-gradient(to right, #a855f7, #c084fc)',
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-1 leading-tight">
                          {comp.detail}
                        </div>
                        {/* Brand collaboration card extras */}
                        {idx === 0 && result.brandPotential && (
                          <div className="mt-2 pt-2 border-t border-neutral-800">
                            <div className="text-[10px] text-neutral-500 mb-1">CPM ${result.brandPotential.estimatedCPM}</div>
                            <div className="flex flex-wrap gap-1">
                              {result.brandPotential.suitableCategories.map((cat, ci) => (
                                <span key={ci} className="rounded-full border border-[#00F2EA]/30 bg-[#00F2EA]/10 px-1.5 py-0.5 text-[10px] text-[#00F2EA]">
                                  {cat}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Layer 1 Hook — tease paid content */}
            <div className="mb-10 flex items-center gap-2 rounded-xl border border-[#FF0050]/15 bg-[#FF0050]/5 px-4 py-3">
              <Star className="h-4 w-4 shrink-0 text-[#FF0050]" />
              <span className="text-xs text-neutral-400">
                {dict.evaluation.unlockTeaser} <span className="text-neutral-300">{dict.evaluation.unlockItems.incomeChannels}</span> · <span className="text-neutral-300">{dict.evaluation.unlockItems.monetizationPaths}</span> · <span className="text-neutral-300">{dict.evaluation.unlockItems.trendBrandMatching}</span> · <span className="text-neutral-300">{dict.evaluation.unlockItems.revenueForecast}</span>
              </span>
            </div>

            {/* ===== Layer 2: Conclusion Area (Assessment Conclusion) ===== */}
            <SectionHeader step="02" title={dict.evaluation.sections.assessmentConclusion} icon={<Target className="h-4 w-4" />} />
            <div className="mb-10 rounded-2xl border border-[#00F2EA]/20 bg-gradient-to-br from-[#00F2EA]/5 to-[#FF0050]/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-[#FF0050]" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{dict.evaluation.conclusion.label}</h3>
              </div>
              <div className="text-xl font-bold mb-5">{result.summary.headline}</div>

              <div className="grid gap-6 lg:grid-cols-2 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">{dict.evaluation.conclusion.strengths}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.summary.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                        <span className="mt-0.5 text-green-400">+</span>
                        {s}
                      </li>
                    ))}
                    {result.summary.strengths.length === 0 && (
                      <li className="text-sm text-neutral-500">{dict.evaluation.conclusion.noStrengths}</li>
                    )}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">{dict.evaluation.conclusion.weaknesses}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.summary.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                        <span className="mt-0.5 text-amber-400">-</span>
                        {w}
                      </li>
                    ))}
                    {result.summary.weaknesses.length === 0 && (
                      <li className="text-sm text-neutral-500">{dict.evaluation.conclusion.noWeaknesses}</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mb-5">
                <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-[#0f0f0f] p-4">
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#00F2EA]" />
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">{dict.evaluation.conclusion.targetAudience}</div>
                    <div className="text-sm text-neutral-200">{result.summary.targetAudience}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-[#0f0f0f] p-4">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#FF0050]" />
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">{dict.evaluation.conclusion.bestAction}</div>
                    <div className="text-sm text-neutral-200">{result.summary.bestAction}</div>
                  </div>
                </div>
              </div>

              {/* Verdict + Price Advice */}
              <div className="rounded-xl border border-[#00F2EA]/20 bg-[#00F2EA]/5 p-4">
                <div className="text-lg font-semibold mb-2">{result.verdict}</div>
                <p className="text-neutral-300 leading-relaxed mb-3">{result.advice}</p>
                <div className="flex items-start gap-3 pt-3 border-t border-[#00F2EA]/10">
                  <DollarSign className="mt-0.5 h-5 w-5 shrink-0 text-[#00F2EA]" />
                  <div>
                    <div className="text-sm font-medium text-[#00F2EA]">{dict.evaluation.conclusion.priceReference}</div>
                    <div className="mt-1 text-sm text-neutral-300">{result.priceAdvice}</div>
                  </div>
                </div>
              </div>

              {/* Peer highlight hook */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-[#00F2EA]/20 bg-[#00F2EA]/5 px-3 py-2.5">
                  <TrendingUp className="h-4 w-4 shrink-0 text-[#00F2EA]" />
                  <span className="text-xs text-neutral-400">
                    {t(dict.resultLabels.peerComparison, { pct: result.metrics.engagementRate, pct2: result.peerBenchmark ? Math.round((1 - result.peerBenchmark.percentile / 100) * 100) : '--' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[#FF0050]/20 bg-[#FF0050]/5 px-3 py-2.5">
                  <Star className="h-4 w-4 shrink-0 text-[#FF0050]" />
                  <span className="text-xs text-neutral-400">
                    {t(dict.resultLabels.brandRank, { tier: result.peerRanking?.tierLabel || '--' })}
                  </span>
                </div>
              </div>

              {/* Monetization Checklist */}
              <div className="mt-5">
                <MonetizationChecklist
                  followerCount={result.followerCount}
                  videoCount={result.videoCount}
                  region={result.region}
                  isUnlocked={true}
                  hasHighRisk={result.riskFlags?.some(r => r.level === 'high')}
                />
              </div>
            </div>

            {/* ===== Premium Content: 评估已收费，全部可见 ===== */}
            <div ref={lockedRef}>
              {/* Section: Income & Growth */}
              <SectionHeader step="03" title={dict.evaluation.sections.incomeAndGrowth} icon={<DollarSign className="h-4 w-4" />} />
              <div className="mb-10 space-y-4">
                <IncomeBreakdownSection estimate={result.incomeEstimate} />

                <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-4">
                  {result.monetizationPath.eligiblePrograms.length > 0 ? (
                    <div>
                      <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">{dict.resultLabels.monetizationEligible}</div>
                      <div className="flex flex-wrap gap-2">
                        {result.monetizationPath.eligiblePrograms.map((program, i) => (
                          <span key={i} className="rounded-full border border-green-900/50 bg-green-950/30 px-3 py-1 text-xs text-green-400">
                            {program}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : result.monetizationPath.nearestThreshold ? (
                    <div className="rounded-xl border border-amber-900/50 bg-amber-950/30 p-3">
                      <div className="text-xs text-amber-400 mb-1 uppercase tracking-wider">{dict.resultLabels.nearestThreshold}</div>
                      <div className="text-sm text-neutral-300">{result.monetizationPath.nearestThreshold.program} — {result.monetizationPath.nearestThreshold.gap}</div>
                    </div>
                  ) : null}
                </div>

                <RevenueRoadmapSection roadmap={result.revenueRoadmap} />
                <GrowthPlanSection plan={result.growthPlan} />
              </div>

              {/* Section: Radar & Risks */}
              <SectionHeader step="04" title={dict.evaluation.sections.radarAndRisk} icon={<Shield className="h-4 w-4" />} />
              <div className="mb-10">
                <div className="grid gap-8 lg:grid-cols-2">
                  <div data-pdf="radar-chart" className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-2">{dict.resultLabels.radarScore}</h3>
                    <RadarChart dimensions={result.dimensions} />
                  </div>
                  <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">{dict.resultLabels.riskSignals}</h3>
                    <RiskList risks={result.riskFlags} />
                  </div>
                </div>
              </div>

              {/* Section: Peer Ranking */}
              <SectionHeader step="05" title={dict.evaluation.sections.peerRanking} icon={<BarChart3 className="h-4 w-4" />} />
              <div className="mb-10">
                <PeerRankingSection ranking={result.peerRanking} />
              </div>

              {/* Section: Brand Matching */}
              <SectionHeader step="06" title={dict.evaluation.sections.brandMatching} icon={<Building2 className="h-4 w-4" />} />
              <div className="mb-10">
                <BrandMatchingSection matching={result.brandMatching} />
              </div>

              {/* Section: Content Strategy */}
              <SectionHeader step="07" title={dict.evaluation.sections.contentStrategy} icon={<Lightbulb className="h-4 w-4" />} />
              <div className="mb-10">
                <ContentStrategySection strategy={result.contentStrategy} />
              </div>

              {/* Section: Trend Analysis */}
              <SectionHeader step="08" title={dict.evaluation.sections.trendAnalysis} icon={<TrendingUp className="h-4 w-4" />} />
              <div className="mb-10">
                <TrendAnalysisSection trendAnalysis={result.trendAnalysis} />
              </div>

              {/* Section: Commercialization Advice */}
              <SectionHeader step="09" title={dict.evaluation.sections.monetizationAdvice} icon={<DollarSign className="h-4 w-4" />} />
              <div className="mb-10">
                <CommercializationSection advice={result.commercializationAdvice} />
              </div>

              {/* Section: Deep Analysis */}
              <DeepAnalysisSection result={result} />
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-600 pt-4 border-t border-neutral-800">
              <span>{dict.common.evaluatedAt} {new Date(result.computedAt).toLocaleString('en-US')}</span>
              <span>{t('© {year} TokValue. {disclaimer}', { year: new Date().getFullYear(), disclaimer: dict.common.dataDisclaimer })}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {/* Export Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                aria-expanded={showExportMenu}
                aria-haspopup="menu"
                aria-controls="export-menu"
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-medium hover:border-[#00F2EA] hover:text-[#00F2EA] transition-colors"
              >
                <Download className="h-4 w-4" />
                {dict.evaluation.exportReport}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>
              {showExportMenu && (
                <div id="export-menu" role="menu" className="absolute bottom-full mb-2 left-0 rounded-xl border border-neutral-700 bg-[#141414] shadow-xl shadow-black/50 overflow-hidden min-w-[160px]">
                  <button
                    onClick={handleExportPng}
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
                  >
                    <ImageIcon className="h-4 w-4 text-[#FF0050]" />
                    {dict.evaluation.exportPng}
                  </button>
                  <button
                    onClick={handleExportPdf}
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors border-t border-neutral-800"
                  >
                    <FileText className="h-4 w-4 text-[#00F2EA]" />
                    {dict.evaluation.exportPdf}
                  </button>
                  <button
                    onClick={handleShareLink}
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors border-t border-neutral-800"
                  >
                    <Share2 className="h-4 w-4 text-purple-400" />
                    {dict.evaluation.shareLink}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleSaveToTracker}
              disabled={isSaved}
              className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors ${
                isSaved
                  ? 'border-green-900/50 bg-green-950/20 text-green-400 cursor-default'
                  : 'border-neutral-700 bg-neutral-900 hover:border-[#FF0050] hover:text-[#FF0050]'
              }`}
            >
              <BookmarkPlus className="h-4 w-4" />
              {isSaved ? dict.evaluation.savedToTracker : dict.evaluation.saveToTracker}
            </button>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-medium hover:border-[#FF0050] hover:text-[#FF0050] transition-colors"
            >
              <History className="h-4 w-4" />
              {dict.nav.history}
            </Link>
          </div>
        </section>
      )}

      

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-[#0a0a0a] py-6">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
            <span>{t(dict.resultLabels.copyrightLine, { year: new Date().getFullYear(), version: APP_VERSION })}</span>
            <div className="flex items-center gap-4">
              <span>{dict.common.tiktokTrademark}</span>
              <span>{dict.common.dataDisclaimer}</span>
            </div>
          </div>
        </div>
      </footer>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
      <VerifyEmailModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onUnlock={handleUnlock}
        existingBalance={creditBalance}
      />
    </main>
  )
}



function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-neutral-800">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left text-sm font-medium text-white hover:text-[#00F2EA] transition-colors"
      >
        {question}
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="pb-4 text-sm text-neutral-400 leading-relaxed">{answer}</div>
      )}
    </div>
  )
}



function valueIcon(name: string) {
  const icons: Record<string, React.ReactNode> = {
    Briefcase: <Briefcase className="h-3.5 w-3.5 text-neutral-500" />,
    Film: <Film className="h-3.5 w-3.5 text-neutral-500" />,
    Users: <Users className="h-3.5 w-3.5 text-neutral-500" />,
    Zap: <Zap className="h-3.5 w-3.5 text-neutral-500" />,
    Play: <Play className="h-3.5 w-3.5 text-neutral-500" />,
    Gift: <Gift className="h-3.5 w-3.5 text-neutral-500" />,
    ShoppingBag: <ShoppingBag className="h-3.5 w-3.5 text-neutral-500" />,
  }
  return icons[name] || <Activity className="h-3.5 w-3.5 text-neutral-500" />
}

function CapFeature({ icon, color, title, items }: {
  icon: React.ReactNode
  color: 'pink' | 'cyan'
  title: string
  items: readonly string[]
}) {
  const borderColor = color === 'pink' ? 'border-[#FF0050]/20 group-hover:border-[#FF0050]/40' : 'border-[#00F2EA]/20 group-hover:border-[#00F2EA]/40'
  const iconBg = color === 'pink' ? 'bg-[#FF0050]/10' : 'bg-[#00F2EA]/10'
  const iconColor = color === 'pink' ? 'text-[#FF0050]' : 'text-[#00F2EA]'
  const dotColor = color === 'pink' ? 'bg-[#FF0050]/60' : 'bg-[#00F2EA]/60'
  return (
    <div className={`rounded-xl border ${borderColor} bg-neutral-900/40 p-4 transition-all`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`flex items-center justify-center h-7 w-7 rounded-lg ${iconBg} ${iconColor}`}>
          {icon}
        </div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px] text-neutral-400 leading-relaxed">
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  )
}