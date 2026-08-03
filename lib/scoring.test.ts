import { describe, it, expect } from 'vitest'
import { scoreProfile } from './scoring'
import { RawProfile } from '../types'

const now = Math.floor(Date.now() / 1000)

function post(id: string, playCount: number, createTime: number, desc = '#fitness #workout daily routine') {
  return {
    id,
    playCount,
    likeCount: Math.round(playCount * 0.05),
    commentCount: Math.round(playCount * 0.005),
    shareCount: Math.round(playCount * 0.002),
    createTime,
    desc,
  }
}

function buildProfile(overrides: Partial<RawProfile> = {}): RawProfile {
  return {
    username: 'testcreator',
    nickname: 'Test Creator',
    followerCount: 50000,
    followingCount: 500,
    totalLikes: 2500000,
    videoCount: 120,
    secUid: 'sec-uid-test',
    region: 'US',
    avatar: 'https://example.com/avatar.jpg',
    bio: 'Fitness and lifestyle content creator',
    verified: true,
    posts: [
      post('1', 250000, now - 1 * 86400),
      post('2', 180000, now - 3 * 86400),
      post('3', 320000, now - 5 * 86400),
      post('4', 150000, now - 8 * 86400),
      post('5', 200000, now - 12 * 86400),
      post('6', 90000, now - 20 * 86400),
      post('7', 120000, now - 30 * 86400),
      post('8', 80000, now - 45 * 86400),
      post('9', 110000, now - 60 * 86400),
      post('10', 70000, now - 80 * 86400),
    ],
    ...overrides,
  }
}

describe('scoreProfile', () => {
  it('produces valid tier and score for a healthy fitness account', () => {
    const evaluation = scoreProfile(buildProfile(), { now })
    expect(evaluation.score).toBeGreaterThanOrEqual(0)
    expect(evaluation.score).toBeLessThanOrEqual(100)
    expect(['S', 'A', 'B', 'C', 'D', 'E', 'F']).toContain(evaluation.tier)
    expect(evaluation.metrics.engagementRate).toBeGreaterThan(0)
    expect(evaluation.businessValue.totalValue.mid).toBeGreaterThan(0)
    expect(evaluation.riskFlags.filter(r => r.level === 'high')).toHaveLength(0)
  })

  it('detects high risk on suspicious account', () => {
    const evaluation = scoreProfile(buildProfile({
      followerCount: 100000,
      followingCount: 80000,
      posts: Array.from({ length: 10 }, (_, i) => ({
        ...post(String(i), 100000, now - i * 86400),
        likeCount: 50,
        commentCount: 5,
        shareCount: 2,
      })),
    }), { now })
    expect(evaluation.riskFlags.some(r => r.level === 'high')).toBe(true)
  })

  it('commercial categories get commerce baseline', () => {
    const evaluation = scoreProfile(buildProfile(), { now })
    expect(evaluation.dimensions.commerce).toBeGreaterThan(0)
  })

  it('returns empty but valid result for account with no posts', () => {
    const evaluation = scoreProfile(buildProfile({ posts: [] }), { now })
    expect(evaluation.score).toBeGreaterThanOrEqual(0)
    expect(evaluation.score).toBeLessThanOrEqual(100)
    expect(evaluation.riskFlags.some(r => r.label === 'Insufficient Data')).toBe(true)
  })

  // ===== 分层估值模型测试 =====

  it('business value has 5 components including IP brand asset', () => {
    const evaluation = scoreProfile(buildProfile(), { now })
    expect(evaluation.businessValue.components).toHaveLength(5)
    const labels = evaluation.businessValue.components.map(c => c.label)
    expect(labels).toContain('IP/Brand Asset Value')
  })

  it('mega-tier account (MrBeast-like) gets high valuation with market anchoring', () => {
    const megaProfile = buildProfile({
      username: 'mrbeast',
      nickname: 'MrBeast',
      followerCount: 100_000_000,
      followingCount: 50,
      totalLikes: 5_000_000_000,
      videoCount: 800,
      bio: 'Subscribe to my channel for epic videos',
      verified: true,
      region: 'US',
      posts: Array.from({ length: 10 }, (_, i) =>
        post(`m${i}`, 50_000_000, now - (i + 1) * 86400, '#entertainment #mrbeast epic challenge')
      ),
    })
    const evaluation = scoreProfile(megaProfile, { now })
    // mega 账号估值中值应该 >= $10M（修正后的幂律粉丝资产 + IP 资产）
    expect(evaluation.businessValue.totalValue.mid).toBeGreaterThanOrEqual(10_000_000)
    // 应包含 IP 资产组件且非零
    const ipComp = evaluation.businessValue.components.find(c => c.label === 'IP/Brand Asset Value')
    expect(ipComp).toBeDefined()
    expect(ipComp!.amount.mid).toBeGreaterThan(0)
    // 5 个组件百分比之和应接近 100
    const pctSum = evaluation.businessValue.components.reduce((s, c) => s + c.percentage, 0)
    expect(pctSum).toBeGreaterThanOrEqual(95)
    expect(pctSum).toBeLessThanOrEqual(101)
  })

  it('nano-tier account (small KOC) gets valid but small valuation', () => {
    const nanoProfile = buildProfile({
      followerCount: 3_000,
      followingCount: 800,
      totalLikes: 50_000,
      videoCount: 20,
      posts: Array.from({ length: 6 }, (_, i) =>
        post(`n${i}`, 800, now - (i + 1) * 86400, '#lifestyle daily vlog')
      ),
    })
    const evaluation = scoreProfile(nanoProfile, { now })
    // nano 账号估值中值应该 > 0 但不应过高（< $100K）
    expect(evaluation.businessValue.totalValue.mid).toBeGreaterThan(0)
    expect(evaluation.businessValue.totalValue.mid).toBeLessThan(100_000)
    // nano 账号不计入 IP 资产
    const ipComp = evaluation.businessValue.components.find(c => c.label === 'IP/Brand Asset Value')
    expect(ipComp!.amount.mid).toBe(0)
  })

  it('follower asset value uses power-law (not linear) — mega >> nano ratio exceeds linear', () => {
    const nanoEval = scoreProfile(buildProfile({
      followerCount: 5_000,
      followingCount: 200,
      totalLikes: 80_000,
      videoCount: 30,
      posts: Array.from({ length: 6 }, (_, i) => post(`n${i}`, 1500, now - (i + 1) * 86400)),
    }), { now })
    const megaEval = scoreProfile(buildProfile({
      followerCount: 50_000_000,
      followingCount: 100,
      totalLikes: 2_000_000_000,
      videoCount: 500,
      verified: true,
      posts: Array.from({ length: 10 }, (_, i) => post(`g${i}`, 20_000_000, now - (i + 1) * 86400, '#entertainment epic content')),
    }), { now })
    const nanoFollowerAsset = nanoEval.businessValue.components.find(c => c.label === 'Follower Asset Value')!.amount.mid
    const megaFollowerAsset = megaEval.businessValue.components.find(c => c.label === 'Follower Asset Value')!.amount.mid
    // mega 粉丝量是 nano 的 10000 倍，幂律下估值倍数应远高于线性（10000x）
    // 幂律 0.85 指数下：10000^0.85 ≈ 2512x，且 mega baseRate 更高
    const ratio = megaFollowerAsset / Math.max(nanoFollowerAsset, 1)
    expect(ratio).toBeGreaterThan(10000)
  })

  it('high-risk account gets discounted valuation vs low-risk equivalent', () => {
    // 低风险健康账号
    const healthyEval = scoreProfile(buildProfile({
      followerCount: 200_000,
      followingCount: 300,
      totalLikes: 8_000_000,
      posts: Array.from({ length: 10 }, (_, i) => post(`h${i}`, 600_000, now - (i + 1) * 86400)),
    }), { now })
    // 高风险账号：相同粉丝/播放，但互动率极低 + 粉关比异常
    // totalLikes 需与实际低互动一致，否则 historicalImpliedPlays 会虚高
    const riskyEval = scoreProfile(buildProfile({
      followerCount: 200_000,
      followingCount: 195_000,
      totalLikes: 7_200,
      posts: Array.from({ length: 10 }, (_, i) => ({
        ...post(`r${i}`, 600_000, now - (i + 1) * 86400),
        likeCount: 60,
        commentCount: 6,
        shareCount: 2,
      })),
    }), { now })
    expect(riskyEval.riskFlags.some(r => r.level === 'high')).toBe(true)
    // 高风险账号估值应低于健康账号
    expect(riskyEval.businessValue.totalValue.mid).toBeLessThan(healthyEval.businessValue.totalValue.mid)
  })

  // ===== Part A: 估值修复测试 =====

  it('edge-content account (high followers, no branding signals, unstable plays) gets reasonable IP value', () => {
    // 擦边美女账号：50M粉，播放极不稳定，无商业信号
    const edgeProfile = buildProfile({
      username: 'edgegirl',
      nickname: 'Edge Girl',
      followerCount: 50_000_000,
      followingCount: 200,
      totalLikes: 800_000_000,
      videoCount: 300,
      bio: 'follow me for more',
      verified: false,
      region: 'TH',
      posts: Array.from({ length: 10 }, (_, i) =>
        post(`e${i}`, i < 5 ? 30_000_000 : 500_000, now - (i + 1) * 86400, '#dance hot girl')
      ),
    })
    const evaluation = scoreProfile(edgeProfile, { now })
    const ipComp = evaluation.businessValue.components.find(c => c.label === 'IP/Brand Asset Value')!
    // IP 应基于 brandDealAnnual × 5，而非 followers × 1000
    // 旧公式 ~$100M+，新公式应 < $50M
    expect(ipComp.amount.mid).toBeLessThan(50_000_000)
  })

  it('global cap prevents total valuation from exceeding 30x brand annual income', () => {
    const profile = buildProfile({
      followerCount: 5_000_000,
      followingCount: 100,
      totalLikes: 200_000_000,
      videoCount: 200,
      bio: 'founder of tech brand, visit my website',
      verified: true,
      region: 'US',
      posts: Array.from({ length: 10 }, (_, i) =>
        post(`t${i}`, 2_000_000, now - (i + 1) * 86400, '#tech #review founder brand')
      ),
    })
    const evaluation = scoreProfile(profile, { now })
    const brandDealAnnual = evaluation.businessValue.components.find(c => c.label === 'Brand Deal Annual Value')!.amount.mid
    if (brandDealAnnual > 0) {
      expect(evaluation.businessValue.totalValue.mid).toBeLessThanOrEqual(brandDealAnnual * 30 + 1)
    }
  })

  it('follower asset applies commercial proximity discount for accounts without branding signals', () => {
    const noBrandProfile = buildProfile({
      followerCount: 1_000_000,
      followingCount: 500,
      totalLikes: 50_000_000,
      videoCount: 100,
      bio: 'just having fun',
      verified: false,
      posts: Array.from({ length: 10 }, (_, i) =>
        post(`f${i}`, 500_000, now - (i + 1) * 86400, 'funny dance video')
      ),
    })
    const brandedProfile = buildProfile({
      followerCount: 1_000_000,
      followingCount: 500,
      totalLikes: 50_000_000,
      videoCount: 100,
      bio: 'founder of skincare brand, link in bio',
      verified: true,
      posts: Array.from({ length: 10 }, (_, i) =>
        post(`b${i}`, 500_000, now - (i + 1) * 86400, 'skincare routine product review')
      ),
    })
    const noBrandEval = scoreProfile(noBrandProfile, { now })
    const brandedEval = scoreProfile(brandedProfile, { now })
    const noBrandFollower = noBrandEval.businessValue.components.find(c => c.label === 'Follower Asset Value')!.amount.mid
    const brandedFollower = brandedEval.businessValue.components.find(c => c.label === 'Follower Asset Value')!.amount.mid
    expect(brandedFollower).toBeGreaterThan(noBrandFollower * 1.5)
  })

  // ===== Part B: brandDealPerVideo 测试 =====

  it('populates brandDealPerVideo with per-video rate data', () => {
    const evaluation = scoreProfile(buildProfile(), { now })
    expect(evaluation.brandDealPerVideo).toBeDefined()
    expect(evaluation.brandDealPerVideo!.mid).toBeGreaterThan(0)
    expect(evaluation.brandDealPerVideo!.low).toBeLessThanOrEqual(evaluation.brandDealPerVideo!.mid)
    expect(evaluation.brandDealPerVideo!.high).toBeGreaterThanOrEqual(evaluation.brandDealPerVideo!.mid)
    expect(evaluation.brandDealPerVideo!.monthlyBrandPosts).toBeGreaterThan(0)
  })
})
