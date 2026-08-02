/* eslint-disable jsx-a11y/alt-text */
import React from 'react'
import { Document, Page, Text, View, Image, StyleSheet, pdf, Font } from '@react-pdf/renderer'
import html2canvas from 'html2canvas'
import type { Evaluation } from '@/types'

// ── Register Chinese Font (client-side via URL fetch) ──
let fontsRegistered = false
async function registerFonts() {
  if (fontsRegistered) return
  try {
    const [regularRes, boldRes] = await Promise.all([
      fetch('/fonts/NotoSansSC-Regular.ttf'),
      fetch('/fonts/NotoSansSC-Bold.ttf'),
    ])
    if (!regularRes.ok || !boldRes.ok) {
      console.warn('[export-pdf] Font files not found, using fallback')
      return
    }
    const [regularBlob, boldBlob] = await Promise.all([
      regularRes.blob(),
      boldRes.blob(),
    ])
    const toDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const [regularUrl, boldUrl] = await Promise.all([
      toDataUrl(regularBlob),
      toDataUrl(boldBlob),
    ])
    Font.register({
      family: 'NotoSansSC',
      fonts: [
        { src: regularUrl, fontWeight: 400 },
        { src: boldUrl, fontWeight: 700 },
      ],
    })
    fontsRegistered = true
  } catch (e) {
    console.warn('[export-pdf] Failed to register Chinese font:', e)
  }
}

// Logo base64 cache
let logoBase64Cache: string | null = null
async function getLogoBase64(): Promise<string | null> {
  if (logoBase64Cache) return logoBase64Cache
  try {
    const res = await fetch('/tokvalue.png')
    if (!res.ok) return null
    const blob = await res.blob()
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
    logoBase64Cache = dataUrl
    return dataUrl
  } catch {
    return null
  }
}

// ── Format Helpers ──
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
function pct(n: number): string { return `${Math.round(n)}%` }

// ── Colors ──
const C = {
  bg: '#0a0a0a',
  card: '#141414',
  cardAlt: '#0f0f0f',
  border: '#1f1f1f',
  cyan: '#00F2EA',
  pink: '#FF0050',
  green: '#22c55e',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#a855f7',
  text: '#e5e5e5',
  muted: '#737373',
  dim: '#525252',
}

// ── Styles ──
const FONT = 'NotoSansSC'
const S = StyleSheet.create({
  page: { backgroundColor: C.bg, padding: 28, paddingBottom: 22 },
  pageFooter: {
    position: 'absolute', bottom: 12, left: 28, right: 28,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: C.border, paddingTop: 6,
  },
  footerText: { fontSize: 7, color: C.dim, fontFamily: FONT },
  footerLogo: { width: 60, height: 12, objectFit: 'contain' },

  // Typography
  h1: { fontSize: 22, fontFamily: FONT, fontWeight: 700, color: C.text },
  h2: { fontSize: 14, fontFamily: FONT, fontWeight: 700, color: C.text, marginBottom: 6 },
  h3: { fontSize: 11, fontFamily: FONT, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 },
  body: { fontSize: 9, fontFamily: FONT, color: C.muted, lineHeight: 1.5 },
  bodyStrong: { fontSize: 9, fontFamily: FONT, color: C.text, lineHeight: 1.5 },
  label: { fontSize: 7, fontFamily: FONT, color: C.dim, textTransform: 'uppercase' },
  value: { fontSize: 10, fontFamily: FONT, fontWeight: 700, color: C.text },
  valueLg: { fontSize: 18, fontFamily: FONT, fontWeight: 700, color: C.cyan },
  valueXl: { fontSize: 26, fontFamily: FONT, fontWeight: 700, color: C.cyan },
  tag: { fontSize: 7, fontFamily: FONT, color: C.cyan, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#00F2EA33' },

  // Layout
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  col: { flexDirection: 'column' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  flex1: { flex: 1 },

  // Cards
  card: { backgroundColor: C.card, borderRadius: 8, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 10 },
  cardCyan: { backgroundColor: C.card, borderRadius: 8, borderWidth: 1, borderColor: '#00F2EA22', padding: 12, marginBottom: 10 },
  cardPink: { backgroundColor: C.card, borderRadius: 8, borderWidth: 1, borderColor: '#FF005022', padding: 12, marginBottom: 10 },

  // Specific
  sectionStep: { fontSize: 8, fontFamily: FONT, fontWeight: 700, color: C.cyan, marginBottom: 2 },
  sectionTitle: { fontSize: 13, fontFamily: FONT, fontWeight: 700, color: C.text, marginBottom: 8 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 8 },
  dot: { width: 4, height: 4, borderRadius: 2, marginRight: 6, marginTop: 4 },
  dotGreen: { backgroundColor: C.green },
  dotRed: { backgroundColor: C.red },
  dotAmber: { backgroundColor: C.amber },

  // Avatar
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: C.border },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center' },
  avatarPlaceholderText: { fontSize: 18, fontFamily: FONT, fontWeight: 700, color: C.muted },

  // Progress bar
  progressBg: { height: 4, backgroundColor: '#1a1a1a', borderRadius: 2, flex: 1 },
  progressFill: { height: 4, borderRadius: 2 },

  // Chart image
  chartImg: { width: '100%', objectFit: 'contain' },

  // Component cards
  compCard: { flex: 1, backgroundColor: C.cardAlt, borderRadius: 6, borderWidth: 1, borderColor: C.border, padding: 8, marginHorizontal: 3 },
  compCardLast: { flex: 1, backgroundColor: C.cardAlt, borderRadius: 6, borderWidth: 1, borderColor: '#a855f733', padding: 8, marginHorizontal: 3 },

  // Badge
  badge: { fontSize: 7, fontFamily: FONT, fontWeight: 700, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeGreen: { backgroundColor: '#22c55e22', color: C.green },
  badgeAmber: { backgroundColor: '#f59e0b22', color: C.amber },
  badgeRed: { backgroundColor: '#ef444422', color: C.red },
  badgeCyan: { backgroundColor: '#00F2EA22', color: C.cyan },
  badgePink: { backgroundColor: '#FF005022', color: C.pink },

  // Income bar
  incomeBar: { height: 6, borderRadius: 3, marginBottom: 2 },

  // Risk row
  riskRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  riskDot: { width: 6, height: 6, borderRadius: 3, marginRight: 8, marginTop: 3 },

  // Peer bar
  peerBarBg: { height: 8, backgroundColor: '#1a1a1a', borderRadius: 4, flex: 1 },
  peerBarFill: { height: 8, borderRadius: 4 },

  // Grid
  grid2: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  gridItem: { width: '50%', paddingHorizontal: 4 },

  // Logo
  logoImg: { width: 100, height: 22, objectFit: 'contain' },
  logoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  reportTitle: { fontSize: 9, fontFamily: FONT, color: C.muted },
})

// ── Chart Capture Helpers ──
async function captureElement(el: HTMLElement | null): Promise<string | null> {
  if (!el) return null
  try {
    const canvas = await html2canvas(el, { backgroundColor: '#0a0a0a', scale: 2, useCORS: true, logging: false })
    return canvas.toDataURL('image/png')
  } catch { return null }
}

export async function captureChartImages(reportEl: HTMLElement): Promise<{
  scoreGauge: string | null
  radar: string | null
}> {
  const scoreEl = reportEl.querySelector('[data-pdf="score-gauge"]') as HTMLElement | null
  const radarEl = reportEl.querySelector('[data-pdf="radar-chart"]') as HTMLElement | null

  const [scoreGauge, radar] = await Promise.all([
    captureElement(scoreEl),
    captureElement(radarEl),
  ])
  return { scoreGauge, radar }
}

// ── Section Components ──

function PageFooter({ page, total, logoBase64 }: { page: number; total: number; logoBase64: string | null }) {
  return (
    <View style={S.pageFooter} fixed>
      {logoBase64 ? (
        <Image src={logoBase64} style={S.footerLogo} />
      ) : (
        <Text style={S.footerText}>TokValue.com</Text>
      )}
      <Text style={S.footerText}>TokValue.com · Page {page} / {total}</Text>
    </View>
  )
}

function ReportHeader({ logoBase64, result }: { logoBase64: string | null; result: Evaluation }) {
  return (
    <View style={S.logoContainer}>
      {logoBase64 ? (
        <Image src={logoBase64} style={S.logoImg} />
      ) : (
        <Text style={[S.h1, { fontSize: 16, color: C.cyan }]}>TokValue</Text>
      )}
      <Text style={S.reportTitle}>Account Value Report · {result.username}</Text>
    </View>
  )
}

function SectionHeader({ step, title }: { step: string; title: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={S.sectionStep}>STEP {step}</Text>
      <Text style={S.sectionTitle}>{title}</Text>
    </View>
  )
}

function AccountHeader({ result }: { result: Evaluation }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 14 }}>
      {/* Avatar */}
      {result.avatar ? (
        <Image src={result.avatar} style={S.avatar} />
      ) : (
        <View style={S.avatarPlaceholder}>
          <Text style={S.avatarPlaceholderText}>{result.nickname.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      {/* Info */}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={S.row}>
          <Text style={S.h1}>{result.nickname}</Text>
          {result.verified && <Text style={{ fontSize: 12, color: C.cyan, marginLeft: 6 }}>✓</Text>}
        </View>
        <Text style={{ fontSize: 9, color: C.muted, marginBottom: 4 }}>@{result.username}</Text>
        <View style={[S.row, { gap: 12 }]}>
          <Text style={S.bodyStrong}>{fmt(result.followerCount)} followers</Text>
          <Text style={S.body}>{fmt(result.followingCount)} following</Text>
          <Text style={S.body}>{fmt(result.totalLikes)} likes</Text>
          <Text style={S.body}>{result.videoCount} videos</Text>
        </View>
        {result.accountProfile && (
          <View style={[S.row, { marginTop: 4 }]}>
            {result.accountProfile.categories.map((cat, i) => (
              <Text key={i} style={[S.tag, { marginRight: 4 }]}>{cat}</Text>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

function ValuationSection({ result }: { result: Evaluation }) {
  const { businessValue } = result
  return (
    <View style={S.cardCyan} wrap={false}>
      <SectionHeader step="01" title="Business Valuation" />
      <Text style={S.valueXl}>{fmtUsdRange(businessValue.totalValue.low, businessValue.totalValue.high)}</Text>
      <Text style={[S.body, { marginBottom: 8 }]}>Estimated total account value</Text>

      {/* 5 Components */}
      <View style={S.row}>
        {businessValue.components.map((comp, i) => (
          <View key={i} style={i === 4 ? S.compCardLast : S.compCard}>
            <Text style={S.label}>{comp.label}</Text>
            <Text style={[S.value, { marginBottom: 4, fontSize: 9 }]}>
              {fmtUsd(comp.amount.low)}–{fmtUsd(comp.amount.high)}
            </Text>
            <View style={S.progressBg}>
              <View style={[S.progressFill, {
                width: `${comp.percentage}%`,
                backgroundColor: i === 0 ? C.pink : i === 1 ? C.cyan : i === 2 ? C.amber : i === 3 ? C.green : C.purple,
              }]} />
            </View>
            <Text style={{ fontSize: 6, color: C.dim, marginTop: 2 }}>{pct(comp.percentage)}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

function ConclusionSection({ result }: { result: Evaluation }) {
  return (
    <View style={S.card} wrap={false}>
      <SectionHeader step="02" title="Assessment Conclusion" />
      <Text style={[S.h2, { marginBottom: 8 }]}>{result.summary.headline}</Text>

      <View style={S.row}>
        {/* Strengths */}
        <View style={[S.flex1, { marginRight: 12 }]}>
          <Text style={[S.label, { color: C.green, marginBottom: 4 }]}>Strengths</Text>
          {result.summary.strengths.map((s, i) => (
            <View key={i} style={[S.row, { marginBottom: 3 }]}>
              <View style={[S.dot, S.dotGreen]} />
              <Text style={S.bodyStrong}>{s}</Text>
            </View>
          ))}
        </View>
        {/* Weaknesses */}
        <View style={S.flex1}>
          <Text style={[S.label, { color: C.amber, marginBottom: 4 }]}>Weaknesses</Text>
          {result.summary.weaknesses.map((w, i) => (
            <View key={i} style={[S.row, { marginBottom: 3 }]}>
              <View style={[S.dot, S.dotAmber]} />
              <Text style={S.bodyStrong}>{w}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={S.divider} />

      {/* Verdict */}
      <Text style={[S.h2, { color: C.cyan, marginBottom: 4 }]}>{result.verdict}</Text>
      <Text style={[S.body, { marginBottom: 6 }]}>{result.advice}</Text>
      <Text style={[S.bodyStrong, { color: C.cyan }]}>Price Reference: {result.priceAdvice}</Text>
    </View>
  )
}

function IncomeSection({ result }: { result: Evaluation }) {
  const est = result.incomeEstimate
  return (
    <View style={S.card} wrap={false}>
      <SectionHeader step="03" title="Income & Growth" />
      <Text style={S.valueLg}>{fmtUsdRange(est.monthlyTotal.low, est.monthlyTotal.high)}</Text>
      <Text style={[S.body, { marginBottom: 8 }]}>Est. Monthly Income</Text>

      {/* Income breakdown */}
      {est.breakdown.map((src, i) => (
        <View key={i} style={{ marginBottom: 6 }}>
          <View style={S.rowBetween}>
            <Text style={S.bodyStrong}>{src.label}</Text>
            <Text style={S.value}>{fmtUsdRange(src.monthlyAmount.low, src.monthlyAmount.high)}</Text>
          </View>
          <View style={S.progressBg}>
            <View style={[S.progressFill, {
              width: `${src.percentage}%`,
              backgroundColor: src.confidence === 'high' ? C.green : src.confidence === 'medium' ? C.amber : C.dim,
            }]} />
          </View>
          <Text style={[S.label, { marginTop: 1 }]}>
            {pct(src.percentage)} · {src.confidence} confidence
          </Text>
        </View>
      ))}

      <View style={S.divider} />

      {/* Revenue Roadmap */}
      <Text style={S.h3}>Revenue Roadmap</Text>
      <View style={S.rowBetween}>
        <Text style={S.body}>Current Monthly</Text>
        <Text style={S.value}>{fmtUsdRange(result.revenueRoadmap.currentMonthly.low, result.revenueRoadmap.currentMonthly.high)}</Text>
      </View>
      {result.revenueRoadmap.projections.slice(0, 6).map((m, i) => (
        <View key={i} style={[S.rowBetween, { marginTop: 4 }]}>
          <Text style={S.bodyStrong}>{m.label}</Text>
          <Text style={S.body}>{fmtUsdRange(m.revenue.low, m.revenue.high)}</Text>
        </View>
      ))}
      <View style={[S.rowBetween, { marginTop: 6, paddingTop: 4, borderTopWidth: 1, borderTopColor: C.border }]}>
        <Text style={S.value}>12-Month Total</Text>
        <Text style={[S.value, { color: C.cyan }]}>{fmtUsdRange(result.revenueRoadmap.total12Month.low, result.revenueRoadmap.total12Month.high)}</Text>
      </View>
    </View>
  )
}

function GrowthPlanSection({ result }: { result: Evaluation }) {
  return (
    <View style={S.card} wrap={false}>
      <Text style={S.h3}>Growth Optimization Plan</Text>
      <Text style={[S.body, { marginBottom: 6 }]}>{result.growthPlan.summary}</Text>
      {result.growthPlan.items.map((item, i) => (
        <View key={i} style={[S.row, { marginBottom: 6 }]}>
          <Text style={[S.badge, {
            backgroundColor: item.priority === 'high' ? '#ef444422' : item.priority === 'medium' ? '#f59e0b22' : '#22c55e22',
            color: item.priority === 'high' ? C.red : item.priority === 'medium' ? C.amber : C.green,
            marginRight: 8, marginTop: 1,
          }]}>
            {item.priority === 'high' ? 'HIGH' : item.priority === 'medium' ? 'MED' : 'LOW'}
          </Text>
          <View style={S.flex1}>
            <Text style={S.bodyStrong}>{item.area}: {item.action}</Text>
            <Text style={S.body}>Expected: {item.expectedImpact}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

function RadarRiskSection({ result, radarImg }: { result: Evaluation; radarImg: string | null }) {
  return (
    <View style={S.card} wrap={false}>
      <SectionHeader step="04" title="Radar Score & Risk Detection" />

      <View style={S.row}>
        {/* Radar Chart */}
        <View style={{ width: '48%', marginRight: '4%' }}>
          {radarImg ? (
            <Image src={radarImg} style={[S.chartImg, { height: 180 }]} />
          ) : (
            <View style={{ height: 180, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={S.body}>10-Dimension Radar Score</Text>
            </View>
          )}
        </View>

        {/* Risk Signals */}
        <View style={{ width: '48%' }}>
          <Text style={[S.h3, { marginBottom: 6 }]}>Risk Signals</Text>
          {result.riskFlags.length === 0 ? (
            <Text style={[S.bodyStrong, { color: C.green }]}>No risk signals detected</Text>
          ) : (
            result.riskFlags.map((r, i) => (
              <View key={i} style={S.riskRow}>
                <View style={[S.riskDot, { backgroundColor: r.level === 'high' ? C.red : r.level === 'medium' ? C.amber : C.dim }]} />
                <View style={S.flex1}>
                  <Text style={S.bodyStrong}>{r.label}</Text>
                  <Text style={S.body}>{r.detail}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  )
}

function PeerRankingSection({ result }: { result: Evaluation }) {
  const pr = result.peerRanking
  return (
    <View style={S.card} wrap={false}>
      <SectionHeader step="05" title="Peer Ranking" />
      <View style={S.rowBetween}>
        <View>
          <Text style={S.valueLg}>{pct(pr.overallPercentile)}</Text>
          <Text style={S.body}>Overall Percentile</Text>
        </View>
        <Text style={[S.badge, S.badgeCyan, { fontSize: 9 }]}>{pr.tierLabel}</Text>
      </View>
      <Text style={[S.body, { marginBottom: 8 }]}>{pr.peerGroupDescription}</Text>

      {pr.rankingBreakdown.map((item, i) => (
        <View key={i} style={{ marginBottom: 5 }}>
          <View style={S.rowBetween}>
            <Text style={S.body}>{item.metric}</Text>
            <Text style={S.bodyStrong}>{item.value}</Text>
          </View>
          <View style={S.row}>
            <View style={S.peerBarBg}>
              <View style={[S.peerBarFill, { width: `${item.percentile}%`, backgroundColor: item.barColor }]} />
            </View>
            <Text style={[S.body, { marginLeft: 6, width: 40 }]}>{pct(item.percentile)}</Text>
          </View>
        </View>
      ))}
      <Text style={[S.body, { marginTop: 4, fontStyle: 'italic' }]}>{pr.insight}</Text>
    </View>
  )
}

function BrandMatchingSection({ result }: { result: Evaluation }) {
  const bm = result.brandMatching
  return (
    <View style={S.card} wrap={false}>
      <SectionHeader step="06" title="Brand Matching" />
      <View style={S.rowBetween}>
        <Text style={S.body}>Total Brand Value</Text>
        <Text style={[S.value, { color: C.cyan }]}>{fmtUsdRange(bm.totalBrandValue.low, bm.totalBrandValue.high)}</Text>
      </View>

      {bm.matches.slice(0, 4).map((m, i) => (
        <View key={i} style={[S.row, { marginTop: 8 }]}>
          <View style={[S.flex1, { marginRight: 8 }]}>
            <Text style={S.bodyStrong}>{m.category}</Text>
            <Text style={S.body}>({m.collaborationType})</Text>
            <Text style={[S.body, { fontSize: 7 }]}>{m.exampleBrands.join(', ')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={S.value}>{fmtUsdRange(m.estimatedDealRange.low, m.estimatedDealRange.high)}</Text>
            <Text style={S.label}>per deal · Fit {pct(m.fitScore)}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

function ContentStrategySection({ result }: { result: Evaluation }) {
  const cs = result.contentStrategy
  return (
    <View style={S.card} wrap={false}>
      <SectionHeader step="07" title="Content Strategy" />
      {/* Content Pillars */}
      <Text style={S.h3}>Content Pillars</Text>
      {cs.pillars.map((p, i) => (
        <View key={i} style={[S.row, { marginBottom: 6 }]}>
          <View style={S.flex1}>
            <Text style={S.bodyStrong}>{p.type} ({p.frequency})</Text>
            <Text style={S.body}>{p.why}</Text>
          </View>
          <Text style={[S.badge, S.badgeCyan]}>{p.expectedEngagement}</Text>
        </View>
      ))}

      <View style={S.divider} />
      {/* Hashtags */}
      <Text style={S.h3}>Recommended Hashtags</Text>
      <View style={S.wrap}>
        {cs.recommendedHashtags.map((h, i) => (
          <Text key={i} style={[S.tag, { marginRight: 4, marginBottom: 4 }]}>
            #{h.tag} ({h.volume})
          </Text>
        ))}
      </View>
    </View>
  )
}

function TrendSection({ result }: { result: Evaluation }) {
  const ta = result.trendAnalysis
  return (
    <View style={S.card} wrap={false}>
      <SectionHeader step="08" title="Trend Analysis" />
      {/* Trending Topics */}
      <Text style={S.h3}>Trending Topics</Text>
      {ta.trendingTopics.slice(0, 4).map((t, i) => (
        <View key={i} style={[S.rowBetween, { marginBottom: 4 }]}>
          <Text style={S.bodyStrong}>{t.topic}</Text>
          <Text style={S.body}>Match {pct(t.relevance)} · Growth {t.growth > 0 ? '+' : ''}{t.growth}%</Text>
        </View>
      ))}

      <View style={S.divider} />
      {/* Content Predictions */}
      <Text style={S.h3}>Content Predictions</Text>
      {ta.contentPredictions.map((p, i) => (
        <View key={i} style={[S.row, { marginBottom: 4 }]}>
          <View style={S.flex1}>
            <Text style={S.bodyStrong}>{p.direction}</Text>
            <Text style={S.body}>{p.why}</Text>
          </View>
          <Text style={[S.badge, S.badgeGreen]}>{pct(p.confidence)} confidence</Text>
        </View>
      ))}
    </View>
  )
}

function CommercializationSection({ result }: { result: Evaluation }) {
  const ca = result.commercializationAdvice
  return (
    <View style={S.card} wrap={false}>
      <SectionHeader step="09" title="Monetization Strategy" />
      <View style={S.rowBetween}>
        <View>
          <Text style={S.body}>Primary: {ca.primaryRecommendation}</Text>
          <Text style={S.body}>Secondary: {ca.secondaryRecommendation}</Text>
        </View>
        <Text style={[S.value, { color: C.cyan }]}>{fmtUsdRange(ca.estimatedTotalMonthly.low, ca.estimatedTotalMonthly.high)}</Text>
      </View>

      <View style={S.divider} />

      {ca.directions.map((d, i) => (
        <View key={i} style={{ marginBottom: 8 }}>
          <View style={S.rowBetween}>
            <Text style={S.bodyStrong}>{d.name}</Text>
            <View style={S.row}>
              <Text style={[S.badge, d.difficulty === 'low' ? S.badgeGreen : d.difficulty === 'medium' ? S.badgeAmber : S.badgeRed, { marginRight: 4 }]}>
                {d.difficulty}
              </Text>
              <Text style={[S.badge, d.revenuePotential === 'high' ? S.badgeGreen : d.revenuePotential === 'medium' ? S.badgeAmber : S.badgeRed]}>
                {d.revenuePotential} potential
              </Text>
            </View>
          </View>
          <Text style={S.body}>{d.description}</Text>
          <Text style={S.value}>{fmtUsdRange(d.estimatedMonthlyRevenue.low, d.estimatedMonthlyRevenue.high)}</Text>
        </View>
      ))}
    </View>
  )
}

function DeepAnalysisSection({ result }: { result: Evaluation }) {
  const m = result.metrics
  const ah = result.accountHealth
  return (
    <View style={S.card} wrap={false}>
      <SectionHeader step="10" title="Deep Analysis" />

      {/* Key Metrics */}
      <Text style={S.h3}>Key Metrics</Text>
      <View style={S.row}>
        <View style={S.flex1}>
          <Text style={S.label}>Engagement Rate</Text>
          <Text style={S.value}>{pct(m.engagementRate)}</Text>
        </View>
        <View style={S.flex1}>
          <Text style={S.label}>Avg. Plays</Text>
          <Text style={S.value}>{fmt(m.effectiveAvgPlays)}</Text>
        </View>
        <View style={S.flex1}>
          <Text style={S.label}>Avg. Likes</Text>
          <Text style={S.value}>{fmt(m.avgLikes)}</Text>
        </View>
        <View style={S.flex1}>
          <Text style={S.label}>Avg. Shares</Text>
          <Text style={S.value}>{fmt(m.avgShares)}</Text>
        </View>
      </View>

      <View style={[S.row, { marginTop: 8 }]}>
        <View style={S.flex1}>
          <Text style={S.label}>Play Growth</Text>
          <Text style={[S.value, { color: m.playGrowth >= 0 ? C.green : C.red }]}>
            {m.playGrowth > 0 ? '+' : ''}{m.playGrowth}%
          </Text>
        </View>
        <View style={S.flex1}>
          <Text style={S.label}>Follower Ratio</Text>
          <Text style={S.value}>{m.followerFollowingRatio.toFixed(1)}</Text>
        </View>
        <View style={S.flex1}>
          <Text style={S.label}>Days Since Last Post</Text>
          <Text style={S.value}>{m.daysSinceLastPost}</Text>
        </View>
        <View style={S.flex1}>
          <Text style={S.label}>Account Health</Text>
          <Text style={[S.value, { color: ah.overallScore >= 70 ? C.green : ah.overallScore >= 40 ? C.amber : C.red }]}>
            {ah.overallScore}/100
          </Text>
        </View>
      </View>

      <View style={S.divider} />

      {/* Account Health */}
      <Text style={S.h3}>Account Health</Text>
      <View style={S.row}>
        <View style={S.flex1}>
          <Text style={S.label}>Reach Suppression Risk</Text>
          <Text style={[S.value, {
            color: ah.shadowbanRisk === 'low' ? C.green : ah.shadowbanRisk === 'medium' ? C.amber : C.red,
          }]}>{ah.shadowbanRisk.toUpperCase()}</Text>
        </View>
        <View style={S.flex1}>
          <Text style={S.label}>Est. Fake Followers</Text>
          <Text style={S.value}>{pct(ah.fakeFollowerEstimate)}</Text>
        </View>
        <View style={S.flex1}>
          <Text style={S.label}>Engagement Authenticity</Text>
          <Text style={S.value}>{ah.engagementAuthenticity}/100</Text>
        </View>
      </View>
      {ah.shadowbanSignals.length > 0 && (
        <View style={{ marginTop: 4 }}>
          <Text style={S.label}>Signals:</Text>
          {ah.shadowbanSignals.map((s, i) => (
            <Text key={i} style={[S.body, { color: C.amber }]}>- {s}</Text>
          ))}
        </View>
      )}
    </View>
  )
}

// ── Main Document ──
interface ReportProps {
  result: Evaluation
  chartImages: { scoreGauge: string | null; radar: string | null }
}

function EvaluationReport({ result, chartImages, logoBase64 }: ReportProps & { logoBase64: string | null }) {
  return (
    <Document
      title={`TokValue - @${result.username} Account Value Report`}
      author="TokValue"
      creator="TokValue.com"
      producer="TokValue.com"
    >
      {/* Page 1: Header + Valuation + Conclusion */}
      <Page size="A4" style={S.page}>
        <ReportHeader logoBase64={logoBase64} result={result} />
        <AccountHeader result={result} />
        <ValuationSection result={result} />
        <ConclusionSection result={result} />
        <PageFooter page={1} total={4} logoBase64={logoBase64} />
      </Page>

      {/* Page 2: Income + Growth + Radar/Risk */}
      <Page size="A4" style={S.page}>
        <IncomeSection result={result} />
        <GrowthPlanSection result={result} />
        <PageFooter page={2} total={4} logoBase64={logoBase64} />
      </Page>

      {/* Page 3: Radar/Risk + Peer Ranking + Brand Matching */}
      <Page size="A4" style={S.page}>
        <RadarRiskSection result={result} radarImg={chartImages.radar} />
        <PeerRankingSection result={result} />
        <BrandMatchingSection result={result} />
        <PageFooter page={3} total={4} logoBase64={logoBase64} />
      </Page>

      {/* Page 4: Content + Trend + Commercialization + Deep Analysis */}
      <Page size="A4" style={S.page}>
        <ContentStrategySection result={result} />
        <TrendSection result={result} />
        <CommercializationSection result={result} />
        <DeepAnalysisSection result={result} />
        <PageFooter page={4} total={4} logoBase64={logoBase64} />
      </Page>
    </Document>
  )
}

// ── Export API ──
export async function generatePdfBlob(
  result: Evaluation,
  reportEl: HTMLElement,
): Promise<Blob> {
  await registerFonts()
  const logoBase64 = await getLogoBase64()
  const chartImages = await captureChartImages(reportEl)
  const blob = await pdf(<EvaluationReport result={result} chartImages={chartImages} logoBase64={logoBase64} />).toBlob()
  return blob
}

export async function downloadPdf(
  result: Evaluation,
  reportEl: HTMLElement,
): Promise<void> {
  const blob = await generatePdfBlob(result, reportEl)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `TokValue-${result.username}-${new Date().toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}