'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Evaluation } from '@/types'
import { ScoreGauge } from '@/components/ScoreGauge'
import { RadarChart } from '@/components/RadarChart'
import { RiskList } from '@/components/RiskList'
import { Search, Loader2, History, Download, TrendingUp, Shield, Users, DollarSign, ThumbsUp, AlertTriangle, Lightbulb, Target, BadgeCheck, MapPin, Star, Briefcase, Film, Zap, Tag, Clock, UserCheck, BarChart3, Building2, BookmarkPlus, FileText, Image as ImageIcon, ChevronDown, Activity, Play, Gift, ShoppingBag, CheckCircle2 } from 'lucide-react'
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
import { exportPdfReport } from '@/lib/export-pdf'
import { APP_VERSION } from '@/lib/version'
import { formatNumber } from '@/lib/format'
import { useToast, ToastContainer } from '@/components/Toast'
import type { CreditBalance } from '@/lib/credits'
import { getActiveEmail, setActiveEmail, fetchBalance, getSessionToken } from '@/lib/credits-client'

const examples = ['charlidamelio', 'mrbeast', 'khaby.lame', 'zachking']

function HomePageContent() {
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

  // Handle unlock: 购买成功后自动重新评估
  async function handleUnlock() {
    setIsUnlocking(true)
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
      await exportPdfReport(result, true, reportRef.current)
    } catch (err) {
      console.error('[export-pdf] failed:', err)
      toast('PDF 导出失败：' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const handleEvaluate = useCallback(async (name?: string) => {
    const target = (name ?? username).trim()
    if (!target) return

    setLoading(true)
    setError('')
    setResult(null)
    setNeedPurchase(false)

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
          setError(data.error || '评估失败')
        }
      } else {
        setResult(data)
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('请求超时，请刷新页面后重试')
      } else {
        setError('网络错误，请检查网络连接后重试')
      }
    } finally {
      setLoading(false)
    }
  }, [username])

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
      link.download = `tikworth-${result.username}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('[export-png] failed:', err)
      toast('PNG 导出失败：' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <main className="min-h-screen pb-20">
      {/* TopBar */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl">
        {/* 底部渐变光线 */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00F2EA]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-[#00F2EA]/[0.03] pointer-events-none" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2 shrink-0 w-[160px]">
            <div className="relative">
              <div className="absolute inset-0 bg-[#00F2EA]/40 blur-md group-hover:bg-[#00F2EA]/60 transition-colors" />
              <div className="relative h-6 w-6 rounded-md bg-gradient-to-br from-[#00F2EA] to-[#FF0050] flex items-center justify-center shadow-lg shadow-[#00F2EA]/20">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-black" fill="currentColor">
                  <path d="M16.5 3a5.5 5.5 0 0 0-5.5 5.5v8a3.5 3.5 0 1 1-3.5-3.5c.17 0 .34.01.5.04V10.5a6 6 0 1 0 6 6V8.5a3.5 3.5 0 0 0 2.5-3.35V3z"/>
                </svg>
              </div>
            </div>
            <span className="text-base font-black tracking-tight bg-gradient-to-r from-[#00F2EA] via-white to-[#FF0050] bg-clip-text text-transparent">
              TikWorth
            </span>
          </Link>

          {/* 中间导航 */}
          <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
            <Link href="/tracker" className="group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-neutral-400 hover:text-white transition-colors">
              <BarChart3 className="h-3.5 w-3.5" />
              账号追踪
              <span className="absolute inset-x-2 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-[#00F2EA]/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
            <Link href="/history" className="group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium text-neutral-400 hover:text-white transition-colors">
              <Clock className="h-3.5 w-3.5" />
              评估历史
              <span className="absolute inset-x-2 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-[#00F2EA]/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
          </nav>

          {/* 右侧状态区 */}
          <div className="flex items-center justify-end gap-2 min-w-0 w-[160px] sm:w-auto">
            {/* 支付成功提示 */}
            {paymentSuccess && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-300 animate-fade-in-up">
                <CheckCircle2 className="h-3 w-3" />
                额度已到账
              </div>
            )}

            {/* 加载中 */}
            {balanceLoading && !creditBalance ? (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="hidden sm:inline">查询额度</span>
              </div>
            ) : creditBalance ? (
              <>
                {/* 额度胶囊 */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00F2EA]/40 to-[#FF0050]/30 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-1.5 rounded-full border border-[#00F2EA]/40 bg-[#0a0a0a] px-3 py-1">
                    <Zap className="h-3 w-3 text-[#00F2EA]" fill="#00F2EA" />
                    <span className="text-xs font-bold text-[#00F2EA] tabular-nums">{creditBalance.credits}</span>
                    <span className="text-[10px] text-neutral-500">credits</span>
                  </div>
                </div>

                {/* 用户标识 */}
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
                    aria-label="切换账号"
                  >
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </button>
                </div>

                {/* 移动端切换按钮 */}
                <button
                  onClick={() => { setCreditBalance(null); setActiveEmail(null) }}
                  className="sm:hidden text-neutral-500 hover:text-neutral-300 transition-colors p-1"
                  aria-label="切换账号"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>
      {/* Hero / Tool */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF0050]/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20 relative">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              <span className="gradient-text">TikWorth</span>
            </h1>
            <p className="text-lg text-neutral-400 max-w-xl mx-auto">
              输入一个 TikTok 账号，10 秒内判断这个号值不值得投 / 合作
            </p>
          </div>

          <form onSubmit={onSubmit} className="relative">
            <div className="flex items-center rounded-2xl border border-neutral-700 bg-neutral-900/80 backdrop-blur px-4 py-3 glow-pink focus-within:border-[#FF0050] transition-colors">
              <span className="text-neutral-500 text-lg mr-3">@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="输入 TikTok 用户名"
                aria-label="TikTok 用户名"
                autoComplete="off"
                className="flex-1 bg-transparent text-lg outline-none placeholder:text-neutral-600"
              />
              <button
                type="submit"
                disabled={loading}
                className="ml-3 inline-flex items-center gap-2 rounded-xl bg-[#FF0050] px-5 py-2.5 font-semibold text-white hover:bg-[#d60043] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {loading ? '评估中' : '开始评估'}
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

      {/* Purchase required: 评估需要额度，显示付费墙 */}
      {needPurchase && !result && (
        <section className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-[#FF0050]/30 bg-[#FF0050]/5 p-4 mb-6 text-center">
            <p className="text-sm text-neutral-300">
              评估此账号需要消耗 <span className="text-[#FF0050] font-bold">1 次额度</span>
              <br />
              <span className="text-xs text-neutral-500">购买后立即查看完整评估报告</span>
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
                      Mock 演示数据
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-500">@{result.username}</p>
                {result.bio && (
                  <p className="text-sm text-neutral-400 mt-1 line-clamp-1">{result.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm flex-wrap">
                  <span><span className="font-semibold tabular-nums">{formatNumber(result.followerCount)}</span> <span className="text-neutral-500">粉丝</span></span>
                  <span><span className="font-semibold tabular-nums">{formatNumber(result.followingCount)}</span> <span className="text-neutral-500">关注</span></span>
                  <span><span className="font-semibold tabular-nums">{formatNumber(result.totalLikes)}</span> <span className="text-neutral-500">总点赞</span></span>
                  <span><span className="font-semibold tabular-nums">{result.videoCount}</span> <span className="text-neutral-500">视频</span></span>
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
              <ScoreGauge score={result.score} tier={result.tier} size={100} showLabel />
            </div>

            {/* ===== Layer 1: Business Value Banner (商业价值首屏) ===== */}
            <SectionHeader step="01" title="商业价值评估" icon={<Star className="h-4 w-4" />} />
            <div className="mb-10 rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] to-[#141414] p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row items-start gap-6">
                {/* Left: Dollar Value Hero */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-4 w-4 text-[#FF0050]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">账号估值</span>
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
                解锁查看：<span className="text-neutral-300">5 个收入渠道</span> · <span className="text-neutral-300">8 大商业化方向</span> · <span className="text-neutral-300">趋势分析 + 品牌匹配</span> · <span className="text-neutral-300">12 月收入预测</span>
              </span>
            </div>

            {/* ===== Layer 2: Conclusion Area (评估结论) ===== */}
            <SectionHeader step="02" title="评估结论" icon={<Target className="h-4 w-4" />} />
            <div className="mb-10 rounded-2xl border border-[#00F2EA]/20 bg-gradient-to-br from-[#00F2EA]/5 to-[#FF0050]/5 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-[#FF0050]" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">评估结论</h3>
              </div>
              <div className="text-xl font-bold mb-5">{result.summary.headline}</div>

              <div className="grid gap-6 lg:grid-cols-2 mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">核心优势</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.summary.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                        <span className="mt-0.5 text-green-400">+</span>
                        {s}
                      </li>
                    ))}
                    {result.summary.strengths.length === 0 && (
                      <li className="text-sm text-neutral-500">暂无突出优势</li>
                    )}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">主要短板</span>
                  </div>
                  <ul className="space-y-1.5">
                    {result.summary.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                        <span className="mt-0.5 text-amber-400">-</span>
                        {w}
                      </li>
                    ))}
                    {result.summary.weaknesses.length === 0 && (
                      <li className="text-sm text-neutral-500">无明显短板</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 mb-5">
                <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-[#0f0f0f] p-4">
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-[#00F2EA]" />
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">适合谁用</div>
                    <div className="text-sm text-neutral-200">{result.summary.targetAudience}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-[#0f0f0f] p-4">
                  <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#FF0050]" />
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">最佳行动建议</div>
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
                    <div className="text-sm font-medium text-[#00F2EA]">合作报价参考</div>
                    <div className="mt-1 text-sm text-neutral-300">{result.priceAdvice}</div>
                  </div>
                </div>
              </div>

              {/* Peer highlight hook */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-[#00F2EA]/20 bg-[#00F2EA]/5 px-3 py-2.5">
                  <TrendingUp className="h-4 w-4 shrink-0 text-[#00F2EA]" />
                  <span className="text-xs text-neutral-400">
                    互动率 <span className="text-[#00F2EA] font-semibold">{result.metrics.engagementRate}%</span> 超过 <span className="text-[#00F2EA] font-semibold">{result.peerBenchmark ? Math.round((1 - result.peerBenchmark.percentile / 100) * 100) : '--'}%</span> 同类账号
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[#FF0050]/20 bg-[#FF0050]/5 px-3 py-2.5">
                  <Star className="h-4 w-4 shrink-0 text-[#FF0050]" />
                  <span className="text-xs text-neutral-400">
                    品牌合作价值排名 <span className="text-[#FF0050] font-semibold">Top {result.peerRanking?.tierLabel || '--'}</span>
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
              <SectionHeader step="03" title="收入与增长" icon={<DollarSign className="h-4 w-4" />} />
              <div className="mb-10 space-y-4">
                <IncomeBreakdownSection estimate={result.incomeEstimate} />

                <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-4">
                  {result.monetizationPath.eligiblePrograms.length > 0 ? (
                    <div>
                      <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">已满足变现门槛</div>
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
                      <div className="text-xs text-amber-400 mb-1 uppercase tracking-wider">最近门槛</div>
                      <div className="text-sm text-neutral-300">{result.monetizationPath.nearestThreshold.program} — {result.monetizationPath.nearestThreshold.gap}</div>
                    </div>
                  ) : null}
                </div>

                <RevenueRoadmapSection roadmap={result.revenueRoadmap} />
                <GrowthPlanSection plan={result.growthPlan} />
              </div>

              {/* Section: Radar & Risks */}
              <SectionHeader step="04" title="雷达评分与风险检测" icon={<Shield className="h-4 w-4" />} />
              <div className="mb-10">
                <div className="grid gap-8 lg:grid-cols-2">
                  <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-2">10 维度雷达评分</h3>
                    <RadarChart dimensions={result.dimensions} />
                  </div>
                  <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">风险信号</h3>
                    <RiskList risks={result.riskFlags} />
                  </div>
                </div>
              </div>

              {/* Section: Peer Ranking */}
              <SectionHeader step="05" title="同行对比排名" icon={<BarChart3 className="h-4 w-4" />} />
              <div className="mb-10">
                <PeerRankingSection ranking={result.peerRanking} />
              </div>

              {/* Section: Brand Matching */}
              <SectionHeader step="06" title="品牌合作匹配" icon={<Building2 className="h-4 w-4" />} />
              <div className="mb-10">
                <BrandMatchingSection matching={result.brandMatching} />
              </div>

              {/* Section: Content Strategy */}
              <SectionHeader step="07" title="内容策略指南" icon={<Lightbulb className="h-4 w-4" />} />
              <div className="mb-10">
                <ContentStrategySection strategy={result.contentStrategy} />
              </div>

              {/* Section: Trend Analysis */}
              <SectionHeader step="08" title="趋势分析" icon={<TrendingUp className="h-4 w-4" />} />
              <div className="mb-10">
                <TrendAnalysisSection trendAnalysis={result.trendAnalysis} />
              </div>

              {/* Section: Commercialization Advice */}
              <SectionHeader step="09" title="商业化方向建议" icon={<DollarSign className="h-4 w-4" />} />
              <div className="mb-10">
                <CommercializationSection advice={result.commercializationAdvice} />
              </div>

              {/* Section: Deep Analysis */}
              <DeepAnalysisSection result={result} />
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-500">
              <span>评估时间：{new Date(result.computedAt).toLocaleString('zh-CN')}</span>
              <span>数据来源第三方 API / Mock，仅供参考，不构成投资或合作建议</span>
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
                导出报告
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
                    导出 PNG 图片
                  </button>
                  <button
                    onClick={handleExportPdf}
                    role="menuitem"
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-300 hover:bg-neutral-800 transition-colors border-t border-neutral-800"
                  >
                    <FileText className="h-4 w-4 text-[#00F2EA]" />
                    导出 PDF 报告
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
              {isSaved ? '已保存到追踪' : '保存到追踪'}
            </button>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-medium hover:border-[#FF0050] hover:text-[#FF0050] transition-colors"
            >
              <History className="h-4 w-4" />
              评估历史
            </Link>
          </div>
        </section>
      )}

      {/* Empty state features */}
      {!result && !loading && (
        <section className="mx-auto max-w-5xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-2">
            <FeatureCard
              icon={<Users className="h-6 w-6 text-[#FF0050]" />}
              title="投前尽调"
              desc="买粉号、僵尸号、掉权重号一眼识别，降低红人合作踩坑概率。"
            />
            <FeatureCard
              icon={<TrendingUp className="h-6 w-6 text-[#00F2EA]" />}
              title="多维评估"
              desc="10 维度雷达评分 + 0-100 总分，从流量触达到品牌潜力全面拆解。"
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6 text-[#FF0050]" />}
              title="合作建议"
              desc="按 S/A/B/C/D 等级直接给出谈价、压价或放弃建议。"
            />

            {/* Demo Preview Card */}
            <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6 hover:border-neutral-700 transition-colors flex flex-col">
              <p className="text-sm text-neutral-500 mb-4">示例账号评估预览</p>

              <div className="mb-4">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-[#00F2EA]">$12K - $45K</span>
              </div>

              <div className="flex items-center gap-2 mb-5">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-green-500/20 text-green-400 font-bold text-sm">A</span>
                <span className="text-sm text-green-400 font-medium">A 级账号</span>
              </div>

              <div className="space-y-2.5 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">互动率</span>
                  <span className="font-semibold tabular-nums">4.2%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">粉丝数</span>
                  <span className="font-semibold tabular-nums">2.5M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">内容分类</span>
                  <span className="font-semibold">娱乐 / 舞蹈</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { setUsername('charlidamelio'); handleEvaluate('charlidamelio') }}
                className="mt-auto w-full rounded-xl bg-[#FF0050] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#d60043] transition-colors"
              >
                免费评估你的账号
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-[#0a0a0a] py-6">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-neutral-600">
          TikWorth v{APP_VERSION}
        </div>
      </footer>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </main>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6 hover:border-neutral-700 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-neutral-400 leading-relaxed">{desc}</p>
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

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  )
}