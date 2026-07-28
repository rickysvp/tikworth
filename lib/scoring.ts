import { RawProfile, Evaluation, DimensionScores, ReportSummary, RiskFlag, Metrics, AccountHealth, ContentCadence, EngagementQuality, PeerBenchmark, BrandPotential, BrandMatching, MonetizationPath, GrowthPlan, GrowthItem, Post, IncomeEstimate, IncomeSource, BusinessValue, BusinessValueComponent, AccountProfile, RevenueRoadmap } from '@/types'

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function average(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function stdDev(nums: number[]): number {
  if (nums.length < 2) return 0
  const avg = average(nums)
  const variance = nums.reduce((acc, n) => acc + Math.pow(n - avg, 2), 0) / nums.length
  return Math.sqrt(variance)
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

function inferCategories(profile: RawProfile): string[] {
  const postsText = profile.posts.map(p => (p.desc || '').toLowerCase()).join(' ')
  const bioText = String(profile.bio || '').toLowerCase()
  const nicknameText = String(profile.nickname || '').toLowerCase()
  const text = `${postsText} ${bioText} ${nicknameText}`

  const categories: { keyword: string; label: string; priority?: number }[] = [
    { keyword: '\\bbeauty\\b|\\bmakeup\\b|\\bskincare\\b|妆容|护肤|cosmetic|lipstick|foundation', label: '美妆护肤', priority: 6 },
    { keyword: '\\bfashion\\b|ootd|穿搭|衣服|\\boutfit\\b|\\bstyle\\b|lookbook|模特|\\bmodel\\b', label: '时尚穿搭', priority: 6 },
    { keyword: '\\btech\\b|\\btechnology\\b|\\bgadget\\b|\\bphone\\b|\\bsmartphone\\b|科技|手机|数码|电子产品|unboxing|laptop|camera|耳机|电脑', label: '科技数码' },
    { keyword: '\\bfood\\b|\\brecipe\\b|\\bcooking\\b|美食|做饭|料理|厨房|restaurant', label: '美食' },
    { keyword: '\\bfitness\\b|\\bworkout\\b|\\bgym\\b|健身|运动|\\btraining\\b|yoga|pilates|跑步|marathon|swim|swimming|schwimmen|游泳|\\bsport\\b|\\bsports\\b|pool|schwimmbad', label: '健身运动', priority: 8 },
    { keyword: 'mma|ufc|\\bboxing\\b|jiujitsu|柔术|格斗|摔跤|Grapplerin|grappling|\\bwrestling\\b|\\bmartial\\b|\\bjudo\\b|\\bkarate\\b', label: '格斗运动', priority: 10 },
    { keyword: '\\btravel\\b|\\bvlog\\b|\\btrip\\b|旅行|旅游|hotel|destination', label: '旅行' },
    { keyword: '\\bgame\\b|\\bgaming\\b|\\bplay\\b|游戏|\\bgamer\\b|stream', label: '游戏' },
    { keyword: '\\bfinance\\b|\\bmoney\\b|\\binvest\\b|理财|赚钱|crypto|\\bstock\\b', label: '金融理财' },
    { keyword: '美女|颜值|女神|姐姐|妹|\\bsexy\\b|\\bpretty\\b|\\bgorgeous\\b|\\bgirl\\b|\\bwoman\\b|\\bfemale\\b|\\bhot\\b|\\bcute\\b|\\bbabe\\b|frau|mädchen|schön|hübsch', label: '颜值娱乐', priority: 6 },
    { keyword: '\\bcomedy\\b|\\bfunny\\b|搞笑|幽默|段子|笑话|\\bmeme\\b', label: '搞笑娱乐' },
    { keyword: '\\bmusic\\b|\\bdance\\b|跳舞|舞蹈|翻唱|\\bcover\\b|\\bsong\\b', label: '音乐舞蹈' },
    { keyword: '\\bpet\\b|\\bcat\\b|\\bdog\\b|宠物|猫|狗|\\banimal\\b', label: '萌宠' },
  ]

  const matched = categories
    .filter(c => new RegExp(c.keyword, 'i').test(text))
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .map(c => c.label)

  return matched.length ? matched.slice(0, 3) : ['生活方式', '泛娱乐']
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

function generateSimilarCreators(profile: RawProfile) {
  const base = ['creator_one', 'creator_two', 'creator_three', 'creator_four', 'creator_five']
  return base.map((handle, i) => ({
    name: `Creator ${i + 1}`,
    handle: `@${handle}`,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`,
    followers: Math.max(1000, Math.floor(profile.followerCount * (0.6 + Math.random() * 0.8))),
    overlap: Math.floor(20 + Math.random() * 60),
  }))
}

// ========== 10 Dimension Scoring ==========

function scoreReach(profile: RawProfile): number {
  // 粉丝规模 + 平均播放量
  const posts = profile.posts
  const avgPlays = posts.length ? posts.reduce((s, p) => s + (p.playCount || 0), 0) / posts.length : 0
  const followerScore = clamp((Math.log10(profile.followerCount + 1) / Math.log10(10_000_000 + 1)) * 100, 0, 100)
  const reachRatio = profile.followerCount ? avgPlays / profile.followerCount : 0
  const reachScore = clamp(reachRatio * 80, 0, 100)
  return Math.round(followerScore * 0.5 + reachScore * 0.5)
}

function scoreEngagement(posts: Post[]): number {
  if (!posts.length) return 0
  const totalPlays = posts.reduce((s, p) => s + (p.playCount || 0), 0)
  const totalInteractions = posts.reduce((s, p) => s + (p.likeCount || 0) + (p.commentCount || 0) + (p.shareCount || 0), 0)
  if (!totalPlays) return 0
  const er = (totalInteractions / totalPlays) * 100

  // 不止看互动率，还看评论/点赞比（衡量互动深度）
  const totalLikes = posts.reduce((s, p) => s + (p.likeCount || 0), 0)
  const totalComments = posts.reduce((s, p) => s + (p.commentCount || 0), 0)
  const commentLikeRatio = totalLikes ? totalComments / totalLikes : 0
  const depthBonus = clamp(commentLikeRatio * 200, 0, 20)

  if (er < 1) return Math.round(5 + depthBonus)
  if (er < 3) return Math.round(35 + depthBonus)
  if (er < 6) return Math.round(65 + depthBonus)
  if (er < 9) return Math.round(85 + depthBonus)
  return Math.round(clamp(100 + depthBonus, 0, 100))
}

function scoreContent(profile: RawProfile): number {
  if (!profile.posts.length || !profile.followerCount) return 0
  const avgPlays = average(profile.posts.map(p => p.playCount || 0))
  const breakoutRatio = Math.min(avgPlays / profile.followerCount, 3) / 3

  // 垂直度：标签集中度
  const tagCounts: Record<string, number> = {}
  let totalTags = 0
  for (const post of profile.posts) {
    const tags = (post.desc || '').match(/#\w+/g) || []
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
      totalTags += 1
    }
  }
  let verticality = 0
  if (totalTags) {
    const maxTag = Math.max(...Object.values(tagCounts))
    verticality = maxTag / totalTags
  }

  // 爆款波动：最高播放/均值
  const plays = profile.posts.map(p => p.playCount || 0)
  const maxPlay = Math.max(...plays)
  const avgPlay = average(plays)
  const spikeRatio = avgPlay ? Math.min(maxPlay / avgPlay, 10) / 10 : 0

  return Math.round(breakoutRatio * 55 + verticality * 25 + spikeRatio * 20)
}

function scoreAuthenticity(profile: RawProfile): number {
  // 粉关比 + 互关/刷量检测
  const frRatio = profile.followerCount / Math.max(profile.followingCount, 1)
  let score = clamp((Math.min(frRatio, 50) / 50) * 100, 0, 100)

  const er = scoreEngagement(profile.posts)
  // 大号互动率极低 → 可能是假粉
  if (profile.followerCount > 100_000 && er < 1) {
    score = clamp(score - 35, 0, 100)
  }
  if (profile.followerCount > 500_000 && er < 2) {
    score = clamp(score - 20, 0, 100)
  }
  // 互关号：关注接近粉丝
  if (frRatio < 0.5) {
    score = clamp(score - 30, 0, 100)
  }
  return Math.round(score)
}

function scoreMomentum(posts: Post[]): number {
  if (!posts.length) return 50
  const now = Math.floor(Date.now() / 1000)
  const recent = posts.filter(p => p.createTime && (now - p.createTime) <= 15 * 86400)
  const older = posts.filter(p => p.createTime && (now - p.createTime) > 15 * 86400 && (now - p.createTime) <= 30 * 86400)

  const recentMedian = median(recent.map(p => p.playCount || 0))
  const olderMedian = median(older.map(p => p.playCount || 0))

  if (!olderMedian) return recentMedian ? 70 : 50
  const growth = (recentMedian - olderMedian) / olderMedian
  // More granular: -50% -> 0, 0% -> 50, +100% -> 100
  return Math.round(clamp(50 + growth * 50, 0, 100))
}

function scoreStability(posts: Post[]): number {
  if (!posts.length) return 0
  const plays = posts.map(p => p.playCount || 0)
  const mean = average(plays)
  const cv = mean ? stdDev(plays) / mean : 0

  const now = Math.floor(Date.now() / 1000)
  const latest = Math.max(...posts.map(p => p.createTime || 0))
  const gapDays = latest ? (now - latest) / 86400 : 999

  let score = 100 - clamp(cv * 100, 0, 60)
  if (gapDays > 14) score -= 30
  if (gapDays > 30) score -= 30
  return Math.round(clamp(score, 0, 100))
}

function scoreCommerce(posts: Post[]): number {
  if (!posts.length) return 0
  const commerceWords = ['buy', 'link', 'shop', 'purchase', 'cart', 'order', 'discount', 'deal', 'promo', 'offer', 'ad', 'sponsored', '购买', '链接', '上车', '下单', '链接']
  let hits = 0
  for (const post of posts) {
    const desc = (post.desc || '').toLowerCase()
    if (commerceWords.some(w => desc.includes(w))) hits += 1
  }
  const hitRate = hits / posts.length
  return Math.round(clamp(hitRate * 250, 0, 100))
}

function scoreMonetization(profile: RawProfile, metrics: Metrics): number {
  // 满足变现门槛 + 预估收益
  let score = 0
  if (profile.followerCount >= 10000 && profile.videoCount >= 10) score += 40
  if (profile.followerCount >= 1000 && metrics.engagementRate >= 3) score += 25
  if (profile.followerCount >= 5000) score += 15
  // 互动率越高，变现潜力越大
  score += clamp(metrics.engagementRate * 3.5, 0, 20)
  return Math.round(clamp(score, 0, 100))
}

function scoreHealth(profile: RawProfile, metrics: Metrics): number {
  let score = 100
  if (metrics.engagementRate < 0.5) score -= 25
  if (metrics.cvPlays > 0.7) score -= 20
  if (metrics.playGrowth < -30) score -= 20
  if (metrics.daysSinceLastPost > 14) score -= 20
  if (metrics.daysSinceLastPost > 30) score -= 25
  if (profile.followerCount / Math.max(profile.followingCount, 1) < 0.1) score -= 25
  return Math.round(clamp(score, 0, 100))
}

function scoreInfluence(profile: RawProfile, metrics: Metrics): number {
  // 同体量百分位 + 互动率/播放在同体量中的位置
  const group = peerGroupFromFollowers(profile.followerCount)
  const peerAvg = generatePeerAvg(group)
  const peerTop10 = generatePeerTop10(group)

  let score = 50
  // 互动率对标
  if (metrics.engagementRate >= peerTop10.er) score += 25
  else if (metrics.engagementRate >= peerAvg.er) score += 10
  else score -= 15

  // 平均播放对标
  if (metrics.avgPlays >= peerTop10.avgPlays) score += 25
  else if (metrics.avgPlays >= peerAvg.avgPlays) score += 10
  else score -= 15

  return Math.round(clamp(score, 0, 100))
}

function computeDimensions(profile: RawProfile): DimensionScores {
  const metrics = computeMetrics(profile)
  return {
    reach: scoreReach(profile),
    engagement: scoreEngagement(profile.posts),
    content: scoreContent(profile),
    authenticity: scoreAuthenticity(profile),
    momentum: scoreMomentum(profile.posts),
    stability: scoreStability(profile.posts),
    commerce: scoreCommerce(profile.posts),
    monetization: scoreMonetization(profile, metrics),
    health: scoreHealth(profile, metrics),
    influence: scoreInfluence(profile, metrics),
  }
}

function totalScore(dimensions: DimensionScores): number {
  const weights = {
    reach: 0.10,
    engagement: 0.18,
    content: 0.10,
    authenticity: 0.12,
    momentum: 0.10,
    stability: 0.08,
    commerce: 0.10,
    monetization: 0.08,
    health: 0.08,
    influence: 0.06,
  }
  const score = Object.entries(weights).reduce((sum, [key, weight]) => {
    return sum + dimensions[key as keyof DimensionScores] * weight
  }, 0)
  return Math.round(clamp(score, 0, 100))
}

function computeMetrics(profile: RawProfile): Metrics {
  const posts = profile.posts.length ? profile.posts : []
  const now = Math.floor(Date.now() / 1000)

  const totalPlays = posts.reduce((s, p) => s + (p.playCount || 0), 0)
  const totalInteractions = posts.reduce(
    (s, p) => s + (p.likeCount || 0) + (p.commentCount || 0) + (p.shareCount || 0),
    0
  )
  const avgPlays = posts.length ? totalPlays / posts.length : 0
  const avgLikes = posts.length ? posts.reduce((s, p) => s + (p.likeCount || 0), 0) / posts.length : 0
  const avgComments = posts.length ? posts.reduce((s, p) => s + (p.commentCount || 0), 0) / posts.length : 0
  const avgShares = posts.length ? posts.reduce((s, p) => s + (p.shareCount || 0), 0) / posts.length : 0

  const engagementRate = totalPlays ? (totalInteractions / totalPlays) * 100 : 0

  const plays = posts.map(p => p.playCount || 0)
  const mean = average(plays)
  const cv = mean ? stdDev(plays) / mean : 0

  const recent = posts.filter(p => p.createTime && (now - p.createTime) <= 15 * 86400)
  const older = posts.filter(p => p.createTime && (now - p.createTime) > 15 * 86400 && (now - p.createTime) <= 30 * 86400)
  const recentMedian = median(recent.map(p => p.playCount || 0))
  const olderMedian = median(older.map(p => p.playCount || 0))
  const playGrowth = olderMedian ? ((recentMedian - olderMedian) / olderMedian) * 100 : 0

  const latestTime = posts.length ? Math.max(...posts.map(p => p.createTime || 0)) : 0
  const daysSinceLastPost = latestTime ? Math.floor((now - latestTime) / 86400) : 999

  const sortedByPlays = [...posts].sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
  const topPost = sortedByPlays[0]

  return {
    engagementRate: Number(engagementRate.toFixed(2)),
    avgPlays: Math.round(avgPlays),
    avgLikes: Math.round(avgLikes),
    avgComments: Math.round(avgComments),
    avgShares: Math.round(avgShares),
    likesPerVideo: profile.videoCount ? Math.round(profile.totalLikes / profile.videoCount) : 0,
    followerFollowingRatio: Number((profile.followerCount / Math.max(profile.followingCount, 1)).toFixed(2)),
    recentMedianPlays: Math.round(recentMedian),
    olderMedianPlays: Math.round(olderMedian),
    playGrowth: Number(playGrowth.toFixed(1)),
    cvPlays: Number(cv.toFixed(2)),
    daysSinceLastPost,
    topPostPlays: topPost ? topPost.playCount || 0 : 0,
    topPostLikes: topPost ? topPost.likeCount || 0 : 0,
  }
}

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
    similarCreators: generateSimilarCreators(profile),
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

  const categories = inferCategories(profile)

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

const CATEGORY_BRAND_CONFIG: Record<string, { icon: string; exampleBrands: string[]; collaborationType: string; reasoning: string; cpmMultiplier: number }> = {
  '美妆护肤': { icon: 'Sparkles', exampleBrands: ['Fenty Beauty', 'Glossier'], collaborationType: '产品测评 / 妆容教程', reasoning: '美妆品牌在 TikTok 投放预算充足，易转化', cpmMultiplier: 1.0 },
  '时尚穿搭': { icon: 'Shirt', exampleBrands: ['Zara', 'ASOS'], collaborationType: '穿搭展示 / 开箱测评', reasoning: '时尚品类转化率高，适合软植入', cpmMultiplier: 0.9 },
  '科技数码': { icon: 'Smartphone', exampleBrands: ['Samsung', 'Anker'], collaborationType: '产品评测 / 使用教程', reasoning: '科技品类客单价高，CPM 溢价空间大', cpmMultiplier: 1.2 },
  '美食': { icon: 'Heart', exampleBrands: ['HelloFresh', 'Traeger'], collaborationType: '食谱植入 / 探店合作', reasoning: '美食内容受众广，适合本地生活品牌', cpmMultiplier: 0.8 },
  '健身运动': { icon: 'Heart', exampleBrands: ['Gymshark', 'Lululemon'], collaborationType: '装备测评 / 训练跟练', reasoning: '运动品牌预算稳定，粉丝购买意愿强', cpmMultiplier: 1.0 },
  '格斗运动': { icon: 'Heart', exampleBrands: ['UFC Store', 'Venum'], collaborationType: '装备测评 / 赛事宣传', reasoning: '格斗垂类受众精准，运动装备转化好', cpmMultiplier: 1.1 },
  '旅行': { icon: 'Heart', exampleBrands: ['Booking.com', 'Airbnb'], collaborationType: '目的地推广 / 酒店体验', reasoning: '旅行内容适合目的地和出行品牌', cpmMultiplier: 0.9 },
  '游戏': { icon: 'Heart', exampleBrands: ['Razer', 'Steam'], collaborationType: '游戏测评 / 直播推广', reasoning: '游戏受众活跃，适合硬件和发行商', cpmMultiplier: 0.9 },
  '金融理财': { icon: 'Heart', exampleBrands: ['Robinhood', 'Wealthsimple'], collaborationType: '产品科普 / 推广码', reasoning: '金融类 CPM 高，但合规要求严', cpmMultiplier: 1.3 },
  '颜值娱乐': { icon: 'Sparkles', exampleBrands: ['Beauty Brands', 'Fashion Nova'], collaborationType: '颜值展示 / 生活方式植入', reasoning: '颜值类账号适合美妆、时尚、生活方式品牌', cpmMultiplier: 0.95 },
  '搞笑娱乐': { icon: 'Heart', exampleBrands: ['Netflix', 'Spotify'], collaborationType: '创意广告 / 挑战赛', reasoning: '娱乐内容适合泛品牌曝光和 IP 合作', cpmMultiplier: 0.75 },
  '音乐舞蹈': { icon: 'Heart', exampleBrands: ['Spotify', 'Sony Music'], collaborationType: '新歌推广 / 舞蹈挑战', reasoning: '音乐舞蹈类账号适合音乐平台和艺人推广', cpmMultiplier: 0.8 },
  '萌宠': { icon: 'Heart', exampleBrands: ['Chewy', 'PetSmart'], collaborationType: '宠物用品测评 / 萌宠日常', reasoning: '宠物主消费意愿高，适合宠物品牌', cpmMultiplier: 0.85 },
  '生活方式': { icon: 'Heart', exampleBrands: ['Target', 'Amazon'], collaborationType: '好物分享 / 日常植入', reasoning: '生活方式类受众广，适合大众消费品牌', cpmMultiplier: 0.75 },
  '泛娱乐': { icon: 'Heart', exampleBrands: ['Netflix', 'Amazon Prime'], collaborationType: '品牌曝光 / 创意合作', reasoning: '泛娱乐内容适合广泛的品牌曝光', cpmMultiplier: 0.7 },
}

function buildBrandMatching(profile: RawProfile, metrics: Metrics, brandPotential: BrandPotential): BrandMatching {
  const categories = inferCategories(profile)
  const baseCpm = brandPotential.estimatedCPM
  const followerK = profile.followerCount / 1000

  const matches = categories.slice(0, 3).map((category, idx) => {
    const config = CATEGORY_BRAND_CONFIG[category] || CATEGORY_BRAND_CONFIG['泛娱乐']
    const fitScore = Math.max(50, Math.min(95, 85 - idx * 7))
    const low = Math.round(baseCpm * followerK * config.cpmMultiplier * 0.5)
    const high = Math.round(baseCpm * followerK * config.cpmMultiplier * 1.5)
    return {
      category,
      icon: config.icon,
      fitScore,
      estimatedDealRange: { low, high },
      exampleBrands: config.exampleBrands,
      collaborationType: config.collaborationType,
      reasoning: config.reasoning,
    }
  })

  // Fallback if no categories matched
  if (matches.length === 0) {
    const config = CATEGORY_BRAND_CONFIG['泛娱乐']
    matches.push({
      category: '泛娱乐',
      icon: config.icon,
      fitScore: 60,
      estimatedDealRange: { low: Math.round(baseCpm * followerK * 0.4), high: Math.round(baseCpm * followerK * 1.2) },
      exampleBrands: config.exampleBrands,
      collaborationType: config.collaborationType,
      reasoning: config.reasoning,
    })
  }

  const totalLow = matches.reduce((s, m) => s + m.estimatedDealRange.low, 0)
  const totalHigh = matches.reduce((s, m) => s + m.estimatedDealRange.high, 0)

  return {
    matches,
    totalBrandValue: { low: totalLow, mid: Math.round((totalLow + totalHigh) / 2), high: totalHigh },
    summary: `基于账号内容风格（${categories.join('、')}）的品牌匹配推荐`,
  }
}

function buildMonetizationPath(profile: RawProfile, metrics: Metrics, cadence: ContentCadence): MonetizationPath {
  const eligible: string[] = []
  if (profile.followerCount >= 10000 && profile.videoCount >= 10) eligible.push('Creator Fund / Creativity Program')
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

function tierFromScore(score: number): 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' {
  if (score >= 85) return 'S'
  if (score >= 70) return 'A'
  if (score >= 55) return 'B'
  if (score >= 40) return 'C'
  if (score >= 25) return 'D'
  if (score >= 10) return 'E'
  return 'F'
}

function detectRisks(profile: RawProfile): RiskFlag[] {
  const risks: RiskFlag[] = []
  const posts = profile.posts

  if (!posts.length) {
    risks.push({ level: 'medium', label: '样本不足', detail: '未获取到近期视频，评分参考性较低' })
    return risks
  }

  const totalPlays = posts.reduce((s, p) => s + (p.playCount || 0), 0)
  const totalInteractions = posts.reduce(
    (s, p) => s + (p.likeCount || 0) + (p.commentCount || 0) + (p.shareCount || 0),
    0
  )
  const er = totalPlays ? (totalInteractions / totalPlays) * 100 : 0

  if (er < 0.5) {
    risks.push({ level: 'high', label: '疑似买粉/僵尸号', detail: '互动率极低，粉丝活跃度可能不真实' })
  } else if (profile.followerCount > 100_000 && er < 1) {
    risks.push({ level: 'high', label: '虚高粉丝', detail: '粉丝量大但互动率异常低，商业价值有限' })
  }

  const ratio = profile.followerCount / Math.max(profile.followingCount, 1)
  if (ratio < 0.1) {
    risks.push({ level: 'high', label: '疑似互关刷量', detail: '关注数接近或超过粉丝数，疑似互关/刷量账号' })
  }

  const now = Math.floor(Date.now() / 1000)
  const latestTime = Math.max(...posts.map(p => p.createTime || 0))
  const gapDays = latestTime ? (now - latestTime) / 86400 : 999
  if (gapDays > 30) {
    risks.push({ level: 'high', label: '长期断更', detail: '超过 30 天未发布新视频，可能是弃号或僵尸号' })
  }

  const plays = posts.map(p => p.playCount || 0)
  const peak = Math.max(...plays)
  const recentMedian = median(plays.filter((_, i) => i < Math.ceil(plays.length / 2)))
  if (peak && recentMedian / peak < 0.3) {
    risks.push({ level: 'medium', label: '疑似限流/掉权重', detail: '近期播放较历史峰值明显下跌' })
  }

  if (profile.videoCount < 5) {
    risks.push({ level: 'medium', label: '样本不足', detail: '视频总数过少，评分可能不稳定' })
  }

  return risks
}

function buildVerdict(tier: string, score: number, nickname: string, metrics: Metrics, health: AccountHealth): string {
  const tierText: Record<string, string> = {
    S: '顶级账号，互动率与流量稳定性俱佳',
    A: '优质账号，综合表现高于行业平均',
    B: '合格账号，有明显可谈价/提升空间',
    C: '一般账号，部分指标存在短板',
    D: '问题账号，多维度表现不佳',
    E: '高风险账号，数据真实性存疑',
    F: '不建议合作，账号质量严重不足',
  }
  const engagementLabel = metrics.engagementRate >= 6 ? '互动率健康' : metrics.engagementRate >= 3 ? '互动率一般' : '互动率偏低'
  const healthLabel = health.shadowbanRisk === 'high' ? '，存在明显健康风险' : health.shadowbanRisk === 'medium' ? '，有轻微风险信号' : ''
  return `${nickname} 综合评级 ${tier} 级，${engagementLabel}。${tierText[tier] || ''}${healthLabel}。`
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

  if (tier === 'D') {
    return '多维度表现不佳，创作者需先排查账号问题并优化内容质量；品牌方不建议合作。'
  }

  return '当前数据商业价值极低。创作者建议从零开始重新规划内容和发布策略；品牌方强烈不建议合作。'
}

function buildPriceAdvice(tier: string, followerCount: number, metrics: Metrics, risks: RiskFlag[]): string {
  const hasHighRisk = risks.some(r => r.level === 'high')
  if (hasHighRisk || tier === 'D' || tier === 'E' || tier === 'F') return '不建议报价，优先排查风险。'
  if (tier === 'C') return '如必须合作，建议控制在 $100-300 或等价置换。'

  // Rough CPM-like estimate
  const baseCpm = tier === 'S' ? 25 : tier === 'A' ? 18 : 12
  const engagementFactor = metrics.engagementRate >= 6 ? 1.2 : metrics.engagementRate >= 3 ? 1 : 0.7
  const estimatedPrice = Math.round((followerCount / 1000) * baseCpm * engagementFactor)
  const low = Math.round(estimatedPrice * 0.7)
  const high = Math.round(estimatedPrice * 1.3)

  return `参考行情价：每条合作视频 $${low.toLocaleString()} - $${high.toLocaleString()}。可结合内容制作成本与排他性再调整。`
}

function buildReportSummary(
  dimensions: DimensionScores, tier: string, score: number,
  metrics: Metrics, health: AccountHealth, brand: BrandPotential,
  peers: PeerBenchmark, monetization: MonetizationPath
): ReportSummary {
  const strengths: string[] = []
  const weaknesses: string[] = []

  const dims: [string, number][] = Object.entries(dimensions)
  const sorted = dims.sort((a, b) => b[1] - a[1])

  // Top 2 as strengths
  for (let i = 0; i < 2 && i < sorted.length; i++) {
    const [key, val] = sorted[i]
    if (val >= 60) {
      strengths.push(dimStrengthLabel(key, val))
    }
  }

  // Bottom 2 as weaknesses
  for (let i = sorted.length - 1; i >= 0 && weaknesses.length < 2; i--) {
    const [key, val] = sorted[i]
    if (val < 55) {
      weaknesses.push(dimWeaknessLabel(key, val))
    }
  }

  // Target audience
  let targetAudience = ''
  if (tier === 'S' || tier === 'A') {
    targetAudience = '品牌方（值得付费合作）、创作者（自身价值高，可持续提价）'
  } else if (tier === 'B') {
    targetAudience = '品牌方（可小预算测试合作）、创作者（有提升空间，方向明确）'
  } else if (tier === 'C') {
    targetAudience = '创作者（需重点优化内容与互动，暂不建议品牌方付费）'
  } else if (tier === 'D') {
    targetAudience = '创作者（需排查账号问题并优化内容，暂不具备商业合作条件）'
  } else {
    targetAudience = '创作者（建议从零开始重新规划，暂不具备商业合作条件）'
  }

  // Best action
  let bestAction = ''
  if (health.shadowbanRisk === 'high') {
    bestAction = '优先排查限流/假粉风险，暂停商业合作谈判'
  } else if (metrics.playGrowth > 20 && metrics.engagementRate >= 3) {
    bestAction = '账号处于上升期，创作者可加速更新并尝试新变现方式，品牌方可尽快锁定合作'
  } else if (metrics.engagementRate < 2) {
    bestAction = '优先优化前3秒钩子和评论引导，提升互动率后再考虑商业化'
  } else if (monetization.eligiblePrograms.length === 0) {
    bestAction = '持续稳定输出垂直内容，先达到 Creator Fund 门槛'
  } else {
    bestAction = '维持现有节奏，重点提升内容质量与品牌适配度'
  }

  const headline = `${tier} 级账号 | 超越同体量 ${peers.percentile}% 账号`

  return { headline, strengths, weaknesses, targetAudience, bestAction }
}

function dimStrengthLabel(key: string, val: number): string {
  const map: Record<string, string> = {
    reach: `流量触达力强（${val}分），粉丝规模与播放量表现优异`,
    engagement: `互动健康度高（${val}分），粉丝活跃且评论深度好`,
    content: `内容爆款力强（${val}分），垂直度高、有爆款视频`,
    authenticity: `粉丝真实度高（${val}分），非僵尸粉，互动可信`,
    momentum: `增长势能强（${val}分），近期播放持续上升`,
    stability: `流量稳定（${val}分），播放波动小，可预期`,
    commerce: `商业适配度高（${val}分），有带货意图，品牌匹配好`,
    monetization: `变现潜力强（${val}分），已满足变现平台门槛`,
    health: `账号健康（${val}分），无明显风险信号`,
    influence: `行业位势高（${val}分），高于同体量平均`,
  }
  return map[key] || `${key}: ${val}分`
}

function dimWeaknessLabel(key: string, val: number): string {
  const map: Record<string, string> = {
    reach: `流量触达力不足（${val}分），建议扩大粉丝基础或提升播放量`,
    engagement: `互动健康度低（${val}分），需优化前3秒钩子与评论引导`,
    content: `内容爆款力弱（${val}分），建议聚焦垂直方向提升爆款率`,
    authenticity: `粉丝真实性存疑（${val}分），可能有互关/刷量行为`,
    momentum: `增长势能不足（${val}分），近期播放有所下滑`,
    stability: `流量不稳定（${val}分），播放波动大，影响合作可靠性`,
    commerce: `商业适配度低（${val}分），缺乏带货意图或品牌关联`,
    monetization: `变现潜力低（${val}分），未满足主要变现门槛`,
    health: `账号健康度低（${val}分），存在限流或假粉风险`,
    influence: `行业位势低（${val}分），低于同体量平均`,
  }
  return map[key] || `${key}: ${val}分`
}

// ========== Income Estimation ==========

const CATEGORY_CPM: Record<string, { cpm: { low: number; high: number }; rpm: { low: number; high: number }; label: string }> = {
  finance: { cpm: { low: 18, high: 35 }, rpm: { low: 1.2, high: 2.5 }, label: '金融理财' },
  tech: { cpm: { low: 15, high: 30 }, rpm: { low: 1.0, high: 2.2 }, label: '科技数码' },
  business: { cpm: { low: 12, high: 25 }, rpm: { low: 0.8, high: 1.8 }, label: '商业' },
  beauty: { cpm: { low: 10, high: 22 }, rpm: { low: 0.6, high: 1.5 }, label: '美妆护肤' },
  fitness: { cpm: { low: 8, high: 18 }, rpm: { low: 0.5, high: 1.2 }, label: '健身运动' },
  fashion: { cpm: { low: 8, high: 18 }, rpm: { low: 0.5, high: 1.2 }, label: '时尚穿搭' },
  lifestyle: { cpm: { low: 6, high: 14 }, rpm: { low: 0.4, high: 1.0 }, label: '生活方式' },
  food: { cpm: { low: 6, high: 14 }, rpm: { low: 0.4, high: 1.0 }, label: '美食' },
  travel: { cpm: { low: 5, high: 12 }, rpm: { low: 0.3, high: 0.8 }, label: '旅行' },
  gaming: { cpm: { low: 4, high: 10 }, rpm: { low: 0.3, high: 0.7 }, label: '游戏' },
  entertainment: { cpm: { low: 4, high: 10 }, rpm: { low: 0.2, high: 0.6 }, label: '泛娱乐' },
  education: { cpm: { low: 8, high: 18 }, rpm: { low: 0.5, high: 1.2 }, label: '教育' },
  other: { cpm: { low: 4, high: 12 }, rpm: { low: 0.2, high: 0.8 }, label: '其他' },
}

const REGION_MULTIPLIER: Record<string, number> = {
  US: 1.0,
  Canada: 0.85,
  UK: 0.8,
  'Western Europe': 0.7,
  Australia: 0.65,
  Global: 0.5,
  'Southeast Asia': 0.3,
  Mixed: 0.55,
}

function inferPrimaryCategory(categories: string[]): keyof typeof CATEGORY_CPM {
  if (!categories.length) return 'other'
  const first = categories[0]
  const map: Record<string, keyof typeof CATEGORY_CPM> = {
    '美妆护肤': 'beauty', '时尚穿搭': 'fashion', '科技数码': 'tech',
    '美食': 'food', '健身运动': 'fitness', '旅行': 'travel',
    '游戏': 'gaming', '金融理财': 'finance', '生活方式': 'lifestyle',
    '泛娱乐': 'entertainment', '教育': 'education',
  }
  return map[first] || 'other'
}

function inferRegionLabel(region: string | undefined): string {
  if (!region) return 'Global'
  if (region === 'US') return 'US'
  if (['CA', 'Canada'].includes(region)) return 'Canada'
  if (['GB', 'UK'].includes(region)) return 'UK'
  if (['DE', 'FR', 'IT', 'ES', 'NL', 'Western Europe'].includes(region)) return 'Western Europe'
  if (['AU', 'Australia'].includes(region)) return 'Australia'
  if (['SG', 'TH', 'VN', 'ID', 'PH', 'MY', 'Southeast Asia'].includes(region)) return 'Southeast Asia'
  return 'Global'
}

function formatUsd(n: number): number {
  return Math.round(n)
}

function estimateIncome(
  profile: RawProfile, metrics: Metrics, categories: string[],
  cadence: ContentCadence, brand: BrandPotential, monetization: MonetizationPath
): IncomeEstimate {
  const categoryKey = inferPrimaryCategory(categories)
  const cat = CATEGORY_CPM[categoryKey]
  const regionLabel = inferRegionLabel(profile.region)
  const regionMult = REGION_MULTIPLIER[regionLabel] || 0.5

  // Brand Deals: category CPM × avgPlays × cadence × region
  const monthlyPosts = cadence.avgPostsPerWeek * 4
  const brandCpm = (cat.cpm.low + cat.cpm.high) / 2
  const engagementFactor = clamp(metrics.engagementRate / 5, 0.5, 1.5)
  const perVideoBrandLow = Math.round((metrics.avgPlays / 1000) * cat.cpm.low * regionMult * engagementFactor * 0.6)
  const perVideoBrandMid = Math.round((metrics.avgPlays / 1000) * brandCpm * regionMult * engagementFactor)
  const perVideoBrandHigh = Math.round((metrics.avgPlays / 1000) * cat.cpm.high * regionMult * engagementFactor * 1.4)
  const brandLow = Math.round(perVideoBrandLow * Math.min(monthlyPosts, 4))
  const brandMid = Math.round(perVideoBrandMid * Math.min(monthlyPosts, 4))
  const brandHigh = Math.round(perVideoBrandHigh * Math.min(monthlyPosts, 4))

  // Creator Program: RPM based on long-form video views
  const eligible = monetization.eligiblePrograms.some(p => p.includes('Creator'))
  const programLow = eligible ? Math.round((metrics.avgPlays / 1000) * cat.rpm.low * regionMult * monthlyPosts) : 0
  const programMid = eligible ? Math.round((metrics.avgPlays / 1000) * ((cat.rpm.low + cat.rpm.high) / 2) * regionMult * monthlyPosts) : 0
  const programHigh = eligible ? Math.round((metrics.avgPlays / 1000) * cat.rpm.high * regionMult * monthlyPosts) : 0

  // Subscriptions: estimate 0.5-2% of followers convert
  const subRate = profile.followerCount > 100000 ? 0.005 : 0.015
  const subCount = Math.round(profile.followerCount * subRate * (metrics.engagementRate >= 3 ? 1.2 : 0.7))
  const subPrice = 4.99
  const subLow = Math.round(subCount * 2.99 * 0.5)
  const subMid = Math.round(subCount * subPrice * 0.5)
  const subHigh = Math.round(subCount * 9.99 * 0.5)

  // TikTok Shop: estimate based on follower engagement
  const shopOrders = Math.round(profile.followerCount * (metrics.engagementRate / 100) * 0.02)
  const avgOrderValue = 25
  const profitMargin = 0.25
  const shopLow = Math.round(shopOrders * avgOrderValue * profitMargin * 0.5)
  const shopMid = Math.round(shopOrders * avgOrderValue * profitMargin)
  const shopHigh = Math.round(shopOrders * avgOrderValue * profitMargin * 1.5)

  // LIVE Gifts: rough estimate
  const liveGiftLow = Math.round(profile.followerCount * 0.0001 * regionMult * 50)
  const liveGiftMid = Math.round(profile.followerCount * 0.0003 * regionMult * 50)
  const liveGiftHigh = Math.round(profile.followerCount * 0.0005 * regionMult * 50)

  const breakdown: IncomeSource[] = [
    {
      source: 'brand_deals', label: '品牌赞助',
      icon: 'Briefcase',
      monthlyAmount: { low: formatUsd(brandLow), mid: formatUsd(brandMid), high: formatUsd(brandHigh) },
      percentage: 0, confidence: metrics.engagementRate >= 3 ? 'high' : 'medium',
      detail: `按 ${cat.label} 品类 CPM $${cat.cpm.low}-$${cat.cpm.high}，月均 ${Math.round(monthlyPosts)} 条合作视频`,
    },
    {
      source: 'creator_program', label: '创作者基金',
      icon: 'Play',
      monthlyAmount: { low: formatUsd(programLow), mid: formatUsd(programMid), high: formatUsd(programHigh) },
      percentage: 0, confidence: eligible ? 'medium' : 'low',
      detail: eligible ? `RPM $${cat.rpm.low}-$${cat.rpm.high} × ${regionLabel} 地区` : '暂未满足 Creator Fund 门槛',
    },
    {
      source: 'subscriptions', label: '订阅收入',
      icon: 'Users',
      monthlyAmount: { low: formatUsd(subLow), mid: formatUsd(subMid), high: formatUsd(subHigh) },
      percentage: 0, confidence: 'low',
      detail: `预估 ${subCount} 订阅者 × $${subPrice} 均价`,
    },
    {
      source: 'tiktok_shop', label: 'TikTok Shop',
      icon: 'ShoppingBag',
      monthlyAmount: { low: formatUsd(shopLow), mid: formatUsd(shopMid), high: formatUsd(shopHigh) },
      percentage: 0, confidence: 'low',
      detail: `预估 ${shopOrders} 单/月 × $${avgOrderValue} 客单价`,
    },
    {
      source: 'live_gifts', label: 'LIVE 礼物',
      icon: 'Gift',
      monthlyAmount: { low: formatUsd(liveGiftLow), mid: formatUsd(liveGiftMid), high: formatUsd(liveGiftHigh) },
      percentage: 0, confidence: 'low',
      detail: `基于 ${regionLabel} 地区 LIVE 礼物基准估算`,
    },
  ]

  // Calculate percentages
  const totalMid = breakdown.reduce((s, b) => s + b.monthlyAmount.mid, 0)
  if (totalMid > 0) {
    for (const b of breakdown) {
      b.percentage = Math.round((b.monthlyAmount.mid / totalMid) * 100)
    }
  }

  const monthlyTotal = {
    low: breakdown.reduce((s, b) => s + b.monthlyAmount.low, 0),
    mid: breakdown.reduce((s, b) => s + b.monthlyAmount.mid, 0),
    high: breakdown.reduce((s, b) => s + b.monthlyAmount.high, 0),
  }

  const summary = brandMid > 0
    ? `品牌赞助是主要收入来源（${cat.label} 品类），预估月收入 $${monthlyTotal.low.toLocaleString()} - $${monthlyTotal.high.toLocaleString()}`
    : '当前账号暂不具备稳定变现条件，建议先提升互动率和粉丝量'

  return {
    monthlyTotal,
    breakdown,
    categoryCpm: brandCpm,
    categoryRpm: (cat.rpm.low + cat.rpm.high) / 2,
    regionMultiplier: regionMult,
    categoryLabel: cat.label,
    regionLabel,
    summary,
  }
}

function estimateBusinessValue(
  profile: RawProfile, metrics: Metrics, brand: BrandPotential,
  monetization: MonetizationPath, health: AccountHealth
): BusinessValue {
  const authenticFollowers = Math.round(profile.followerCount * (health.engagementAuthenticity / 100))

  // 1. Brand Deal Value: CPM × avg plays × engagement factor
  const brandCpm = brand.estimatedCPM
  const engagementFactor = clamp(metrics.engagementRate / 5, 0.3, 1.5)
  const brandDealLow = Math.round((metrics.avgPlays / 1000) * brandCpm * 0.6 * engagementFactor * 4)
  const brandDealMid = Math.round((metrics.avgPlays / 1000) * brandCpm * engagementFactor * 4)
  const brandDealHigh = Math.round((metrics.avgPlays / 1000) * brandCpm * 1.5 * engagementFactor * 4)

  // 2. Content Asset Value: video count × avg quality × avg plays value
  const contentValuePerVideo = clamp(metrics.avgPlays / 10000 * 50, 10, 500)
  const contentLow = Math.round(profile.videoCount * contentValuePerVideo * 0.5)
  const contentMid = Math.round(profile.videoCount * contentValuePerVideo)
  const contentHigh = Math.round(profile.videoCount * contentValuePerVideo * 1.5)

  // 3. Follower Asset Value: authentic followers × per-follower value
  const followerValuePer1k = metrics.engagementRate >= 5 ? 15 : metrics.engagementRate >= 2 ? 8 : 3
  const followerLow = Math.round((authenticFollowers / 1000) * followerValuePer1k * 0.6)
  const followerMid = Math.round((authenticFollowers / 1000) * followerValuePer1k)
  const followerHigh = Math.round((authenticFollowers / 1000) * followerValuePer1k * 1.5)

  // 4. Monetization Capability: based on eligible programs
  const eligibleCount = monetization.eligiblePrograms.length
  const monBase = eligibleCount >= 3 ? 15000 : eligibleCount >= 2 ? 8000 : eligibleCount >= 1 ? 3000 : 500
  const monLow = Math.round(monBase * 0.5 * engagementFactor)
  const monMid = Math.round(monBase * engagementFactor)
  const monHigh = Math.round(monBase * 1.5 * engagementFactor)

  const components: BusinessValueComponent[] = [
    {
      label: '品牌合作价值', icon: 'Briefcase',
      amount: { low: brandDealLow, mid: brandDealMid, high: brandDealHigh },
      percentage: 0,
      detail: `CPM $${brandCpm} × 均播 ${formatNum(metrics.avgPlays)} × 月均4条`,
    },
    {
      label: '内容资产价值', icon: 'Film',
      amount: { low: contentLow, mid: contentMid, high: contentHigh },
      percentage: 0,
      detail: `${profile.videoCount} 条视频 × 均播 ${formatNum(metrics.avgPlays)}`,
    },
    {
      label: '粉丝资产价值', icon: 'Users',
      amount: { low: followerLow, mid: followerMid, high: followerHigh },
      percentage: 0,
      detail: `${formatNum(authenticFollowers)} 真实粉丝 × $${followerValuePer1k}/千粉`,
    },
    {
      label: '变现能力价值', icon: 'Zap',
      amount: { low: monLow, mid: monMid, high: monHigh },
      percentage: 0,
      detail: eligibleCount > 0 ? `已满足 ${eligibleCount} 个变现渠道` : '暂未满足变现门槛',
    },
  ]

  const totalMid = components.reduce((s, c) => s + c.amount.mid, 0)
  if (totalMid > 0) {
    for (const c of components) {
      c.percentage = Math.round((c.amount.mid / totalMid) * 100)
    }
  }

  const totalLow = components.reduce((s, c) => s + c.amount.low, 0)
  const totalHigh = components.reduce((s, c) => s + c.amount.high, 0)

  const summary = totalMid >= 50000
    ? `该账号商业价值较高，品牌合作是核心价值来源，适合中大型品牌付费合作`
    : totalMid >= 10000
    ? `该账号具备一定商业价值，可通过品牌合作和小规模变现获取收益`
    : `该账号当前商业价值有限，建议优先提升内容质量和粉丝互动`

  return {
    totalValue: { low: totalLow, mid: totalMid, high: totalHigh },
    components,
    summary,
  }
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(n))
}

function buildAccountProfile(profile: RawProfile, metrics: Metrics, categories: string[], cadence: ContentCadence): AccountProfile {
  const personaType =
    profile.followerCount >= 1_000_000 ? '头部达人' :
    profile.followerCount >= 100_000 ? '腰部创作者' :
    profile.followerCount >= 10_000 ? '成长型博主' : '素人创作者'

  const rhythmLabel = cadence.postingRhythm === 'daily' ? '日更' : cadence.postingRhythm === 'weekly' ? '周更' : '不定期更新'

  const contentStyle =
    metrics.engagementRate >= 6 ? '高互动型' :
    metrics.engagementRate >= 3 ? '内容驱动型' : '流量型'

  return {
    categories: categories.length ? categories.slice(0, 3) : ['泛娱乐'],
    personaType,
    postingRhythm: rhythmLabel,
    audienceRegion: profile.region || 'US',
    contentStyle,
  }
}

function buildRevenueRoadmap(
  profile: RawProfile,
  metrics: Metrics,
  health: AccountHealth,
  monetization: MonetizationPath,
  income: IncomeEstimate,
): RevenueRoadmap {
  const baseMid = income.monthlyTotal.mid

  // Determine growth rate based on actual metrics
  // - playGrowth: recent vs older median plays
  // - engagement rate: quality of audience
  // - account health: risk signals
  let monthlyGrowthRate = 0

  // Growth momentum from play trends
  if (metrics.playGrowth > 30) {
    monthlyGrowthRate = 0.08 // 8% monthly growth for strong momentum
  } else if (metrics.playGrowth > 10) {
    monthlyGrowthRate = 0.05
  } else if (metrics.playGrowth > 0) {
    monthlyGrowthRate = 0.03
  } else if (metrics.playGrowth > -20) {
    monthlyGrowthRate = 0.01 // barely growing
  } else if (metrics.playGrowth > -40) {
    monthlyGrowthRate = -0.02 // declining
  } else {
    monthlyGrowthRate = -0.05 // steep decline
  }

  // Engagement quality modifier
  if (metrics.engagementRate >= 5) {
    monthlyGrowthRate += 0.02
  } else if (metrics.engagementRate >= 3) {
    monthlyGrowthRate += 0.01
  } else if (metrics.engagementRate < 1) {
    monthlyGrowthRate -= 0.03
  }

  // Health risk modifier
  if (health.shadowbanRisk === 'high') {
    monthlyGrowthRate -= 0.05
  } else if (health.shadowbanRisk === 'medium') {
    monthlyGrowthRate -= 0.02
  }

  // Account size modifier - larger accounts grow slower
  if (profile.followerCount > 1_000_000) {
    monthlyGrowthRate -= 0.02
  } else if (profile.followerCount > 100_000) {
    monthlyGrowthRate -= 0.01
  }

  // Monetization readiness bonus
  const eligibleCount = monetization.eligiblePrograms.length
  if (eligibleCount >= 2) {
    monthlyGrowthRate += 0.01
  }

  // Clamp growth rate
  monthlyGrowthRate = clamp(monthlyGrowthRate, -0.08, 0.12)

  // Calculate projections
  const m3Mid = baseMid > 0
    ? Math.round(baseMid * Math.pow(1 + monthlyGrowthRate, 3))
    : Math.round(100 * Math.pow(1 + Math.max(monthlyGrowthRate, 0.02), 3))
  const m6Mid = baseMid > 0
    ? Math.round(baseMid * Math.pow(1 + monthlyGrowthRate, 6))
    : Math.round(200 * Math.pow(1 + Math.max(monthlyGrowthRate, 0.02), 6))
  const m12Mid = baseMid > 0
    ? Math.round(baseMid * Math.pow(1 + monthlyGrowthRate, 12))
    : Math.round(500 * Math.pow(1 + Math.max(monthlyGrowthRate, 0.02), 12))

  const variance = clamp(metrics.cvPlays, 0.15, 0.5)

  // Build milestones based on actual account status
  const buildMilestones = () => {
    const milestones: { month: number; label: string; revenue: { low: number; mid: number; high: number }; milestone: string; unlocks: string[] }[] = []

    // 3 month
    const m3Unlocks: string[] = []
    if (eligibleCount === 0) {
      m3Unlocks.push('达到 Creator Fund 门槛（10K 粉丝）')
      m3Unlocks.push('建立内容模板，提升发布频率')
    } else {
      m3Unlocks.push('开通全部变现渠道')
      m3Unlocks.push('建立品牌合作初选名单')
    }
    if (metrics.engagementRate < 3) {
      m3Unlocks.push('优化前 3 秒钩子，提升互动率至 3%+')
    }

    milestones.push({
      month: 3, label: '3 个月',
      revenue: { low: Math.round(m3Mid * (1 - variance)), mid: m3Mid, high: Math.round(m3Mid * (1 + variance)) },
      milestone: monthlyGrowthRate > 0.03 ? '快速起步阶段' : monthlyGrowthRate > 0 ? '稳定增长起步' : '夯实基础阶段',
      unlocks: m3Unlocks,
    })

    // 6 month
    const m6Unlocks: string[] = []
    if (monthlyGrowthRate > 0.02) {
      m6Unlocks.push('获得首个品牌长期合作')
      m6Unlocks.push('开启直播带货尝试')
    } else if (monthlyGrowthRate > 0) {
      m6Unlocks.push('稳定品牌合作收入')
      m6Unlocks.push('建立粉丝社群')
    } else {
      m6Unlocks.push('排查账号问题，恢复流量权重')
      m6Unlocks.push('尝试新内容方向突破瓶颈')
    }

    milestones.push({
      month: 6, label: '6 个月',
      revenue: { low: Math.round(m6Mid * (1 - variance)), mid: m6Mid, high: Math.round(m6Mid * (1 + variance)) },
      milestone: monthlyGrowthRate > 0.03 ? '收入翻倍增长' : monthlyGrowthRate > 0 ? '多元化变现起步' : '调整优化阶段',
      unlocks: m6Unlocks,
    })

    // 12 month
    const m12Unlocks: string[] = []
    if (monthlyGrowthRate > 0.03) {
      m12Unlocks.push('多平台矩阵分发')
      m12Unlocks.push('自有品牌/产品线')
      m12Unlocks.push('达人经纪签约机会')
    } else if (monthlyGrowthRate > 0) {
      m12Unlocks.push('全渠道变现成熟')
      m12Unlocks.push('建立被动收入来源')
    } else {
      m12Unlocks.push('重新定位账号方向')
      m12Unlocks.push('如未改善，考虑新开账号')
    }

    milestones.push({
      month: 12, label: '12 个月',
      revenue: { low: Math.round(m12Mid * (1 - variance)), mid: m12Mid, high: Math.round(m12Mid * (1 + variance)) },
      milestone: monthlyGrowthRate > 0.03 ? '全渠道变现成熟' : monthlyGrowthRate > 0 ? '稳定增长阶段' : '转型或退出',
      unlocks: m12Unlocks,
    })

    return milestones
  }

  const projections = buildMilestones()

  const total12Month = {
    low: Math.round((baseMid * 3 + m3Mid * 3 + m6Mid * 3 + m12Mid * 3) * (1 - variance)),
    mid: Math.round(baseMid * 3 + m3Mid * 3 + m6Mid * 3 + m12Mid * 3),
    high: Math.round((baseMid * 3 + m3Mid * 3 + m6Mid * 3 + m12Mid * 3) * (1 + variance)),
  }

  // Generate meaningful summary
  let summary = ''
  if (health.shadowbanRisk === 'high') {
    summary = `账号存在高风险信号，当前预测基于问题解决后的恢复路径。若不解决 ${health.shadowbanSignals.length} 个风险信号，实际收入可能低于预期。`
  } else if (monthlyGrowthRate > 0.05) {
    summary = `账号处于强势上升期（月均增速 ${(monthlyGrowthRate * 100).toFixed(0)}%），12 个月累计收入预估 $${formatNum(total12Month.mid)}。建议抓住窗口期加速变现。`
  } else if (monthlyGrowthRate > 0.02) {
    summary = `账号健康增长中（月均增速 ${(monthlyGrowthRate * 100).toFixed(0)}%），12 个月累计收入预估 $${formatNum(total12Month.mid)}。按当前节奏持续优化即可。`
  } else if (monthlyGrowthRate > 0) {
    summary = `账号增长缓慢（月均增速约 ${(monthlyGrowthRate * 100).toFixed(0)}%），需主动拓展变现渠道。12 个月累计收入预估 $${formatNum(total12Month.mid)}。`
  } else {
    summary = `账号当前处于下滑趋势，预测基于采取优化措施后的恢复路径。若不采取行动，实际收入可能持续下降。`
  }

  return {
    currentMonthly: income.monthlyTotal,
    projections,
    total12Month,
    summary,
  }
}

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
  const summary = buildReportSummary(dimensions, tier, score, metrics, accountHealth, brandPotential, peerBenchmark, monetizationPath)
  const incomeEstimate = estimateIncome(profile, metrics, brandPotential.suitableCategories, contentCadence, brandPotential, monetizationPath)
  const businessValue = estimateBusinessValue(profile, metrics, brandPotential, monetizationPath, accountHealth)
  const accountProfile = buildAccountProfile(profile, metrics, brandPotential.suitableCategories, contentCadence)

  return {
    username: profile.username,
    nickname: profile.nickname || profile.username,
    score,
    tier,
    summary,
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
    incomeEstimate,
    businessValue,
    accountProfile,
    revenueRoadmap: buildRevenueRoadmap(profile, metrics, accountHealth, monetizationPath, incomeEstimate),
    contentStrategy: {
      pillars: [
        { type: '教程/干货', icon: 'BookOpen', frequency: '每周 2-3 条', expectedEngagement: '4.5-6.0%', examples: ['5分钟学会XX技巧', '这个隐藏功能99%的人不知道', '行业大佬都在用的方法'], why: '教程类内容完播率高，且容易建立专业信任感' },
        { type: '幕后/日常', icon: 'Camera', frequency: '每周 1-2 条', expectedEngagement: '3.5-5.0%', examples: ['一天的工作流程', '真实的创作幕后', '团队日常互动'], why: '幕后内容拉近粉丝距离，提升粉丝粘性' },
        { type: '趋势/热点', icon: 'TrendingUp', frequency: '每周 2-3 条', expectedEngagement: '5.0-8.0%', examples: ['热门挑战变体', '热点事件解读', '流行趋势分析'], why: '蹭热点是获取自然流量的最快方式' },
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
      ],
      collaborationIdeas: [
        { type: '合拍/联动', description: '与同体量创作者互相导流', potential: 'high' },
        { type: '品牌定制', description: '为相关品牌制作产品测评或教程', potential: 'high' },
      ],
      summary: '建议以教程和热点内容为主体，搭配幕后内容增加人格化',
    },
    peerRanking: {
      overallPercentile: 50 + (metrics.engagementRate - 3) * 10 + (metrics.playGrowth > 0 ? 10 : -5),
      tierLabel: 'Top 50%',
      peerGroupDescription: profile.followerCount < 10000 ? '1K-10K 粉丝创作者' : profile.followerCount < 100000 ? '10K-100K 粉丝创作者' : '100K-1M 粉丝创作者',
      rankingBreakdown: [
        { metric: '互动率', value: `${metrics.engagementRate}%`, percentile: 50 + (metrics.engagementRate - 3) * 12, barColor: '#00F2EA' },
        { metric: '平均播放', value: metrics.avgPlays >= 1000 ? (metrics.avgPlays / 1000).toFixed(1) + 'K' : String(metrics.avgPlays), percentile: 50, barColor: '#FF0050' },
        { metric: '播放增长', value: `${metrics.playGrowth > 0 ? '+' : ''}${metrics.playGrowth}%`, percentile: 50 + metrics.playGrowth * 1.5, barColor: metrics.playGrowth > 0 ? '#22c55e' : '#f59e0b' },
      ],
      insight: '基于同体量创作者的相对表现评估',
    },
    brandMatching: buildBrandMatching(profile, metrics, brandPotential),
    trendAnalysis: {
      trendingTopics: [], trendingSounds: [], contentPredictions: [], bestPostTimes: [], summary: '',
    },
    commercializationAdvice: {
      directions: [], primaryRecommendation: '', secondaryRecommendation: '', estimatedTotalMonthly: { low: 0, mid: 0, high: 0 }, summary: '',
    },
    computedAt: new Date().toISOString(),
    avatar: profile.avatar,
    bio: profile.bio,
    followerCount: profile.followerCount,
    followingCount: profile.followingCount,
    totalLikes: profile.totalLikes,
    videoCount: profile.videoCount,
    verified: profile.verified,
    region: profile.region,
    posts: profile.posts,
  }
}
