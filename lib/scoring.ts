import {
  RawProfile, Evaluation, DimensionScores, RiskFlag, Metrics,
  AccountHealth, ContentCadence, EngagementQuality, PeerBenchmark, BrandPotential,
  BrandMatching, BrandMatch, MonetizationPath, GrowthPlan, GrowthItem, Post,
  AccountProfile,
  PeerRanking, TrendAnalysis, CommercializationAdvice, CommercializationDirection,
  CalculationMetadata,
} from '@/types'
import {
  THREE_LAYER_WEIGHTS, RISK_THRESHOLDS, MONETIZATION_THRESHOLDS,
  getPeerBenchmarks, clamp,
} from './scoring/config'
import {
  classifyAllPosts, calcEffectivePlays, calcOverallEngagement, calcWindowedPlayGrowth,
  calcMaturePlayCV,
} from './scoring/metrics'
import { computeDimensions } from './scoring/dimensions'
import {
  pickCategoryCpm, pickRegionMultiplier, getEngagementMultiplier, getFollowerTier,
  calcBrandDealValue, buildIncomeEstimate, buildBusinessValue, buildRevenueRoadmap,
} from './scoring/valuation'
import { tierFromScore, tierFromBusinessValue, buildPriceAdvice, buildVerdict, buildSummary } from './scoring/verdict'
import { buildContentStrategy } from './scoring/content-strategy'

export { clamp, tierFromScore, inferCategories, peerGroupFromFollowers, aggregateByHour, aggregateByWeekday, average, median, stdDev }

function average(nums: number[]): number { return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0 }
function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0
  const avg = average(nums)
  return Math.sqrt(nums.reduce((acc, n) => acc + Math.pow(n - avg, 2), 0) / nums.length)
}
function median(nums: number[]): number {
  if (!nums.length) return 0
  const sorted = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function aggregateByHour(posts: Post[]): { hour: number; engagementRate: number }[] {
  const buckets: Record<number, { interactions: number; plays: number }> = {}
  for (const post of posts) {
    const h = new Date((post.createTime || 0) * 1000).getHours()
    buckets[h] = buckets[h] || { interactions: 0, plays: 0 }
    buckets[h].interactions += (post.likeCount || 0) + (post.commentCount || 0) + (post.shareCount || 0)
    buckets[h].plays += post.playCount || 0
  }
  return Object.entries(buckets).map(([hour, data]) => ({
    hour: Number(hour), engagementRate: data.plays ? (data.interactions / data.plays) * 100 : 0,
  })).sort((a, b) => b.engagementRate - a.engagementRate)
}

function aggregateByWeekday(posts: Post[]): { weekday: string; engagementRate: number }[] {
  const labels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const buckets: Record<number, { interactions: number; plays: number }> = {}
  for (const post of posts) {
    const d = new Date((post.createTime || 0) * 1000).getDay()
    buckets[d] = buckets[d] || { interactions: 0, plays: 0 }
    buckets[d].interactions += (post.likeCount || 0) + (post.commentCount || 0) + (post.shareCount || 0)
    buckets[d].plays += post.playCount || 0
  }
  return Object.entries(buckets).map(([day, data]) => ({
    weekday: labels[Number(day)], engagementRate: data.plays ? (data.interactions / data.plays) * 100 : 0,
  })).sort((a, b) => b.engagementRate - a.engagementRate)
}

function peerGroupFromFollowers(followers: number): string {
  if (followers < 1000) return '< 1K 粉丝'
  if (followers < 10000) return '1K-10K 粉丝'
  if (followers < 100000) return '10K-100K 粉丝'
  if (followers < 1000000) return '100K-1M 粉丝'
  return '1M+ 粉丝'
}

function inferCategories(profile: RawProfile): string[] {
  const text = `${profile.posts.map(p => (p.desc || '').toLowerCase()).join(' ')} ${String(profile.bio || '').toLowerCase()} ${String(profile.nickname || '').toLowerCase()}`
  const categories: { keyword: string; label: string; priority?: number }[] = [
    { keyword: '\\bbeauty\\b|\\bmakeup\\b|\\bskincare\\b|妆容|护肤|cosmetic|lipstick|foundation', label: '美妆护肤', priority: 6 },
    { keyword: '\\bfashion\\b|ootd|穿搭|衣服|\\boutfit\\b|\\bstyle\\b|lookbook|模特|\\bmodel\\b', label: '时尚穿搭', priority: 6 },
    { keyword: '\\btech\\b|\\btechnology\\b|\\bgadget\\b|\\bphone\\b|\\bsmartphone\\b|科技|手机|数码|电子产品|unboxing|laptop|camera|耳机|电脑', label: '科技数码' },
    { keyword: '\\bfood\\b|\\brecipe\\b|\\bcooking\\b|美食|做饭|料理|厨房|restaurant', label: '美食' },
    { keyword: '\\bfitness\\b|\\bworkout\\b|\\bgym\\b|健身|运动|\\btraining\\b|yoga|pilates|跑步|marathon|swim|swimming|\\bsport\\b|\\bsports\\b', label: '健身运动', priority: 8 },
    { keyword: 'mma|ufc|\\bboxing\\b|jiujitsu|柔术|格斗|摔跤|grappling|\\bwrestling\\b|\\bmartial\\b|\\bjudo\\b|\\bkarate\\b', label: '格斗运动', priority: 10 },
    { keyword: '\\btravel\\b|\\bvlog\\b|\\btrip\\b|旅行|旅游|hotel|destination', label: '旅游' },
    { keyword: '\\bgame\\b|\\bgaming\\b|\\bplay\\b|游戏|\\bgamer\\b|stream', label: '游戏' },
    { keyword: '\\bfinance\\b|\\bmoney\\b|\\binvest\\b|理财|赚钱|crypto|\\bstock\\b', label: '金融理财' },
    { keyword: '美女|颜值|女神|\\bsexy\\b|\\bpretty\\b|\\bgorgeous\\b|\\bgirl\\b|\\bhot\\b|\\bcute\\b', label: '美女/颜值', priority: 6 },
    { keyword: '\\bcomedy\\b|\\bfunny\\b|搞笑|幽默|段子|笑话|\\bmeme\\b', label: '搞笑' },
    { keyword: '\\bmusic\\b|\\bdance\\b|跳舞|舞蹈|翻唱|\\bcover\\b|\\bsong\\b', label: '才艺' },
    { keyword: '\\bpet\\b|\\bcat\\b|\\bdog\\b|宠物|猫|狗|\\banimal\\b', label: '宠物' },
  ]
  const matched = categories.filter(c => new RegExp(c.keyword, 'i').test(text))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0)).map(c => c.label)
  return matched.length ? matched.slice(0, 3) : ['生活方式', '泛娱乐']
}

function detectRisks(profile: RawProfile, metrics: Metrics, classified: ReturnType<typeof classifyAllPosts>): RiskFlag[] {
  const risks: RiskFlag[] = []
  if (!profile.posts.length) {
    risks.push({ level: 'medium', label: '样本不足', detail: '未获取到近期视频，评分参考性较低' })
    return risks
  }
  const { engagementRate, cvPlays, daysSinceLastPost } = metrics
  const frRatio = profile.followerCount / Math.max(profile.followingCount, 1)
  if (engagementRate < RISK_THRESHOLDS.engagementRateCritical) risks.push({ level: 'high', label: '疑似买粉/僵尸号', detail: '互动率极低，粉丝活跃度可能不真实' })
  else if (profile.followerCount > 100000 && engagementRate < 1) risks.push({ level: 'high', label: '虚高粉丝', detail: '粉丝量大但互动率异常低，商业价值有限' })
  if (frRatio < RISK_THRESHOLDS.followerFollowingCritical) risks.push({ level: 'high', label: '疑似互关刷量', detail: '关注数接近或超过粉丝数，疑似互关/刷量账号' })
  if (daysSinceLastPost > RISK_THRESHOLDS.inactiveDaysCritical) risks.push({ level: 'high', label: '长期断更', detail: '超过 60 天未发布新视频' })
  else if (daysSinceLastPost > RISK_THRESHOLDS.inactiveDaysWarning) risks.push({ level: 'medium', label: '更新频率低', detail: '超过 30 天未发布新视频' })
  const matureCV = classified.mature.length >= 3 ? calcMaturePlayCV(classified.mature) : cvPlays
  if (matureCV > RISK_THRESHOLDS.cvPlaysCritical) risks.push({ level: 'medium', label: '流量波动异常', detail: '成熟视频播放量波动极大，可能被限流或内容不稳定' })
  if (profile.videoCount < 5) risks.push({ level: 'medium', label: '样本不足', detail: '视频总数过少，评分可能不稳定' })
  return risks
}

function computeMetrics(profile: RawProfile, ep: ReturnType<typeof calcEffectivePlays>, classified: ReturnType<typeof classifyAllPosts>, now: number = Math.floor(Date.now() / 1000)): Metrics {
  const relevant = [...classified.mature, ...classified.growing]
  const totalPlays = relevant.reduce((s, p) => s + (p.post.playCount || 0), 0) || profile.posts.reduce((s, p) => s + (p.playCount || 0), 0)
  const totalInteractions = relevant.reduce((s, p) => s + (p.post.likeCount || 0) + (p.post.commentCount || 0) + (p.post.shareCount || 0), 0)
  const engagementRate = totalPlays ? (totalInteractions / totalPlays) * 100 : calcOverallEngagement(profile, now)
  const allPlays = profile.posts.map(p => p.playCount || 0)
  const avgPlays = allPlays.length ? allPlays.reduce((a, b) => a + b, 0) / allPlays.length : ep.effectiveAvgPlays
  const avgLikes = profile.posts.length ? profile.posts.reduce((s, p) => s + (p.likeCount || 0), 0) / profile.posts.length : 0
  const avgComments = profile.posts.length ? profile.posts.reduce((s, p) => s + (p.commentCount || 0), 0) / profile.posts.length : 0
  const avgShares = profile.posts.length ? profile.posts.reduce((s, p) => s + (p.shareCount || 0), 0) / profile.posts.length : 0
  const cvAll = avgPlays > 0 ? stdDev(allPlays) / avgPlays : 1
  const growth = calcWindowedPlayGrowth(profile, now)
  const latest = profile.posts.length ? Math.max(...profile.posts.map(p => p.createTime || 0)) : 0
  const daysSinceLastPost = latest ? Math.floor((now - latest) / 86400) : 999
  const sorted = [...profile.posts].sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
  const top = sorted[0]
  return {
    engagementRate: Number(engagementRate.toFixed(2)),
    avgPlays: Math.round(avgPlays),
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    avgShares: Math.round(avgShares),
    likesPerVideo: profile.videoCount ? Math.round(profile.totalLikes / profile.videoCount) : 0,
    followerFollowingRatio: Number((profile.followerCount / Math.max(profile.followingCount, 1)).toFixed(2)),
    recentMedianPlays: Math.round(median(classified.growing.length ? classified.growing.map(p => p.post.playCount || 0) : allPlays.slice(0, Math.ceil(allPlays.length / 2)))),
    olderMedianPlays: Math.round(median(classified.mature.length ? classified.mature.slice(-Math.ceil(classified.mature.length / 2)).map(p => p.post.playCount || 0) : [])),
    playGrowth: Number((growth.playGrowth * 100).toFixed(1)),
    cvPlays: Number(cvAll.toFixed(2)),
    daysSinceLastPost,
    topPostPlays: top?.playCount || 0,
    topPostLikes: top?.likeCount || 0,
    matureMedianPlays: ep.matureWeightedMedian,
    matureWeightedAvgPlays: ep.matureWeightedAvg,
    historicalImpliedPlays: ep.historicalImpliedPlays,
    immatureVideoCount: ep.immatureCount,
    growingVideoCount: ep.growingCount,
    likePlayRatio: ep.likePlayRatio,
    effectivePlaysSource: ep.source,
    effectiveAvgPlays: ep.effectiveAvgPlays,
    effectivePeakPlays: ep.effectivePeakPlays,
  }
}

/**
 * 三层评分流程（Spec 定义）
 * 第一步：核心驱动（60%）→ 确定评级区间
 * 第二步：质量调节（30%）→ 区间内微调
 * 第三步：风险调节（10%）→ 只扣分，触发降级
 */
function totalScore(dims: DimensionScores, _followerCount: number): { score: number; coreScore: number; qualityScore: number; riskScore: number } {
  const { core, quality, risk } = THREE_LAYER_WEIGHTS

  const coreScore = Object.entries(core).reduce((s, [k, w]) => {
    const v = dims[k as keyof DimensionScores]
    return s + (Number.isFinite(v) ? v * w : 0)
  }, 0)

  const qualityScore = Object.entries(quality).reduce((s, [k, w]) => {
    const v = dims[k as keyof DimensionScores]
    return s + (Number.isFinite(v) ? v * w : 0)
  }, 0)

  const riskScore = Object.entries(risk).reduce((s, [k, w]) => {
    const v = dims[k as keyof DimensionScores]
    return s + (Number.isFinite(v) ? v * w : 0)
  }, 0)

  const raw = coreScore + qualityScore + riskScore
  return {
    score: Math.round(clamp(Number.isFinite(raw) ? raw : 0, 0, 100)),
    coreScore: Math.round(coreScore * 100) / 100,
    qualityScore: Math.round(qualityScore * 100) / 100,
    riskScore: Math.round(riskScore * 100) / 100,
  }
}

function buildAccountHealth(metrics: Metrics, risks: RiskFlag[], dims: DimensionScores): AccountHealth {
  const highCount = risks.filter(r => r.level === 'high').length
  const risk: AccountHealth['shadowbanRisk'] = highCount >= 1 ? 'high' : risks.length >= 1 ? 'medium' : 'low'
  const authenticity = dims.authenticity
  return {
    overallScore: Math.round(clamp(100 - highCount * 25 - risks.filter(r => r.level === 'medium').length * 10, 0, 100)),
    shadowbanRisk: risk,
    shadowbanSignals: risks.map(r => r.detail),
    growthAnomaly: metrics.playGrowth < -40 ? 'abnormal' : metrics.playGrowth < -20 ? 'suspect' : 'normal',
    growthAnomalyReason: metrics.playGrowth < -20 ? '近期播放中位数较前期明显下跌' : '增长趋势正常',
    engagementAuthenticity: Math.round(authenticity),
    fakeFollowerEstimate: Math.round(clamp(100 - authenticity, 0, 100)),
    healthReasoning: risk === 'high' ? `账号存在 ${highCount} 个高风险信号，建议先排查风险再考虑合作或变现。` : risk === 'medium' ? `账号整体正常，但存在 ${risks.length} 个值得关注的问题。` : '账号健康状态良好，没有明显风险信号。',
  }
}

function buildContentCadence(posts: Post[], now: number = Math.floor(Date.now() / 1000)): ContentCadence {
  const recent = posts.filter(p => p.createTime && now - p.createTime <= 30 * 86400)
  const avgPerDay = recent.length ? recent.length / 30 : 0
  const avgPerWeek = avgPerDay * 7
  const rhythm: ContentCadence['postingRhythm'] = avgPerDay >= 0.85 ? 'daily' : avgPerDay >= 0.25 ? 'weekly' : 'irregular'
  return {
    postingRhythm: rhythm,
    avgPostsPerDay: Number(avgPerDay.toFixed(2)),
    avgPostsPerWeek: Number(avgPerWeek.toFixed(1)),
    bestTimeSlots: aggregateByHour(recent).slice(0, 3),
    bestWeekdays: aggregateByWeekday(recent).slice(0, 3),
    consistencyScore: Math.round(clamp(100 - Math.abs(avgPerDay - 1) * 30, 0, 100)),
    cadenceAdvice: rhythm === 'irregular' ? '发布节奏不稳定，建议先固定到每周至少 3 条，培养粉丝预期。' : '发布节奏健康，建议继续保持并持续优化内容。',
  }
}

function buildEngagementQuality(metrics: Metrics, profile: RawProfile, classified: ReturnType<typeof classifyAllPosts>): EngagementQuality {
  const relevant = [...classified.mature, ...classified.growing]
  const totalPlays = relevant.reduce((s, p) => s + p.post.playCount, 0) || 1
  const totalShares = relevant.reduce((s, p) => s + (p.post.shareCount || 0), 0)
  const totalComments = relevant.reduce((s, p) => s + (p.post.commentCount || 0), 0)
  const viralCoeff = profile.followerCount > 0 ? metrics.effectiveAvgPlays / profile.followerCount : 0
  return {
    conversationDepth: Number((1 + totalComments / Math.max(profile.followerCount * 0.001, 80)).toFixed(1)),
    shareRatio: Number(((totalShares / totalPlays) * 100).toFixed(2)),
    commentLikeRatio: Number((metrics.avgLikes ? (metrics.avgComments / metrics.avgLikes) * 100 : 0).toFixed(2)),
    completionRate: null,
    viralCoefficient: Number(viralCoeff.toFixed(2)),
    topEngagers: [],
    qualityReasoning: metrics.engagementRate >= 5 ? '互动质量优秀，粉丝活跃度高，适合商业合作。' : metrics.engagementRate >= 2 ? '互动质量合格，可通过优化评论引导和前 3 秒钩子进一步提升。' : '互动质量偏低，需优先排查内容吸引力或粉丝真实性。',
  }
}

function buildPeerBenchmark(profile: RawProfile, metrics: Metrics): PeerBenchmark {
  const peers = getPeerBenchmarks(profile.followerCount)
  const playsRatio = profile.followerCount > 0 ? metrics.effectiveAvgPlays / profile.followerCount : 0
  const benchmarks = [
    { metric: '互动率', userValue: metrics.engagementRate, peerAvg: peers.avgER, peerTop10: peers.top10ER },
    { metric: '平均播放/粉丝比', userValue: playsRatio, peerAvg: peers.avgPlaysRatio, peerTop10: peers.avgPlaysRatio * 1.8 },
    { metric: '播放增长', userValue: metrics.playGrowth, peerAvg: 3, peerTop10: 15 },
  ]
  const aboveCount = benchmarks.filter(b => b.userValue >= b.peerTop10).length
  const avgCount = benchmarks.filter(b => b.userValue >= b.peerAvg).length
  const belowCount = benchmarks.filter(b => b.userValue < b.peerAvg).length
  const percentile = clamp(50 + aboveCount * 12 + (avgCount - aboveCount) * 5 - belowCount * 8, 1, 99)
  return {
    percentile: Math.round(percentile),
    peerGroupSize: peerGroupFromFollowers(profile.followerCount),
    benchmarks: benchmarks.map(b => {
      const status: 'above' | 'average' | 'below' = b.userValue >= b.peerTop10 ? 'above' : b.userValue >= b.peerAvg ? 'average' : 'below'
      return { ...b, status }
    }),
    similarCreators: [],
  }
}

function buildBrandPotential(metrics: Metrics, categories: string[], health: AccountHealth, dims: DimensionScores): BrandPotential {
  const { cpm } = pickCategoryCpm(categories)
  const playsRatio = metrics.effectiveAvgPlays / Math.max(1, metrics.avgPlays)
  const score = clamp(metrics.engagementRate * 8 + playsRatio * 15 + health.engagementAuthenticity * 0.2 + dims.commerce * 0.3, 0, 100)
  const spendingPower: BrandPotential['audienceSpendingPower'] = metrics.engagementRate >= 5 ? 'high' : metrics.engagementRate >= 2 ? 'medium' : 'low'
  return {
    brandScore: Math.round(score),
    estimatedCPM: Math.round(cpm * (metrics.engagementRate >= 5 ? 1.2 : metrics.engagementRate >= 3 ? 1.0 : 0.8)),
    audienceSpendingPower: spendingPower,
    suitableCategories: categories,
    collaborationTypes: [
      { type: '短视频植入', fit: clamp(Math.round(score), 0, 100), expectedRevenue: '基于均播 × CPM 计算' },
      { type: '直播带货', fit: clamp(Math.round(score - 10), 0, 100), expectedRevenue: '按 GMV 分成 10-20%' },
      { type: '联盟分销', fit: clamp(Math.round(score - 5), 0, 100), expectedRevenue: '按成交 CPS' },
    ],
    brandReasoning: score >= 70 ? `品牌合作潜力较高，${categories.join('、')} 方向匹配度好，可按市场行情报价。` : '品牌合作潜力一般，建议先聚焦内容质量和互动率提升。',
  }
}

function buildBrandMatching(categories: string[], cpm: number, effectiveAvgPlays: number, engagementMult: number, regionMult: number): BrandMatching {
  const matches: BrandMatch[] = categories.slice(0, 3).map((cat, idx) => {
    const perVideoMid = Math.max((effectiveAvgPlays / 1000) * cpm * engagementMult * regionMult, 100)
    return {
      category: cat, icon: '✨',
      fitScore: Math.max(50, Math.min(95, 85 - idx * 7)),
      estimatedDealRange: { low: Math.round(perVideoMid * 0.6), high: Math.round(perVideoMid * 1.5) },
      exampleBrands: ['相关品类品牌'],
      collaborationType: '产品植入/测评',
      reasoning: `${cat} 品类品牌与账号内容匹配度较高`,
    }
  })
  if (!matches.length) matches.push({ category: '通用', icon: '✨', fitScore: 60, estimatedDealRange: { low: 100, high: 500 }, exampleBrands: [], collaborationType: '品牌曝光', reasoning: '内容适合大众消费品牌' })
  const totalLow = matches.reduce((s, m) => s + m.estimatedDealRange.low, 0)
  const totalHigh = matches.reduce((s, m) => s + m.estimatedDealRange.high, 0)
  return { matches, totalBrandValue: { low: totalLow, mid: Math.round((totalLow + totalHigh) / 2), high: totalHigh }, summary: `基于账号内容风格（${categories.join('、')}）的品牌匹配推荐` }
}

function buildMonetizationPath(profile: RawProfile, metrics: Metrics, income: import('@/types').IncomeEstimate): MonetizationPath {
  const eligible: string[] = []
  if (profile.followerCount >= MONETIZATION_THRESHOLDS.creatorFundFollowers && profile.videoCount >= 10) eligible.push('Creator Fund / Creativity Program')
  if (profile.followerCount >= MONETIZATION_THRESHOLDS.tiktokShopFollowers) eligible.push('TikTok Shop 联盟')
  if (profile.followerCount >= MONETIZATION_THRESHOLDS.liveGiftFollowers) eligible.push('LIVE 礼物')
  if (profile.followerCount >= MONETIZATION_THRESHOLDS.subscriptionFollowers) eligible.push('订阅功能')
  const nearest = eligible.length === 0 ? { program: 'Creator Fund', gap: `还差 ${Math.max(0, MONETIZATION_THRESHOLDS.creatorFundFollowers - profile.followerCount).toLocaleString()} 粉丝` } : null
  return { eligiblePrograms: eligible, nearestThreshold: nearest, estimatedMonthlyUsd: income.monthlyTotal, pathReasoning: eligible.length ? `已满足 ${eligible.join('、')} 的门槛，可开始尝试变现。` : `暂未满足主要变现门槛，${nearest?.gap}，建议持续输出垂直内容。` }
}

function buildGrowthPlan(risks: RiskFlag[], metrics: Metrics, cadence: ContentCadence, dims: DimensionScores, followerCount: number): GrowthPlan {
  const items: GrowthItem[] = []
  if (risks.some(r => r.level === 'high')) items.push({ priority: 'high', area: '账号健康', action: '排查近 10 条视频是否违规或被限流，必要时停更 3-5 天恢复权重', expectedImpact: '降低限流风险，恢复推荐流量' })
  if (metrics.engagementRate < 3) items.push({ priority: 'high', area: '互动率', action: '优化前 3 秒钩子 + 增加评论引导，提升完播和评论率', expectedImpact: '互动率从当前水平提升至 3-5%' })
  if (cadence.consistencyScore < 60) items.push({ priority: 'medium', area: '发布节奏', action: `每周稳定发布 ${Math.max(3, Math.round(cadence.avgPostsPerWeek))} 条以上`, expectedImpact: '提升账号活跃度和推荐稳定性' })
  if (followerCount < 10000) items.push({ priority: 'medium', area: '内容定位', action: '聚焦 1-2 个垂直方向，每条视频带 3-5 个精准话题标签', expectedImpact: '加速达到 Creator Fund 门槛' })
  if (dims.stability < 50) items.push({ priority: 'medium', area: '流量稳定性', action: '分析播放量低谷视频，找出内容或发布时间上的共同点并规避', expectedImpact: '降低播放波动，提升账号可预期性' })
  return { items: items.slice(0, 5), summary: items.length ? `建议优先处理 ${items.filter(i => i.priority === 'high').length} 项高风险/高回报优化点` : '当前账号综合状态良好，继续保持现有节奏' }
}

function buildAccountProfile(profile: RawProfile, metrics: Metrics, categories: string[], cadence: ContentCadence): AccountProfile {
  return {
    categories: categories.slice(0, 3),
    personaType: profile.followerCount >= 1000000 ? '头部达人' : profile.followerCount >= 100000 ? '腰部创作者' : profile.followerCount >= 10000 ? '成长型博主' : '素人创作者',
    postingRhythm: cadence.postingRhythm === 'daily' ? '日更' : cadence.postingRhythm === 'weekly' ? '周更' : '不定期更新',
    audienceRegion: profile.region || 'US',
    contentStyle: metrics.engagementRate >= 6 ? '高互动型' : metrics.engagementRate >= 3 ? '内容驱动型' : '流量型',
  }
}

function buildPeerRanking(metrics: Metrics, peerBench: PeerBenchmark, followerCount: number): PeerRanking {
  const peers = getPeerBenchmarks(followerCount)
  const playsRatio = followerCount > 0 ? metrics.effectiveAvgPlays / followerCount : 0
  const playsPercentile = clamp(50 + (playsRatio - peers.avgPlaysRatio) / Math.max(peers.avgPlaysRatio, 0.01) * 50, 1, 99)
  return {
    overallPercentile: peerBench.percentile,
    tierLabel: `Top ${100 - peerBench.percentile}%`,
    peerGroupDescription: peerGroupFromFollowers(followerCount),
    rankingBreakdown: [
      { metric: '互动率', value: `${metrics.engagementRate.toFixed(1)}%`, percentile: clamp(50 + (metrics.engagementRate - 3) * 12, 1, 99), barColor: '#00F2EA' },
      { metric: '平均播放', value: metrics.effectiveAvgPlays >= 1000 ? (metrics.effectiveAvgPlays / 1000).toFixed(1) + 'K' : String(metrics.effectiveAvgPlays), percentile: Math.round(playsPercentile), barColor: '#FF0050' },
      { metric: '播放增长', value: `${metrics.playGrowth > 0 ? '+' : ''}${metrics.playGrowth.toFixed(0)}%`, percentile: clamp(50 + metrics.playGrowth * 1.5, 1, 99), barColor: metrics.playGrowth > 0 ? '#22c55e' : '#f59e0b' },
    ],
    insight: '基于同体量创作者的相对表现评估（基于 log 曲线基准函数）',
  }
}

function buildTrendAnalysis(metrics: Metrics, cadence: ContentCadence): TrendAnalysis {
  const dir = metrics.playGrowth > 20 ? '上升趋势明显，继续保持更新节奏' : metrics.playGrowth > 0 ? '稳步增长，可尝试热点内容加速' : metrics.playGrowth > -20 ? '增长放缓，建议优化内容钩子' : '流量下滑明显，建议排查限流或调整方向'
  return {
    trendingTopics: [], trendingSounds: [],
    contentPredictions: [{ direction: dir, confidence: clamp(Math.abs(metrics.playGrowth) + 40, 30, 90), expectedEngagement: metrics.engagementRate >= 3 ? '3-6%' : '1-3%', why: `基于 ${metrics.playGrowth.toFixed(0)}% 播放增长和 ${metrics.engagementRate.toFixed(1)}% 互动率预测` }],
    bestPostTimes: cadence.bestTimeSlots.slice(0, 3).map((t, i) => ({ day: cadence.bestWeekdays[i % Math.max(cadence.bestWeekdays.length, 1)]?.weekday || '周三', hour: t.hour, score: t.engagementRate })),
    summary: dir,
  }
}

function buildCommercializationAdvice(categories: string[], dims: DimensionScores, income: import('@/types').IncomeEstimate, followerCount: number): CommercializationAdvice {
  const tier = getFollowerTier(followerCount)
  const directions: CommercializationDirection[] = []
  if (dims.commerce >= 40) directions.push({ name: '品牌赞助', icon: '💰', fitScore: dims.commerce, difficulty: tier === 'nano' ? 'low' : 'medium', estimatedMonthlyRevenue: income.breakdown.find(b => b.source === 'brand_deals')?.monthlyAmount || { low: 0, mid: 0, high: 0 }, revenuePotential: 'high', description: '通过品牌植入、测评、合作视频获取收入', actionSteps: ['完善媒体包', '主动联系相关品牌', '加入达人平台'], why: '品牌赞助是最稳定的变现方式', prerequisites: ['10K+ 粉丝（建议）', '稳定的内容质量'] })
  if (categories.some(c => ['美食', 'food', '美妆护肤', 'beauty', '时尚穿搭', 'fashion', '健身运动', 'fitness'].includes(c.toLowerCase()))) {
    directions.push({ name: 'TikTok Shop', icon: '🛒', fitScore: dims.monetization, difficulty: 'medium', estimatedMonthlyRevenue: income.breakdown.find(b => b.source === 'tiktok_shop')?.monthlyAmount || { low: 0, mid: 0, high: 0 }, revenuePotential: 'high', description: '通过短视频/直播带货获取佣金', actionSteps: ['开通 Shop 权限', '选品匹配内容', '优化挂车视频'], why: '适合高转化品类', prerequisites: ['1K+ 粉丝', '垂直品类内容'] })
  }
  directions.push({ name: '创作者基金', icon: '🎬', fitScore: dims.monetization, difficulty: 'low', estimatedMonthlyRevenue: income.breakdown.find(b => b.source === 'creator_program')?.monthlyAmount || { low: 0, mid: 0, high: 0 }, revenuePotential: 'low', description: '通过播放量获取平台分成', actionSteps: ['满足 10K 粉门槛', '持续产出原创内容', '申请 Beta 计划'], why: '最基础的变现方式', prerequisites: ['10K+ 粉丝', '10K+ 均播（Beta）'] })
  const total = income.monthlyTotal
  return { directions, primaryRecommendation: directions[0]?.name || '品牌赞助', secondaryRecommendation: directions[1]?.name || '创作者基金', estimatedTotalMonthly: total, summary: `根据账号体量（${tier}）和内容品类，建议优先尝试 ${directions[0]?.name || '品牌赞助'}` }
}

export interface ScoreOptions { now?: number }

export function scoreProfile(profile: RawProfile, options?: ScoreOptions): Evaluation {
  const now = options?.now ?? Date.now() / 1000
  const classified = classifyAllPosts(profile.posts, now)
  const ep = calcEffectivePlays(profile, now)
  const metrics = computeMetrics(profile, ep, classified, now)
  const categories = inferCategories(profile)
  const cadence = buildContentCadence(profile.posts, now)
  const postsPerMonth = cadence.avgPostsPerWeek * 4.33
  const risks = detectRisks(profile, metrics, classified)
  const dims = computeDimensions({ profile, metrics, classified: { mature: classified.mature, growing: classified.growing }, postsPerMonth, categories })
  const { score } = totalScore(dims, profile.followerCount)
  const health = buildAccountHealth(metrics, risks, dims)
  const income = buildIncomeEstimate({ profile, metrics, dims, categories, cadence, risks })
  const business = buildBusinessValue({ profile, metrics, dims, categories, income, risks })
  // 评级基于商业价值（后置于 business value 计算）
  const { tier, reason: tierReason } = tierFromBusinessValue(business.totalValue.mid, profile.followerCount, risks)
  const roadmap = buildRevenueRoadmap({ profile, metrics, dims, risks, income })
  const { cpm: categoryCpm, label: categoryLabel } = pickCategoryCpm(categories)
  const { mult: regionMult, label: regionLabel } = pickRegionMultiplier(profile.region)
  const engagementMult = getEngagementMultiplier(metrics.engagementRate)
  const brand = calcBrandDealValue({
    effectiveAvgPlays: metrics.effectiveAvgPlays,
    categoryCpm,
    er: metrics.engagementRate,
    regionMult,
    postsPerMonth,
    followers: profile.followerCount,
    playGrowth: metrics.playGrowth,
    risks,
    verified: profile.verified,
    categories,
  })
  const brandPotential = buildBrandPotential(metrics, categories, health, dims)
  const { verdict, advice } = buildVerdict({ score, tier, tierReason, nickname: profile.nickname || profile.username, metrics, health, dims, risks, categories, businessValueMid: business.totalValue.mid })
  const priceAdvice = buildPriceAdvice({ perVideoLow: brand.perVideoLow, perVideoMid: brand.perVideoMid, perVideoHigh: brand.perVideoHigh, effectiveAvgPlays: metrics.effectiveAvgPlays, categoryLabel, cpm: categoryCpm, engagementMult, regionLabel, regionMult, risks })
  const peerBench = buildPeerBenchmark(profile, metrics)
  const followerTier = getFollowerTier(profile.followerCount)
  const calculationMetadata: CalculationMetadata = {
    effectiveAvgPlays: metrics.effectiveAvgPlays, effectivePeakPlays: metrics.effectivePeakPlays,
    matureVideoCount: ep.matureVideoCount, excludedImmatureCount: ep.immatureCount, excludedGrowingCount: ep.growingCount,
    brandCpm: categoryCpm, engagementMultiplier: engagementMult, regionMultiplier: regionMult,
    categoryForCpm: categoryLabel, regionLabel, perVideoBrandDealMid: brand.perVideoMid, monthlyBrandPosts: brand.monthlyBrandPosts,
    likePlayRatio: metrics.likePlayRatio, playsSource: ep.source,
  }
  return {
    username: profile.username, nickname: profile.nickname || profile.username, score, tier,
    summary: buildSummary({ profile: { nickname: profile.nickname, followerCount: profile.followerCount }, dims, metrics, tier, tierReason, categories, percentile: peerBench.percentile, businessValueMid: business.totalValue.mid }),
    dimensions: dims, metrics, riskFlags: risks, verdict, advice, priceAdvice,
    accountHealth: health, contentCadence: cadence, engagementQuality: buildEngagementQuality(metrics, profile, classified),
    peerBenchmark: peerBench, brandPotential, monetizationPath: buildMonetizationPath(profile, metrics, income),
    growthPlan: buildGrowthPlan(risks, metrics, cadence, dims, profile.followerCount),
    incomeEstimate: income, businessValue: business,
    accountProfile: buildAccountProfile(profile, metrics, categories, cadence),
    revenueRoadmap: roadmap,
    contentStrategy: buildContentStrategy({ categories, cadence, followerTier }),
    peerRanking: buildPeerRanking(metrics, peerBench, profile.followerCount),
    brandMatching: buildBrandMatching(categories, categoryCpm, metrics.effectiveAvgPlays, engagementMult, regionMult),
    trendAnalysis: buildTrendAnalysis(metrics, cadence),
    commercializationAdvice: buildCommercializationAdvice(categories, dims, income, profile.followerCount),
    computedAt: new Date().toISOString(), avatar: profile.avatar, bio: profile.bio,
    followerCount: profile.followerCount, followingCount: profile.followingCount, totalLikes: profile.totalLikes, videoCount: profile.videoCount,
    verified: profile.verified, region: profile.region, posts: profile.posts,
    formulaVersion: 'v2', calculationMetadata,
  }
}
