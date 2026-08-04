import Link from 'next/link'
import Image from 'next/image'
import {
  Building2, User, Users, DollarSign, Globe, TrendingUp, Layers, Trophy,
  Shield, Sparkles, Eye, Scale, AlertTriangle, Activity, Rocket, Lightbulb,
  Flame, MessageCircle, Radio, FileDown, RefreshCw, BarChart3, LineChart,
  Wallet, Zap, Mail, CreditCard, Star, CheckCircle2, ArrowRight, ChevronDown,
} from 'lucide-react'
import { getServerDict, t } from '@/lib/i18n/server'
import { CREDIT_PACKAGES } from '@/lib/credits'
import type { EnDict } from '@/lib/i18n/dictionaries/en'
import { HomepageJsonLd } from '@/components/HomepageJsonLd'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

/**
 * StaticLanding — SSR 输出的静态首页内容。
 *
 * 原理：首页的 HomePageContent 因使用 useSearchParams 在静态预渲染时
 * bailout 到客户端渲染，Next.js 会把最近的 <Suspense> fallback 渲染进
 * SSR HTML。本组件作为 fallback，让搜索引擎爬虫拿到完整首页内容
 * （H1、Use Cases、Capabilities、Pricing、FAQ）。
 *
 * 纯展示组件：只读 i18n 字典，无任何 state / 事件绑定。
 * FAQ 用 <details> 实现展开，无需 JS 也能查看。
 */

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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-b border-neutral-800">
      <summary className="w-full flex items-center justify-between py-4 text-left text-sm font-medium text-white hover:text-[#00F2EA] transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4 text-sm text-neutral-400 leading-relaxed">{answer}</div>
    </details>
  )
}

export function StaticLanding() {
  const d: EnDict = getServerDict()

  return (
    <div className="min-h-screen flex flex-col">
      <link rel="canonical" href="https://tokvalue.com/" />
      <HomepageJsonLd />
      <SiteHeader />

      {/* Hero — 静态文字 */}
      <section className="relative overflow-hidden border-b border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FF0050]/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-3xl px-4 py-20 sm:py-24 relative">
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
              {d.home.hero.title}
            </h1>
            <p className="text-lg text-neutral-400 max-w-xl mx-auto">
              {d.home.hero.subtitle}
            </p>
          </div>
          <div className="flex items-center rounded-2xl border border-neutral-700 bg-neutral-900/80 backdrop-blur px-4 py-3">
            <span className="text-neutral-500 text-lg mr-3">@</span>
            <input
              type="text"
              placeholder={d.home.hero.placeholder}
              aria-label={d.home.hero.ariaLabel}
              disabled
              className="flex-1 bg-transparent text-lg outline-none placeholder:text-neutral-600"
            />
            <span className="ml-3 inline-flex items-center gap-2 rounded-xl bg-[#FF0050] px-5 py-2.5 font-semibold text-white opacity-60">
              <Zap className="h-4 w-4" />
              {d.common.evaluate}
            </span>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="border-b border-neutral-800 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-center mb-10">{d.home.useCases.title}</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Building2, title: d.home.useCases.brands.title, desc: d.home.useCases.brands.desc, cta: d.home.useCases.brands.cta, image: '/images/role-brands.jpg' },
              { icon: User, title: d.home.useCases.creators.title, desc: d.home.useCases.creators.desc, cta: d.home.useCases.creators.cta, image: '/images/role-creators.jpg' },
              { icon: Users, title: d.home.useCases.agencies.title, desc: d.home.useCases.agencies.desc, cta: d.home.useCases.agencies.cta, image: '/images/role-agencies.jpg' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="group rounded-2xl border border-neutral-800 bg-[#141414] overflow-hidden hover:border-[#00F2EA]/30 transition-all hover:-translate-y-1">
                  <div className="relative h-40 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      width={400}
                      height={200}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />
                  </div>
                  <div className="p-6 pt-0 -mt-8 relative z-10">
                    <div className="w-11 h-11 rounded-xl bg-[#00F2EA]/10 flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-[#00F2EA]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed mb-4">{item.desc}</p>
                    <span className="text-sm font-medium text-[#FF0050]">
                      {item.cta} →
                    </span>
                  </div>
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
              {d.home.capabilities.badge}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              {d.home.capabilities.title}
            </h2>
            <p className="text-neutral-500 text-sm max-w-2xl mx-auto leading-relaxed">
              {d.home.capabilities.description}
            </p>
          </div>

          {/* 1. BUSINESS VALUATION */}
          <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] via-[#0f0f0f] to-[#FF0050]/[0.04] p-6 sm:p-8 mb-5 hover:border-[#FF0050]/30 transition-all group">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
              <div className="lg:w-[340px] shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF0050]/10 border border-[#FF0050]/20 px-3 py-1 text-[10px] font-semibold text-[#FF0050] uppercase tracking-wider mb-4">
                  <DollarSign className="h-3 w-3" /> {d.home.capabilities.valuation.badge}
                </span>
                <h3 className="text-xl font-bold mb-2">{d.home.capabilities.valuation.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed mb-5">
                  {d.home.capabilities.valuation.desc}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FF0050]/5 border border-[#FF0050]/10">
                    <DollarSign className="h-5 w-5 text-[#FF0050] shrink-0" />
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{d.home.capabilities.valuation.rangeLabel}</div>
                      <div className="text-base font-bold text-[#FF0050]">{d.home.capabilities.valuation.rangeValue}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FF0050]/5 border border-[#FF0050]/10">
                    <Globe className="h-5 w-5 text-[#FF0050] shrink-0" />
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider">{d.home.capabilities.valuation.coverageLabel}</div>
                      <div className="text-sm font-semibold text-white">{d.home.capabilities.valuation.coverageValue}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 grid gap-3 sm:grid-cols-2">
                <CapFeature icon={<DollarSign className="h-4 w-4" />} color="pink" title={d.home.capabilities.valuation.features.incomeBreakdown.title} items={d.home.capabilities.valuation.features.incomeBreakdown.items} />
                <CapFeature icon={<TrendingUp className="h-4 w-4" />} color="pink" title={d.home.capabilities.valuation.features.revenueRoadmap.title} items={d.home.capabilities.valuation.features.revenueRoadmap.items} />
                <CapFeature icon={<Layers className="h-4 w-4" />} color="pink" title={d.home.capabilities.valuation.features.valueBreakdown.title} items={d.home.capabilities.valuation.features.valueBreakdown.items} />
                <CapFeature icon={<Trophy className="h-4 w-4" />} color="pink" title={d.home.capabilities.valuation.features.peerBenchmarking.title} items={d.home.capabilities.valuation.features.peerBenchmarking.items} />
              </div>
            </div>
          </div>

          {/* 2. AUTHORITY & RISK */}
          <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] via-[#0f0f0f] to-[#00F2EA]/[0.04] p-6 sm:p-8 mb-5 hover:border-[#00F2EA]/30 transition-all group">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
              <div className="lg:w-[340px] shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00F2EA]/10 border border-[#00F2EA]/20 px-3 py-1 text-[10px] font-semibold text-[#00F2EA] uppercase tracking-wider mb-4">
                  <Shield className="h-3 w-3" /> {d.home.capabilities.authority.badge}
                </span>
                <h3 className="text-xl font-bold mb-2">{d.home.capabilities.authority.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed mb-5">
                  {d.home.capabilities.authority.desc}
                </p>
                <div className="mb-4 space-y-2">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">{d.home.capabilities.authority.valueLevels.title}</div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/15">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mt-0.5">
                      <Trophy className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-amber-300">{d.home.capabilities.authority.valueLevels.premium.label}</div>
                      <div className="text-[11px] text-neutral-400 leading-relaxed">{d.home.capabilities.authority.valueLevels.premium.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-[#00F2EA]/10 to-[#00F2EA]/5 border border-[#00F2EA]/15">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-[#00F2EA]/20 flex items-center justify-center mt-0.5">
                      <TrendingUp className="h-4 w-4 text-[#00F2EA]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#00F2EA]">{d.home.capabilities.authority.valueLevels.growth.label}</div>
                      <div className="text-[11px] text-neutral-400 leading-relaxed">{d.home.capabilities.authority.valueLevels.growth.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/15">
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center mt-0.5">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-purple-300">{d.home.capabilities.authority.valueLevels.developing.label}</div>
                      <div className="text-[11px] text-neutral-400 leading-relaxed">{d.home.capabilities.authority.valueLevels.developing.desc}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#00F2EA]/5 border border-[#00F2EA]/10">
                  <Eye className="h-5 w-5 text-[#00F2EA] shrink-0" />
                  <div className="text-xs text-neutral-400">
                    {t(d.home.capabilities.authority.brandCheck, { pct: '85' })}
                  </div>
                </div>
              </div>
              <div className="flex-1 grid gap-3 sm:grid-cols-2">
                <CapFeature icon={<Scale className="h-4 w-4" />} color="cyan" title={d.home.capabilities.authority.features.radarScoring.title} items={d.home.capabilities.authority.features.radarScoring.items} />
                <CapFeature icon={<AlertTriangle className="h-4 w-4" />} color="cyan" title={d.home.capabilities.authority.features.riskIntelligence.title} items={d.home.capabilities.authority.features.riskIntelligence.items} />
                <CapFeature icon={<Building2 className="h-4 w-4" />} color="cyan" title={d.home.capabilities.authority.features.brandSuitability.title} items={d.home.capabilities.authority.features.brandSuitability.items} />
                <CapFeature icon={<Activity className="h-4 w-4" />} color="cyan" title={d.home.capabilities.authority.features.accountHealth.title} items={d.home.capabilities.authority.features.accountHealth.items} />
              </div>
            </div>
          </div>

          {/* 3. GROWTH & MONETIZATION */}
          <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] via-[#0f0f0f] to-[#FF0050]/[0.04] p-6 sm:p-8 mb-5 hover:border-[#FF0050]/30 transition-all group">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
              <div className="lg:w-[340px] shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FF0050]/10 border border-[#FF0050]/20 px-3 py-1 text-[10px] font-semibold text-[#FF0050] uppercase tracking-wider mb-4">
                  <Rocket className="h-3 w-3" /> {d.home.capabilities.growth.badge}
                </span>
                <h3 className="text-xl font-bold mb-2">{d.home.capabilities.growth.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed mb-5">
                  {d.home.capabilities.growth.desc}
                </p>
                <div className="space-y-2 text-xs">
                  {d.home.capabilities.growth.guarantees.map((text, i) => (
                    <div key={i} className="flex items-center gap-2 text-neutral-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#00F2EA] shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 grid gap-3 sm:grid-cols-2">
                <CapFeature icon={<Lightbulb className="h-4 w-4" />} color="pink" title={d.home.capabilities.growth.features.contentStrategy.title} items={d.home.capabilities.growth.features.contentStrategy.items} />
                <CapFeature icon={<Rocket className="h-4 w-4" />} color="pink" title={d.home.capabilities.growth.features.monetizationBlueprint.title} items={d.home.capabilities.growth.features.monetizationBlueprint.items} />
                <CapFeature icon={<Flame className="h-4 w-4" />} color="pink" title={d.home.capabilities.growth.features.trendForecasting.title} items={d.home.capabilities.growth.features.trendForecasting.items} />
                <CapFeature icon={<MessageCircle className="h-4 w-4" />} color="pink" title={d.home.capabilities.growth.features.engagementDeepDive.title} items={d.home.capabilities.growth.features.engagementDeepDive.items} />
              </div>
            </div>
          </div>

          {/* Additional Capabilities Summary */}
          <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-[#0f0f0f] to-[#141414] p-6 mb-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="h-4 w-4 text-[#FF0050]" />
              <h4 className="text-sm font-semibold text-neutral-300">{d.home.capabilities.alsoIncluded.title}</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {d.home.capabilities.alsoIncluded.items.map((item, i) => {
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
            <p className="text-sm text-neutral-500 mb-4">{d.home.capabilities.ctaHint}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF0050] to-[#e60049] px-6 py-3 text-sm font-semibold text-white hover:from-[#e60049] hover:to-[#cc0040] transition-all shadow-lg shadow-[#FF0050]/25"
            >
              {d.home.capabilities.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-neutral-800 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00F2EA]/20 bg-[#00F2EA]/5 px-4 py-1.5 text-xs font-medium text-[#00F2EA] mb-4">
              <Zap className="h-3.5 w-3.5" />
              Pricing
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl">{d.home.pricing.title}</h2>
            <p className="mt-4 max-w-xl mx-auto text-neutral-400">{d.home.pricing.subtitle}</p>
          </div>

          {/* Trust Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-12 max-w-3xl mx-auto">
            {d.home.pricing.trustBar.map((item: { icon: string; title: string; desc: string }) => {
              const Icon = item.icon === 'zap' ? Zap : item.icon === 'mail' ? Mail : CreditCard
              return (
                <div key={item.title} className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-[#0a0a0a] px-4 py-3">
                  <Icon className="h-5 w-5 text-[#00F2EA] shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-neutral-500">{item.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {CREDIT_PACKAGES.map(pkg => {
              const plan = (d.home.pricing.plans as unknown as Array<{
                id: string
                name: string
                desc: string
                highlight: boolean
                badge?: string
              }>).find(p => p.id === pkg.id)

              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-2xl border-2 p-6 transition-all ${
                    pkg.highlight
                      ? 'border-[#FF0050] bg-gradient-to-b from-[#FF0050]/[0.06] to-transparent shadow-lg shadow-[#FF0050]/5'
                      : 'border-neutral-800 bg-[#0a0a0a] hover:border-neutral-700'
                  }`}
                >
                  {pkg.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FF0050] px-3 py-1 text-[11px] font-bold text-white shadow-lg shadow-[#FF0050]/25">
                        <Star className="h-3 w-3" fill="currentColor" />
                        {d.creditPackages[pkg.id as keyof typeof d.creditPackages]?.badge ?? pkg.badge}
                      </span>
                    </div>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-1">
                    {d.creditPackages[pkg.id as keyof typeof d.creditPackages]?.label ?? pkg.label}
                  </p>
                  <p className="text-sm text-neutral-400 mb-4">{plan?.desc}</p>
                  <div className="flex items-baseline gap-0.5 mb-1">
                    <span className="text-neutral-500 text-lg">$</span>
                    <span className="text-5xl font-black text-white tracking-tight">{pkg.price}</span>
                  </div>
                  <p className="text-sm text-neutral-500">
                    <span className="text-white font-semibold">{pkg.credits}</span> reports
                  </p>
                  <p className="text-xs text-neutral-600 mt-0.5">{pkg.perUnit}</p>
                  <Link
                    href="/"
                    className={`mt-5 w-full block text-center rounded-xl py-3 text-sm font-semibold transition-all ${
                      pkg.highlight
                        ? 'bg-[#FF0050] text-white hover:bg-[#e60049] shadow-lg shadow-[#FF0050]/20'
                        : 'border border-neutral-700 text-neutral-300 hover:border-[#FF0050] hover:text-[#FF0050]'
                    }`}
                  >
                    {d.common.getStarted}
                  </Link>
                </div>
              )
            })}
          </div>

          {/* All plans include */}
          <div className="mb-12">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">{d.home.pricing.allPlansInclude.title}</h3>
              <p className="text-sm text-neutral-500 max-w-xl mx-auto">{d.home.pricing.allPlansInclude.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 max-w-3xl mx-auto">
              {d.home.pricing.allPlansInclude.list.map((f: string) => (
                <div key={f} className="flex items-center gap-2.5 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-[#00F2EA] shrink-0" />
                  <span className="text-neutral-300">{d.home.pricing.allPlansInclude.features[f as keyof typeof d.home.pricing.allPlansInclude.features]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-xs text-neutral-600">
            {d.home.pricing.footer.map((text: string, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-[#00F2EA]/50" />
                {text}
              </div>
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
              {d.home.faq.badge}
            </div>
            <h2 className="text-2xl font-bold">{d.home.faq.title}</h2>
          </div>
          {Object.entries(d.home.faq.questions).map(([key, item]) => (
            <FaqItem key={key} question={item.q} answer={item.a} />
          ))}
        </div>
      </section>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}
