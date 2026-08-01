'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Lock, DollarSign, TrendingUp, Target, Shield, BarChart3,
  Building2, Lightbulb, Flame, Rocket, FileDown, Check, Mail,
  KeyRound, ArrowRight, Loader2, Sparkles, Users, CheckCircle2,
  Zap, Star, Clock, RefreshCw,
} from 'lucide-react'
import type { Evaluation } from '@/types'
import type { CreditBalance, CreditPackage } from '@/lib/credits'
import { CREDIT_PACKAGES } from '@/lib/credits'
import {
  getActiveEmail, setActiveEmail, setPendingEmail, clearPendingEmail, fetchBalance,
  setSessionToken,
} from '@/lib/credits-client'

interface PaidWallProps {
  onUnlock: () => void
  result?: Evaluation | null
  /** If user already has credits, show direct unlock button */
  existingBalance?: CreditBalance | null
  /** Loading state for unlock action */
  isUnlocking?: boolean
  /** Loading state for initial balance fetch */
  balanceLoading?: boolean
}

type Step = 'choose' | 'email' | 'code' | 'success'

const UNLOCK_MODULES = [
  { icon: DollarSign,   color: 'text-[#FF0050]', bg: 'bg-[#FF0050]/10', title: '5 渠道收入估算', desc: '品牌合作/直播/创作者基金/联盟/商品分成' },
  { icon: TrendingUp,   color: 'text-[#00F2EA]', bg: 'bg-[#00F2EA]/10', title: '12 个月收入路线图', desc: '按季度预测粉丝/播放/收入增长曲线' },
  { icon: Target,       color: 'text-[#FF0050]', bg: 'bg-[#FF0050]/10', title: '增长行动计划',     desc: '粉丝/播放/互动三维可执行建议' },
  { icon: Shield,       color: 'text-[#00F2EA]', bg: 'bg-[#00F2EA]/10', title: '10 维雷达风险检测', desc: '异常涨粉/数据造假/断更/限流预警' },
  { icon: BarChart3,    color: 'text-[#FF0050]', bg: 'bg-[#FF0050]/10', title: '同行百分位排名',   desc: '在同量级账号中的百分位与差距' },
  { icon: Building2,    color: 'text-[#00F2EA]', bg: 'bg-[#00F2EA]/10', title: '品牌合作匹配',     desc: '适合合作的品牌类型+合作建议' },
  { icon: Lightbulb,    color: 'text-[#FF0050]', bg: 'bg-[#FF0050]/10', title: '内容策略指南',     desc: '支柱方向/话题标签/最佳发布时间' },
  { icon: Flame,        color: 'text-[#00F2EA]', bg: 'bg-[#00F2EA]/10', title: '趋势热点分析',     desc: '相关话题热度+账号适配度' },
  { icon: Rocket,       color: 'text-[#FF0050]', bg: 'bg-[#FF0050]/10', title: '商业化方向建议',   desc: '3 条变现路径+优先级排序' },
  { icon: FileDown,     color: 'text-[#00F2EA]', bg: 'bg-[#00F2EA]/10', title: '高清 PDF 导出',    desc: '完整版可分享商业分析报告' },
]

export function PaidWall({ onUnlock, result, existingBalance, isUnlocking, balanceLoading }: PaidWallProps) {
  const [step, setStep] = useState<Step>('choose')
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage>(CREDIT_PACKAGES[1])
  const [email, setEmail] = useState('')
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [devCode, setDevCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [successBalance, setSuccessBalance] = useState<number | null>(null)
  const [balance, setBalance] = useState<CreditBalance | null>(existingBalance || null)
  const codeRefs = useRef<(HTMLInputElement | null)[]>([])
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const username = result?.username || ''

  // Init: if no existingBalance passed, try to fetch from API
  useEffect(() => {
    if (existingBalance) {
      setBalance(existingBalance)
      return
    }
    const activeEmail = getActiveEmail()
    if (activeEmail) {
      fetchBalance(activeEmail).then(b => { if (b) setBalance(b) })
    }
  }, [existingBalance])

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current)
    }
  }, [])

  // Focus first code input when entering code step
  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => codeRefs.current[0]?.focus(), 100)
    }
  }, [step])

  function startCooldown() {
    setCooldown(60)
    if (cooldownTimer.current) clearInterval(cooldownTimer.current)
    cooldownTimer.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) {
          if (cooldownTimer.current) clearInterval(cooldownTimer.current)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  async function handleSendCode(e?: React.FormEvent) {
    e?.preventDefault()
    if (loading) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), packageId: selectedPkg.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '发送失败')
      setDevCode(data.devCode || null)
      setPendingEmail(email.trim(), selectedPkg.id)
      setStep('code')
      startCooldown()
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (cooldown > 0 || loading) return
    await handleSendCode()
  }

  async function handleVerify() {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('请输入完整的 6 位验证码')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: fullCode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '验证失败')

      clearPendingEmail()
      setActiveEmail(email.trim())
      if (data.token) setSessionToken(data.token)

      if (data.requiresPayment && data.checkoutUrl) {
        window.location.href = data.checkoutUrl
        return
      }

      setBalance({
        email: email.trim(),
        credits: data.balance,
        totalPurchased: data.granted,
        verifiedAt: Date.now(),
        purchases: [],
      })
      setSuccessBalance(data.balance)
      setStep('success')
      // auto-unlock after a brief moment
      setTimeout(() => {
        onUnlock()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证失败')
      setCode(['', '', '', '', '', ''])
      setTimeout(() => codeRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }

  function handleCodeChange(idx: number, value: string) {
    const v = value.replace(/\D/g, '').slice(-1)
    const newCode = [...code]
    newCode[idx] = v
    setCode(newCode)
    setError('')
    if (v && idx < 5) {
      codeRefs.current[idx + 1]?.focus()
    }
    if (newCode.every(c => c !== '')) {
      setTimeout(() => handleVerify(), 100)
    }
  }

  function handleCodeKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      codeRefs.current[idx - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      e.preventDefault()
      const chars = pasted.split('')
      setCode(chars)
      setTimeout(() => handleVerify(), 100)
    }
  }

  function handleDirectUnlock() {
    // User has credits, directly proceed to unlock (parent will call consume API)
    onUnlock()
  }

  return (
    <div className="relative rounded-3xl border border-neutral-800 bg-[#0a0a0a] overflow-hidden bg-mesh-gradient-strong isolate animate-fade-in-up">
      {/* 顶部光斑装饰 */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[500px] h-48 bg-[#FF0050]/15 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 w-72 h-72 bg-[#00F2EA]/10 rounded-full blur-3xl" />

      <div className="relative px-6 sm:px-10 pt-8 pb-10">
        {/* ── 标题区 ── */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 mb-3">
            <Lock className="h-3.5 w-3.5 text-[#FF0050]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">深度分析已锁定</span>
            <Lock className="h-3.5 w-3.5 text-[#FF0050]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            解锁 <span className="text-[#FF0050]">@{username || '此账号'}</span> 的完整商业价值报告
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            付费后可查看以下 <span className="text-white font-semibold">10 大核心模块</span>，数据即时生成，支持 PDF 导出
          </p>
          {balanceLoading && !balance && step === 'choose' && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-neutral-700 bg-neutral-900/50 px-3 py-1 text-xs">
              <Loader2 className="h-3 w-3 animate-spin text-neutral-400" />
              <span className="text-neutral-400">正在查询额度...</span>
            </div>
          )}
          {balance && balance.credits > 0 && step === 'choose' && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#00F2EA]/30 bg-[#00F2EA]/5 px-3 py-1 text-xs">
              <Sparkles className="h-3 w-3 text-[#00F2EA]" />
              <span className="text-[#00F2EA] font-semibold">
                当前剩余 {balance.credits} 次额度（{balance.email}）
              </span>
            </div>
          )}
        </div>

        {/* ── 10 大模块网格 ── */}
        <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {UNLOCK_MODULES.map((m, i) => {
            const Icon = m.icon
            return (
              <div key={i} className="group relative rounded-xl border border-neutral-800 bg-[#111] p-3 transition-all hover:border-neutral-700 hover:bg-[#151515]">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${m.bg} mb-2`}>
                  <Icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <div className="text-xs font-semibold text-white leading-tight">{m.title}</div>
                <div className="mt-1 text-[10px] text-neutral-500 leading-snug line-clamp-2">{m.desc}</div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Lock className="h-3 w-3 text-neutral-600" />
                </div>
              </div>
            )
          })}
        </div>

        {/* ── 信任背书 ── */}
        <div className="mt-6 flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-[11px] text-neutral-500">
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3 text-[#00F2EA]" />
            <span><span className="text-[#00F2EA] font-semibold">1,247</span> 位创作者已解锁</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-[#FF0050]" />
            <span>即时生成 · 无需等待</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 text-[#00F2EA]" />
            <span>额度永不过期 · 邮箱绑定可跨设备</span>
          </div>
        </div>

        {/* ── 步骤分隔符 ── */}
        {step !== 'choose' && (
          <div className="mt-6 flex items-center gap-3 text-[11px] text-neutral-500">
            <div className="flex-1 h-px bg-neutral-800" />
            <div className="flex items-center gap-1.5">
              {step === 'email' && <Mail className="h-3.5 w-3.5 text-[#FF0050]" />}
              {step === 'code' && <KeyRound className="h-3.5 w-3.5 text-[#FF0050]" />}
              {step === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-[#00F2EA]" />}
              <span>
                {step === 'email' && '通过邮箱绑定您的额度'}
                {step === 'code' && '请查收邮件验证码'}
                {step === 'success' && '解锁成功'}
              </span>
            </div>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>
        )}

        {/* ── 选择套餐 / 直接解锁 ── */}
        {step === 'choose' && (
          <>
            {/* 如果已有积分，显示直接解锁按钮 */}
            {balance && balance.credits > 0 ? (
              <div className="mt-6">
                <div className="rounded-2xl border border-[#00F2EA]/30 bg-[#00F2EA]/5 p-5 text-center">
                  <div className="text-sm text-neutral-400 mb-2">您的账户已有额度，可直接解锁本次报告</div>
                  <button
                    onClick={handleDirectUnlock}
                    disabled={isUnlocking}
                    className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#00F2EA] to-[#66f7f3] py-4 text-base font-bold text-black shadow-lg shadow-[#00F2EA]/30 transition-all hover:shadow-xl hover:shadow-[#00F2EA]/40 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isUnlocking ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          正在解锁...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4" />
                          使用 1 次额度解锁完整报告（剩余 {balance.credits} 次）
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </button>
                  <button
                    onClick={() => { setBalance(null); setActiveEmail(null) }}
                    className="mt-3 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    使用其他邮箱购买新额度
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6">
                  <div className="text-center mb-4">
                    <div className="text-xs font-semibold text-white">选择适合您的评估套餐</div>
                    <div className="text-[10px] text-neutral-500 mt-1">一次付费，永久有效 · 不自动续费 · 邮箱绑定可跨设备找回</div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {CREDIT_PACKAGES.map(pkg => {
                      const isSelected = selectedPkg.id === pkg.id
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => setSelectedPkg(pkg)}
                          className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                            isSelected
                              ? 'border-[#FF0050] bg-[#FF0050]/5 shadow-lg shadow-[#FF0050]/10'
                              : 'border-neutral-800 bg-[#111] hover:border-neutral-700'
                          }`}
                        >
                          {pkg.badge && (
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FF0050] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-[#FF0050]/30">
                                <Star className="h-2.5 w-2.5" />
                                {pkg.badge}
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs text-neutral-400 align-top">$</span>
                            <span className={`text-3xl font-black ${isSelected ? 'text-white' : 'text-neutral-200'}`}>{pkg.price}</span>
                          </div>
                          <div className="mt-1 text-sm font-bold text-white">{pkg.label}</div>
                          <div className="mt-0.5 text-[11px] text-neutral-500">{pkg.credits} 次评估 · {pkg.perUnit}</div>
                          <div className="mt-3 space-y-1">
                            {(pkg.id === 'pack3' ? ['3 次完整账号评估', '含 10 大模块全部分析', 'PDF 高清导出'] :
                              pkg.id === 'pack10' ? ['10 次完整账号评估', '支持跨设备找回额度', 'PDF 高清导出', '优先客服支持'] :
                              ['100 次完整账号评估', '跨设备同步额度', 'PDF 高清导出', '优先体验新功能 + 客服']
                            ).map((f, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px] text-neutral-400">
                                <Check className={`h-3 w-3 mt-0.5 flex-shrink-0 ${isSelected ? 'text-[#00F2EA]' : 'text-neutral-600'}`} />
                                <span>{f}</span>
                              </div>
                            ))}
                          </div>
                          {isSelected && (
                            <div className="mt-3 flex items-center justify-center gap-1 rounded-lg bg-[#FF0050] py-2 text-xs font-bold text-white">
                              <span>已选择</span>
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <button
                  onClick={() => setStep('email')}
                  className="mt-5 w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#FF0050] to-[#ff2d6a] py-4 text-base font-bold text-white shadow-lg shadow-[#FF0050]/30 transition-all hover:shadow-xl hover:shadow-[#FF0050]/40 active:scale-[0.99]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Zap className="h-4 w-4" />
                    ${selectedPkg.price} 解锁 {selectedPkg.credits} 次完整报告
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
              </>
            )}
          </>
        )}

        {/* ── 输入邮箱 ── */}
        {step === 'email' && (
          <form onSubmit={handleSendCode} className="mt-6 max-w-md mx-auto">
            <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#FF0050]/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-[#FF0050]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">输入您的邮箱</div>
                  <div className="text-[11px] text-neutral-500">用于绑定额度，换设备时可通过邮箱验证码找回</div>
                </div>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-neutral-700 bg-[#0a0a0a] px-4 py-3 pr-12 text-sm text-white placeholder-neutral-600 outline-none focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20 transition-colors"
                  autoFocus
                />
                {email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#00F2EA]" />
                )}
              </div>
              {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF0050] py-3 text-sm font-bold text-white hover:bg-[#e60049] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><KeyRound className="h-4 w-4" />发送验证码</>}
              </button>
              <button
                type="button"
                onClick={() => { setStep('choose'); setError(''); }}
                className="mt-2 w-full text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                ← 返回选择套餐
              </button>
            </div>
            <div className="mt-3 flex items-start gap-2 text-[10px] text-neutral-500">
              <Clock className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>验证码 10 分钟内有效，我们不会发送营销邮件，仅用于额度绑定。<strong className="text-neutral-400">开发阶段：验证码将直接显示在界面上，无需实际查收邮件。</strong></span>
            </div>
          </form>
        )}

        {/* ── 输入验证码 ── */}
        {step === 'code' && (
          <div className="mt-6 max-w-md mx-auto">
            <div className="rounded-2xl border border-neutral-800 bg-[#111] p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#00F2EA]/10 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="h-5 w-5 text-[#00F2EA]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">输入验证码</div>
                  <div className="text-[11px] text-neutral-500 truncate">已发送到 <span className="text-[#00F2EA]">{email}</span></div>
                </div>
              </div>

              {devCode && (
                <div className="mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-[11px] text-yellow-300">
                  <span className="font-semibold">开发模式：</span>验证码 <code className="font-mono font-bold bg-yellow-500/20 px-1.5 py-0.5 rounded ml-1">{devCode}</code>（生产环境会发送到您的邮箱）
                </div>
              )}

              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {code.map((c, i) => (
                  <input
                    key={i}
                    ref={el => { codeRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={c}
                    aria-label={`验证码第${i + 1}位`}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    className="w-11 h-12 sm:w-12 sm:h-14 rounded-xl border border-neutral-700 bg-[#0a0a0a] text-center text-xl sm:text-2xl font-black text-white outline-none focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20 transition-colors"
                  />
                ))}
              </div>

              {error && <div className="mt-3 text-center text-xs text-red-400">{error}</div>}

              <button
                onClick={handleVerify}
                disabled={loading || code.some(c => !c)}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF0050] py-3 text-sm font-bold text-white hover:bg-[#e60049] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" />验证并解锁</>}
              </button>

              <div className="mt-3 flex items-center justify-between text-xs">
                <button
                  onClick={() => { setStep('email'); setCode(['', '', '', '', '', '']); setError('') }}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  ← 修改邮箱
                </button>
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className="text-[#00F2EA] hover:text-[#00dccb] disabled:text-neutral-600 disabled:cursor-not-allowed transition-colors"
                >
                  {cooldown > 0 ? `${cooldown}s 后重发` : '重新发送验证码'}
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-neutral-900/50 px-4 py-2.5 text-[11px] text-neutral-500 text-center">
              <span className="text-neutral-400">本次购买：</span>
              <span className="text-white font-semibold">{selectedPkg.label}</span> · ${selectedPkg.price} · {selectedPkg.credits} 次评估
            </div>
          </div>
        )}

        {/* ── 成功态 ── */}
        {step === 'success' && (
          <div className="mt-6 max-w-md mx-auto">
            <div className="rounded-2xl border border-[#00F2EA]/40 bg-[#00F2EA]/5 p-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-[#00F2EA]/20 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-8 w-8 text-[#00F2EA]" />
              </div>
              <div className="text-lg font-bold text-white">解锁成功！</div>
              <div className="mt-1 text-sm text-neutral-400">
                {successBalance !== null && <>您的邮箱 <span className="text-[#00F2EA]">{email}</span> 已绑定，当前剩余 <span className="text-white font-semibold">{successBalance}</span> 次额度</>}
              </div>
              <div className="mt-3 text-xs text-neutral-500">正在为您加载完整报告...</div>
            </div>
          </div>
        )}

        {/* ── 底部保障 ── */}
        {step === 'choose' && !(balance && balance.credits > 0) && (
          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] text-neutral-600">
            <span>🔒 邮箱绑定额度</span>
            <span>📧 无需注册 · 验证码即登录</span>
            <span>❌ 不自动续费</span>
            <span>💻 跨设备可找回</span>
          </div>
        )}
      </div>
    </div>
  )
}
