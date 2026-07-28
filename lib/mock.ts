import { RawProfile, Evaluation, RiskFlag, AccountHealth, ContentCadence, EngagementQuality, PeerBenchmark, BrandPotential, MonetizationPath, GrowthPlan, RevenueRoadmap, ContentStrategy, PeerRanking, BrandMatching, BrandMatch, TrendAnalysis, CommercializationAdvice, CommercializationDirection } from '@/types'
import { scoreProfile } from './scoring'

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const archetypes = [
  { name: 'rising', label: '上升期素人', followers: [12000, 45000], er: [0.07, 0.12], growth: [0.3, 0.8], stability: [0.2, 0.35] },
  { name: 'solid', label: '稳定腰部号', followers: [150000, 600000], er: [0.05, 0.09], growth: [0.05, 0.25], stability: [0.15, 0.3] },
  { name: 'mega', label: '头部大号', followers: [2000000, 8000000], er: [0.03, 0.06], growth: [-0.05, 0.1], stability: [0.25, 0.45] },
  { name: 'fake', label: '疑似买粉号', followers: [300000, 1200000], er: [0.002, 0.008], growth: [-0.3, -0.1], stability: [0.4, 0.7] },
  { name: 'declining', label: '限流掉权号', followers: [80000, 300000], er: [0.02, 0.04], growth: [-0.4, -0.15], stability: [0.5, 0.8] },
]

function pickArchetype(username: string, seed: number) {
  // Make well-known usernames map to specific archetypes for predictable demos
  const nameBased: Record<string, number> = {
    charlidamelio: 2,
    mrbeast: 2,
    'khaby.lame': 2,
    zachking: 1,
    bella: 1,
    addisonre: 2,
    test: 0,
    fake: 3,
    dead: 4,
  }
  if (nameBased[username]) return archetypes[nameBased[username]]
  return archetypes[seed % archetypes.length]
}

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

  // Differentiated categories based on archetype
  const archetypeCategories: Record<string, string[]> = {
    rising: ['美妆护肤', '时尚穿搭', '生活方式'],
    solid: ['科技数码', '知识教育', '生活方式'],
    mega: ['泛娱乐', '潮流文化', '生活方式'],
    fake: ['泛娱乐', '生活方式'],
    declining: ['游戏', '泛娱乐'],
  }
  const archetypeName = profile.username === 'charlidamelio' ? 'mega' : profile.username === 'zachking' ? 'solid' : 'rising'
  const categories = archetypeCategories[archetypeName] || ['生活方式', '泛娱乐']

  return {
    brandScore,
    estimatedCPM,
    audienceSpendingPower: profile.followerCount > 500000 ? 'high' : profile.followerCount > 50000 ? 'medium' : 'low',
    suitableCategories: categories,
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
  if (profile.followerCount >= 10000 && profile.videoCount >= 10) eligible.push('Creator Fund / Creativity Program')
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

function mockRiskFlags(archetypeName: string, profile: RawProfile): RiskFlag[] {
  switch (archetypeName) {
    case 'fake':
      return [
        { level: 'high', label: '疑似买粉/僵尸号', detail: '互动率极低（<1%），粉丝活跃度严重不真实，商业价值极低' },
        { level: 'high', label: '虚高粉丝', detail: `粉丝量 ${profile.followerCount.toLocaleString()} 但互动率异常低，大量粉丝可能是僵尸粉` },
        { level: 'medium', label: '疑似限流/掉权重', detail: '近期播放较历史峰值明显下跌，可能被平台限流' },
      ]
    case 'declining':
      return [
        { level: 'high', label: '长期断更', detail: '超过 30 天未发布新视频，可能是弃号或僵尸号' },
        { level: 'medium', label: '疑似限流/掉权重', detail: '近期播放较历史峰值明显下跌，内容可能被算法降权' },
        { level: 'medium', label: '播放波动异常', detail: '播放量变异系数高，流量不稳定，影响合作可预期性' },
      ]
    case 'rising':
      return [
        { level: 'low', label: '样本量有限', detail: '账号处于上升期，历史数据较少，评分可能随更多内容更新而变化' },
      ]
    case 'solid':
      return [
        { level: 'low', label: '增长放缓', detail: '账号进入稳定期，播放增速趋缓，建议尝试新内容方向以突破瓶颈' },
      ]
    case 'mega':
      return []
    default:
      return []
  }
}

function mockBio(username: string, archetypeName: string): string {
  const bios: Record<string, string[]> = {
    rising: [
      `just getting started on TikTok 📈`,
      `daily vlogs & behind the scenes ✨`,
      `new creator | follow the journey 🚀`,
    ],
    solid: [
      `content creator | business inquiries: ${username}@email.com`,
      `helping you level up your social game 🔥`,
      `lifestyle & inspo | collabs welcome 💌`,
    ],
    mega: [
      `official account | ${Math.floor(Math.random() * 100)}M+ community 💙`,
      `worldwide creator | dream big ✨`,
      `verified creator | new video every week 🎬`,
    ],
    fake: [
      `follow for follow 🔄`,
      `buy followers - DM me 📩`,
      `growing fast 🚀🚀🚀`,
    ],
    declining: [
      `taking a break...`,
      `old account, might come back`,
      `inactive for now`,
    ],
  }
  const list = bios[archetypeName] || bios.rising
  return list[hashString(username + 'bio') % list.length]
}

export function generateMockProfile(username: string): RawProfile {
  const normalized = username.trim().replace(/^@/, '').toLowerCase()
  const seed = hashString(normalized)
  const type = pickArchetype(normalized, seed)

  const followerCount = Math.floor(type.followers[0] + pseudoRandom(seed) * (type.followers[1] - type.followers[0]))
  const videoCount = 30 + Math.floor(pseudoRandom(seed + 1) * 200)
  const totalLikes = Math.floor(followerCount * (3 + pseudoRandom(seed + 2) * 12))
  const followingCount = Math.max(1, Math.floor(followerCount * (0.01 + pseudoRandom(seed + 3) * 0.05)))

  const now = Math.floor(Date.now() / 1000)
  const posts: RawProfile['posts'] = []

  // Generate 24 posts over the last 45 days
  const basePlays = followerCount * (0.4 + pseudoRandom(seed + 10) * 1.5)
  const growthFactor = type.growth[0] + pseudoRandom(seed + 11) * (type.growth[1] - type.growth[0])
  const stabilityCv = type.stability[0] + pseudoRandom(seed + 12) * (type.stability[1] - type.stability[0])

  for (let i = 0; i < 24; i++) {
    // Trend: older posts slightly lower/higher based on growth
    const ageFactor = 1 - (growthFactor * (i / 24))
    const playNoise = 1 + (pseudoRandom(seed + i * 7) - 0.5) * stabilityCv * 2
    const playCount = Math.max(1000, Math.floor(basePlays * ageFactor * playNoise))

    const er = type.er[0] + pseudoRandom(seed + i * 13) * (type.er[1] - type.er[0])
    const totalInteractions = Math.floor(playCount * er)
    const likeCount = Math.floor(totalInteractions * 0.78)
    const commentCount = Math.floor(totalInteractions * 0.15)
    const shareCount = totalInteractions - likeCount - commentCount

    const isCommerce = pseudoRandom(seed + i * 19) > 0.75
    const desc = isCommerce
      ? '#fyp check the link in bio 🛒 #musthave'
      : ['#fyp', '#viral', '#daily', '#funny'][i % 4]

    posts.push({
      id: `mock-${i}`,
      playCount,
      likeCount,
      commentCount,
      shareCount,
      createTime: now - (i + 1) * 2 * 86400 - Math.floor(pseudoRandom(seed + i) * 86400),
      desc,
    })
  }

  return {
    username: normalized,
    nickname: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    bio: mockBio(normalized, type.name),
    followerCount,
    followingCount,
    totalLikes,
    videoCount,
    secUid: `mock-sec-${normalized}`,
    region: 'US',
    verified: type.name === 'mega' || type.name === 'solid',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalized}`,
    posts,
  }
}

function mockRevenueRoadmap(profile: RawProfile, metrics: import('@/types').Metrics, _incomeEstimate: import('@/types').IncomeEstimate, health: import('@/types').AccountHealth): RevenueRoadmap {
  const baseMonthly = _incomeEstimate.monthlyTotal

  // Realistic growth rate based on actual metrics
  let monthlyGrowthRate = 0
  if (metrics.playGrowth > 30) monthlyGrowthRate = 0.08
  else if (metrics.playGrowth > 10) monthlyGrowthRate = 0.05
  else if (metrics.playGrowth > 0) monthlyGrowthRate = 0.03
  else if (metrics.playGrowth > -20) monthlyGrowthRate = 0.01
  else if (metrics.playGrowth > -40) monthlyGrowthRate = -0.02
  else monthlyGrowthRate = -0.05

  if (metrics.engagementRate >= 5) monthlyGrowthRate += 0.02
  else if (metrics.engagementRate >= 3) monthlyGrowthRate += 0.01
  else if (metrics.engagementRate < 1) monthlyGrowthRate -= 0.03

  if (health.shadowbanRisk === 'high') monthlyGrowthRate -= 0.05
  else if (health.shadowbanRisk === 'medium') monthlyGrowthRate -= 0.02

  if (profile.followerCount > 1_000_000) monthlyGrowthRate -= 0.02
  else if (profile.followerCount > 100_000) monthlyGrowthRate -= 0.01

  const eligibleCount = (baseMonthly.mid > 0 ? 1 : 0) + (metrics.engagementRate >= 3 ? 1 : 0)
  if (eligibleCount >= 2) monthlyGrowthRate += 0.01

  monthlyGrowthRate = Math.max(-0.08, Math.min(0.12, monthlyGrowthRate))

  const m3Mid = baseMonthly.mid > 0
    ? Math.round(baseMonthly.mid * Math.pow(1 + monthlyGrowthRate, 3))
    : Math.round(100 * Math.pow(1 + Math.max(monthlyGrowthRate, 0.02), 3))
  const m6Mid = baseMonthly.mid > 0
    ? Math.round(baseMonthly.mid * Math.pow(1 + monthlyGrowthRate, 6))
    : Math.round(200 * Math.pow(1 + Math.max(monthlyGrowthRate, 0.02), 6))
  const m12Mid = baseMonthly.mid > 0
    ? Math.round(baseMonthly.mid * Math.pow(1 + monthlyGrowthRate, 12))
    : Math.round(500 * Math.pow(1 + Math.max(monthlyGrowthRate, 0.02), 12))

  const variance = Math.max(0.15, Math.min(0.5, metrics.cvPlays))

  const m3Unlocks: string[] = eligibleCount === 0
    ? ['达到 Creator Fund 门槛（10K 粉丝）', '建立内容模板，提升发布频率']
    : ['开通全部变现渠道', '建立品牌合作初选名单']
  if (metrics.engagementRate < 3) m3Unlocks.push('优化前 3 秒钩子，提升互动率至 3%+')

  const m6Unlocks: string[] = monthlyGrowthRate > 0.02
    ? ['获得首个品牌长期合作', '开启直播带货尝试']
    : monthlyGrowthRate > 0
      ? ['稳定品牌合作收入', '建立粉丝社群']
      : ['排查账号问题，恢复流量权重', '尝试新内容方向突破瓶颈']

  const m12Unlocks: string[] = monthlyGrowthRate > 0.03
    ? ['多平台矩阵分发', '自有品牌/产品线', '达人经纪签约机会']
    : monthlyGrowthRate > 0
      ? ['全渠道变现成熟', '建立被动收入来源']
      : ['重新定位账号方向', '如未改善，考虑新开账号']

  const total12Month = {
    low: Math.round((baseMonthly.mid * 3 + m3Mid * 3 + m6Mid * 3 + m12Mid * 3) * (1 - variance)),
    mid: Math.round(baseMonthly.mid * 3 + m3Mid * 3 + m6Mid * 3 + m12Mid * 3),
    high: Math.round((baseMonthly.mid * 3 + m3Mid * 3 + m6Mid * 3 + m12Mid * 3) * (1 + variance)),
  }

  let summary = ''
  if (health.shadowbanRisk === 'high') {
    summary = `账号存在高风险信号，当前预测基于问题解决后的恢复路径。若不解决 ${health.shadowbanSignals.length} 个风险信号，实际收入可能低于预期。`
  } else if (monthlyGrowthRate > 0.05) {
    summary = `账号处于强势上升期（月均增速 ${(monthlyGrowthRate * 100).toFixed(0)}%），12 个月累计收入预估 $${formatK(total12Month.mid)}。建议抓住窗口期加速变现。`
  } else if (monthlyGrowthRate > 0.02) {
    summary = `账号健康增长中（月均增速 ${(monthlyGrowthRate * 100).toFixed(0)}%），12 个月累计收入预估 $${formatK(total12Month.mid)}。按当前节奏持续优化即可。`
  } else if (monthlyGrowthRate > 0) {
    summary = `账号增长缓慢（月均增速约 ${(monthlyGrowthRate * 100).toFixed(0)}%），需主动拓展变现渠道。12 个月累计收入预估 $${formatK(total12Month.mid)}。`
  } else {
    summary = `账号当前处于下滑趋势，预测基于采取优化措施后的恢复路径。若不采取行动，实际收入可能持续下降。`
  }

  return {
    currentMonthly: baseMonthly,
    projections: [
      { month: 3, label: '3 个月', revenue: { low: Math.round(m3Mid * (1 - variance)), mid: m3Mid, high: Math.round(m3Mid * (1 + variance)) }, milestone: monthlyGrowthRate > 0.03 ? '快速起步阶段' : monthlyGrowthRate > 0 ? '稳定增长起步' : '夯实基础阶段', unlocks: m3Unlocks },
      { month: 6, label: '6 个月', revenue: { low: Math.round(m6Mid * (1 - variance)), mid: m6Mid, high: Math.round(m6Mid * (1 + variance)) }, milestone: monthlyGrowthRate > 0.03 ? '收入翻倍增长' : monthlyGrowthRate > 0 ? '多元化变现起步' : '调整优化阶段', unlocks: m6Unlocks },
      { month: 12, label: '12 个月', revenue: { low: Math.round(m12Mid * (1 - variance)), mid: m12Mid, high: Math.round(m12Mid * (1 + variance)) }, milestone: monthlyGrowthRate > 0.03 ? '全渠道变现成熟' : monthlyGrowthRate > 0 ? '稳定增长阶段' : '转型或退出', unlocks: m12Unlocks },
    ],
    total12Month,
    summary,
  }
}

function mockContentStrategy(_profile: RawProfile, _metrics: import('@/types').Metrics): ContentStrategy {
  return {
    pillars: [
      {
        type: '教程/干货',
        icon: 'BookOpen',
        frequency: '每周 2-3 条',
        expectedEngagement: '4.5-6.0%',
        examples: ['5分钟学会XX技巧', '这个隐藏功能99%的人不知道', '行业大佬都在用的方法'],
        why: '教程类内容完播率高，且容易建立专业信任感，带动品牌合作',
      },
      {
        type: '幕后/日常',
        icon: 'Camera',
        frequency: '每周 1-2 条',
        expectedEngagement: '3.5-5.0%',
        examples: ['一天的工作流程', '真实的创作幕后', '团队日常互动'],
        why: '幕后内容拉近粉丝距离，提升粉丝粘性和忠诚度',
      },
      {
        type: '趋势/热点',
        icon: 'TrendingUp',
        frequency: '每周 2-3 条',
        expectedEngagement: '5.0-8.0%',
        examples: ['热门挑战变体', '热点事件解读', '流行趋势分析'],
        why: '蹭热点是获取自然流量的最快方式，但需与账号定位结合',
      },
    ],
    recommendedHashtags: [
      { tag: '#fyp', volume: 'high', relevance: 95 },
      { tag: '#viral', volume: 'high', relevance: 85 },
      { tag: '#contentcreator', volume: 'medium', relevance: 90 },
      { tag: '#learnontiktok', volume: 'high', relevance: 80 },
      { tag: '#smallbusiness', volume: 'medium', relevance: 75 },
    ],
    optimalSchedule: [
      { day: '周三', time: '19:00', format: '教程/干货' },
      { day: '周五', time: '18:00', format: '趋势/热点' },
      { day: '周六', time: '11:00', format: '幕后/日常' },
      { day: '周一', time: '20:00', format: '教程/干货' },
      { day: '周四', time: '12:00', format: '趋势/热点' },
    ],
    collaborationIdeas: [
      { type: '合拍/联动', description: '与同体量创作者互相导流，制作联合内容', potential: 'high' },
      { type: '品牌定制', description: '为美妆/生活方式品牌制作产品测评或教程', potential: 'high' },
      { type: '挑战赛发起', description: '发起品牌话题挑战赛，带动UGC内容', potential: 'medium' },
    ],
    summary: '建议以教程和热点内容为主体，搭配幕后内容增加人格化，保持每周 5-7 条的高频更新',
  }
}

function mockPeerRanking(profile: RawProfile, metrics: import('@/types').Metrics): PeerRanking {
  const percentile = Math.min(95, Math.max(5, 50 + (metrics.engagementRate - 3) * 10 + (metrics.playGrowth > 0 ? 10 : -5)))
  const tierLabel = percentile >= 90 ? 'Top 10%' : percentile >= 75 ? 'Top 25%' : percentile >= 50 ? 'Top 50%' : 'Below Average'

  return {
    overallPercentile: percentile,
    tierLabel,
    peerGroupDescription: profile.followerCount < 10000 ? '1K-10K 粉丝创作者' : profile.followerCount < 100000 ? '10K-100K 粉丝创作者' : '100K-1M 粉丝创作者',
    rankingBreakdown: [
      { metric: '互动率', value: `${metrics.engagementRate}%`, percentile: Math.min(95, 50 + (metrics.engagementRate - 3) * 12), barColor: '#00F2EA' },
      { metric: '平均播放', value: metrics.avgPlays >= 1000 ? (metrics.avgPlays / 1000).toFixed(1) + 'K' : String(metrics.avgPlays), percentile: Math.min(90, 40 + metrics.avgPlays / 1000), barColor: '#FF0050' },
      { metric: '播放增长', value: `${metrics.playGrowth > 0 ? '+' : ''}${metrics.playGrowth}%`, percentile: Math.min(95, 50 + metrics.playGrowth * 1.5), barColor: metrics.playGrowth > 0 ? '#22c55e' : '#f59e0b' },
      { metric: '更新频率', value: metrics.daysSinceLastPost <= 2 ? '活跃' : '低频', percentile: metrics.daysSinceLastPost <= 2 ? 80 : 30, barColor: '#a855f7' },
      { metric: '粉丝粘性', value: `${(metrics.engagementRate * 3).toFixed(1)}x`, percentile: Math.min(90, 40 + metrics.engagementRate * 8), barColor: '#ec4899' },
    ],
    insight: percentile >= 75
      ? '账号表现优于大多数同行，继续维持内容质量可巩固领先地位'
      : percentile >= 50
        ? '账号处于行业中游，重点优化互动率和内容质量可快速超越同行'
        : '账号当前表现低于同行平均水平，建议优先解决核心短板',
  }
}

function mockBrandMatching(profile: RawProfile, metrics: import('@/types').Metrics, brandPotential: BrandPotential): BrandMatching {
  const cpm = brandPotential.estimatedCPM
  const followerK = profile.followerCount / 1000

  const allMatches: BrandMatch[] = [
    {
      category: '美妆护肤',
      icon: 'Sparkles',
      fitScore: 85,
      estimatedDealRange: { low: Math.round(cpm * followerK * 0.5), high: Math.round(cpm * followerK * 1.5) },
      exampleBrands: ['Fenty Beauty', 'Glossier', 'The Ordinary', 'CeraVe'],
      collaborationType: '产品测评 / 教程植入',
      reasoning: '美妆品牌在 TikTok 投放预算充足，且与教程类内容高度契合',
    },
    {
      category: '时尚穿搭',
      icon: 'Shirt',
      fitScore: 78,
      estimatedDealRange: { low: Math.round(cpm * followerK * 0.4), high: Math.round(cpm * followerK * 1.2) },
      exampleBrands: ['Zara', 'ASOS', 'Shein', 'Uniqlo'],
      collaborationType: '穿搭展示 / 开箱测评',
      reasoning: '时尚品类转化率高，品牌方更看重真实穿搭展示而非硬广',
    },
    {
      category: '科技数码',
      icon: 'Smartphone',
      fitScore: 72,
      estimatedDealRange: { low: Math.round(cpm * followerK * 0.6), high: Math.round(cpm * followerK * 1.8) },
      exampleBrands: ['Samsung', 'Anker', 'Logitech', 'DJI'],
      collaborationType: '产品评测 / 使用教程',
      reasoning: '科技品类客单价高，CPM 溢价空间大，适合深度测评内容',
    },
    {
      category: '健康生活',
      icon: 'Heart',
      fitScore: 68,
      estimatedDealRange: { low: Math.round(cpm * followerK * 0.3), high: Math.round(cpm * followerK * 1.0) },
      exampleBrands: ['Nike Training', 'MyFitnessPal', 'Headspace', 'Whoop'],
      collaborationType: '日常使用 / 挑战赛',
      reasoning: '健康类品牌偏好长期合作，适合建立稳定收入来源',
    },
  ]

  // Sort by fit score and take top 3
  const matches = allMatches.sort((a, b) => b.fitScore - a.fitScore).slice(0, 3)

  return {
    matches,
    totalBrandValue: {
      low: matches.reduce((sum, m) => sum + m.estimatedDealRange.low, 0),
      mid: matches.reduce((sum, m) => sum + (m.estimatedDealRange.low + m.estimatedDealRange.high) / 2, 0),
      high: matches.reduce((sum, m) => sum + m.estimatedDealRange.high, 0),
    },
    summary: `基于账号内容风格和受众画像，最匹配 ${matches.length} 个品牌合作方向，预计单次合作收入 $${Math.round(matches[0]?.estimatedDealRange.low || 0)} - $${Math.round(matches[0]?.estimatedDealRange.high || 0)}`,
  }
}

function mockTrendAnalysis(profile: RawProfile, _metrics: import('@/types').Metrics): TrendAnalysis {
  const seed = hashString(profile.username)
  const categories = ['美妆护肤', '时尚穿搭', '科技数码', '美食', '健身运动', '旅行', '游戏', '金融理财', '娱乐', '教育']
  const catIdx = hashString(profile.username) % categories.length
  const category = categories[catIdx]

  const topicsByCategory: Record<string, { topic: string; hashtag: string }[]> = {
    '美妆护肤': [
      { topic: 'Clean Beauty 纯净美妆', hashtag: 'CleanBeauty2026' },
      { topic: '5分钟通勤妆', hashtag: '5MinMakeup' },
      { topic: '护肤成分党', hashtag: 'SkincareIngredients' },
      { topic: '夏日防晒测评', hashtag: 'SunscreenReview' },
      { topic: '彩妆教程', hashtag: 'MakeupTutorial' },
    ],
    '时尚穿搭': [
      { topic: 'Old Money 老钱风', hashtag: 'OldMoneyStyle' },
      { topic: '胶囊衣橱', hashtag: 'CapsuleWardrobe' },
      { topic: '可持续时尚', hashtag: 'SustainableFashion' },
      { topic: 'OOTD 日常穿搭', hashtag: 'OOTDChallenge' },
      { topic: '复古风回潮', hashtag: 'Y2KFashion' },
    ],
    '科技数码': [
      { topic: 'AI 工具推荐', hashtag: 'AITools2026' },
      { topic: '手机测评', hashtag: 'PhoneReview' },
      { topic: '智能家居', hashtag: 'SmartHome' },
      { topic: '编程入门', hashtag: 'LearnToCode' },
      { topic: '数码开箱', hashtag: 'TechUnboxing' },
    ],
    '美食': [
      { topic: '懒人料理', hashtag: 'EasyRecipe' },
      { topic: '街头美食', hashtag: 'StreetFood' },
      { topic: '健康轻食', hashtag: 'HealthyEating' },
      { topic: '烘焙教程', hashtag: 'BakingTips' },
      { topic: '美食探店', hashtag: 'FoodHunt' },
    ],
    '健身运动': [
      { topic: '居家健身', hashtag: 'HomeWorkout' },
      { topic: '30天挑战', hashtag: '30DayChallenge' },
      { topic: '瑜伽入门', hashtag: 'YogaForBeginners' },
      { topic: '跑步打卡', hashtag: 'RunningCommunity' },
      { topic: '健身餐搭配', hashtag: 'FitMealPrep' },
    ],
    '旅行': [
      { topic: '小众旅行地', hashtag: 'HiddenGems' },
      { topic: '背包客攻略', hashtag: 'BackpackerGuide' },
      { topic: '酒店测评', hashtag: 'HotelReview' },
      { topic: '当地美食地图', hashtag: 'LocalFoodMap' },
      { topic: '旅行Vlog', hashtag: 'TravelVlog' },
    ],
    '游戏': [
      { topic: '新游评测', hashtag: 'GameReview' },
      { topic: '电竞集锦', hashtag: 'EsportsHighlights' },
      { topic: '独立游戏推荐', hashtag: 'IndieGame' },
      { topic: '游戏技巧', hashtag: 'GamingTips' },
      { topic: '速通挑战', hashtag: 'SpeedrunChallenge' },
    ],
    '金融理财': [
      { topic: '被动收入', hashtag: 'PassiveIncome' },
      { topic: '股票分析', hashtag: 'StockAnalysis' },
      { topic: '省钱技巧', hashtag: 'MoneySavingTips' },
      { topic: '加密货币', hashtag: 'Crypto2026' },
      { topic: '财务自由', hashtag: 'FinancialFreedom' },
    ],
    '娱乐': [
      { topic: '舞蹈挑战', hashtag: 'DanceChallenge' },
      { topic: '搞笑短剧', hashtag: 'ComedySketch' },
      { topic: '生活记录', hashtag: 'DailyVlog' },
      { topic: '才艺展示', hashtag: 'TalentShow' },
      { topic: '反应视频', hashtag: 'ReactionVideo' },
    ],
    '教育': [
      { topic: '语言学习', hashtag: 'LanguageLearning' },
      { topic: '冷知识', hashtag: 'FunFacts' },
      { topic: '学科辅导', hashtag: 'StudyTips' },
      { topic: '职业技能', hashtag: 'CareerSkills' },
      { topic: '历史故事', hashtag: 'HistoryFacts' },
    ],
  }

  const topics = topicsByCategory[category] || topicsByCategory['娱乐']
  const trendingTopics = topics.map((t, i) => ({
    ...t,
    growth: Math.round(50 + pseudoRandom(seed + i) * 200),
    relevance: Math.round(60 + pseudoRandom(seed + i + 100) * 40),
  }))

  const sounds = [
    { name: 'Viral Beat 2026', artist: 'DJ Trend', usageCount: '2.3M', growth: 180 },
    { name: 'Emotional Piano', artist: 'PianoLab', usageCount: '1.8M', growth: 120 },
    { name: 'Funky Groove', artist: 'GrooveMaster', usageCount: '950K', growth: 240 },
    { name: 'Chill Lofi', artist: 'LofiBeats', usageCount: '4.1M', growth: 85 },
    { name: 'Dance Fever', artist: 'ClubSound', usageCount: '3.2M', growth: 150 },
  ]
  const trendingSounds = sounds.sort(() => pseudoRandom(seed + 500) - 0.5).slice(0, 3)

  const predictions = [
    {
      direction: `${category}领域的「对比测评」内容正在爆发`,
      confidence: 75 + Math.round(pseudoRandom(seed + 600) * 20),
      expectedEngagement: '预计互动率 6-8%',
      why: '用户越来越依赖真实对比来做消费决策',
    },
    {
      direction: '配合热门音乐做「前后对比」类视频',
      confidence: 65 + Math.round(pseudoRandom(seed + 700) * 25),
      expectedEngagement: '预计互动率 5-7%',
      why: '前/后对比是 TikTok 上转化率最高的内容形式之一',
    },
    {
      direction: '增加「教程类」内容提升收藏率',
      confidence: 60 + Math.round(pseudoRandom(seed + 800) * 30),
      expectedEngagement: '预计收藏率提升 40%',
      why: '收藏是算法推荐的重要信号，教程类内容收藏率最高',
    },
  ]

  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const bestPostTimes = days.map((day, i) => ({
    day,
    hour: 8 + Math.round(pseudoRandom(seed + i * 10) * 14),
    score: Math.round(50 + pseudoRandom(seed + i * 20) * 50),
  })).sort((a, b) => b.score - a.score).slice(0, 7)

  return {
    trendingTopics,
    trendingSounds,
    contentPredictions: predictions,
    bestPostTimes,
    summary: `基于账号在「${category}」领域的内容表现，当前最匹配 ${trendingTopics.length} 个上升趋势话题，建议优先使用 ${trendingTopics[0].topic} 标签创作内容。`,
  }
}

function mockCommercialization(profile: RawProfile, _metrics: import('@/types').Metrics, _evaluation: import('@/types').Evaluation): CommercializationAdvice {
  const seed = hashString(profile.username)
  const followerCount = profile.followerCount
  const isLargeAccount = followerCount >= 100000
  const isMidAccount = followerCount >= 10000 && followerCount < 100000
  const isSmallAccount = followerCount < 10000

  // Base revenue estimates based on account size
  const baseRevenue = isLargeAccount ? { low: 5000, mid: 15000, high: 50000 }
    : isMidAccount ? { low: 500, mid: 2000, high: 8000 }
    : { low: 50, mid: 200, high: 1000 }

  const allDirections: CommercializationDirection[] = [
    {
      name: '品牌推广合作',
      icon: 'Building2',
      fitScore: isLargeAccount ? 90 : isMidAccount ? 80 : 50,
      difficulty: isLargeAccount ? 'low' : 'medium',
      estimatedMonthlyRevenue: {
        low: Math.round(baseRevenue.low * 0.4),
        mid: Math.round(baseRevenue.mid * 0.4),
        high: Math.round(baseRevenue.high * 0.4),
      },
      revenuePotential: 'high',
      description: '基于粉丝画像和内容匹配度，与品牌方进行单次推广合作，是最直接、最成熟的变现方式',
      actionSteps: [
        '注册 TikTok Creator Marketplace，完善品牌合作资料',
        '每月发布 2-3 条品牌调性视频，展示合作案例',
        '主动联系 3-5 个匹配品牌，提供合作提案',
        '设置合理的 CPM 报价（参考区间 $5-25）',
      ],
      why: '品牌推广是 TikTok 创作者收入占比最高的渠道（约 70%），你的账号在品牌匹配度上表现优秀',
      prerequisites: ['粉丝 ≥ 10K', '近 30 天有活跃内容', '账号无违规记录'],
    },
    {
      name: '短视频带货',
      icon: 'ShoppingBag',
      fitScore: isLargeAccount ? 85 : isMidAccount ? 75 : 45,
      difficulty: 'medium',
      estimatedMonthlyRevenue: {
        low: Math.round(baseRevenue.low * 0.3),
        mid: Math.round(baseRevenue.mid * 0.3),
        high: Math.round(baseRevenue.high * 0.3),
      },
      revenuePotential: 'high',
      description: '通过 TikTok Shop 挂载商品链接，在短视频中植入产品推荐，赚取销售佣金',
      actionSteps: [
        '开通 TikTok Shop 联盟带货权限',
        '选择 3-5 个与内容调性匹配的商品',
        '制作「使用场景 + 效果展示」类带货视频',
        '优化视频前三秒的钩子，提升转化率',
      ],
      why: 'TikTok Shop 2025 年 GMV 突破 200 亿美元，短视频带货是增长最快的变现渠道',
      prerequisites: ['粉丝 ≥ 1K', '账号所在地支持 TikTok Shop', '内容适合植入产品'],
    },
    {
      name: '直播带货',
      icon: 'Radio',
      fitScore: 55 + Math.round(pseudoRandom(seed + 200) * 30),
      difficulty: 'high',
      estimatedMonthlyRevenue: {
        low: Math.round(baseRevenue.low * 0.25),
        mid: Math.round(baseRevenue.mid * 0.25),
        high: Math.round(baseRevenue.high * 0.25),
      },
      revenuePotential: 'high',
      description: '通过实时直播展示商品、与粉丝互动，实现即时成交，适合有表达欲和感染力的创作者',
      actionSteps: [
        '每周固定 2-3 场直播，培养粉丝观看习惯',
        '准备直播脚本和产品卖点清单',
        '设置直播专属优惠，提升成交率',
        '直播后复盘数据，优化选品和话术',
      ],
      why: '直播带货具有最高的即时转化率，头部主播单场 GMV 可达百万美元',
      prerequisites: ['粉丝 ≥ 1K', '良好的口语表达能力', '稳定的直播时间'],
    },
    {
      name: '直播打赏',
      icon: 'Gift',
      fitScore: 45 + Math.round(pseudoRandom(seed + 300) * 35),
      difficulty: 'low',
      estimatedMonthlyRevenue: {
        low: Math.round(baseRevenue.low * 0.1),
        mid: Math.round(baseRevenue.mid * 0.1),
        high: Math.round(baseRevenue.high * 0.1),
      },
      revenuePotential: 'medium',
      description: '通过直播互动获得粉丝打赏礼物，适合才艺型、娱乐型创作者',
      actionSteps: [
        '每周 2-3 场互动直播，设计互动环节',
        '感谢打赏粉丝，建立粉丝团',
        '设置打赏目标并展示进度条',
        '在直播中展示特殊才艺或独家内容',
      ],
      why: '直播打赏门槛低、启动快，适合作为变现的补充渠道',
      prerequisites: ['粉丝 ≥ 1K', '有一定互动能力', '内容适合直播'],
    },
    {
      name: '创作者基金',
      icon: 'Coins',
      fitScore: isSmallAccount ? 80 : isMidAccount ? 60 : 30,
      difficulty: 'low',
      estimatedMonthlyRevenue: {
        low: Math.round(baseRevenue.low * 0.05),
        mid: Math.round(baseRevenue.mid * 0.05),
        high: Math.round(baseRevenue.high * 0.05),
      },
      revenuePotential: 'low',
      description: '加入 TikTok Creator Rewards Program，通过视频播放量获得平台分成',
      actionSteps: [
        '确认账号满足创作者基金最低门槛',
        '提升视频完播率和互动率',
        '发布 1 分钟以上原创视频获取更高收益',
        '保持每周 3-5 条的发布频率',
      ],
      why: '创作者基金是最低门槛的变现方式，适合起步阶段积累第一笔收入',
      prerequisites: ['粉丝 ≥ 10K', '近 30 天播放量 ≥ 100K', '年满 18 岁'],
    },
    {
      name: '知识付费/课程',
      icon: 'BookOpen',
      fitScore: 40 + Math.round(pseudoRandom(seed + 400) * 40),
      difficulty: 'medium',
      estimatedMonthlyRevenue: {
        low: Math.round(baseRevenue.low * 0.15),
        mid: Math.round(baseRevenue.mid * 0.15),
        high: Math.round(baseRevenue.high * 0.15),
      },
      revenuePotential: 'medium',
      description: '将专业知识打包为付费课程或电子书，通过 TikTok 引流到私域完成转化',
      actionSteps: [
        '确定你的核心专业领域，设计课程大纲',
        '在 TikTok 发布免费干货内容建立信任',
        '引导粉丝到独立站或私域完成购买',
        '收集学员反馈，迭代优化课程内容',
      ],
      why: '知识付费利润率高，且能建立长期粉丝粘性，是你专业能力的直接变现',
      prerequisites: ['有专业领域知识', '内容具备教育属性', '有一定粉丝信任度'],
    },
    {
      name: '社群运营',
      icon: 'Users',
      fitScore: 50 + Math.round(pseudoRandom(seed + 500) * 30),
      difficulty: 'medium',
      estimatedMonthlyRevenue: {
        low: Math.round(baseRevenue.low * 0.08),
        mid: Math.round(baseRevenue.mid * 0.08),
        high: Math.round(baseRevenue.high * 0.08),
      },
      revenuePotential: 'medium',
      description: '建立付费社群（Discord/Telegram），提供独家内容、问答互动、资源共享',
      actionSteps: [
        '在 TikTok 简介添加社群链接',
        '每周在社群提供独家内容（教程/数据分析/行业洞察）',
        '设置阶梯式会员制度（基础/高级/VIP）',
        '定期举办社群专属活动，提升留存率',
      ],
      why: '社群运营能建立高粘性粉丝群体，带来稳定的月收入（SaaS 模式）',
      prerequisites: ['有一定粉丝基础', '能持续产出独家内容', '愿意投入时间运营'],
    },
    {
      name: '电商独立站',
      icon: 'Store',
      fitScore: 30 + Math.round(pseudoRandom(seed + 600) * 40),
      difficulty: 'high',
      estimatedMonthlyRevenue: {
        low: Math.round(baseRevenue.low * 0.2),
        mid: Math.round(baseRevenue.mid * 0.2),
        high: Math.round(baseRevenue.high * 0.2),
      },
      revenuePotential: 'high',
      description: '创建自有品牌电商网站，通过 TikTok 内容引流，实现品牌化运营',
      actionSteps: [
        '选择细分品类，创建 Shopify 独立站',
        '设计品牌视觉和产品包装',
        '制作高质量的产品展示视频在 TikTok 发布',
        '建立邮件列表，做复购和交叉销售',
      ],
      why: '电商独立站能建立品牌资产，长期 LTV 远超一次性合作',
      prerequisites: ['有产品供应链', '有一定启动资金', '了解电商运营基础'],
    },
  ]

  // Sort by fit score and pick top 5
  const sorted = allDirections.sort((a, b) => b.fitScore - a.fitScore)
  const topDirections = sorted.slice(0, 5)

  // Calculate total
  const totalMonthly = {
    low: topDirections.reduce((sum, d) => sum + d.estimatedMonthlyRevenue.low, 0),
    mid: topDirections.reduce((sum, d) => sum + d.estimatedMonthlyRevenue.mid, 0),
    high: topDirections.reduce((sum, d) => sum + d.estimatedMonthlyRevenue.high, 0),
  }

  const primary = topDirections[0]
  const secondary = topDirections[1]

  return {
    directions: topDirections,
    primaryRecommendation: `${primary.name} — 匹配度最高（${primary.fitScore}%），预估月收入 $${formatK(primary.estimatedMonthlyRevenue.low)} - $${formatK(primary.estimatedMonthlyRevenue.high)}`,
    secondaryRecommendation: `${secondary.name} — 作为补充渠道，预估月收入 $${formatK(secondary.estimatedMonthlyRevenue.low)} - $${formatK(secondary.estimatedMonthlyRevenue.high)}`,
    estimatedTotalMonthly: totalMonthly,
    summary: `综合评估：你的账号最适合 ${topDirections.length} 个商业化方向，组合运营预计月收入 $${formatK(totalMonthly.low)} - $${formatK(totalMonthly.high)}。建议优先启动 ${primary.name}，稳定后叠加 ${secondary.name}。`,
  }
}

function formatK(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(n))
}

export function generateMockEvaluation(username: string): Evaluation {
  const normalized = username.trim().replace(/^@/, '').toLowerCase()
  const seed = hashString(normalized)
  const archetype = pickArchetype(normalized, seed)
  const profile = generateMockProfile(username)
  const evaluation = scoreProfile(profile)
  const metrics = evaluation.metrics
  const health = mockAccountHealth(profile, metrics)
  const brandPotential = mockBrandPotential(profile, metrics, health)

  return {
    ...evaluation,
    riskFlags: mockRiskFlags(archetype.name, profile),
    accountHealth: health,
    contentCadence: mockContentCadence(),
    engagementQuality: mockEngagementQuality(profile, metrics),
    peerBenchmark: mockPeerBenchmark(profile, metrics),
    brandPotential,
    monetizationPath: mockMonetizationPath(profile, metrics),
    growthPlan: mockGrowthPlan(),
    revenueRoadmap: mockRevenueRoadmap(profile, metrics, evaluation.incomeEstimate, health),
    contentStrategy: mockContentStrategy(profile, metrics),
    peerRanking: mockPeerRanking(profile, metrics),
    brandMatching: mockBrandMatching(profile, metrics, brandPotential),
    trendAnalysis: mockTrendAnalysis(profile, metrics),
    commercializationAdvice: mockCommercialization(profile, metrics, evaluation),
  }
}
