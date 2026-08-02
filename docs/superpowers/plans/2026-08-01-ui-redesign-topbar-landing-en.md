# UI Redesign: Topbar + Landing + Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Topbar with glassmorphism + email verification entry, rebuild landing page as immersive English narrative, create standalone VerifyEmailModal with 4-step payment flow.

**Architecture:** New `VerifyEmailModal` and `ParticleBackground` components; `app/page.tsx` gains 5 new landing sections between Hero and result area; all user-facing copy switches from Chinese to English across ~15 files. No API/backend changes.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Lucide Icons, canvas API (particles)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `components/ParticleBackground.tsx` | Canvas particle animation for Hero background |
| `components/VerifyEmailModal.tsx` | 4-step modal: choose package → email → code → success |
| `app/layout.tsx` | Root layout: lang="en", English metadata |
| `app/page.tsx` | Topbar + Hero + 5 landing sections + result display |
| `lib/tier.ts` | English tier labels |
| `components/PaidWall.tsx` | English UNLOCK_MODULES + copy |
| `components/SectionHeader.tsx` | No changes needed (no hardcoded text) |
| `components/ScoreGauge.tsx` | Update aria-label to English |
| `components/RiskList.tsx` | Update "未检测到明显风险信号" to English |
| `components/DeepAnalysisSection.tsx` | Update button text to English |
| `components/sections/*.tsx` | English titles/labels (10 files) |
| `app/globals.css` | New modal + particle animations |

---

### Task 1: Create ParticleBackground Component

**Files:**
- Create: `components/ParticleBackground.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; color: string; alpha: number
}

const COLORS = ['#00F2EA', '#FF0050', '#ffffff', '#66f7f3', '#ff6b8a']
const PARTICLE_COUNT = 200

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let particles: Particle[] = []
    let animationId: number
    let w = 0, h = 0

    function resize() {
      w = canvas!.width = canvas!.offsetWidth
      h = canvas!.height = canvas!.offsetHeight
    }

    function initParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.5 + 0.1,
      }))
    }

    function animate() {
      ctx!.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = p.color
        ctx!.globalAlpha = p.alpha
        ctx!.fill()
      }
      ctx!.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }

    resize()
    initParticles()
    animate()
    window.addEventListener('resize', () => { resize(); initParticles() })

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  )
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/ParticleBackground.tsx
git commit -m "feat: add ParticleBackground canvas component"
```

---

### Task 2: Create VerifyEmailModal Component

**Files:**
- Create: `components/VerifyEmailModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X, Mail, KeyRound, CheckCircle2, Loader2, Sparkles,
  Zap, ArrowRight, Check, Star, Clock,
} from 'lucide-react'
import type { CreditBalance, CreditPackage } from '@/lib/credits'
import { CREDIT_PACKAGES } from '@/lib/credits'
import {
  getActiveEmail, setActiveEmail, setPendingEmail, clearPendingEmail,
  fetchBalance, setSessionToken,
} from '@/lib/credits-client'

type Step = 'choose' | 'email' | 'code' | 'success'

interface VerifyEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onUnlock: () => void
  existingBalance?: CreditBalance | null
}

export function VerifyEmailModal({ isOpen, onClose, onUnlock, existingBalance }: VerifyEmailModalProps) {
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
  const modalRef = useRef<HTMLDivElement>(null)

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('choose')
      setError('')
      setCode(['', '', '', '', '', ''])
      setBalance(existingBalance || null)
      const activeEmail = getActiveEmail()
      if (activeEmail && !existingBalance) {
        fetchBalance(activeEmail).then(b => { if (b) setBalance(b) })
      }
    }
  }, [isOpen, existingBalance])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Focus first code input
  useEffect(() => {
    if (step === 'code') setTimeout(() => codeRefs.current[0]?.focus(), 100)
  }, [step])

  useEffect(() => {
    return () => { if (cooldownTimer.current) clearInterval(cooldownTimer.current) }
  }, [])

  function startCooldown() {
    setCooldown(60)
    if (cooldownTimer.current) clearInterval(cooldownTimer.current)
    cooldownTimer.current = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { if (cooldownTimer.current) clearInterval(cooldownTimer.current); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleSendCode(e?: React.FormEvent) {
    e?.preventDefault()
    if (loading) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
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
      if (!res.ok) throw new Error(data.error || 'Failed to send code')
      setDevCode(data.devCode || null)
      setPendingEmail(email.trim(), selectedPkg.id)
      setStep('code')
      startCooldown()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code')
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
      setError('Please enter the complete 6-digit code')
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
      if (!res.ok) throw new Error(data.error || 'Verification failed')

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
      setTimeout(() => {
        onClose()
        onUnlock()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
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
    if (v && idx < 5) codeRefs.current[idx + 1]?.focus()
    if (newCode.every(c => c !== '')) setTimeout(() => handleVerify(), 100)
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
      setCode(pasted.split(''))
      setTimeout(() => handleVerify(), 100)
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-[#0a0a0a] shadow-2xl shadow-black/50 animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Verify your email to unlock"
      >
        {/* Top glow */}
        <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-[300px] h-32 bg-[#FF0050]/10 rounded-full blur-3xl" />

        <div className="relative p-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 rounded-lg p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Step 1: Choose Package */}
          {step === 'choose' && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-white">Unlock Full Report</h2>
                <p className="mt-1 text-sm text-neutral-400">Choose a package to get started</p>
              </div>

              {/* Existing balance prompt */}
              {balance && balance.credits > 0 && (
                <div className="mb-4 rounded-xl border border-[#00F2EA]/30 bg-[#00F2EA]/5 p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-sm text-[#00F2EA]">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold">{balance.credits} credits available ({balance.email})</span>
                  </div>
                  <button
                    onClick={() => { onClose(); onUnlock() }}
                    className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#00F2EA] to-[#66f7f3] py-2.5 text-sm font-bold text-black hover:shadow-lg hover:shadow-[#00F2EA]/30 transition-all"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4" />
                      Use 1 Credit to Unlock
                    </span>
                  </button>
                  <button
                    onClick={() => setBalance(null)}
                    className="mt-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    Use a different email
                  </button>
                </div>
              )}

              {/* Package cards */}
              {(!balance || balance.credits === 0) && (
                <>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {CREDIT_PACKAGES.map(pkg => {
                      const isSelected = selectedPkg.id === pkg.id
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => setSelectedPkg(pkg)}
                          className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                            isSelected
                              ? 'border-[#FF0050] bg-[#FF0050]/5 shadow-lg shadow-[#FF0050]/10'
                              : 'border-neutral-800 bg-[#111] hover:border-neutral-700'
                          }`}
                        >
                          {pkg.badge && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#FF0050] px-2 py-0.5 text-[9px] font-bold text-white">
                                <Star className="h-2 w-2" />
                                {pkg.badge}
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-0.5">
                            <span className="text-[10px] text-neutral-400">$</span>
                            <span className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-neutral-200'}`}>{pkg.price}</span>
                          </div>
                          <div className="mt-0.5 text-xs font-bold text-white">{pkg.label}</div>
                          <div className="text-[10px] text-neutral-500">{pkg.credits} evals</div>
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setStep('email')}
                    className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#FF0050] to-[#ff2d6a] py-3 text-sm font-bold text-white shadow-lg shadow-[#FF0050]/20 hover:shadow-xl hover:shadow-[#FF0050]/30 transition-all"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Continue with Email
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  </button>
                </>
              )}
            </>
          )}

          {/* Step 2: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendCode}>
              <div className="text-center mb-5">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#FF0050]/10 flex items-center justify-center mb-3">
                  <Mail className="h-6 w-6 text-[#FF0050]" />
                </div>
                <h2 className="text-xl font-bold text-white">Verify Your Email</h2>
                <p className="mt-1 text-sm text-neutral-400">Enter your email to bind your credits</p>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="your@email.com"
                  className="w-full rounded-xl border border-neutral-700 bg-[#111] px-4 py-3 pr-12 text-sm text-white placeholder-neutral-600 outline-none focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20 transition-colors"
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
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><KeyRound className="h-4 w-4" />Send Verification Code</>}
              </button>
              <p className="mt-3 text-center text-xs text-neutral-500">No registration needed. Code-only login.</p>
              <button
                type="button"
                onClick={() => { setStep('choose'); setError('') }}
                className="mt-2 w-full text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
              >
                ← Back to packages
              </button>
            </form>
          )}

          {/* Step 3: Code */}
          {step === 'code' && (
            <div>
              <div className="text-center mb-5">
                <div className="mx-auto w-12 h-12 rounded-full bg-[#00F2EA]/10 flex items-center justify-center mb-3">
                  <KeyRound className="h-6 w-6 text-[#00F2EA]" />
                </div>
                <h2 className="text-xl font-bold text-white">Enter Code</h2>
                <p className="mt-1 text-sm text-neutral-400">
                  Sent to <span className="text-[#00F2EA]">{email}</span>
                </p>
              </div>

              {devCode && (
                <div className="mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-3 py-2 text-[11px] text-yellow-300 text-center">
                  <span className="font-semibold">DEV:</span> Code <code className="font-mono font-bold bg-yellow-500/20 px-1.5 py-0.5 rounded ml-1">{devCode}</code>
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
                    aria-label={`Digit ${i + 1}`}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    className="w-11 h-12 sm:w-12 sm:h-14 rounded-xl border border-neutral-700 bg-[#111] text-center text-xl font-black text-white outline-none focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20 transition-colors"
                  />
                ))}
              </div>

              {error && <div className="mt-3 text-center text-xs text-red-400">{error}</div>}

              <button
                onClick={handleVerify}
                disabled={loading || code.some(c => !c)}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-[#FF0050] py-3 text-sm font-bold text-white hover:bg-[#e60049] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" />Verify & Unlock</>}
              </button>

              <div className="mt-3 flex items-center justify-between text-xs">
                <button
                  onClick={() => { setStep('email'); setCode(['', '', '', '', '', '']); setError('') }}
                  className="text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  ← Change email
                </button>
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || loading}
                  className="text-[#00F2EA] hover:text-[#00dccb] disabled:text-neutral-600 disabled:cursor-not-allowed transition-colors"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>

              <div className="mt-3 rounded-lg bg-neutral-900/50 px-3 py-2 text-center text-[11px] text-neutral-500">
                Package: <span className="text-white font-semibold">{selectedPkg.label}</span> · ${selectedPkg.price} · {selectedPkg.credits} evals
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#00F2EA]/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-9 w-9 text-[#00F2EA]" />
              </div>
              <h2 className="text-xl font-bold text-white">Unlock Successful!</h2>
              <p className="mt-2 text-sm text-neutral-400">
                <span className="text-[#00F2EA]">{email}</span> has{' '}
                <span className="text-white font-semibold">{successBalance}</span> credits remaining
              </p>
              <p className="mt-3 text-xs text-neutral-500">Auto-closing...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/VerifyEmailModal.tsx
git commit -m "feat: add VerifyEmailModal with 4-step payment flow"
```

---

### Task 3: Update app/layout.tsx (English)

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update lang and metadata**

Change `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tikworth.com'),
  title: "TikWorth - TikTok Account Business Valuation",
  description: "Enter a TikTok username, get a professional valuation in 10 seconds. S/A/B/C/D/E/F tier rating, 10-dimension analysis, risk detection, and brand matching.",
  openGraph: {
    title: "TikWorth - TikTok Account Business Valuation",
    description: "Enter a TikTok username, get a professional valuation in 10 seconds.",
    type: 'website',
    locale: 'en_US',
    siteName: 'TikWorth',
  },
  twitter: {
    card: 'summary_large_image',
    title: "TikWorth - TikTok Account Business Valuation",
    description: "Enter a TikTok username, get a professional valuation in 10 seconds.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0a0a0a] text-neutral-100 min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: switch layout to English (lang + metadata)"
```

---

### Task 4: Update lib/tier.ts (English Labels)

**Files:**
- Modify: `lib/tier.ts`

- [ ] **Step 1: Update TIER_LABELS to English**

Change `lib/tier.ts` TIER_LABELS:

```ts
export const TIER_LABELS: Record<string, string> = {
  S: 'Top Tier · Premium Collaboration',
  A: 'High Quality · Recommended',
  B: 'Qualified · Negotiable',
  C: 'Average · Room to Grow',
  D: 'Problematic · Not Recommended',
  E: 'High Risk · Authenticity Doubtful',
  F: 'Avoid · Severe Quality Issues',
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/tier.ts
git commit -m "feat: switch tier labels to English"
```

---

### Task 5: Rewrite app/page.tsx (Topbar + Landing + English)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update imports to add new components**

Add to imports:
```tsx
import { ParticleBackground } from '@/components/ParticleBackground'
import { VerifyEmailModal } from '@/components/VerifyEmailModal'
```

- [ ] **Step 2: Replace Topbar (lines 230-325)**

Replace the entire `<header>` block with:

```tsx
{/* TopBar */}
<header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl">
  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#00F2EA]/40 to-transparent" />
  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-[#00F2EA]/[0.03] pointer-events-none" />
  <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center gap-4">
    {/* Logo */}
    <Link href="/" className="group flex items-center gap-2 shrink-0 w-[160px]">
      <div className="relative">
        <div className="absolute inset-0 bg-[#00F2EA]/40 blur-md group-hover:bg-[#00F2EA]/60 transition-colors" />
        <div className="relative h-7 w-7 rounded-md bg-gradient-to-br from-[#00F2EA] to-[#FF0050] flex items-center justify-center shadow-lg shadow-[#00F2EA]/20">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-black" fill="currentColor">
            <path d="M16.5 3a5.5 5.5 0 0 0-5.5 5.5v8a3.5 3.5 0 1 1-3.5-3.5c.17 0 .34.01.5.04V10.5a6 6 0 1 0 6 6V8.5a3.5 3.5 0 0 0 2.5-3.35V3z"/>
          </svg>
        </div>
      </div>
      <span className="text-lg font-black tracking-tight bg-gradient-to-r from-[#00F2EA] via-white to-[#FF0050] bg-clip-text text-transparent">
        TikWorth
      </span>
    </Link>

    {/* Navigation */}
    <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
      {[
        { label: 'Tracker', href: '/tracker', icon: BarChart3 },
        { label: 'History', href: '/history', icon: Clock },
        { label: 'Pricing', href: '#pricing', icon: Zap },
        { label: 'How It Works', href: '#capabilities', icon: Lightbulb },
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
          Credits added
        </div>
      )}

      {balanceLoading && !creditBalance ? (
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="hidden sm:inline">Loading</span>
        </div>
      ) : creditBalance ? (
        <>
          {/* Credit badge */}
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00F2EA]/40 to-[#FF0050]/30 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-1.5 rounded-full border border-[#00F2EA]/40 bg-[#0a0a0a] px-3 py-1">
              <Zap className="h-3 w-3 text-[#00F2EA]" fill="#00F2EA" />
              <span className="text-xs font-bold text-[#00F2EA] tabular-nums">{creditBalance.credits}</span>
              <span className="text-[10px] text-neutral-500">credits</span>
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
              aria-label="Switch account"
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
            Verify Email
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
        </button>
      )}
    </div>
  </div>
</header>
```

- [ ] **Step 3: Add VerifyEmailModal state**

Add after existing state declarations:
```tsx
const [showVerifyModal, setShowVerifyModal] = useState(false)
```

- [ ] **Step 4: Replace Hero section (lines 327-381)**

```tsx
{/* Hero / Tool */}
<section className="relative overflow-hidden border-b border-neutral-800">
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF0050]/10 via-transparent to-transparent" />
  <ParticleBackground />
  <div className="mx-auto max-w-3xl px-4 py-20 sm:py-24 relative">
    <div className="text-center mb-8">
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
        How Much Is Any <span className="gradient-text">TikTok</span> Account Worth?
      </h1>
      <p className="text-lg text-neutral-400 max-w-xl mx-auto">
        Enter a username, get a professional valuation in 10 seconds.
      </p>
    </div>
    {/* Search form - keep existing logic */}
    <form onSubmit={onSubmit} className="relative">
      <div className="flex items-center rounded-2xl border border-neutral-700 bg-neutral-900/80 backdrop-blur px-4 py-3 glow-pink focus-within:border-[#FF0050] transition-colors">
        <span className="text-neutral-500 text-lg mr-3">@</span>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="Enter TikTok username"
          aria-label="TikTok username"
          autoComplete="off"
          className="flex-1 bg-transparent text-lg outline-none placeholder:text-neutral-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="ml-3 inline-flex items-center gap-2 rounded-xl bg-[#FF0050] px-5 py-2.5 font-semibold text-white hover:bg-[#d60043] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Analyzing...' : 'Evaluate'}
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
```

- [ ] **Step 5: Add landing sections between Hero and result area**

Insert after the Hero section, before the `{needPurchase && !result && (` block:

```tsx
{/* Landing Page Sections (shown when no result) */}
{!result && !loading && !needPurchase && (
  <>
    {/* Social Proof */}
    <section className="border-b border-neutral-800 bg-[#0a0a0a] py-12">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-3 gap-8 text-center">
          {[
            { value: '12,847+', label: 'Accounts Evaluated' },
            { value: '$2.4B+', label: 'Total Value Assessed' },
            { value: '98.2%', label: 'Satisfaction Rate' },
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
        <h2 className="text-2xl font-bold text-center mb-10">Built for Everyone in the TikTok Economy</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Building2, title: 'Brands & Advertisers',
              desc: 'Pre-investment due diligence. Avoid bot accounts and fake followers before spending your ad budget.',
              cta: 'Try Free →', action: () => document.querySelector('input')?.focus(),
            },
            {
              icon: User, title: 'Creators & Influencers',
              desc: 'Know your market value. Price your brand deals with confidence backed by real data.',
              cta: 'Evaluate Now →', action: () => { setUsername(''); document.querySelector('input')?.focus() },
            },
            {
              icon: Users, title: 'Agencies & MCNs',
              desc: 'Batch evaluation at scale. Make data-driven decisions for your entire creator roster.',
              cta: 'See Pricing →', action: () => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }),
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
                  {item.cta}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>

    {/* Core Capabilities */}
    <section id="capabilities" className="border-b border-neutral-800 py-16">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-2xl font-bold text-center mb-2">Everything You Need to Know</h2>
        <p className="text-neutral-500 text-center mb-10 text-sm">10 comprehensive modules in every report</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {UNLOCK_MODULES.map((m, i) => {
            const Icon = m.icon
            return (
              <div key={i} className="group rounded-xl border border-neutral-800 bg-[#111] p-3 transition-all hover:border-neutral-700 hover:bg-[#151515]">
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${m.bg} mb-2`}>
                  <Icon className={`h-4 w-4 ${m.color}`} />
                </div>
                <div className="text-xs font-semibold text-white leading-tight">{m.title}</div>
                <div className="mt-1 text-[10px] text-neutral-500 leading-snug line-clamp-2">{m.desc}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>

    {/* Pricing Preview */}
    <section id="pricing" className="border-b border-neutral-800 py-16">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-2xl font-bold text-center mb-2">Simple, Transparent Pricing</h2>
        <p className="text-neutral-500 text-center mb-10 text-sm">One-time purchase. No auto-renewal. Email-bound for cross-device access.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CREDIT_PACKAGES.map(pkg => (
            <div key={pkg.id} className={`relative rounded-2xl border-2 p-5 text-center transition-all ${
              pkg.highlight ? 'border-[#FF0050] bg-[#FF0050]/5' : 'border-neutral-800 bg-[#141414]'
            }`}>
              {pkg.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FF0050] px-2.5 py-0.5 text-[10px] font-bold text-white">
                    <Star className="h-2.5 w-2.5" />{pkg.badge}
                  </span>
                </div>
              )}
              <div className="text-xs text-neutral-500 uppercase tracking-wider mb-2">{pkg.label}</div>
              <div className="flex items-baseline justify-center gap-0.5">
                <span className="text-neutral-400">$</span>
                <span className="text-4xl font-black text-white">{pkg.price}</span>
              </div>
              <div className="text-sm text-neutral-500 mt-1">{pkg.credits} evaluations</div>
              <div className="text-xs text-neutral-600 mt-0.5">{pkg.perUnit}</div>
              <button
                onClick={() => { setSelectedPkgForModal(pkg); setShowVerifyModal(true) }}
                className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  pkg.highlight
                    ? 'bg-[#FF0050] text-white hover:bg-[#e60049]'
                    : 'border border-neutral-700 text-neutral-300 hover:border-[#FF0050] hover:text-[#FF0050]'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-center gap-5 text-[10px] text-neutral-600">
          <span>No auto-renewal</span>
          <span>Email-bound</span>
          <span>Cross-device access</span>
        </div>
      </div>
    </section>

    {/* FAQ */}
    <section className="border-b border-neutral-800 py-16">
      <div className="mx-auto max-w-2xl px-4">
        <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>
        <FAQItem question="How does the valuation work?" answer="We analyze 10 dimensions including follower quality, engagement rate, content performance, brand safety, and regional market data. Our algorithm combines industry benchmarks with real-time TikTok data to produce a comprehensive business valuation." />
        <FAQItem question="Is my data secure?" answer="Yes. We only access publicly available TikTok profile data. We never store your personal information beyond the email you use for credit binding. No passwords, no social logins." />
        <FAQItem question="Can I use credits across devices?" answer="Absolutely. Your credits are bound to your email address. Simply verify your email on any device to access your balance." />
        <FAQItem question="How accurate is the estimate?" answer="Our model is calibrated against publicly reported brand deal values and industry benchmarks. While no estimate is 100% precise, our valuation framework is used by over 12,000 creators and agencies for negotiation and due diligence." />
        <FAQItem question="Do you support regions outside the US?" answer="Yes. We support 50+ countries with region-specific CPM rates and market multipliers. Accounts from the US, Europe, Asia, LATAM, and MENA are all covered." />
      </div>
    </section>

    {/* Footer */}
    <footer className="border-t border-neutral-800 bg-[#0a0a0a] py-6">
      <div className="mx-auto max-w-5xl px-4 text-center text-xs text-neutral-600">
        TikWorth v{APP_VERSION} · Data sourced from third-party APIs. For reference only.
      </div>
    </footer>
  </>
)}
```

- [ ] **Step 6: Add FAQItem component and UNLOCK_MODULES import**

Add at the bottom of the file (before `export default`):

```tsx
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
```

Add `UNLOCK_MODULES` data to page.tsx (copy from PaidWall.tsx, but with English copy):

```tsx
const UNLOCK_MODULES = [
  { icon: DollarSign,   color: 'text-[#FF0050]', bg: 'bg-[#FF0050]/10', title: '5-Channel Income', desc: 'Brand deals, LIVE, Creator Fund, affiliate, merch' },
  { icon: TrendingUp,   color: 'text-[#00F2EA]', bg: 'bg-[#00F2EA]/10', title: '12-Month Revenue Roadmap', desc: 'Quarterly follower/views/revenue projections' },
  { icon: Target,       color: 'text-[#FF0050]', bg: 'bg-[#FF0050]/10', title: 'Growth Action Plan', desc: 'Follower/views/engagement 3D recommendations' },
  { icon: Shield,       color: 'text-[#00F2EA]', bg: 'bg-[#00F2EA]/10', title: '10-Dimension Risk Scan', desc: 'Bot detection, fake engagement, shadowban alerts' },
  { icon: BarChart3,    color: 'text-[#FF0050]', bg: 'bg-[#FF0050]/10', title: 'Peer Percentile Ranking', desc: 'Percentile rank vs same-tier accounts' },
  { icon: Building2,    color: 'text-[#00F2EA]', bg: 'bg-[#00F2EA]/10', title: 'Brand Matching', desc: 'Suitable brand types + collaboration advice' },
  { icon: Lightbulb,    color: 'text-[#FF0050]', bg: 'bg-[#FF0050]/10', title: 'Content Strategy Guide', desc: 'Content pillars, hashtags, best posting times' },
  { icon: Flame,        color: 'text-[#00F2EA]', bg: 'bg-[#00F2EA]/10', title: 'Trend Analysis', desc: 'Related topic trends + account fit score' },
  { icon: Rocket,       color: 'text-[#FF0050]', bg: 'bg-[#FF0050]/10', title: 'Monetization Paths', desc: '3 revenue paths + priority ranking' },
  { icon: FileDown,     color: 'text-[#00F2EA]', bg: 'bg-[#00F2EA]/10', title: 'HD PDF Export', desc: 'Full shareable business analysis report' },
]
```

- [ ] **Step 7: Add modal state for pricing cards**

Add after other state declarations:
```tsx
const [selectedPkgForModal, setSelectedPkgForModal] = useState<CreditPackage>(CREDIT_PACKAGES[1])
```

Add import at top:
```tsx
import type { CreditPackage } from '@/lib/credits'
import { CREDIT_PACKAGES } from '@/lib/credits'
```

- [ ] **Step 8: Add VerifyEmailModal to JSX**

Add at the end of the component, just before `</main>`:
```tsx
<VerifyEmailModal
  isOpen={showVerifyModal}
  onClose={() => setShowVerifyModal(false)}
  onUnlock={handleUnlock}
  existingBalance={creditBalance}
/>
```

- [ ] **Step 9: Add missing icon imports**

Add `User`, `Flame`, `Rocket`, `FileDown` to the lucide-react import.

- [ ] **Step 10: Update all remaining Chinese copy in result section**

Replace all Chinese text in the result area (lines 383-853):
- `Mock 演示数据` → `Demo Data`
- `粉丝` → `followers`
- `关注` → `following`
- `总点赞` → `total likes`
- `视频` → `videos`
- Section headers: `商业价值评估` → `Business Valuation`, `评估结论` → `Assessment Conclusion`, `收入与增长` → `Income & Growth`, `雷达评分与风险检测` → `Radar Score & Risk Detection`, `同行对比排名` → `Peer Ranking`, `品牌合作匹配` → `Brand Matching`, `内容策略指南` → `Content Strategy`, `趋势分析` → `Trend Analysis`, `商业化方向建议` → `Monetization Advice`, `深度分析` → `Deep Analysis`
- `核心优势` → `Strengths`, `主要短板` → `Weaknesses`
- `暂无突出优势` → `No standout strengths`, `无明显短板` → `No significant weaknesses`
- `适合谁用` → `Target Audience`, `最佳行动建议` → `Best Action`
- `评估时间` → `Evaluated at`, `数据来源第三方 API / Mock，仅供参考，不构成投资或合作建议` → `Data sourced from third-party APIs. For reference only.`
- `导出报告` → `Export Report`, `导出 PNG 图片` → `Export PNG`, `导出 PDF 报告` → `Export PDF`
- `已保存到追踪` → `Saved to Tracker`, `保存到追踪` → `Save to Tracker`, `评估历史` → `History`
- `合作报价参考` → `Price Reference`, `品牌合作价值排名` → `Brand Value Rank`, `账号估值` → `Account Valuation`
- `已满足变现门槛` → `Monetization Eligible`, `最近门槛` → `Nearest Threshold`
- `额度已到账` → `Credits Added`, `查询额度` → `Loading Credits`, `credits` stays
- `评估此账号需要消耗` → `This evaluation uses`, `次额度` → `credit(s)`, `购买后立即查看完整评估报告` → `Purchase to view the full report`
- `免费评估你的账号` → `Evaluate Your Account Free`
- `解锁查看` → `Unlock to view`, `个收入渠道` → ` income channels`, `大商业化方向` → ` monetization paths`, `趋势分析 + 品牌匹配` → `Trend Analysis + Brand Matching`, `月收入预测` → `12-Month Revenue Forecast`

- [ ] **Step 11: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 12: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redesign Topbar + landing page with English copy"
```

---

### Task 6: Update components/PaidWall.tsx (English)

**Files:**
- Modify: `components/PaidWall.tsx`

- [ ] **Step 1: Update UNLOCK_MODULES to English**

Replace the UNLOCK_MODULES array with the same English version from Task 5.

- [ ] **Step 2: Update all Chinese copy**

Replace:
- `深度分析已锁定` → `Deep Analysis Locked`
- `解锁` → `Unlock`, `此账号` → `this account`
- `的完整商业价值报告` → `'s Complete Business Report`
- `付费后可查看以下` → `Unlock the full report to access`
- `大核心模块` → ` core modules`
- `数据即时生成，支持 PDF 导出` → `Instant generation, PDF export ready`
- `正在查询额度...` → `Loading credits...`
- `当前剩余` → `remaining:`, `次额度` → ` credits`
- `选择适合您的评估套餐` → `Choose your plan`
- `一次付费，永久有效 · 不自动续费 · 邮箱绑定可跨设备找回` → `One-time purchase · No auto-renewal · Cross-device email binding`
- `已选择` → `Selected`
- `解锁 3 次完整报告` → `Unlock 3 evaluations`
- `通过邮箱绑定您的额度` → `Bind your credits via email`
- `请查收邮件验证码` → `Check your email for the code`
- `解锁成功` → `Unlocked`
- `您的账户已有额度，可直接解锁本次报告` → `You have credits available. Unlock this report now.`
- `使用 1 次额度解锁完整报告（剩余` → `Use 1 credit to unlock (`, `次）` → ` remaining)`
- `使用其他邮箱购买新额度` → `Use a different email`
- `输入您的邮箱` → `Enter your email`
- `用于绑定额度，换设备时可通过邮箱验证码找回` → `Bind your credits. Recover on any device via email code.`
- `发送验证码` → `Send Code`
- `← 返回选择套餐` → `← Back to packages`
- `验证码 10 分钟内有效，我们不会发送营销邮件，仅用于额度绑定。` → `Code valid for 10 minutes. No marketing emails. Credits binding only.`
- `开发阶段：验证码将直接显示在界面上，无需实际查收邮件。` → `DEV: Code shown directly. No actual email sent.`
- `输入验证码` → `Enter Code`
- `已发送到` → `Sent to`
- `开发模式：` → `DEV:`, `验证码` → `Code`
- `（生产环境会发送到您的邮箱）` → `(will be emailed in production)`
- `验证并解锁` → `Verify & Unlock`
- `← 修改邮箱` → `← Change email`
- `重新发送验证码` → `Resend code`
- `本次购买：` → `Order:`
- `解锁成功！` → `Unlock Successful!`
- `您的邮箱` → `Your email`, `已绑定，当前剩余` → ` is bound with`, `次额度` → ` credits remaining`
- `正在为您加载完整报告...` → `Loading full report...`
- `正在解锁...` → `Unlocking...`
- `邮箱绑定额度` → `Email-bound credits`
- `无需注册 · 验证码即登录` → `No registration · Code-only login`
- `不自动续费` → `No auto-renewal`
- `跨设备可找回` → `Cross-device recovery`

- [ ] **Step 3: Update package feature lists**

In the package cards, update feature lists:
```tsx
(pkg.id === 'pack3' ? ['3 complete evaluations', '10 analysis modules', 'PDF export'] :
 pkg.id === 'pack10' ? ['10 complete evaluations', 'Cross-device recovery', 'PDF export', 'Priority support'] :
 ['100 complete evaluations', 'Cross-device sync', 'PDF export', 'Early access + VIP support']
)
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add components/PaidWall.tsx
git commit -m "feat: switch PaidWall to English copy"
```

---

### Task 7: Update Scoring Components (English Labels)

**Files:**
- Modify: `components/ScoreGauge.tsx`
- Modify: `components/RiskList.tsx`
- Modify: `components/DeepAnalysisSection.tsx`

- [ ] **Step 1: Update ScoreGauge aria-label**

Change `aria-label={`${tier}级账号，评分${score}分`}` → `aria-label={`Tier ${tier} account, score ${score}`}`

- [ ] **Step 2: Update RiskList empty state**

Change `未检测到明显风险信号` → `No risk signals detected`

- [ ] **Step 3: Update DeepAnalysisSection button text**

Change `深度分析` → `Deep Analysis` (section title in SectionHeader)

- [ ] **Step 4: Commit**

```bash
git add components/ScoreGauge.tsx components/RiskList.tsx components/DeepAnalysisSection.tsx
git commit -m "feat: switch scoring components to English"
```

---

### Task 8: Update Section Components (English)

**Files:**
- Modify: `components/sections/GrowthPlanSection.tsx`
- Modify: `components/sections/IncomeBreakdownSection.tsx`
- Modify: `components/sections/RevenueRoadmapSection.tsx`
- Modify: `components/sections/ContentStrategySection.tsx`
- Modify: `components/sections/PeerRankingSection.tsx`
- Modify: `components/sections/BrandMatchingSection.tsx`
- Modify: `components/sections/MonetizationChecklist.tsx`
- Modify: `components/sections/TrendAnalysisSection.tsx`
- Modify: `components/sections/CommercializationSection.tsx`
- Modify: `components/sections/AccountHealthSection.tsx`
- Modify: `components/sections/ContentCadenceSection.tsx`
- Modify: `components/sections/EngagementQualitySection.tsx`
- Modify: `components/sections/PeerBenchmarkSection.tsx`

- [ ] **Step 1: Batch update section titles and labels**

For each file, replace Chinese titles/labels with English equivalents. Use `Grep` first to find all Chinese strings:

```bash
grep -rn '[\u4e00-\u9fff]' components/sections/ --include='*.tsx' | grep -v '//' | head -100
```

Then update each file. Key replacements:
- `收入拆解` → `Income Breakdown`, `品牌合作` → `Brand Deals`
- `直播带货` → `LIVE Shopping`, `创作者基金` → `Creator Fund`
- `订阅收入` → `Subscriptions`, `联盟营销` → `Affiliate`
- `收入路线图` → `Revenue Roadmap`, `增长计划` → `Growth Plan`
- `内容策略` → `Content Strategy`, `同行排名` → `Peer Ranking`
- `品牌匹配` → `Brand Matching`, `变现清单` → `Monetization Checklist`
- `趋势分析` → `Trend Analysis`, `商业化` → `Monetization`
- `账号健康` → `Account Health`, `内容节奏` → `Content Cadence`
- `互动质量` → `Engagement Quality`, `同体量对比` → `Peer Benchmark`

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/sections/
git commit -m "feat: switch all section components to English"
```

---

### Task 9: Update app/globals.css (Animations)

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add modal and scale-in animations**

Add at the end of `globals.css`:

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}

.animate-scale-in {
  animation: scale-in 0.25s ease-out;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add modal fade-in/scale-in animations"
```

---

### Task 10: Final Verification

**Files:**
- All modified files

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run existing tests**

Run: `npx vitest run`
Expected: 23 tests pass

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: Successful build

- [ ] **Step 4: Start dev server and verify**

Run: `npm run dev`
- Open http://localhost:3000
- Verify: Topbar shows "Verify Email" button (unauthenticated)
- Verify: Landing page renders all 7 sections
- Verify: Click "Verify Email" opens modal
- Verify: Search works for a TikTok username
- Verify: Result displays in English
- Verify: Paid wall shows in English

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: final verification - all tests pass, build succeeds"
git push
```