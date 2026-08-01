import { describe, it, expect } from 'vitest'
import {
  scoreReach,
  scoreEngagement,
  scoreContent,
  scoreAuthenticity,
  scoreMomentum,
  scoreStability,
  scoreCommerce,
  scoreMonetization,
  scoreHealth,
  scoreInfluence,
} from './dimensions'
import { ClassifiedPost } from './metrics'
import { Metrics, Post } from '../../types'

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: '1',
    playCount: 100000,
    likeCount: 5000,
    commentCount: 500,
    shareCount: 200,
    createTime: Math.floor(Date.now() / 1000) - 86400,
    desc: '#fitness #workout',
    ...overrides,
  }
}

function classify(post: Post): ClassifiedPost {
  return { post, maturity: 'mature' as const, ageHours: 48, ageDays: 2 }
}

function makeMetrics(partial: Partial<Metrics>): Metrics {
  return {
    engagementRate: 0,
    avgPlays: 0,
    avgLikes: 0,
    avgComments: 0,
    avgShares: 0,
    likesPerVideo: 0,
    followerFollowingRatio: 0,
    recentMedianPlays: 0,
    olderMedianPlays: 0,
    playGrowth: 0,
    cvPlays: 0,
    daysSinceLastPost: 0,
    topPostPlays: 0,
    topPostLikes: 0,
    matureMedianPlays: 0,
    matureWeightedAvgPlays: 0,
    historicalImpliedPlays: 0,
    immatureVideoCount: 0,
    growingVideoCount: 0,
    likePlayRatio: 0,
    effectivePlaysSource: 'mature-only',
    effectiveAvgPlays: 0,
    effectivePeakPlays: 0,
    ...partial,
  }
}

describe('scoreReach', () => {
  it('rewards higher play/follower ratio within non-capped range', () => {
    expect(scoreReach(50000, 45000)).toBeGreaterThan(scoreReach(50000, 5000))
  })

  it('clamps between 0 and 100', () => {
    expect(scoreReach(100, 0)).toBeGreaterThanOrEqual(0)
    expect(scoreReach(100000000, 1000000000)).toBeLessThanOrEqual(100)
  })

  it('mega account with 0.5 playFanRatio gets reasonable score', () => {
    const score = scoreReach(100_000_000, 50_000_000)
    expect(score).toBeGreaterThanOrEqual(60)
  })
})

describe('scoreEngagement', () => {
  it('returns higher score for higher engagement rate', () => {
    const high = [classify(makePost({ playCount: 100000, likeCount: 10000, commentCount: 1000, shareCount: 500 }))]
    const low = [classify(makePost({ playCount: 100000, likeCount: 500, commentCount: 50, shareCount: 20 }))]
    expect(scoreEngagement(high, [], 50000)).toBeGreaterThan(scoreEngagement(low, [], 50000))
  })

  it('returns 0 for empty posts', () => {
    expect(scoreEngagement([], [], 50000)).toBe(0)
  })

  it('mega account with 1.5% ER gets reasonable score (not punished)', () => {
    const posts = [classify(makePost({ playCount: 50_000_000, likeCount: 500_000, commentCount: 150_000, shareCount: 100_000 }))]
    const score = scoreEngagement(posts, [], 100_000_000)
    expect(score).toBeGreaterThanOrEqual(60)
  })
})

describe('scoreContent', () => {
  it('rewards consistency and performance, not only spikes', () => {
    const profile = {
      username: 'test',
      nickname: 'Test',
      followerCount: 50000,
      followingCount: 500,
      totalLikes: 2500000,
      videoCount: 120,
      secUid: 'x',
      posts: Array.from({ length: 10 }, (_, i) => makePost({
        id: String(i),
        playCount: 150000 + i * 10000,
        desc: '#fitness #workout',
      })),
    }
    const metrics = makeMetrics({
      cvPlays: 0.2,
      effectiveAvgPlays: 160000,
      effectivePeakPlays: 170000,
    })
    const score = scoreContent(profile, metrics)
    expect(score).toBeGreaterThan(40)
    expect(score).toBeLessThanOrEqual(100)
  })
})

describe('scoreCommerce', () => {
  it('gives baseline score for commercial categories without explicit keywords', () => {
    const posts = [makePost({ desc: '#fitness #workout daily' })]
    expect(scoreCommerce(posts, ['健身运动'], 50000)).toBeGreaterThan(0)
  })

  it('rewards explicit commerce keywords', () => {
    const noKeyword = [makePost({ desc: '#fitness #workout' })]
    const withKeyword = [makePost({ desc: '#fitness buy now link in bio' })]
    expect(scoreCommerce(withKeyword, ['健身运动'], 50000)).toBeGreaterThan(scoreCommerce(noKeyword, ['健身运动'], 50000))
  })

  it('mega account has commerce baseline even without keywords', () => {
    const posts = [makePost({ desc: '#entertainment fun video' })]
    const score = scoreCommerce(posts, ['娱乐'], 100_000_000)
    expect(score).toBeGreaterThanOrEqual(50)
  })
})

describe('scoreMonetization', () => {
  it('does not max out for medium accounts', () => {
    const score = scoreMonetization(50000, 120, 300000, 15, 5.7)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(100)
  })

  it('rewards higher engagement', () => {
    expect(scoreMonetization(50000, 120, 300000, 15, 6)).toBeGreaterThanOrEqual(scoreMonetization(50000, 120, 300000, 15, 3))
  })

  it('mega account gets high monetization baseline', () => {
    const score = scoreMonetization(100_000_000, 800, 50_000_000, 8, 1.5)
    expect(score).toBeGreaterThanOrEqual(80)
  })
})

describe('scoreAuthenticity', () => {
  it('penalizes suspicious follow ratios', () => {
    expect(scoreAuthenticity(1000, 1000, 5, [])).toBeLessThan(scoreAuthenticity(1000, 10, 5, []))
  })

  it('mega account with 1.5% ER not penalized (normal for tier)', () => {
    const score = scoreAuthenticity(100_000_000, 100, 1.5, [])
    expect(score).toBeGreaterThanOrEqual(60)
  })
})

describe('scoreHealth', () => {
  it('penalizes low engagement relative to tier', () => {
    const low = makeMetrics({ engagementRate: 0.3, cvPlays: 0.5, daysSinceLastPost: 5 })
    const high = makeMetrics({ engagementRate: 5, cvPlays: 0.5, daysSinceLastPost: 5 })
    expect(scoreHealth(50000, 500, low)).toBeLessThan(scoreHealth(50000, 500, high))
  })

  it('mega account with normal ER gets high health score', () => {
    const metrics = makeMetrics({ engagementRate: 1.5, cvPlays: 1.0, daysSinceLastPost: 3 })
    const score = scoreHealth(100_000_000, 100, metrics)
    expect(score).toBeGreaterThanOrEqual(80)
  })
})

describe('scoreStability', () => {
  it('rewards low cv and recent posts', () => {
    const stable = [
      classify(makePost({ playCount: 100000 })),
      classify(makePost({ playCount: 105000 })),
      classify(makePost({ playCount: 102000 })),
    ]
    const volatile = [
      classify(makePost({ playCount: 10000 })),
      classify(makePost({ playCount: 200000 })),
      classify(makePost({ playCount: 50000 })),
    ]
    expect(scoreStability(stable, 1, 50000)).toBeGreaterThan(scoreStability(volatile, 1, 50000))
  })

  it('mega account with moderate CV gets reasonable score', () => {
    const posts = [
      classify(makePost({ playCount: 50_000_000 })),
      classify(makePost({ playCount: 45_000_000 })),
      classify(makePost({ playCount: 55_000_000 })),
    ]
    const score = scoreStability(posts, 3, 100_000_000)
    expect(score).toBeGreaterThanOrEqual(50)
  })
})

describe('scoreMomentum', () => {
  it('rewards positive play growth', () => {
    expect(scoreMomentum(0.2, 50000)).toBeGreaterThan(scoreMomentum(-0.2, 50000))
  })

  it('mega account with 0% growth gets neutral score (not punished)', () => {
    const score = scoreMomentum(0, 100_000_000)
    expect(score).toBeGreaterThanOrEqual(60)
  })
})

describe('scoreInfluence', () => {
  it('rewards above-benchmark engagement and play ratio', () => {
    expect(scoreInfluence(50000, 6, 300000)).toBeGreaterThan(scoreInfluence(50000, 1, 10000))
  })

  it('mega account gets high influence baseline', () => {
    const score = scoreInfluence(100_000_000, 1.5, 50_000_000)
    expect(score).toBeGreaterThanOrEqual(70)
  })
})