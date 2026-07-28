import {
  RawProfile, Metrics, DimensionScores, RiskFlag,
  IncomeEstimate, IncomeSource, BusinessValue, BusinessValueComponent,
  RevenueRoadmap, RevenueMilestone, ContentCadence,
} from '../../types'
import {
  CATEGORY_BRAND_CPM, CATEGORY_CREATOR_RPM, REGION_VALUE_MULTIPLIER,
  ENGAGEMENT_TIERS, FOLLOWER_VALUE_PER_1K, CATEGORY_FAN_VALUE_MULT,
  CONTENT_VALUE_MULTIPLIER, SUBSCRIPTION_CONVERSION_RATES, SUBSCRIPTION_AVG_PRICE,
  SUBSCRIPTION_CREATOR_CUT, SHOP_OPERATIONAL_METRICS, LIVE_GIFT_MULTIPLIERS,
  INCOME_LOW_HIGH_FACTORS, MIN_BRAND_DEAL_PRICE, BRAND_DEAL_LIMITS,
  MONETIZATION_THRESHOLDS, GROWTH_RATE_PARAMS, clamp,
} from './config'

export type FollowerTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega'

export function getFollowerTier(followers: number): FollowerTier {
  if (followers < 10000) return 'nano'
  if (followers < 100000) return 'micro'
  if (followers < 500000) return 'mid'
  if (followers < 1000000) return 'macro'
  return 'mega'
}

const CATEGORY_LABELS: Record<string, string> = {
  '金融理财': '金融理财', 'finance': '金融理财',
  '科技数码': '科技数码', 'tech': '科技数码',
  '汽车': '汽车', 'auto': '汽车', 'cars': '汽车',
  '知识教育': '知识教育', 'education': '知识教育',
  '美妆护肤': '美妆护肤', 'beauty': '美妆护肤', 'makeup': '美妆护肤',
  '时尚穿搭': '时尚穿搭', 'fashion': '时尚穿搭',
  '健身运动': '健身运动', 'fitness': '健身运动', '健身': '健身运动', '格斗运动': '健身运动',
  '运动': '运动', 'sports': '运动',
  '美食': '美食', 'food': '美食', 'cooking': '美食',
  '旅游': '旅游', 'travel': '旅游',
  '母婴亲子': '母婴亲子', 'mom': '母婴亲子', 'parenting': '母婴亲子',
  '生活方式': '生活方式', 'lifestyle': '生活方式',
  '宠物': '宠物', 'pets': '宠物',
  '游戏': '游戏', 'gaming': '游戏', 'games': '游戏',
  '才艺': '才艺', 'talent': '才艺', 'music': '才艺', 'dance': '才艺',
  '剧情': '剧情', 'drama': '剧情', 'storytelling': '剧情',
  '搞笑': '搞笑', 'comedy': '搞笑', 'funny': '搞笑',
  '娱乐': '娱乐', 'entertainment': '娱乐',
  'default': '通用',
}

export function pickCategoryCpm(categories: string[]): { cpm: number; label: string } {
  for (const cat of categories) {
    const key = cat.toLowerCase()
    if (CATEGORY_BRAND_CPM[key] !== undefined) {
      return { cpm: CATEGORY_BRAND_CPM[key], label: CATEGORY_LABELS[key] || cat }
    }
    if (CATEGORY_BRAND_CPM[cat] !== undefined) {
      return { cpm: CATEGORY_BRAND_CPM[cat], label: CATEGORY_LABELS[cat] || cat }
    }
  }
  return { cpm: CATEGORY_BRAND_CPM.default, label: '通用' }
}

const REGION_LABELS: Record<string, string> = {
  'US': '美国', 'CA': '加拿大', 'UK': '英国', 'AU': '澳大利亚',
  'DE': '德国', 'FR': '法国', 'IT': '意大利', 'ES': '西班牙', 'NL': '荷兰',
  'SE': '瑞典', 'CH': '瑞士', 'JP': '日本', 'KR': '韩国',
  'SG': '新加坡', 'HK': '中国香港', 'TW': '中国台湾',
  'AE': '阿联酋', 'SA': '沙特', 'IL': '以色列',
  'BR': '巴西', 'MX': '墨西哥', 'AR': '阿根廷',
  'ID': '印尼', 'TH': '泰国', 'VN': '越南', 'PH': '菲律宾', 'MY': '马来西亚',
  'IN': '印度', 'PK': '巴基斯坦', 'BD': '孟加拉',
  'RU': '俄罗斯', 'TR': '土耳其', 'PL': '波兰', 'CZ': '捷克',
  'ZA': '南非', 'EG': '埃及', 'NG': '尼日利亚',
  'default': '全球',
}

export function pickRegionMultiplier(region?: string): { mult: number; label: string } {
  const r = (region || 'default').toUpperCase()
  const mult = REGION_VALUE_MULTIPLIER[r] ?? REGION_VALUE_MULTIPLIER.default
  const label = REGION_LABELS[r] || REGION_LABELS.default
  return { mult, label }
}

export function getEngagementMultiplier(er: number): number {
  for (const tier of ENGAGEMENT_TIERS) {
    if (er >= tier.min) return tier.multiplier
  }
  return 0.7
}

export interface BrandDealResult {
  perVideoLow: number
  perVideoMid: number
  perVideoHigh: number
  monthlyBrandPosts: number
  monthlyLow: number
  monthlyMid: number
  monthlyHigh: number
  detail: {
    cpm: number
    effectiveAvgPlays: number
    engagementMult: number
    regionMult: number
    monthlyBrandPosts: number
  }
}

export function calcBrandDealValue(
  effectiveAvgPlays: number,
  categoryCpm: number,
  er: number,
  regionMult: number,
  postsPerMonth: number
): BrandDealResult {
  const engagementMult = getEngagementMultiplier(er)
  let perVideoMid = (effectiveAvgPlays / 1000) * categoryCpm * engagementMult * regionMult
  perVideoMid = Math.max(perVideoMid, MIN_BRAND_DEAL_PRICE)

  const maxRatioPosts = postsPerMonth * BRAND_DEAL_LIMITS.maxRatioOfMonthlyPosts
  let monthlyBrandPosts = Math.min(Math.round(maxRatioPosts), BRAND_DEAL_LIMITS.maxPerMonth)
  monthlyBrandPosts = Math.max(monthlyBrandPosts, 0.5)

  const { low: lowFactor, high: highFactor } = INCOME_LOW_HIGH_FACTORS
  const perVideoLow = Math.max(perVideoMid * lowFactor, MIN_BRAND_DEAL_PRICE)
  const perVideoHigh = perVideoMid * highFactor

  return {
    perVideoLow: Math.round(perVideoLow),
    perVideoMid: Math.round(perVideoMid),
    perVideoHigh: Math.round(perVideoHigh),
    monthlyBrandPosts,
    monthlyLow: Math.round(perVideoLow * monthlyBrandPosts),
    monthlyMid: Math.round(perVideoMid * monthlyBrandPosts),
    monthlyHigh: Math.round(perVideoHigh * monthlyBrandPosts),
    detail: {
      cpm: categoryCpm,
      effectiveAvgPlays: Math.round(effectiveAvgPlays),
      engagementMult,
      regionMult,
      monthlyBrandPosts,
    },
  }
}

export interface SimpleIncomeResult {
  low: number
  mid: number
  high: number
  detail: string
}

export interface SubscriptionResult extends SimpleIncomeResult {
  eligible: boolean
}

export interface ShopResult extends SimpleIncomeResult {
  eligible: boolean
}

export function calcCreatorFundIncome(
  effectiveAvgPlays: number,
  postsPerMonth: number,
  region: string | undefined,
  _categories: string[]
): SimpleIncomeResult {
  const monthlyMatureViews = effectiveAvgPlays * postsPerMonth * 0.8
  const rpm = CATEGORY_CREATOR_RPM[(region || 'default').toUpperCase()] ?? CATEGORY_CREATOR_RPM.default
  const mid = (monthlyMatureViews / 1000) * rpm
  const { low, high } = INCOME_LOW_HIGH_FACTORS
  return {
    low: Math.round(mid * low),
    mid: Math.round(mid),
    high: Math.round(mid * high),
    detail: `月成熟播放 ${Math.round(monthlyMatureViews).toLocaleString()} × RPM $${rpm.toFixed(3)}`,
  }
}

export function calcSubscriptionIncome(
  followers: number,
  postsPerMonth: number
): SubscriptionResult {
  const eligible = followers >= MONETIZATION_THRESHOLDS.subscriptionFollowers && postsPerMonth >= 1
  if (!eligible) {
    return { low: 0, mid: 0, high: 0, eligible: false, detail: '暂未满足订阅功能门槛（需 1K+ 粉丝）' }
  }
  const tier = getFollowerTier(followers)
  const convRate = SUBSCRIPTION_CONVERSION_RATES[tier]
  const activeSubs = followers * convRate * 0.3
  const mid = activeSubs * SUBSCRIPTION_AVG_PRICE * SUBSCRIPTION_CREATOR_CUT
  const { low, high } = INCOME_LOW_HIGH_FACTORS
  return {
    low: Math.round(mid * low),
    mid: Math.round(mid),
    high: Math.round(mid * high),
    eligible: true,
    detail: `预估 ${Math.round(activeSubs)} 订阅者 × $${SUBSCRIPTION_AVG_PRICE}/月（创作者分成 50%）`,
  }
}

export function calcTikTokShopIncome(
  followers: number,
  categories: string[],
  engagementRate: number
): ShopResult {
  let shopConfig: { aov: number; commission: number; conversionRate: number } | null = null
  for (const cat of categories) {
    const key = cat.toLowerCase()
    if (SHOP_OPERATIONAL_METRICS[key]) { shopConfig = SHOP_OPERATIONAL_METRICS[key]; break }
    if (SHOP_OPERATIONAL_METRICS[cat]) { shopConfig = SHOP_OPERATIONAL_METRICS[cat]; break }
  }

  const eligible = followers >= MONETIZATION_THRESHOLDS.tiktokShopFollowers && shopConfig !== null
  if (!eligible || !shopConfig) {
    return { low: 0, mid: 0, high: 0, eligible: false, detail: shopConfig ? '粉丝量未达 Shop 门槛（1K+）' : '该品类暂不适合 TikTok Shop 带货' }
  }

  const monthlyActiveFollowers = followers * 0.1
  const erFactor = clamp(engagementRate / 3, 0.5, 1.5)
  const orders = monthlyActiveFollowers * shopConfig.conversionRate * erFactor
  const mid = orders * shopConfig.aov * shopConfig.commission
  const { low, high } = INCOME_LOW_HIGH_FACTORS
  return {
    low: Math.round(mid * low),
    mid: Math.round(mid),
    high: Math.round(mid * high),
    eligible: true,
    detail: `预估 ${Math.round(orders)} 单/月 × $${shopConfig.aov} 客单价 × ${(shopConfig.commission * 100).toFixed(0)}% 佣金`,
  }
}

export function calcLiveGiftIncome(
  followers: number,
  postsPerWeek: number
): SimpleIncomeResult {
  const liveFrequency = postsPerWeek * 0.3
  if (followers < MONETIZATION_THRESHOLDS.liveGiftFollowers || liveFrequency < 0.25) {
    return { low: 0, mid: 0, high: 0, detail: '暂不满足 LIVE 礼物稳定收入条件' }
  }
  const tier = getFollowerTier(followers)
  const rate = LIVE_GIFT_MULTIPLIERS[tier] ?? LIVE_GIFT_MULTIPLIERS.default
  const mid = followers * rate * Math.min(liveFrequency, 4)
  const { low, high } = INCOME_LOW_HIGH_FACTORS
  return {
    low: Math.round(mid * low),
    mid: Math.round(mid),
    high: Math.round(mid * high),
    detail: `基于 ${tier} 层级 LIVE 礼物系数估算，月均 ${liveFrequency.toFixed(1)} 场直播`,
  }
}

export interface ContentAssetResult {
  value: number
  detail: string
}

export function calcContentAssetValue(
  videoCount: number,
  effectiveAvgPlays: number,
  categoryCpm: number
): ContentAssetResult {
  const contentCpm = categoryCpm * CONTENT_VALUE_MULTIPLIER.contentCpmRatio
  const gross = videoCount * (effectiveAvgPlays / 1000) * contentCpm
  const value = gross * CONTENT_VALUE_MULTIPLIER.discountFactor
  return {
    value: Math.round(value),
    detail: `${videoCount} 条视频 × 均播 ${Math.round(effectiveAvgPlays).toLocaleString()} × 内容 CPM $${contentCpm.toFixed(1)} × 折现率 ${(CONTENT_VALUE_MULTIPLIER.discountFactor * 100).toFixed(0)}%`,
  }
}

export interface FollowerAssetResult {
  value: number
  detail: string
}

export function calcFollowerAssetValue(
  followers: number,
  following: number,
  authenticityScore: number,
  categories: string[]
): FollowerAssetResult {
  const realFollowers = followers * (authenticityScore / 100)
  let categoryMult = 1.0
  for (const cat of categories) {
    const key = cat.toLowerCase()
    const m = CATEGORY_FAN_VALUE_MULT[key] ?? CATEGORY_FAN_VALUE_MULT[cat]
    if (m && m > categoryMult) categoryMult = m
  }
  const tier = getFollowerTier(followers)
  const fanValuePer1k = FOLLOWER_VALUE_PER_1K[tier] * categoryMult
  const value = (realFollowers / 1000) * fanValuePer1k
  return {
    value: Math.round(value),
    detail: `${Math.round(realFollowers).toLocaleString()} 真实粉丝 × $${fanValuePer1k.toFixed(1)}/千粉（${tier} 层级，品类系数 ${categoryMult.toFixed(1)}x）`,
  }
}

export interface MonetizationCapResult {
  value: number
  detail: string
}

export function calcMonetizationCapability(
  channels: string[],
  monthlyIncomeMid: number
): MonetizationCapResult {
  const activeChannels = channels.filter(c => c).length
  const value = activeChannels * monthlyIncomeMid * 3
  return {
    value: Math.round(value),
    detail: `已开通 ${activeChannels} 个变现渠道 × 月收入中值 × 3 个月现值`,
  }
}

export interface BuildIncomeInput {
  profile: RawProfile
  metrics: Metrics
  dims: DimensionScores
  categories: string[]
  cadence: ContentCadence
}

export function buildIncomeEstimate(input: BuildIncomeInput): IncomeEstimate {
  const { profile, metrics, categories, cadence } = input
  const { cpm: categoryCpm, label: categoryLabel } = pickCategoryCpm(categories)
  const { mult: regionMult, label: regionLabel } = pickRegionMultiplier(profile.region)
  const postsPerMonth = cadence.avgPostsPerWeek * 4.33

  const brand = calcBrandDealValue(metrics.effectiveAvgPlays, categoryCpm, metrics.engagementRate, regionMult, postsPerMonth)
  const fund = calcCreatorFundIncome(metrics.effectiveAvgPlays, postsPerMonth, profile.region, categories)
  const subs = calcSubscriptionIncome(profile.followerCount, postsPerMonth)
  const shop = calcTikTokShopIncome(profile.followerCount, categories, metrics.engagementRate)
  const live = calcLiveGiftIncome(profile.followerCount, cadence.avgPostsPerWeek)

  const fundEligible = profile.followerCount >= MONETIZATION_THRESHOLDS.creatorFundFollowers

  const breakdown: IncomeSource[] = [
    {
      source: 'brand_deals', label: '品牌赞助', icon: '💰',
      monthlyAmount: { low: brand.monthlyLow, mid: brand.monthlyMid, high: brand.monthlyHigh },
      percentage: 0,
      confidence: metrics.engagementRate >= 3 ? 'high' : 'medium',
      detail: `${categoryLabel} CPM $${categoryCpm} × 均播 ${Math.round(metrics.effectiveAvgPlays).toLocaleString()} × 互动系数 ${brand.detail.engagementMult.toFixed(1)} × ${regionLabel}系数 ${regionMult.toFixed(2)}，月均 ${brand.monthlyBrandPosts} 条`,
    },
    {
      source: 'creator_program', label: '创作者基金', icon: '🎬',
      monthlyAmount: { low: fund.low, mid: fund.mid, high: fund.high },
      percentage: 0,
      confidence: fundEligible ? 'medium' : 'low',
      detail: fundEligible ? fund.detail : '暂未满足 Creator Fund 门槛（10K 粉 + 10 条视频）',
    },
    {
      source: 'subscriptions', label: '订阅收入', icon: '⭐',
      monthlyAmount: { low: subs.low, mid: subs.mid, high: subs.high },
      percentage: 0,
      confidence: subs.eligible ? 'low' : 'low',
      detail: subs.detail,
    },
    {
      source: 'tiktok_shop', label: 'TikTok Shop', icon: '🛒',
      monthlyAmount: { low: shop.low, mid: shop.mid, high: shop.high },
      percentage: 0,
      confidence: shop.eligible ? 'medium' : 'low',
      detail: shop.detail,
    },
    {
      source: 'live_gifts', label: 'LIVE 礼物', icon: '🎁',
      monthlyAmount: { low: live.low, mid: live.mid, high: live.high },
      percentage: 0,
      confidence: 'low',
      detail: live.detail,
    },
  ]

  const totalMid = breakdown.reduce((s, b) => s + b.monthlyAmount.mid, 0)
  if (totalMid > 0) {
    for (const b of breakdown) {
      b.percentage = Math.round((b.monthlyAmount.mid / totalMid) * 100)
    }
  }

  const monthlyTotal = {
    low: breakdown.reduce((s, b) => s + b.monthlyAmount.low, 0),
    mid: totalMid,
    high: breakdown.reduce((s, b) => s + b.monthlyAmount.high, 0),
  }

  const rpm = CATEGORY_CREATOR_RPM[(profile.region || 'default').toUpperCase()] ?? CATEGORY_CREATOR_RPM.default
  const summary = brand.monthlyMid > 0
    ? `品牌赞助是主要收入来源（${categoryLabel} 品类），预估月收入 $${monthlyTotal.low.toLocaleString()} - $${monthlyTotal.high.toLocaleString()}，中值 $${monthlyTotal.mid.toLocaleString()}`
    : '当前账号暂不具备稳定变现条件，建议先提升互动率和粉丝量'

  return {
    monthlyTotal,
    breakdown,
    categoryCpm: Math.round(categoryCpm),
    categoryRpm: rpm,
    regionMultiplier: regionMult,
    categoryLabel,
    regionLabel,
    summary,
  }
}

export interface BuildValueInput {
  profile: RawProfile
  metrics: Metrics
  dims: DimensionScores
  categories: string[]
  income: IncomeEstimate
}

export function buildBusinessValue(input: BuildValueInput): BusinessValue {
  const { profile, metrics, dims, categories, income } = input
  const { cpm: categoryCpm } = pickCategoryCpm(categories)
  const effectiveCpm = income.categoryCpm || categoryCpm
  const brandDealsMid = income.breakdown.find(b => b.source === 'brand_deals')?.monthlyAmount.mid || 0

  const brandDealValue = brandDealsMid * 12
  const contentAsset = calcContentAssetValue(profile.videoCount, metrics.effectiveAvgPlays, effectiveCpm)
  const followerAsset = calcFollowerAssetValue(profile.followerCount, profile.followingCount, dims.authenticity, categories)
  const activeChannels = income.breakdown.filter(b => b.monthlyAmount.mid > 0).map(b => b.source)
  const monCap = calcMonetizationCapability(activeChannels, income.monthlyTotal.mid)

  const components: BusinessValueComponent[] = [
    {
      label: '品牌合作年价值', icon: '💰',
      amount: {
        low: Math.round(brandDealValue * INCOME_LOW_HIGH_FACTORS.low),
        mid: Math.round(brandDealValue),
        high: Math.round(brandDealValue * INCOME_LOW_HIGH_FACTORS.high),
      },
      percentage: 0,
      detail: `月均品牌收入 $${Math.round(brandDealsMid).toLocaleString()} × 12 个月`,
    },
    {
      label: '内容资产价值', icon: '🎬',
      amount: { low: Math.round(contentAsset.value * 0.6), mid: contentAsset.value, high: Math.round(contentAsset.value * 1.5) },
      percentage: 0,
      detail: contentAsset.detail,
    },
    {
      label: '粉丝资产价值', icon: '👥',
      amount: { low: Math.round(followerAsset.value * 0.6), mid: followerAsset.value, high: Math.round(followerAsset.value * 1.5) },
      percentage: 0,
      detail: followerAsset.detail,
    },
    {
      label: '变现能力价值', icon: '⚡',
      amount: { low: Math.round(monCap.value * 0.6), mid: monCap.value, high: Math.round(monCap.value * 1.5) },
      percentage: 0,
      detail: monCap.detail,
    },
  ]

  const totalMid = components.reduce((s, c) => s + c.amount.mid, 0)
  if (totalMid > 0) {
    for (const c of components) c.percentage = Math.round((c.amount.mid / totalMid) * 100)
  }

  const totalLow = components.reduce((s, c) => s + c.amount.low, 0)
  const totalHigh = components.reduce((s, c) => s + c.amount.high, 0)

  const summary = totalMid >= 50000
    ? `该账号商业价值较高（中值 $${Math.round(totalMid).toLocaleString()}），品牌合作是核心价值来源，适合中大型品牌付费合作`
    : totalMid >= 10000
    ? `该账号具备一定商业价值（中值 $${Math.round(totalMid).toLocaleString()}），可通过品牌合作和多渠道变现获取收益`
    : `该账号当前商业价值有限（中值 $${Math.round(totalMid).toLocaleString()}），建议优先提升内容质量和粉丝互动`

  return {
    totalValue: { low: totalLow, mid: totalMid, high: totalHigh },
    components,
    summary,
  }
}

export interface BuildRoadmapInput {
  profile: RawProfile
  metrics: Metrics
  dims: DimensionScores
  risks: RiskFlag[]
  income: IncomeEstimate
}

export function buildRevenueRoadmap(input: BuildRoadmapInput): RevenueRoadmap {
  const { profile, metrics, dims, risks, income } = input
  const baseMid = income.monthlyTotal.mid
  const { playGrowthTransmission, baseGrowthMin, baseGrowthMax, engagementBonusPerPoint,
    engagementBonusMax, engagementBonusMin, highRiskPenalty, mediumRiskPenalty,
    scaleSuppressPerLog, monthlyGrowthMin, monthlyGrowthMax } = GROWTH_RATE_PARAMS

  const rawPlayGrowth = metrics.playGrowth / 100
  const baseGrowth = clamp(rawPlayGrowth * playGrowthTransmission, baseGrowthMin, baseGrowthMax)

  const erDelta = metrics.engagementRate - 3
  const engagementBonus = clamp(erDelta * engagementBonusPerPoint, engagementBonusMin, engagementBonusMax)

  const hasHighRisk = risks.some(r => r.level === 'high')
  const hasMediumRisk = risks.some(r => r.level === 'medium')
  const healthPenalty = hasHighRisk ? highRiskPenalty : hasMediumRisk ? mediumRiskPenalty : 0

  const logF = Math.log10(Math.max(profile.followerCount / 10000, 1))
  const scaleSuppress = logF * scaleSuppressPerLog

  let monthlyGrowth = baseGrowth + engagementBonus + healthPenalty + scaleSuppress
  monthlyGrowth = clamp(monthlyGrowth, monthlyGrowthMin, monthlyGrowthMax)

  const buildProj = (month: number): { low: number; mid: number; high: number } => {
    const mid = baseMid > 0 ? baseMid * Math.pow(1 + monthlyGrowth, month) : 100 * Math.pow(1 + Math.max(monthlyGrowth, 0.02), month)
    const variance = clamp(metrics.cvPlays, 0.15, 0.5)
    return {
      low: Math.max(0, Math.round(mid * (1 - variance))),
      mid: Math.round(mid),
      high: Math.round(mid * (1 + variance)),
    }
  }

  const m3 = buildProj(3)
  const m6 = buildProj(6)
  const m12 = buildProj(12)

  const unlocksFor = (month: number): string[] => {
    const u: string[] = []
    if (month === 3) {
      u.push(dims.monetization < 40 ? '达到 Creator Fund 门槛（10K 粉丝）' : '优化品牌合作报价体系')
      if (metrics.engagementRate < 3) u.push('优化前 3 秒钩子，提升互动率至 3%+')
      u.push('建立固定发布节奏')
    } else if (month === 6) {
      u.push(...(monthlyGrowth > 0.02 ? ['获得首个品牌长期合作', '开启 LIVE/Shop 尝试'] : ['稳定品牌合作收入', '建立粉丝社群']))
    } else if (month === 12) {
      if (monthlyGrowth > 0.03) u.push('多平台矩阵分发', '自有品牌/产品线')
      else if (monthlyGrowth > 0) u.push('全渠道变现成熟', '建立被动收入来源')
      else u.push('重新定位账号方向', '尝试新内容方向突破')
    }
    return u
  }

  const milestoneLabel = (month: number): string => {
    if (monthlyGrowth > 0.05) return month === 3 ? '快速起步阶段' : month === 6 ? '收入翻倍增长' : '全渠道变现成熟'
    if (monthlyGrowth > 0.02) return month === 3 ? '稳定增长起步' : month === 6 ? '多元化变现' : '稳定增长阶段'
    if (monthlyGrowth > 0) return month === 3 ? '夯实基础阶段' : month === 6 ? '优化调整' : '稳定输出阶段'
    return month === 3 ? '问题修复期' : month === 6 ? '转型调整' : '转型或退出'
  }

  const current = income.monthlyTotal
  const projections: RevenueMilestone[] = [
    { month: 3, label: '3 个月', revenue: m3, milestone: milestoneLabel(3), unlocks: unlocksFor(3) },
    { month: 6, label: '6 个月', revenue: m6, milestone: milestoneLabel(6), unlocks: unlocksFor(6) },
    { month: 12, label: '12 个月', revenue: m12, milestone: milestoneLabel(12), unlocks: unlocksFor(12) },
  ]

  const total12Month = {
    low: Math.round((current.low * 3 + m3.low * 3 + m6.low * 3 + m12.low * 3)),
    mid: Math.round((current.mid * 3 + m3.mid * 3 + m6.mid * 3 + m12.mid * 3)),
    high: Math.round((current.high * 3 + m3.high * 3 + m6.high * 3 + m12.high * 3)),
  }

  let summary = ''
  if (hasHighRisk) {
    summary = `账号存在高风险信号，当前预测基于问题解决后的恢复路径。若不解决风险，实际收入可能低于预期 30-50%。`
  } else if (monthlyGrowth > 0.05) {
    summary = `账号处于强势上升期（月均增速 ${(monthlyGrowth * 100).toFixed(0)}%），12 个月累计收入预估 $${total12Month.mid.toLocaleString()}。建议抓住窗口期加速变现。`
  } else if (monthlyGrowth > 0.02) {
    summary = `账号健康增长中（月均增速 ${(monthlyGrowth * 100).toFixed(0)}%），12 个月累计收入预估 $${total12Month.mid.toLocaleString()}。按当前节奏持续优化即可。`
  } else if (monthlyGrowth > 0) {
    summary = `账号增长缓慢（月均增速约 ${(monthlyGrowth * 100).toFixed(0)}%），需主动拓展变现渠道。12 个月累计收入预估 $${total12Month.mid.toLocaleString()}。`
  } else {
    summary = `账号当前存在下滑压力（月均 ${(monthlyGrowth * 100).toFixed(0)}%），预测基于采取优化措施后的恢复路径。`
  }

  return {
    currentMonthly: current,
    projections,
    total12Month,
    summary,
  }
}
