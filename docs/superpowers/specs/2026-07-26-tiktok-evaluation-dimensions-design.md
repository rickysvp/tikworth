# TikTok 账号商业价值评估 — 维度扩展设计文档

> 目标：把现有 7 维度评分报告升级为**综合立体的 TikTok 账号商业价值识别与提升工具**。既要让品牌方判断合作价值，也要让创作者看清自己账号的商业潜力并获得可执行的优化方向，还要让新手知道怎么成长到能变现。

---

## 1. 问题与目标

### 1.1 当前问题
- 报告只有 7 维度评分 + 8 个核心指标，信息密度低。
- 缺少账号健康、内容节奏、互动质量、同业对标、品牌合作潜力等深度维度。
- 三类目标用户（品牌方 / 网红 / 新手）看到的内容没有差异化价值。

### 1.2 设计目标

- 在现有 `0-100 评分 + S/A/B/C/D 等级` 基础上，扩展为 **12+ 专业分析维度**。
- 每个维度都要输出三类价值：
  - **识别价值**：这个维度当前是什么水平（分数/等级/百分位）
  - **诊断价值**：问题出在哪、优势是什么
  - **行动价值**：下一步可以做什么来优化或规避风险
- 报告页面从“单页摘要”升级为“分层专业报告”，首屏给快速结论，下方逐层展开深度分析与优化建议。
- 全部基于当前 mock 数据模式实现，后续切换真实 API 时零改动。

---

## 2. 目标用户与输出

| 用户类型 | 核心诉求 | 报告必须回答的问题 | 典型输出 |
|---|---|---|---|
| **品牌方 / 广告主** | 找合适的网红合作 | 这个号值不值得合作？报价多少合理？有没有买粉/限流风险？ | 综合评分、风险信号、品牌适配品类、报价区间、同业对标 |
| **创作者 / 网红本人** | 了解自己账号的商业价值并提升 | 我现在处于什么水平？短板在哪？怎么提升到能接到更高报价？ | 账号健康诊断、内容节奏优化、互动质量提升、变现路径、成长建议 |
| **TikTok 新手** | 学习如何成长到能变现 | 我跟能赚钱的账号差多少？该学哪些点？多久能达到门槛？ | 同体量对标、门槛差距、可复制的节奏与内容策略、成长里程碑 |

报告组织以“**账号商业价值识别 + 提升路径**”为主线，每个分析单元都同时输出：**当前水平 → 问题诊断 → 可执行建议**。用户无论出于什么目的查询，都能拿到直接可用的结论。

---

## 3. 维度框架（综合商业价值识别）

参考 EarnOnX 的多维分析思路，但围绕 **TikTok 账号的商业价值 = 流量资产 × 互动质量 × 变现潜力 × 健康风险** 重新组织。保留并增强现有 7 维度，新增 5 大模块，共 **12 个顶层分析单元**：

### 3.1 保留并增强的现有维度

1. **规模力（Scale）** — 粉丝量级与行业水位
   - 输出：当前粉丝在行业中的位置、距离下一商业化门槛（1K/5K/10K/100K）的差距
2. **互动率（Engagement）** — 点赞/评论/分享/播放综合互动
   - 输出：互动率是否健康、与同体量账号相比如何、低互动可能的优化方向
3. **稳定性（Stability）** — 播放波动与断更风险
   - 输出：流量是否稳定、断更是否影响权重、对创作者和品牌的意义
4. **增长力（Momentum）** — 近期 vs 早期播放增长
   - 输出：账号处于上升/持平/下滑期、创作者该加量还是调整方向
5. **受众质量（Audience）** — 粉关比、粉丝活跃度
   - 输出：粉丝是否真实活跃、是否存在互关刷量、对品牌触达效率的影响
6. **商业意图（Commerce）** — 带货/链接/购物车内容占比
   - 输出：账号是否已有商业化行为、适合哪类变现、品牌方可否直接复用经验
7. **内容力（Content）** — 爆款能力、内容垂直度
   - 输出：内容是否聚焦、爆款/粉丝比如何、新手可复制的点

### 3.2 新增维度

8. **账号健康（AccountHealth）**
   - 综合健康分 0-100，限流风险等级 + 信号清单
   - 增长异常判定、互动真实性、估算假粉比例
   - **输出**：问题在哪、创作者该怎么恢复权重、品牌方该注意什么风险

9. **内容节奏（ContentCadence）**
   - 发视频节奏、日均/周均发布量、最佳时段/星期 Top 3、一致性评分
   - **输出**：当前节奏是否利于增长、创作者该在什么时间加更、新手该怎么定发布计划

10. **互动质量（EngagementQuality）**
    - 评论深度、分享率、收藏率 proxy、病毒系数、Top 5 互动粉丝
    - **输出**：互动是真实还是水、评论质量如何、创作者怎么提升粉丝黏性

11. **同业对标（PeerBenchmark）**
    - 同体量百分位、多指标对标表、相似创作者推荐
    - **输出**：在同粉丝段算什么水平、差距在哪、该向哪些账号学习

12. **品牌合作潜力（BrandPotential）**
    - 品牌合作分 0-100、估算 CPM、粉丝消费力、适合品类、合作类型适配度
    - **输出**：适合接哪类广告、大概能报什么价、创作者该如何提升自己的品牌合作分

### 3.3 结果输出增强

- **verdict（结论）**：一句话总评，同时回答三个问题：这个账号合作价值如何、当前健康状态如何、成长潜力如何。
- **advice（建议）**：一段核心行动建议，覆盖品牌方决策、创作者优化方向、新手可借鉴点。
- **priceAdvice（报价参考）**：保留现有报价区间，并在品牌合作潜力 section 中补充“估算 CPM”和多种计价参考。
- **growthPlan（成长计划）**：新增，按优先级列出 3-5 条可执行优化项，例如“每周稳定发布 5 条”“优化前 3 秒完播”“清理低质量互关粉丝”等，主要服务创作者和新手。

---

## 4. 类型与数据模型

### 4.1 扩展现有 `types.ts`

新增接口（与现有 `Metrics`、`Evaluation` 并存）：

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
  eligiblePrograms: string[] // 如 Creator Fund, Creativity Program, LIVE Gifts, Affiliate
  nearestThreshold: { program: string; gap: string } | null
  estimatedMonthlyUsd: { low: number; mid: number; high: number }
  pathReasoning: string
}

export interface GrowthItem {
  priority: 'high' | 'medium' | 'low'
  area: string // 如 'content', 'cadence', 'engagement', 'health'
  action: string // 可执行动作
  expectedImpact: string // 预期效果
}

export interface GrowthPlan {
  items: GrowthItem[]
  summary: string
}
```

### 4.2 扩展 `Evaluation` 接口

```typescript
export interface Evaluation {
  // ... 现有字段 ...
  accountHealth: AccountHealth
  contentCadence: ContentCadence
  engagementQuality: EngagementQuality
  peerBenchmark: PeerBenchmark
  brandPotential: BrandPotential
  monetizationPath: MonetizationPath
  growthPlan: GrowthPlan
}
```

### 4.3 扩展 `RawProfile`

```typescript
export interface RawProfile {
  // ... 现有字段 ...
  bio?: string
  verified?: boolean
  region?: string
  language?: string
}
```

---

## 5. 算法设计

所有新增维度使用确定性算法，不依赖 LLM。

### 5.1 账号健康（AccountHealth）

```typescript
function judgeAccountHealth(profile: RawProfile, metrics: Metrics): AccountHealth {
  const signals: string[] = []
  let risk: 'low' | 'medium' | 'high' = 'low'

  if (metrics.engagementRate < 0.5) signals.push('互动率极低')
  if (metrics.cvPlays > 0.7) signals.push('播放波动异常')
  if (metrics.playGrowth < -30) signals.push('近期播放大幅下滑')
  if (metrics.daysSinceLastPost > 14) signals.push('超过两周未更新')
  if (profile.followerCount / Math.max(profile.followingCount, 1) < 0.1) signals.push('关注数接近粉丝数')

  if (signals.length >= 3) risk = 'high'
  else if (signals.length >= 1) risk = 'medium'

  const authenticity = clamp(100 - signals.length * 20 - metrics.engagementRate * 2, 0, 100)
  const fakeFollowerEstimate = clamp((1 - authenticity / 100) * 100, 0, 100)

  return {
    overallScore: clamp(100 - signals.length * 18, 0, 100),
    shadowbanRisk: risk,
    shadowbanSignals: signals,
    growthAnomaly: metrics.playGrowth < -40 ? 'abnormal' : metrics.playGrowth < -20 ? 'suspect' : 'normal',
    growthAnomalyReason: metrics.playGrowth < -20 ? '近期播放中位数较前期明显下跌' : '增长趋势正常',
    engagementAuthenticity: Math.round(authenticity),
    fakeFollowerEstimate: Math.round(fakeFollowerEstimate),
    healthReasoning: buildHealthReasoning(risk, signals),
  }
}
```

### 5.2 内容节奏（ContentCadence）

基于最近 30 天内发布视频的时间分布：

```typescript
function analyzeCadence(posts: Post[]): ContentCadence {
  const now = Math.floor(Date.now() / 1000)
  const recent = posts.filter(p => now - p.createTime <= 30 * 86400)
  const avgPerDay = recent.length / 30
  const avgPerWeek = avgPerDay * 7

  const rhythm = avgPerDay >= 0.85 ? 'daily' : avgPerDay >= 0.25 ? 'weekly' : 'irregular'

  // 按小时/星期聚合 engagementRate 取 Top 3
  const bestTimeSlots = aggregateByHour(recent).slice(0, 3)
  const bestWeekdays = aggregateByWeekday(recent).slice(0, 3)

  const consistencyScore = clamp(100 - Math.abs(avgPerDay - 1) * 30, 0, 100)

  return {
    postingRhythm: rhythm,
    avgPostsPerDay: Number(avgPerDay.toFixed(2)),
    avgPostsPerWeek: Number(avgPerWeek.toFixed(1)),
    bestTimeSlots,
    bestWeekdays,
    consistencyScore: Math.round(consistencyScore),
    cadenceAdvice: buildCadenceAdvice(rhythm, consistencyScore),
  }
}
```

### 5.3 互动质量（EngagementQuality）

```typescript
function analyzeEngagementQuality(profile: RawProfile, metrics: Metrics): EngagementQuality {
  const totalInteractions = profile.posts.reduce(
    (s, p) => s + (p.likeCount || 0) + (p.commentCount || 0) + (p.shareCount || 0),
    0
  )
  const totalPlays = profile.posts.reduce((s, p) => s + (p.playCount || 0), 0)

  const shareRatio = totalPlays ? (profile.posts.reduce((s, p) => s + (p.shareCount || 0), 0) / totalPlays) * 100 : 0
  // saveRatio 用收藏 proxy：评论 / 点赞 > 0.2 视为高收藏意愿
  const saveRatio = metrics.avgLikes ? (metrics.avgComments / metrics.avgLikes) * 100 : 0
  const viralCoefficient = totalPlays && profile.followerCount
    ? totalPlays / profile.posts.length / profile.followerCount
    : 0

  return {
    conversationDepth: Number((1 + metrics.avgComments / 100).toFixed(1)),
    shareRatio: Number(shareRatio.toFixed(2)),
    saveRatio: Number(saveRatio.toFixed(2)),
    completionRate: 0, // 真实数据需 API 支持，mock 中按互动率 proxy
    viralCoefficient: Number(viralCoefficient.toFixed(2)),
    topEngagers: generateTopEngagers(profile),
    qualityReasoning: buildQualityReasoning(metrics, shareRatio, viralCoefficient),
  }
}
```

### 5.4 同业对标（PeerBenchmark）

按粉丝量分组，生成同业均值与 Top 10%：

```typescript
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
      status: b.userValue >= b.peerTop10 ? 'above' : b.userValue >= b.peerAvg ? 'average' : 'below',
    })),
    similarCreators: generateSimilarCreators(profile, group),
  }
}
```

### 5.5 品牌合作潜力（BrandPotential）

```typescript
function estimateBrandPotential(profile: RawProfile, metrics: Metrics, health: AccountHealth): BrandPotential {
  const brandScore = clamp(
    metrics.engagementRate * 8 + metrics.avgPlays / profile.followerCount * 15 + health.engagementAuthenticity * 0.2,
    0,
    100
  )

  const baseCpm = brandScore >= 80 ? 20 : brandScore >= 60 ? 14 : brandScore >= 40 ? 9 : 5
  const estimatedCPM = Math.round(baseCpm * (metrics.engagementRate >= 5 ? 1.2 : 1))

  const spendingPower = profile.followerCount > 500_000 ? 'high' : profile.followerCount > 50_000 ? 'medium' : 'low'

  const categories = inferCategories(profile.posts)

  return {
    brandScore: Math.round(brandScore),
    estimatedCPM,
    audienceSpendingPower: spendingPower,
    suitableCategories: categories,
    collaborationTypes: [
      { type: '短视频植入', fit: clamp(brandScore, 0, 100), expectedRevenue: `$${Math.round(estimatedCPM * profile.followerCount / 1000 * 0.7)} - $${Math.round(estimatedCPM * profile.followerCount / 1000 * 1.3)}` },
      { type: '直播带货', fit: clamp(brandScore - 10, 0, 100), expectedRevenue: '按 GMV 分成 10-20%' },
      { type: '联盟分销', fit: clamp(brandScore - 5, 0, 100), expectedRevenue: '按成交 CPS' },
    ],
    brandReasoning: buildBrandReasoning(brandScore, categories),
  }
}
```

### 5.6 变现路径（MonetizationPath）

针对新手和网红本人：

```typescript
function buildMonetizationPath(
  profile: RawProfile,
  metrics: Metrics,
  cadence: ContentCadence
): MonetizationPath {
  const eligible: string[] = []
  if (profile.followerCount >= 10000 && metrics.videoCount >= 10) eligible.push('Creator Fund / Creativity Program')
  if (profile.followerCount >= 1000 && metrics.engagementRate >= 3) eligible.push('LIVE Gifts')
  if (profile.followerCount >= 5000) eligible.push('Affiliate 联盟分销')

  let nearestThreshold = null
  if (eligible.length === 0) {
    nearestThreshold = { program: 'Creator Fund', gap: `还差 ${10000 - profile.followerCount} 粉丝` }
  }

  const monthlyViews = metrics.avgPlays * cadence.avgPostsPerWeek * 4
  const rpm = 2 // 保守 RPM

  return {
    eligiblePrograms: eligible,
    nearestThreshold,
    estimatedMonthlyUsd: {
      low: Math.round(monthlyViews * rpm * 0.5 / 1000),
      mid: Math.round(monthlyViews * rpm / 1000),
      high: Math.round(monthlyViews * rpm * 2 / 1000),
    },
    pathReasoning: buildPathReasoning(eligible, nearestThreshold),
  }
}
```

### 5.7 成长计划（GrowthPlan）

根据所有维度计算结果，按优先级生成 3-5 条可执行建议：

```typescript
function buildGrowthPlan(profile: RawProfile, metrics: Metrics, health: AccountHealth, cadence: ContentCadence): GrowthPlan {
  const items: GrowthItem[] = []

  if (health.shadowbanRisk !== 'low') {
    items.push({
      priority: 'high',
      area: 'health',
      action: '排查限流信号：检查近 10 条视频是否触发违规、是否被限流，必要时停更 3-5 天恢复',
      expectedImpact: '降低限流风险，恢复推荐流量',
    })
  }

  if (metrics.engagementRate < 3) {
    items.push({
      priority: 'high',
      area: 'engagement',
      action: '优化前 3 秒钩子 + 增加评论引导，提升完播和评论率',
      expectedImpact: '互动率从当前水平提升至 3-5%',
    })
  }

  if (cadence.consistencyScore < 60) {
    items.push({
      priority: 'medium',
      area: 'cadence',
      action: `将发布节奏稳定在每周 ${Math.max(3, Math.round(cadence.avgPostsPerWeek))} 条以上，优先在 ${cadence.bestTimeSlots[0]?.hour}:00 左右发布`,
      expectedImpact: '提升账号活跃度和推荐稳定性',
    })
  }

  if (profile.followerCount < 10000) {
    items.push({
      priority: 'medium',
      area: 'content',
      action: '聚焦 1-2 个垂直方向，每条视频带 3-5 个精准话题标签，提升爆款概率',
      expectedImpact: '加速达到 Creator Fund 门槛',
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

---

## 6. Mock 数据策略

扩展 `lib/mock.ts`：

1. 为每个 archetype 增加 `health`、`cadence`、`engagementQuality`、`peerBenchmark`、`brandPotential`、`monetizationPath` 的差异化参数。
2. 使用 `hashString(username)` 保证相同用户名生成相同结果，便于演示。
3. 为已知示例账号（charlidamelio / mrbeast / khaby.lame / zachking / test / fake / dead）绑定特定 archetype。

新增 mock 辅助函数：
- `mockAccountHealth(profile, metrics)`
- `mockContentCadence(profile)`
- `mockEngagementQuality(profile, metrics)`
- `mockPeerBenchmark(profile, metrics)`
- `mockBrandPotential(profile, metrics, health)`
- `mockMonetizationPath(profile, metrics, cadence)`
- `mockGrowthPlan(profile, metrics, health, cadence)`

---

## 7. UI / UX 设计

### 7.1 报告页面结构（page.tsx）

```
① 账号身份卡（ProfileCard）
② 综合评分与等级（ScoreGauge + tier）
③ 一句话结论 + 三视角建议（verdict + advice）
④ 报价参考（priceAdvice）
⑤ 核心指标网格（8 张 MetricCard）
⑥ 近期趋势 + 最佳视频（Trend + Top Post）
⑦ 7 维度评分条形图（DimensionBar）— 现有 7 维度
⑧ 风险信号（RiskList）
⑨ 账号健康诊断（AccountHealthSection）— 新增
⑩ 内容节奏分析（ContentCadenceSection）— 新增
⑪ 互动质量分析（EngagementQualitySection）— 新增
⑫ 同业对标（PeerBenchmarkSection）— 新增
⑬ 品牌合作潜力（BrandPotentialSection）— 新增
⑭ 变现路径与门槛（MonetizationPathSection）— 新增
⑮ 成长优化计划（GrowthPlanSection）— 新增
⑯ 账号基础数据（粉丝 / 总赞 / 视频数）
⑰ 页脚（评估时间 + 免责声明）
```

### 7.2 新增组件

全部放在 `components/sections/`：

- `AccountHealthSection.tsx`
- `ContentCadenceSection.tsx`
- `EngagementQualitySection.tsx`
- `PeerBenchmarkSection.tsx`
- `BrandPotentialSection.tsx`
- `MonetizationPathSection.tsx`
- `GrowthPlanSection.tsx`

复用现有：`ScoreGauge`、`DimensionBar`、`RiskList`、`MetricCard` 风格。

### 7.3 视觉规范

延续现有抖音风格：
- 背景：`#0a0a0a` / `#141414`
- 主色：`#FF0050`（抖音粉）、`#00F2EA`（抖音青）
- 卡片：圆角 2xl、边框 `neutral-800`、hover 微亮
- 图表：Recharts，颜色与主题一致
- 风险徽章：high 红色 / medium 琥珀 / low 绿色

---

## 8. 数据库变更

修改 `lib/db.ts` 中的 `evaluations` 建表语句，新增以下 JSONB 字段：

```sql
account_health JSONB,
content_cadence JSONB,
engagement_quality JSONB,
peer_benchmark JSONB,
brand_potential JSONB,
monetization_path JSONB,
growth_plan JSONB
```

若本地已存在旧表，开发环境下可先删除表让程序自动重建，或手动执行 ALTER TABLE 添加字段。生产环境需单独迁移脚本。

读写逻辑同步扩展，JSON 字段直接存储新增维度对象。

---

## 9. API 与数据流

`/api/evaluate/route.ts` 无需改动接口签名，仍返回 `Evaluation` 对象。

数据流：

```
username → generateMockProfile → scoreProfile → 返回 Evaluation
                              ↘ 新增模块计算函数 ↗
```

`scoreProfile` 内部调用所有新增计算函数，将结果合并到 `Evaluation`。

---

## 10. 实现阶段

### Phase 1：类型与算法骨架
- [ ] 扩展 `types.ts` 新增 7 个接口（6 维度 + GrowthPlan），扩展 `Evaluation` 和 `RawProfile`
- [ ] 在 `lib/scoring.ts` 实现 7 个新增计算函数（6 维度 + 成长计划）
- [ ] `npx tsc --noEmit` 通过

### Phase 2：Mock 数据填充
- [ ] 扩展 `lib/mock.ts` 生成差异化 mock 数据
- [ ] 确保 5 个 archetype 在新增维度上呈现明显差异
- [ ] 验证已知示例账号输出稳定

### Phase 3：UI Section 组件
- [ ] 新建 7 个 section 组件（含 GrowthPlanSection）
- [ ] 在 `app/page.tsx` 按顺序接入
- [ ] 移动端响应式检查

### Phase 4：数据库与历史
- [ ] 扩展 `lib/db.ts` 表结构
- [ ] 更新 `app/history/page.tsx` 展示新增维度摘要

### Phase 5：验证
- [ ] 浏览器搜索 `charlidamelio`、`mrbeast`、`fake`、`dead` 验证差异化
- [ ] 检查 TypeScript、运行时错误
- [ ] 导出 PNG 仍正常工作

---

## 11. 成功标准

- 报告包含 ≥12 个可独立解释的分析单元，每个单元输出“水平 + 诊断 + 行动建议”。
- 同一账号多次评估结果一致（mock 模式下）。
- 品牌方、网红、新手三类用户均能在报告中找到直接可用的信息。
- 创作者能拿到 3-5 条按优先级排序的成长优化项。
- “分析太草率”的反馈不再出现，用户能感知到专业深度。
- TypeScript 零错误，移动端可用，导出 PNG 正常。

---

## 12. 不在本次范围

- 接入真实 RapidAPI 数据（保持 mock 模式）。
- 多语言 i18n（保持中文优先）。
- 用户登录、支付、导出 PDF。
- LLM 生成文案（全部用确定性算法 + 模板）。
