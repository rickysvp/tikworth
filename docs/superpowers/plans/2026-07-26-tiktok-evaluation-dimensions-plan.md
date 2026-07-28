# TikTok 商业价值评估维度扩展 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 7 维度评分基础上，扩展为面向品牌方、创作者、新手的综合立体 TikTok 商业价值评估工具，输出识别 + 诊断 + 行动建议。

**Architecture:** 保持现有 Next.js App Router + mock 数据模式不变。后端在 `lib/scoring.ts` 中新增 6 个维度算法 + 成长计划生成；前端新增 7 个 section 组件展示结果；数据库用 JSONB 字段存储新增维度对象。

**Tech Stack:** Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + Recharts + @neondatabase/serverless

---

## File Structure

| File | Responsibility |
|---|---|
| `types.ts` | 新增 7 个接口，扩展 `Evaluation` / `RawProfile` |
| `lib/scoring.ts` | 新增 6 个维度计算函数 + 成长计划 + 增强 verdict/advice |
| `lib/mock.ts` | 为每个 archetype 生成差异化的新维度 mock 数据 |
| `lib/db.ts` | 新增 JSONB 列，更新读写/序列化逻辑 |
| `components/sections/AccountHealthSection.tsx` | 账号健康诊断展示 |
| `components/sections/ContentCadenceSection.tsx` | 内容节奏分析展示 |
| `components/sections/EngagementQualitySection.tsx` | 互动质量分析展示 |
| `components/sections/PeerBenchmarkSection.tsx` | 同业对标展示 |
| `components/sections/BrandPotentialSection.tsx` | 品牌合作潜力展示 |
| `components/sections/MonetizationPathSection.tsx` | 变现路径与门槛展示 |
| `components/sections/GrowthPlanSection.tsx` | 成长优化计划展示 |
| `app/page.tsx` | 接入新增 section 组件 |
| `app/history/page.tsx` | 可选：展示等级与关键摘要 |

---

## Task 1: Extend `types.ts`

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: Add new interfaces after `Metrics`**

```typescript
export interface AccountHealth {
  overallScore: number
  shadowbanRisk: 'low' | 'medium' | 'high'
  shadowbanSignals: string[]
  growthAnomaly: 'normal' | 'suspect' | 'abnormal'
  growthAnomalyReason: string
  engagementAuthenticity: number
  fakeFollowerEstimate: number
  healthReasoning: string
}

export interface ContentCadence {
  postingRhythm: 'daily' | 'weekly' | 'irregular'
  avgPostsPerDay: number
  avgPostsPerWeek: number
  bestTimeSlots: { hour: number; engagementRate: number }[]
  bestWeekdays: { weekday: string; engagementRate: number }[]
  consistencyScore: number
  cadenceAdvice: string
}

export interface EngagementQuality {
  conversationDepth: number
  shareRatio: number
  saveRatio: number
  completionRate: number
  viralCoefficient: number
  topEngagers: { name: string; handle: string; avatarUrl: string; interactions: number }[]
  qualityReasoning: string
}

export interface PeerBenchmark {
  percentile: number
  peerGroupSize: string
  benchmarks: {
    metric: string
    userValue: number
    peerAvg: number
    peerTop10: number
    status: 'above' | 'average' | 'below'
  }[]
  similarCreators: { name: string; handle: string; avatarUrl: string; followers: number; overlap: number }[]
}

export interface BrandPotential {
  brandScore: number
  estimatedCPM: number
  audienceSpendingPower: 'low' | 'medium' | 'high'
  suitableCategories: string[]
  collaborationTypes: { type: string; fit: number; expectedRevenue: string }[]
  brandReasoning: string
}

export interface MonetizationPath {
  eligiblePrograms: string[]
  nearestThreshold: { program: string; gap: string } | null
  estimatedMonthlyUsd: { low: number; mid: number; high: number }
  pathReasoning: string
}

export interface GrowthItem {
  priority: 'high' | 'medium' | 'low'
  area: string
  action: string
  expectedImpact: string
}

export interface GrowthPlan {
  items: GrowthItem[]
  summary: string
}
```

- [ ] **Step 2: Extend `RawProfile` and `Evaluation`**

```typescript
export interface RawProfile {
  username: string
  nickname: string
  followerCount: number
  followingCount: number
  totalLikes: number
  videoCount: number
  secUid: string
  region?: string
  avatar?: string
  bio?: string
  verified?: boolean
  language?: string
  posts: Post[]
}

export interface Evaluation {
  username: string
  nickname: string
  score: number
  tier: 'S' | 'A' | 'B' | 'C' | 'D'
  dimensions: DimensionScores
  metrics: Metrics
  riskFlags: RiskFlag[]
  verdict: string
  advice: string
  priceAdvice: string
  accountHealth: AccountHealth
  contentCadence: ContentCadence
  engagementQuality: EngagementQuality
  peerBenchmark: PeerBenchmark
  brandPotential: BrandPotential
  monetizationPath: MonetizationPath
  growthPlan: GrowthPlan
  computedAt: string
  mock?: boolean
  cached?: boolean
  avatar?: string
  followerCount: number
  totalLikes: number
  videoCount: number
}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: errors in `scoring.ts` / `mock.ts` / `db.ts` because they don't yet return new fields (acceptable at this stage)

---

## Task 2: Implement Scoring Algorithms

**Files:**
- Modify: `lib/scoring.ts`

- [ ] **Step 1: Update imports**

```typescript
import { RawProfile, Evaluation, DimensionScores, RiskFlag, Metrics, AccountHealth, ContentCadence, EngagementQuality, PeerBenchmark, BrandPotential, MonetizationPath, GrowthPlan, GrowthItem, Post } from '@/types'
```

- [ ] **Step 2: Add helper functions at top of file**

Add after `median()`:

```typescript
function aggregateByHour(posts: Post[]): { hour: number; engagementRate: number }[] {
  const buckets: Record<number, { interactions: number; plays: number }> = {}
  for (const post of posts) {
    const date = new Date((post.createTime || 0) * 1000)
    const hour = date.getHours()
    buckets[hour] = buckets[hour] || { interactions: 0, plays: 0 }
    buckets[hour].interactions += (post.likeCount || 0) + (post.commentCount || 0) + (post.shareCount || 0)
    buckets[hour].plays += post.playCount || 0
  }
  return Object.entries(buckets)
    .map(([hour, data]) => ({
      hour: Number(hour),
      engagementRate: data.plays ? (data.interactions / data.plays) * 100 : 0,
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate)
}

function aggregateByWeekday(posts: Post[]): { weekday: string; engagementRate: number }[] {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const buckets: Record<number, { interactions: number; plays: number }> = {}
  for (const post of posts) {
    const date = new Date((post.createTime || 0) * 1000)
    const day = date.getDay()
    buckets[day] = buckets[day] || { interactions: 0, plays: 0 }
    buckets[day].interactions += (post.likeCount || 0) + (post.commentCount || 0) + (post.shareCount || 0)
    buckets[day].plays += post.playCount || 0
  }
  return Object.entries(buckets)
    .map(([day, data]) => ({
      weekday: labels[Number(day)],
      engagementRate: data.plays ? (data.interactions / data.plays) * 100 : 0,
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate)
}

function peerGroupFromFollowers(followers: number): string {
  if (followers < 1000) return '< 1K 粉丝'
  if (followers < 10000) return '1K-10K 粉丝'
  if (followers < 100000) return '10K-100K 粉丝'
  if (followers < 1000000) return '100K-1M 粉丝'
  return '1M+ 粉丝'
}

function generatePeerAvg(group: string) {
  const map: Record<string, { er: number; avgPlays: number; playGrowth: number; postFreq: number }> = {
    '< 1K 粉丝': { er: 4.5, avgPlays: 800, playGrowth: 5, postFreq: 0.5 },
    '1K-10K 粉丝': { er: 3.8, avgPlays: 3500, playGrowth: 8, postFreq: 0.6 },
    '10K-100K 粉丝': { er: 3.2, avgPlays: 18000, playGrowth: 6, postFreq: 0.7 },
    '100K-1M 粉丝': { er: 2.5, avgPlays: 120000, playGrowth: 4, postFreq: 0.8 },
    '1M+ 粉丝': { er: 1.8, avgPlays: 800000, playGrowth: 2, postFreq: 0.9 },
  }
  return map[group] || map['10K-100K 粉丝']
}

function generatePeerTop10(group: string) {
  const avg = generatePeerAvg(group)
  return {
    er: avg.er * 2.2,
    avgPlays: avg.avgPlays * 3.5,
    playGrowth: avg.playGrowth * 4,
    postFreq: Math.min(avg.postFreq * 2.2, 1.8),
  }
}

function inferCategories(posts: Post[]): string[] {
  const text = posts.map(p => (p.desc || '').toLowerCase()).join(' ')
  const categories: { keyword: string; label: string }[] = [
    { keyword: 'beauty|makeup|skincare|妆容|护肤', label: '美妆护肤' },
    { keyword: 'fashion|ootd|穿搭|衣服', label: '时尚穿搭' },
    { keyword: 'tech|gadget|phone|review|科技|手机', label: '科技数码' },
    { keyword: 'food|recipe|cooking|美食|做饭', label: '美食' },
    { keyword: 'fitness|workout|gym|健身|运动', label: '健身运动' },
    { keyword: 'travel|vlog|trip|旅行', label: '旅行' },
    { keyword: 'game|gaming|play|游戏', label: '游戏' },
    { keyword: 'finance|money|invest|理财|赚钱', label: '金融理财' },
  ]
  const matched = categories.filter(c => new RegExp(c.keyword).test(text)).map(c => c.label)
  return matched.length ? matched : ['生活方式', '泛娱乐']
}

function generateTopEngagers(profile: RawProfile) {
  const names = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan']
  return names.slice(0, 5).map((name, i) => ({
    name,
    handle: `@${name.toLowerCase()}${i + 1}`,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}-${name}`,
    interactions: Math.max(10, Math.floor(profile.followerCount * 0.001 * (1 - i * 0.15))),
  }))
}

function generateSimilarCreators(profile: RawProfile, group: string) {
  const base = ['creator_one', 'creator_two', 'creator_three', 'creator_four', 'creator_five']
  return base.map((handle, i) => ({
    name: `Creator ${i + 1}`,
    handle: `@${handle}`,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`,
    followers: Math.max(1000, Math.floor(profile.followerCount * (0.6 + Math.random() * 0.8))),
    overlap: Math.floor(20 + Math.random() * 60),
  }))
}
```

- [ ] **Step 3: Add dimension calculation functions**

Add before `computeDimensions()`:

```typescript
function judgeAccountHealth(profile: RawProfile, metrics: Metrics): AccountHealth {
  const signals: string[] = []

  if (metrics.engagementRate < 0.5) signals.push('互动率极低，疑似僵尸粉')
  if (metrics.cvPlays > 0.7) signals.push('播放波动异常，流量不稳定')
  if (metrics.playGrowth < -30) signals.push('近期播放大幅下滑')
  if (metrics.daysSinceLastPost > 14) signals.push('超过两周未更新')
  if (profile.followerCount / Math.max(profile.followingCount, 1) < 0.1) signals.push('关注数接近粉丝数，疑似互关刷量')

  const risk: 'low' | 'medium' | 'high' = signals.length >= 3 ? 'high' : signals.length >= 1 ? 'medium' : 'low'
  const authenticity = clamp(100 - signals.length * 18 - Math.max(0, 5 - metrics.engagementRate) * 3, 0, 100)
  const fakeFollowerEstimate = clamp((1 - authenticity / 100) * 100, 0, 100)

  const growthAnomaly: AccountHealth['growthAnomaly'] =
    metrics.playGrowth < -40 ? 'abnormal' : metrics.playGrowth < -20 ? 'suspect' : 'normal'

  const healthReasoning =
    risk === 'high'
      ? `账号存在 ${signals.length} 个明显异常信号，建议先排查风险再考虑合作或变现。`
      : risk === 'medium'
      ? `账号整体正常，但存在 ${signals.length} 个值得关注的问题。`
      : '账号健康状态良好，没有明显风险信号。'

  return {
    overallScore: clamp(100 - signals.length * 18, 0, 100),
    shadowbanRisk: risk,
    shadowbanSignals: signals,
    growthAnomaly,
    growthAnomalyReason: growthAnomaly !== 'normal' ? '近期播放中位数较前期明显下跌' : '增长趋势正常',
    engagementAuthenticity: Math.round(authenticity),
    fakeFollowerEstimate: Math.round(fakeFollowerEstimate),
    healthReasoning,
  }
}

function analyzeCadence(posts: Post[]): ContentCadence {
  const now = Math.floor(Date.now() / 1000)
  const recent = posts.filter(p => p.createTime && now - p.createTime <= 30 * 86400)
  const avgPerDay = recent.length ? recent.length / 30 : 0
  const avgPerWeek = avgPerDay * 7

  const rhythm: ContentCadence['postingRhythm'] =
    avgPerDay >= 0.85 ? 'daily' : avgPerDay >= 0.25 ? 'weekly' : 'irregular'

  const bestTimeSlots = aggregateByHour(recent).slice(0, 3)
  const bestWeekdays = aggregateByWeekday(recent).slice(0, 3)

  const consistencyScore = clamp(100 - Math.abs(avgPerDay - 1) * 30, 0, 100)

  const cadenceAdvice =
    rhythm === 'irregular'
      ? '发布节奏不稳定，建议先固定到每周至少 3 条，培养粉丝预期。'
      : consistencyScore < 60
      ? '已有固定发布习惯，但频率偏低，可尝试在最佳时段加更 1-2 条。'
      : '发布节奏健康，建议继续保持并持续优化内容。'

  return {
    postingRhythm: rhythm,
    avgPostsPerDay: Number(avgPerDay.toFixed(2)),
    avgPostsPerWeek: Number(avgPerWeek.toFixed(1)),
    bestTimeSlots,
    bestWeekdays,
    consistencyScore: Math.round(consistencyScore),
    cadenceAdvice,
  }
}

function analyzeEngagementQuality(profile: RawProfile, metrics: Metrics): EngagementQuality {
  const totalPlays = profile.posts.reduce((s, p) => s + (p.playCount || 0), 0)
  const totalShares = profile.posts.reduce((s, p) => s + (p.shareCount || 0), 0)
  const shareRatio = totalPlays ? (totalShares / totalPlays) * 100 : 0
  const saveRatio = metrics.avgLikes ? (metrics.avgComments / metrics.avgLikes) * 100 : 0
  const viralCoefficient = profile.followerCount && profile.posts.length
    ? totalPlays / profile.posts.length / profile.followerCount
    : 0

  const qualityReasoning =
    metrics.engagementRate >= 5
      ? '互动质量优秀，粉丝活跃度高，适合商业合作。'
      : metrics.engagementRate >= 2
      ? '互动质量合格，可通过优化评论引导和前 3 秒钩子进一步提升。'
      : '互动质量偏低，需优先排查内容吸引力或粉丝真实性。'

  return {
    conversationDepth: Number((1 + metrics.avgComments / 80).toFixed(1)),
    shareRatio: Number(shareRatio.toFixed(2)),
    saveRatio: Number(saveRatio.toFixed(2)),
    completionRate: 0,
    viralCoefficient: Number(viralCoefficient.toFixed(2)),
    topEngagers: generateTopEngagers(profile),
    qualityReasoning,
  }
}

function computePeerBenchmark(profile: RawProfile, metrics: Metrics): PeerBenchmark {
  const group = peerGroupFromFollowers(profile.followerCount)
  const peerAvg = generatePeerAvg(group)
  const peerTop10 = generatePeerTop10(group)

  const benchmarks = [
    { metric: '互动率', userValue: metrics.engagementRate, peerAvg: peerAvg.er, peerTop10: peerTop10.er },
    { metric: '平均播放', userValue: metrics.avgPlays, peerAvg: peerAvg.avgPlays, peerTop10: peerTop10.avgPlays },
    { metric: '播放增长', userValue: metrics.playGrowth, peerAvg: peerAvg.playGrowth, peerTop10: peerTop10.playGrowth },
    { metric: '更新频率', userValue: metrics.daysSinceLastPost <= 2 ? 1 : 0, peerAvg: peerAvg.postFreq, peerTop10: peerTop10.postFreq },
  ]

  const aboveCount = benchmarks.filter(b => b.userValue >= b.peerTop10).length
  const percentile = clamp(50 + aboveCount * 12, 0, 99)

  return {
    percentile,
    peerGroupSize: group,
    benchmarks: benchmarks.map(b => ({
      ...b,
      status: (b.userValue >= b.peerTop10 ? 'above' : b.userValue >= b.peerAvg ? 'average' : 'below') as PeerBenchmark['benchmarks'][0]['status'],
    })),
    similarCreators: generateSimilarCreators(profile, group),
  }
}

function estimateBrandPotential(profile: RawProfile, metrics: Metrics, health: AccountHealth): BrandPotential {
  const avgPlaysToFollowers = profile.followerCount ? metrics.avgPlays / profile.followerCount : 0
  const brandScore = clamp(
    metrics.engagementRate * 8 + avgPlaysToFollowers * 15 + health.engagementAuthenticity * 0.2,
    0,
    100
  )

  const baseCpm = brandScore >= 80 ? 20 : brandScore >= 60 ? 14 : brandScore >= 40 ? 9 : 5
  const estimatedCPM = Math.round(baseCpm * (metrics.engagementRate >= 5 ? 1.2 : 1))

  const spendingPower: BrandPotential['audienceSpendingPower'] =
    profile.followerCount > 500_000 ? 'high' : profile.followerCount > 50_000 ? 'medium' : 'low'

  const categories = inferCategories(profile.posts)

  const estimatedVideoPrice = Math.round((estimatedCPM * profile.followerCount) / 1000)

  return {
    brandScore: Math.round(brandScore),
    estimatedCPM,
    audienceSpendingPower: spendingPower,
    suitableCategories: categories,
    collaborationTypes: [
      { type: '短视频植入', fit: clamp(brandScore, 0, 100), expectedRevenue: `$${Math.round(estimatedVideoPrice * 0.7)} - $${Math.round(estimatedVideoPrice * 1.3)}` },
      { type: '直播带货', fit: clamp(brandScore - 10, 0, 100), expectedRevenue: '按 GMV 分成 10-20%' },
      { type: '联盟分销', fit: clamp(brandScore - 5, 0, 100), expectedRevenue: '按成交 CPS' },
    ],
    brandReasoning:
      brandScore >= 70
        ? `品牌合作潜力较高，${categories.join('、')} 方向匹配度好，可按市场行情报价。`
        : `品牌合作潜力一般，建议先聚焦内容质量和互动率提升。`,
  }
}

function buildMonetizationPath(profile: RawProfile, metrics: Metrics, cadence: ContentCadence): MonetizationPath {
  const eligible: string[] = []
  if (profile.followerCount >= 10000 && metrics.videoCount >= 10) eligible.push('Creator Fund / Creativity Program')
  if (profile.followerCount >= 1000 && metrics.engagementRate >= 3) eligible.push('LIVE Gifts')
  if (profile.followerCount >= 5000) eligible.push('Affiliate 联盟分销')

  const nearestThreshold =
    eligible.length === 0
      ? { program: 'Creator Fund', gap: `还差 ${Math.max(0, 10000 - profile.followerCount)} 粉丝` }
      : null

  const monthlyViews = metrics.avgPlays * cadence.avgPostsPerWeek * 4
  const rpm = 2

  return {
    eligiblePrograms: eligible,
    nearestThreshold,
    estimatedMonthlyUsd: {
      low: Math.round(monthlyViews * rpm * 0.5 / 1000),
      mid: Math.round(monthlyViews * rpm / 1000),
      high: Math.round(monthlyViews * rpm * 2 / 1000),
    },
    pathReasoning:
      eligible.length === 0
        ? `暂未满足主要变现门槛，${nearestThreshold?.gap}，建议持续输出垂直内容。`
        : `已满足 ${eligible.join('、')} 的门槛，可开始尝试变现。`,
  }
}

function buildGrowthPlan(profile: RawProfile, metrics: Metrics, health: AccountHealth, cadence: ContentCadence): GrowthPlan {
  const items: GrowthItem[] = []

  if (health.shadowbanRisk !== 'low') {
    items.push({
      priority: 'high',
      area: '账号健康',
      action: '排查近 10 条视频是否违规或被限流，必要时停更 3-5 天恢复权重',
      expectedImpact: '降低限流风险，恢复推荐流量',
    })
  }

  if (metrics.engagementRate < 3) {
    items.push({
      priority: 'high',
      area: '互动率',
      action: '优化前 3 秒钩子 + 增加评论引导，提升完播和评论率',
      expectedImpact: '互动率从当前水平提升至 3-5%',
    })
  }

  if (cadence.consistencyScore < 60) {
    const bestHour = cadence.bestTimeSlots[0]?.hour ?? 19
    items.push({
      priority: 'medium',
      area: '发布节奏',
      action: `每周稳定发布 ${Math.max(3, Math.round(cadence.avgPostsPerWeek))} 条以上，优先在 ${bestHour}:00 左右发布`,
      expectedImpact: '提升账号活跃度和推荐稳定性',
    })
  }

  if (profile.followerCount < 10000) {
    items.push({
      priority: 'medium',
      area: '内容定位',
      action: '聚焦 1-2 个垂直方向，每条视频带 3-5 个精准话题标签',
      expectedImpact: '加速达到 Creator Fund 门槛',
    })
  }

  if (metrics.cvPlays > 0.5) {
    items.push({
      priority: 'medium',
      area: '流量稳定性',
      action: '分析播放量低谷视频，找出内容或发布时间上的共同点并规避',
      expectedImpact: '降低播放波动，提升账号可预期性',
    })
  }

  return {
    items: items.slice(0, 5),
    summary: items.length
      ? `建议优先处理 ${items.filter(i => i.priority === 'high').length} 项高风险/高回报优化点`
      : '当前账号综合状态良好，继续保持现有节奏',
  }
}
```

- [ ] **Step 4: Enhance verdict and advice**

Replace `buildVerdict` and `buildAdvice`:

```typescript
function buildVerdict(tier: string, score: number, nickname: string, metrics: Metrics, health: AccountHealth): string {
  const tierText: Record<string, string> = {
    S: '顶级账号，互动率与流量稳定性俱佳',
    A: '优质账号，综合表现高于行业平均',
    B: '合格账号，有明显可谈价/提升空间',
    C: '一般账号，部分指标存在短板',
    D: '不建议付费合作或当前变现价值较低',
  }
  const engagementLabel = metrics.engagementRate >= 6 ? '互动率健康' : metrics.engagementRate >= 3 ? '互动率一般' : '互动率偏低'
  const healthLabel = health.shadowbanRisk === 'high' ? '，存在明显健康风险' : health.shadowbanRisk === 'medium' ? '，有轻微风险信号' : ''
  return `${nickname} 为 ${tier}级账号（${score}分），${engagementLabel}。${tierText[tier] || ''}${healthLabel}。`
}

function buildAdvice(tier: string, risks: RiskFlag[], metrics: Metrics, health: AccountHealth, cadence: ContentCadence): string {
  const hasHighRisk = risks.some(r => r.level === 'high')

  if (hasHighRisk) {
    const riskLabels = risks.filter(r => r.level === 'high').map(r => r.label).join('、')
    return `发现高风险信号：${riskLabels}。建议先排查风险，确认账号健康后再考虑合作或变现。`
  }

  if (tier === 'S' || tier === 'A') {
    if (metrics.playGrowth > 20) {
      return '账号正处于流量上升期，建议创作者保持更新节奏并尝试更多变现方式；品牌方可尽快锁定合作档期。'
    }
    return '账号综合质量良好，创作者可重点优化内容垂直度和互动率以提升报价；品牌方合作时重点确认内容与品牌调性匹配。'
  }

  if (tier === 'B') {
    return `账号有商业潜力但存在提升空间。创作者可优先优化${cadence.consistencyScore < 60 ? '发布节奏' : '内容互动'}；品牌方谈判时可参考当前互动率 ${metrics.engagementRate}% 和播放波动 CV ${metrics.cvPlays} 适度压价。`
  }

  if (tier === 'C') {
    return '数据表现平平，创作者建议先免费置换或小预算测试，重点提升完播和互动质量；不建议品牌方直接大额付费投广。'
  }

  return '当前数据商业价值有限。创作者建议以产品置换或小额测试方式接触，同时持续优化内容；品牌方建议谨慎合作。'
}
```

- [ ] **Step 5: Wire everything into `scoreProfile()`**

Replace the `scoreProfile` function:

```typescript
export function scoreProfile(profile: RawProfile): Evaluation {
  const dimensions = computeDimensions(profile)
  const metrics = computeMetrics(profile)
  const score = totalScore(dimensions)
  const tier = tierFromScore(score)
  const riskFlags = detectRisks(profile)
  const accountHealth = judgeAccountHealth(profile, metrics)
  const contentCadence = analyzeCadence(profile.posts)
  const engagementQuality = analyzeEngagementQuality(profile, metrics)
  const peerBenchmark = computePeerBenchmark(profile, metrics)
  const brandPotential = estimateBrandPotential(profile, metrics, accountHealth)
  const monetizationPath = buildMonetizationPath(profile, metrics, contentCadence)
  const growthPlan = buildGrowthPlan(profile, metrics, accountHealth, contentCadence)

  return {
    username: profile.username,
    nickname: profile.nickname || profile.username,
    score,
    tier,
    dimensions,
    metrics,
    riskFlags,
    verdict: buildVerdict(tier, score, profile.nickname || profile.username, metrics, accountHealth),
    advice: buildAdvice(tier, riskFlags, metrics, accountHealth, contentCadence),
    priceAdvice: buildPriceAdvice(tier, profile.followerCount, metrics, riskFlags),
    accountHealth,
    contentCadence,
    engagementQuality,
    peerBenchmark,
    brandPotential,
    monetizationPath,
    growthPlan,
    computedAt: new Date().toISOString(),
    avatar: profile.avatar,
    followerCount: profile.followerCount,
    totalLikes: profile.totalLikes,
    videoCount: profile.videoCount,
  }
}
```

- [ ] **Step 6: Type-check**

Run: `npx tsc --noEmit`
Expected: errors only in `mock.ts` / `db.ts` / `page.tsx` because they don't yet consume new fields

---

## Task 3: Extend Mock Data

**Files:**
- Modify: `lib/mock.ts`

- [ ] **Step 1: Update imports**

```typescript
import { RawProfile, Evaluation, AccountHealth, ContentCadence, EngagementQuality, PeerBenchmark, BrandPotential, MonetizationPath, GrowthPlan } from '@/types'
import { scoreProfile } from './scoring'
```

- [ ] **Step 2: Add mock helper functions after `pickArchetype`**

```typescript
function mockAccountHealth(profile: RawProfile, metrics: import('@/types').Metrics): AccountHealth {
  const er = metrics.engagementRate
  const signals: string[] = []
  if (er < 0.5) signals.push('互动率极低，疑似僵尸粉')
  if (metrics.cvPlays > 0.7) signals.push('播放波动异常，流量不稳定')
  if (metrics.playGrowth < -30) signals.push('近期播放大幅下滑')
  if (metrics.daysSinceLastPost > 14) signals.push('超过两周未更新')
  if (profile.followerCount / Math.max(profile.followingCount, 1) < 0.1) signals.push('关注数接近粉丝数，疑似互关刷量')

  const risk: AccountHealth['shadowbanRisk'] = signals.length >= 3 ? 'high' : signals.length >= 1 ? 'medium' : 'low'
  const authenticity = Math.round(Math.max(0, Math.min(100, 100 - signals.length * 18)))

  return {
    overallScore: Math.round(Math.max(0, 100 - signals.length * 18)),
    shadowbanRisk: risk,
    shadowbanSignals: signals,
    growthAnomaly: metrics.playGrowth < -40 ? 'abnormal' : metrics.playGrowth < -20 ? 'suspect' : 'normal',
    growthAnomalyReason: metrics.playGrowth < -20 ? '近期播放中位数较前期明显下跌' : '增长趋势正常',
    engagementAuthenticity: authenticity,
    fakeFollowerEstimate: Math.round(100 - authenticity),
    healthReasoning: risk === 'high' ? '账号存在多个异常信号，建议先排查风险' : risk === 'medium' ? '账号整体正常，但有个别问题需关注' : '账号健康状态良好',
  }
}

function mockContentCadence(): ContentCadence {
  return {
    postingRhythm: 'daily',
    avgPostsPerDay: 1.1,
    avgPostsPerWeek: 7.7,
    bestTimeSlots: [
      { hour: 19, engagementRate: 5.2 },
      { hour: 12, engagementRate: 4.1 },
      { hour: 21, engagementRate: 3.8 },
    ],
    bestWeekdays: [
      { weekday: '周三', engagementRate: 4.5 },
      { weekday: '周五', engagementRate: 4.2 },
      { weekday: '周六', engagementRate: 3.9 },
    ],
    consistencyScore: 78,
    cadenceAdvice: '发布节奏健康，建议继续保持并在最佳时段发布。',
  }
}

function mockEngagementQuality(profile: RawProfile, metrics: import('@/types').Metrics): EngagementQuality {
  return {
    conversationDepth: Number((1 + metrics.avgComments / 80).toFixed(1)),
    shareRatio: Number((metrics.avgShares / Math.max(metrics.avgPlays, 1) * 100).toFixed(2)),
    saveRatio: Number((metrics.avgComments / Math.max(metrics.avgLikes, 1) * 100).toFixed(2)),
    completionRate: 0,
    viralCoefficient: profile.followerCount ? Number((metrics.avgPlays / profile.followerCount).toFixed(2)) : 0,
    topEngagers: [
      { name: 'Alex', handle: '@alex1', avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}-alex`, interactions: Math.floor(profile.followerCount * 0.002) },
      { name: 'Sam', handle: '@sam2', avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}-sam`, interactions: Math.floor(profile.followerCount * 0.0015) },
      { name: 'Jordan', handle: '@jordan3', avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}-jordan`, interactions: Math.floor(profile.followerCount * 0.001) },
      { name: 'Taylor', handle: '@taylor4', avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}-taylor`, interactions: Math.floor(profile.followerCount * 0.0008) },
      { name: 'Morgan', handle: '@morgan5', avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}-morgan`, interactions: Math.floor(profile.followerCount * 0.0006) },
    ],
    qualityReasoning: metrics.engagementRate >= 5 ? '互动质量优秀' : metrics.engagementRate >= 2 ? '互动质量合格，仍有提升空间' : '互动质量偏低，需优先优化',
  }
}

function mockPeerBenchmark(profile: RawProfile, metrics: import('@/types').Metrics): PeerBenchmark {
  const group = profile.followerCount < 10000 ? '1K-10K 粉丝' : profile.followerCount < 100000 ? '10K-100K 粉丝' : '100K-1M 粉丝'
  const aboveCount = metrics.engagementRate >= 4 ? 2 : metrics.engagementRate >= 2 ? 1 : 0

  return {
    percentile: 50 + aboveCount * 15,
    peerGroupSize: group,
    benchmarks: [
      { metric: '互动率', userValue: metrics.engagementRate, peerAvg: 3.2, peerTop10: 7.0, status: metrics.engagementRate >= 7 ? 'above' : metrics.engagementRate >= 3.2 ? 'average' : 'below' },
      { metric: '平均播放', userValue: metrics.avgPlays, peerAvg: metrics.avgPlays * 0.8, peerTop10: metrics.avgPlays * 2.5, status: 'average' },
      { metric: '播放增长', userValue: metrics.playGrowth, peerAvg: 5, peerTop10: 20, status: metrics.playGrowth >= 20 ? 'above' : metrics.playGrowth >= 5 ? 'average' : 'below' },
      { metric: '更新频率', userValue: metrics.daysSinceLastPost <= 2 ? 1 : 0, peerAvg: 0.7, peerTop10: 1.5, status: metrics.daysSinceLastPost <= 2 ? 'average' : 'below' },
    ],
    similarCreators: [
      { name: 'Creator 1', handle: '@creator_one', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator_one', followers: Math.floor(profile.followerCount * 0.9), overlap: 32 },
      { name: 'Creator 2', handle: '@creator_two', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator_two', followers: Math.floor(profile.followerCount * 1.1), overlap: 28 },
      { name: 'Creator 3', handle: '@creator_three', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator_three', followers: Math.floor(profile.followerCount * 0.7), overlap: 24 },
    ],
  }
}

function mockBrandPotential(profile: RawProfile, metrics: import('@/types').Metrics, health: AccountHealth): BrandPotential {
  const brandScore = Math.round(Math.min(100, metrics.engagementRate * 8 + (metrics.avgPlays / Math.max(profile.followerCount, 1)) * 15 + health.engagementAuthenticity * 0.2))
  const estimatedCPM = brandScore >= 80 ? 24 : brandScore >= 60 ? 16 : brandScore >= 40 ? 10 : 6
  const estimatedPrice = Math.round((estimatedCPM * profile.followerCount) / 1000)

  return {
    brandScore,
    estimatedCPM,
    audienceSpendingPower: profile.followerCount > 500000 ? 'high' : profile.followerCount > 50000 ? 'medium' : 'low',
    suitableCategories: ['生活方式', '泛娱乐'],
    collaborationTypes: [
      { type: '短视频植入', fit: brandScore, expectedRevenue: `$${Math.round(estimatedPrice * 0.7)} - $${Math.round(estimatedPrice * 1.3)}` },
      { type: '直播带货', fit: Math.max(0, brandScore - 10), expectedRevenue: '按 GMV 分成 10-20%' },
      { type: '联盟分销', fit: Math.max(0, brandScore - 5), expectedRevenue: '按成交 CPS' },
    ],
    brandReasoning: brandScore >= 70 ? '品牌合作潜力较高，适合承接短视频植入类合作' : '品牌合作潜力一般，建议先提升互动率和内容垂直度',
  }
}

function mockMonetizationPath(profile: RawProfile, metrics: import('@/types').Metrics): MonetizationPath {
  const eligible: string[] = []
  if (profile.followerCount >= 10000 && metrics.videoCount >= 10) eligible.push('Creator Fund / Creativity Program')
  if (profile.followerCount >= 1000 && metrics.engagementRate >= 3) eligible.push('LIVE Gifts')
  if (profile.followerCount >= 5000) eligible.push('Affiliate 联盟分销')

  return {
    eligiblePrograms: eligible,
    nearestThreshold: eligible.length === 0 ? { program: 'Creator Fund', gap: `还差 ${Math.max(0, 10000 - profile.followerCount)} 粉丝` } : null,
    estimatedMonthlyUsd: { low: 50, mid: 150, high: 400 },
    pathReasoning: eligible.length === 0 ? '暂未满足主要变现门槛，建议持续输出垂直内容' : `已满足 ${eligible.join('、')} 的门槛，可开始尝试变现`,
  }
}

function mockGrowthPlan(): GrowthPlan {
  return {
    items: [
      { priority: 'high', area: '互动率', action: '优化前 3 秒钩子 + 增加评论引导', expectedImpact: '互动率提升至 3-5%' },
      { priority: 'medium', area: '发布节奏', action: '每周稳定发布 5-7 条，优先在 19:00 发布', expectedImpact: '提升账号活跃度' },
    ],
    summary: '建议优先处理 1 项高风险/高回报优化点',
  }
}
```

- [ ] **Step 3: Create a wrapper that calls `scoreProfile` and then overwrites new dimensions**

Replace `generateMockEvaluation`:

```typescript
export function generateMockEvaluation(username: string): Evaluation {
  const profile = generateMockProfile(username)
  const evaluation = scoreProfile(profile)
  const metrics = evaluation.metrics

  return {
    ...evaluation,
    accountHealth: mockAccountHealth(profile, metrics),
    contentCadence: mockContentCadence(),
    engagementQuality: mockEngagementQuality(profile, metrics),
    peerBenchmark: mockPeerBenchmark(profile, metrics),
    brandPotential: mockBrandPotential(profile, metrics, mockAccountHealth(profile, metrics)),
    monetizationPath: mockMonetizationPath(profile, metrics),
    growthPlan: mockGrowthPlan(),
  }
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: errors only in `db.ts` / `page.tsx` / section components

---

## Task 4: Extend Database Layer

**Files:**
- Modify: `lib/db.ts`

- [ ] **Step 1: Update CREATE TABLE statement**

Add new JSONB columns after `video_count INTEGER`:

```sql
account_health JSONB,
content_cadence JSONB,
engagement_quality JSONB,
peer_benchmark JSONB,
brand_potential JSONB,
monetization_path JSONB,
growth_plan JSONB
```

- [ ] **Step 2: Update `saveEvaluation` INSERT/UPDATE columns**

Expand the SQL to include new fields:

```typescript
await getSql()`
  INSERT INTO evaluations
    (username, nickname, score, tier, dimensions, metrics, risk_flags, verdict, advice, price_advice,
     account_health, content_cadence, engagement_quality, peer_benchmark, brand_potential, monetization_path, growth_plan,
     computed_at, avatar, follower_count, total_likes, video_count)
  VALUES
    (${evaluation.username}, ${evaluation.nickname}, ${evaluation.score}, ${evaluation.tier},
     ${JSON.stringify(evaluation.dimensions)}::jsonb, ${JSON.stringify(evaluation.metrics)}::jsonb,
     ${JSON.stringify(evaluation.riskFlags)}::jsonb,
     ${evaluation.verdict}, ${evaluation.advice}, ${evaluation.priceAdvice},
     ${JSON.stringify(evaluation.accountHealth)}::jsonb, ${JSON.stringify(evaluation.contentCadence)}::jsonb,
     ${JSON.stringify(evaluation.engagementQuality)}::jsonb, ${JSON.stringify(evaluation.peerBenchmark)}::jsonb,
     ${JSON.stringify(evaluation.brandPotential)}::jsonb, ${JSON.stringify(evaluation.monetizationPath)}::jsonb,
     ${JSON.stringify(evaluation.growthPlan)}::jsonb,
     ${evaluation.computedAt}, ${evaluation.avatar || null}, ${evaluation.followerCount}, ${evaluation.totalLikes}, ${evaluation.videoCount})
  ON CONFLICT (username) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    score = EXCLUDED.score,
    tier = EXCLUDED.tier,
    dimensions = EXCLUDED.dimensions,
    metrics = EXCLUDED.metrics,
    risk_flags = EXCLUDED.risk_flags,
    verdict = EXCLUDED.verdict,
    advice = EXCLUDED.advice,
    price_advice = EXCLUDED.price_advice,
    account_health = EXCLUDED.account_health,
    content_cadence = EXCLUDED.content_cadence,
    engagement_quality = EXCLUDED.engagement_quality,
    peer_benchmark = EXCLUDED.peer_benchmark,
    brand_potential = EXCLUDED.brand_potential,
    monetization_path = EXCLUDED.monetization_path,
    growth_plan = EXCLUDED.growth_plan,
    computed_at = EXCLUDED.computed_at,
    avatar = EXCLUDED.avatar,
    follower_count = EXCLUDED.follower_count,
    total_likes = EXCLUDED.total_likes,
    video_count = EXCLUDED.video_count
`
```

- [ ] **Step 3: Update `normalizeEvaluation` defaults**

Add after `priceAdvice`:

```typescript
accountHealth: evaluation.accountHealth || {
  overallScore: 0,
  shadowbanRisk: 'low',
  shadowbanSignals: [],
  growthAnomaly: 'normal',
  growthAnomalyReason: '',
  engagementAuthenticity: 0,
  fakeFollowerEstimate: 0,
  healthReasoning: '',
},
contentCadence: evaluation.contentCadence || {
  postingRhythm: 'irregular',
  avgPostsPerDay: 0,
  avgPostsPerWeek: 0,
  bestTimeSlots: [],
  bestWeekdays: [],
  consistencyScore: 0,
  cadenceAdvice: '',
},
engagementQuality: evaluation.engagementQuality || {
  conversationDepth: 0,
  shareRatio: 0,
  saveRatio: 0,
  completionRate: 0,
  viralCoefficient: 0,
  topEngagers: [],
  qualityReasoning: '',
},
peerBenchmark: evaluation.peerBenchmark || {
  percentile: 0,
  peerGroupSize: '',
  benchmarks: [],
  similarCreators: [],
},
brandPotential: evaluation.brandPotential || {
  brandScore: 0,
  estimatedCPM: 0,
  audienceSpendingPower: 'low',
  suitableCategories: [],
  collaborationTypes: [],
  brandReasoning: '',
},
monetizationPath: evaluation.monetizationPath || {
  eligiblePrograms: [],
  nearestThreshold: null,
  estimatedMonthlyUsd: { low: 0, mid: 0, high: 0 },
  pathReasoning: '',
},
growthPlan: evaluation.growthPlan || {
  items: [],
  summary: '',
},
```

- [ ] **Step 4: Update `rowToEvaluation` to read new fields**

Add after `priceAdvice`:

```typescript
accountHealth: parseJson(row.account_health),
contentCadence: parseJson(row.content_cadence),
engagementQuality: parseJson(row.engagement_quality),
peerBenchmark: parseJson(row.peer_benchmark),
brandPotential: parseJson(row.brand_potential),
monetizationPath: parseJson(row.monetization_path),
growthPlan: parseJson(row.growth_plan),
```

Add helper before `rowToEvaluation`:

```typescript
function parseJson(value: unknown): any {
  if (!value) return undefined
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  return value
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors in `lib/`; errors remain in page components

---

## Task 5: Create Section Components

**Files:**
- Create: `components/sections/AccountHealthSection.tsx`
- Create: `components/sections/ContentCadenceSection.tsx`
- Create: `components/sections/EngagementQualitySection.tsx`
- Create: `components/sections/PeerBenchmarkSection.tsx`
- Create: `components/sections/BrandPotentialSection.tsx`
- Create: `components/sections/MonetizationPathSection.tsx`
- Create: `components/sections/GrowthPlanSection.tsx`

- [ ] **Step 1: Create `components/sections/AccountHealthSection.tsx`**

```tsx
'use client'

import { AccountHealth } from '@/types'
import { AlertTriangle, CheckCircle, Activity } from 'lucide-react'

export function AccountHealthSection({ health }: { health: AccountHealth }) {
  const riskColor = health.shadowbanRisk === 'high' ? 'text-red-400' : health.shadowbanRisk === 'medium' ? 'text-amber-400' : 'text-green-400'
  const RiskIcon = health.shadowbanRisk === 'low' ? CheckCircle : AlertTriangle

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">账号健康诊断</h3>
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-3xl font-bold tabular-nums">{health.overallScore}</div>
          <div className="text-xs text-neutral-500 mt-1">健康分</div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <RiskIcon className={`h-6 w-6 ${riskColor}`} />
          <div>
            <div className={`text-sm font-semibold ${riskColor}`}>
              限流风险 {health.shadowbanRisk === 'high' ? '高' : health.shadowbanRisk === 'medium' ? '中' : '低'}
            </div>
            <div className="text-xs text-neutral-500">{health.shadowbanSignals.length} 个信号</div>
          </div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-3xl font-bold tabular-nums">{health.fakeFollowerEstimate}%</div>
          <div className="text-xs text-neutral-500 mt-1">估算假粉</div>
        </div>
      </div>

      {health.shadowbanSignals.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-neutral-300 mb-2">风险信号</div>
          <div className="flex flex-wrap gap-2">
            {health.shadowbanSignals.map((signal, i) => (
              <span key={i} className="rounded-full border border-red-900/50 bg-red-950/30 px-3 py-1 text-xs text-red-300">
                {signal}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-neutral-800 bg-[#141414] p-4">
        <Activity className="mt-0.5 h-5 w-5 shrink-0 text-[#00F2EA]" />
        <p className="text-sm text-neutral-300">{health.healthReasoning}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/sections/ContentCadenceSection.tsx`**

```tsx
'use client'

import { ContentCadence } from '@/types'
import { Clock, Calendar } from 'lucide-react'

export function ContentCadenceSection({ cadence }: { cadence: ContentCadence }) {
  const rhythmLabel = cadence.postingRhythm === 'daily' ? '日更' : cadence.postingRhythm === 'weekly' ? '周更' : '不规律'

  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">内容节奏分析</h3>
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-2xl font-bold">{rhythmLabel}</div>
          <div className="text-xs text-neutral-500 mt-1">发布节奏</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-2xl font-bold">{cadence.avgPostsPerWeek}</div>
          <div className="text-xs text-neutral-500 mt-1">周均发布</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-2xl font-bold">{cadence.consistencyScore}</div>
          <div className="text-xs text-neutral-500 mt-1">一致性评分</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-4">
        <div>
          <div className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2"><Clock className="h-4 w-4" /> 最佳时段</div>
          <div className="space-y-2">
            {cadence.bestTimeSlots.map((slot, i) => (
              <div key={i} className="flex justify-between text-sm rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
                <span className="text-neutral-400">{slot.hour}:00</span>
                <span className="font-medium">{slot.engagementRate.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> 最佳星期</div>
          <div className="space-y-2">
            {cadence.bestWeekdays.map((day, i) => (
              <div key={i} className="flex justify-between text-sm rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
                <span className="text-neutral-400">{day.weekday}</span>
                <span className="font-medium">{day.engagementRate.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-neutral-300">{cadence.cadenceAdvice}</p>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/sections/EngagementQualitySection.tsx`**

```tsx
'use client'

import { EngagementQuality } from '@/types'
import { MessageCircle, Share2, Bookmark, Zap } from 'lucide-react'

export function EngagementQualitySection({ quality }: { quality: EngagementQuality }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">互动质量分析</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Metric icon={<MessageCircle className="h-5 w-5" />} label="评论深度" value={`${quality.conversationDepth}`} />
        <Metric icon={<Share2 className="h-5 w-5" />} label="分享率" value={`${quality.shareRatio}%`} />
        <Metric icon={<Bookmark className="h-5 w-5" />} label="收藏率 proxy" value={`${quality.saveRatio}%`} />
        <Metric icon={<Zap className="h-5 w-5" />} label="病毒系数" value={`${quality.viralCoefficient}x`} />
      </div>

      <p className="text-sm text-neutral-300 mb-4">{quality.qualityReasoning}</p>

      {quality.topEngagers.length > 0 && (
        <div>
          <div className="text-sm font-medium text-neutral-300 mb-2">Top 互动粉丝</div>
          <div className="space-y-2">
            {quality.topEngagers.map((engager, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
                <div className="flex items-center gap-3">
                  <img src={engager.avatarUrl} alt={engager.name} className="h-8 w-8 rounded-full" />
                  <div>
                    <div className="text-sm font-medium">{engager.name}</div>
                    <div className="text-xs text-neutral-500">{engager.handle}</div>
                  </div>
                </div>
                <div className="text-sm text-neutral-300">{engager.interactions} 互动</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-4 text-center">
      <div className="mb-2 flex justify-center text-neutral-500">{icon}</div>
      <div className="text-xl font-bold tabular-nums">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{label}</div>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/sections/PeerBenchmarkSection.tsx`**

```tsx
'use client'

import { PeerBenchmark } from '@/types'
import { TrendingUp, Users } from 'lucide-react'

export function PeerBenchmarkSection({ benchmark }: { benchmark: PeerBenchmark }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">同业对标</h3>
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-3xl font-bold tabular-nums">{benchmark.percentile}%</div>
          <div className="text-xs text-neutral-500 mt-1">同体量百分位</div>
        </div>
        <div className="flex items-center justify-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-center">
            <div className="text-lg font-semibold">{benchmark.peerGroupSize}</div>
            <div className="text-xs text-neutral-500 mt-1">同体量分组</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm font-medium text-neutral-300 mb-3">关键指标对比</div>
        <div className="space-y-2">
          {benchmark.benchmarks.map((b, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 text-sm rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
              <span className="text-neutral-400">{b.metric}</span>
              <span className={b.status === 'above' ? 'text-green-400' : b.status === 'below' ? 'text-red-400' : 'text-amber-400'}>{b.userValue}</span>
              <span className="text-neutral-500">均值 {b.peerAvg}</span>
              <span className="text-neutral-500">Top10% {b.peerTop10}</span>
            </div>
          ))}
        </div>
      </div>

      {benchmark.similarCreators.length > 0 && (
        <div>
          <div className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2"><Users className="h-4 w-4" /> 相似创作者</div>
          <div className="space-y-2">
            {benchmark.similarCreators.map((c, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
                <div className="flex items-center gap-3">
                  <img src={c.avatarUrl} alt={c.name} className="h-8 w-8 rounded-full" />
                  <div>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-xs text-neutral-500">{c.handle}</div>
                  </div>
                </div>
                <div className="text-right text-xs text-neutral-400">
                  <div>{c.followers.toLocaleString()} 粉丝</div>
                  <div>重合度 {c.overlap}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create `components/sections/BrandPotentialSection.tsx`**

```tsx
'use client'

import { BrandPotential } from '@/types'
import { Briefcase, DollarSign } from 'lucide-react'

export function BrandPotentialSection({ potential }: { potential: BrandPotential }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">品牌合作潜力</h3>
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-3xl font-bold tabular-nums">{potential.brandScore}</div>
          <div className="text-xs text-neutral-500 mt-1">品牌合作分</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-2xl font-bold">${potential.estimatedCPM}</div>
          <div className="text-xs text-neutral-500 mt-1">估算 CPM</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-lg font-bold capitalize">{potential.audienceSpendingPower}</div>
          <div className="text-xs text-neutral-500 mt-1">粉丝消费力</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-neutral-300 mb-2">适合合作品类</div>
        <div className="flex flex-wrap gap-2">
          {potential.suitableCategories.map((cat, i) => (
            <span key={i} className="rounded-full border border-[#00F2EA]/30 bg-[#00F2EA]/10 px-3 py-1 text-xs text-[#00F2EA]">
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-neutral-300 mb-2">合作类型适配</div>
        <div className="space-y-2">
          {potential.collaborationTypes.map((collab, i) => (
            <div key={i} className="rounded-xl border border-neutral-800 bg-[#141414] px-3 py-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{collab.type}</span>
                <span className="text-neutral-400">适配度 {collab.fit}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                <div className="h-full bg-[#FF0050]" style={{ width: `${collab.fit}%` }} />
              </div>
              <div className="text-xs text-neutral-500 mt-1">{collab.expectedRevenue}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-sm text-neutral-300">{potential.brandReasoning}</p>
    </div>
  )
}
```

- [ ] **Step 6: Create `components/sections/MonetizationPathSection.tsx`**

```tsx
'use client'

import { MonetizationPath } from '@/types'
import { Wallet, Target } from 'lucide-react'

export function MonetizationPathSection({ path }: { path: MonetizationPath }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-[#0f0f0f] p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-6">变现路径与门槛</h3>

      {path.eligiblePrograms.length > 0 ? (
        <div className="mb-6">
          <div className="text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2"><Wallet className="h-4 w-4" /> 已满足门槛</div>
          <div className="flex flex-wrap gap-2">
            {path.eligiblePrograms.map((program, i) => (
              <span key={i} className="rounded-full border border-green-900/50 bg-green-950/30 px-3 py-1 text-xs text-green-400">
                {program}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-amber-900/50 bg-amber-950/30 p-4">
          <div className="text-sm font-medium text-amber-400 flex items-center gap-2"><Target className="h-4 w-4" /> 最近门槛</div>
          <div className="text-sm text-neutral-300 mt-1">{path.nearestThreshold?.program} — {path.nearestThreshold?.gap}</div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-xl font-bold">${path.estimatedMonthlyUsd.low}</div>
          <div className="text-xs text-neutral-500 mt-1">保守月收益</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-xl font-bold">${path.estimatedMonthlyUsd.mid}</div>
          <div className="text-xs text-neutral-500 mt-1">预期月收益</div>
        </div>
        <div className="text-center rounded-2xl border border-neutral-800 bg-[#141414] p-4">
          <div className="text-xl font-bold">${path.estimatedMonthlyUsd.high}</div>
          <div className="text-xs text-neutral-500 mt-1">理想月收益</div>
        </div>
      </div>

      <p className="text-sm text-neutral-300">{path.pathReasoning}</p>
    </div>
  )
}
```

- [ ] **Step 7: Create `components/sections/GrowthPlanSection.tsx`**

```tsx
'use client'

import { GrowthPlan } from '@/types'
import { ArrowRight, Flag } from 'lucide-react'

export function GrowthPlanSection({ plan }: { plan: GrowthPlan }) {
  return (
    <div className="rounded-2xl border border-[#FF0050]/30 bg-[#FF0050]/5 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-[#FF0050] mb-2">成长优化计划</h3>
      <p className="text-sm text-neutral-300 mb-6">{plan.summary}</p>

      <div className="space-y-3">
        {plan.items.map((item, i) => (
          <div key={i} className="rounded-xl border border-neutral-800 bg-[#0f0f0f] p-4">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${item.priority === 'high' ? 'bg-red-500/20 text-red-400' : item.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'}`}>
                {i + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{item.area}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${item.priority === 'high' ? 'border-red-900/50 text-red-400' : item.priority === 'medium' ? 'border-amber-900/50 text-amber-400' : 'border-green-900/50 text-green-400'}`}>
                    {item.priority === 'high' ? '高优先级' : item.priority === 'medium' ? '中优先级' : '低优先级'}
                  </span>
                </div>
                <p className="text-sm text-neutral-300 mb-1">{item.action}</p>
                <p className="text-xs text-neutral-500">预期效果：{item.expectedImpact}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: errors in `page.tsx` only

---

## Task 6: Integrate Sections into Report Page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Import new section components**

Add to imports:

```typescript
import { AccountHealthSection } from '@/components/sections/AccountHealthSection'
import { ContentCadenceSection } from '@/components/sections/ContentCadenceSection'
import { EngagementQualitySection } from '@/components/sections/EngagementQualitySection'
import { PeerBenchmarkSection } from '@/components/sections/PeerBenchmarkSection'
import { BrandPotentialSection } from '@/components/sections/BrandPotentialSection'
import { MonetizationPathSection } from '@/components/sections/MonetizationPathSection'
import { GrowthPlanSection } from '@/components/sections/GrowthPlanSection'
```

- [ ] **Step 2: Insert sections before account stats grid**

After the `Dimensions & Risks` grid (`</div>` closing the grid), add:

```tsx
{/* New Analysis Sections */}
<div className="space-y-6 mb-10">
  <AccountHealthSection health={result.accountHealth} />
  <ContentCadenceSection cadence={result.contentCadence} />
  <EngagementQualitySection quality={result.engagementQuality} />
  <PeerBenchmarkSection benchmark={result.peerBenchmark} />
  <BrandPotentialSection potential={result.brandPotential} />
  <MonetizationPathSection path={result.monetizationPath} />
  <GrowthPlanSection plan={result.growthPlan} />
</div>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS

---

## Task 7: Optional History Enhancements

**Files:**
- Modify: `app/history/page.tsx`

- [ ] **Step 1: Show tier + brand score summary on history cards**

Add under the existing score/tier block (inside the card):

```tsx
{/* @ts-ignore */}
{item.brandPotential?.brandScore && (
  <div className="text-xs text-neutral-500 mt-1">品牌分 {item.brandPotential.brandScore}</div>
)}
```

This is optional; only if it does not break existing layout.

---

## Task 8: Verification

- [ ] **Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: zero errors

- [ ] **Step 2: Start dev server**

Run: `npm run dev`
Wait for `ready started server` message.

- [ ] **Step 3: Test in browser**

Open http://localhost:3000

Test cases:
- Search `charlidamelio` — verify all 7 new sections render
- Search `fake` — verify AccountHealth shows high risk signals
- Search `dead` — verify low scores and negative growth
- Search `test` — verify growth plan appears

- [ ] **Step 4: Test export**

Click "导出报告 PNG" and verify the image contains new sections.

- [ ] **Step 5: Test history**

Go to `/history` and verify saved evaluations load without errors.

---

## Self-Review

1. **Spec coverage:** All 12 dimensions + growth plan have corresponding tasks. UI integration and DB persistence covered.
2. **Placeholder scan:** No TBD/TODO. All code snippets are complete enough to compile.
3. **Type consistency:** Interfaces, function names, and property names match between `types.ts`, `scoring.ts`, `mock.ts`, `db.ts`, and components.
4. **Scope:** This plan stays within the spec scope: mock-only data, no real API changes, no auth/payment, no PDF export.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-07-26-tiktok-evaluation-dimensions-plan.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach do you prefer?
