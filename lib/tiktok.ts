import { RawProfile, Post, SearchUserResult } from '@/types'

const RAPIDAPI_HOST = 'tiktok-scraper7.p.rapidapi.com'
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || ''

function apiHeaders() {
  return {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
    'Content-Type': 'application/json',
  }
}

function normalizeUsername(input: string): string {
  return input.trim().replace(/^@/, '').toLowerCase()
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

class TikTokApiError extends Error {
  code: string
  status: number
  constructor(message: string, code: string, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}

async function apiGet<T = unknown>(path: string, label: string): Promise<T> {
  if (!RAPIDAPI_KEY) {
    throw new TikTokApiError('RAPIDAPI_KEY not configured', 'MISSING_API_KEY', 503)
  }

  const url = `https://${RAPIDAPI_HOST}${path}`
  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: apiHeaders(),
      cache: 'no-store',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('ENOTFOUND')) {
      throw new TikTokApiError(`Network error: ${msg}`, 'NETWORK_ERROR', 502)
    }
    throw err
  }

  if (res.status === 429) throw new TikTokApiError('Rate limited', 'RATE_LIMIT', 429)
  if (res.status === 403) throw new TikTokApiError('Invalid API key or quota exceeded', 'RATE_LIMIT', 429)

  const text = await res.text()

  if (!res.ok) {
    console.error(`[tiktok] ${label} HTTP ${res.status}:`, text.slice(0, 300))
    throw new TikTokApiError(`API HTTP ${res.status}`, 'API_ERROR', 500)
  }

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    console.error(`[tiktok] ${label} invalid JSON:`, text.slice(0, 200))
    throw new TikTokApiError('Invalid API response', 'API_ERROR', 500)
  }

  const root = json as { code?: number; msg?: string; data?: unknown }
  if (root.code !== undefined && root.code !== 0) {
    const msg = root.msg || 'unknown error'
    console.warn(`[tiktok] ${label} api error code=${root.code}: ${msg}`)
    if (/invalid|not found|does not exist/i.test(msg)) {
      throw new TikTokApiError(msg, 'USER_NOT_FOUND', 404)
    }
    if (/rate limit|quota|too many/i.test(msg)) {
      throw new TikTokApiError(msg, 'RATE_LIMIT', 429)
    }
    throw new TikTokApiError(msg, 'API_ERROR', 500)
  }

  return (root.data as T) ?? ({} as T)
}

export async function fetchProfile(inputUsername: string): Promise<RawProfile> {
  const username = normalizeUsername(inputUsername)
  if (!username) throw new TikTokApiError('Empty username', 'INVALID_USERNAME', 400)

  // 1. Fetch user info
  const infoData = await apiGet<{ user?: Record<string, unknown>; stats?: Record<string, unknown> }>(
    `/user/info?unique_id=${encodeURIComponent(username)}`,
    'user/info'
  )

  const user = infoData.user || {}
  const stats = infoData.stats || {}

  const followerCount = toNumber(stats.followerCount)
  const videoCount = toNumber(stats.videoCount)
  const totalLikes = toNumber(stats.heartCount ?? stats.heart)
  const nickname = String(user.nickname || username)
  const secUid = String(user.secUid || '')

  if (!followerCount && !videoCount && !nickname) {
    throw new TikTokApiError('User has empty stats', 'USER_NOT_FOUND', 404)
  }

  console.log('[tiktok] user/info:', username, 'followers:', followerCount, 'videos:', videoCount, 'secUid:', secUid ? 'yes' : 'no')

  // 2. Fetch posts (using unique_id, count=30)
  const posts = await fetchPosts(username)

  return {
    username,
    nickname,
    followerCount,
    followingCount: toNumber(stats.followingCount),
    totalLikes,
    videoCount,
    secUid,
    region: user.region ? String(user.region) : undefined,
    avatar: String(user.avatarLarger || user.avatarMedium || user.avatarThumb || ''),
    bio: String(user.signature || ''),
    posts,
  }
}

async function fetchPosts(uniqueId: string): Promise<Post[]> {
  try {
    // tiktok-scraper7 uses cursor pagination; count=30 per page, fetch 1 page for speed
    const postsData = await apiGet<{ videos?: unknown[]; hasMore?: boolean; cursor?: string }>(
      `/user/posts?unique_id=${encodeURIComponent(uniqueId)}&count=30&cursor=0`,
      'user/posts'
    )

    const videos = postsData.videos || []
    const posts: Post[] = videos.map((v: unknown): Post => {
      const item = (v && typeof v === 'object') ? (v as Record<string, unknown>) : {}
      return {
        id: String(item.video_id || item.aweme_id || item.id || ''),
        playCount: toNumber(item.play_count ?? item.playCount),
        likeCount: toNumber(item.digg_count ?? item.diggCount),
        commentCount: toNumber(item.comment_count ?? item.commentCount),
        shareCount: toNumber(item.share_count ?? item.shareCount),
        createTime: toNumber(item.create_time ?? item.createTime),
        desc: String(item.title ?? item.desc ?? ''),
      }
    }).filter(p => p.id)

    console.log(`[tiktok] user/posts returned ${posts.length} posts`)
    return posts
  } catch (err) {
    // Posts fetch failure shouldn't block the entire evaluation (scores can still work with aggregate stats)
    console.warn('[tiktok] user/posts failed, continuing without posts:', err instanceof Error ? err.message : err)
    return []
  }
}

export async function searchUsers(keywords: string, count = 10): Promise<SearchUserResult[]> {
  const q = keywords.trim()
  if (!q) return []

  const data = await apiGet<{ user_list?: unknown[] }>(
    `/user/search?keywords=${encodeURIComponent(q)}&count=${count}&cursor=0`,
    'user/search'
  )

  const list = data.user_list || []
  return list.map((entry: unknown): SearchUserResult => {
    const e = (entry && typeof entry === 'object') ? (entry as Record<string, unknown>) : {}
    const u = (e.user && typeof e.user === 'object') ? (e.user as Record<string, unknown>) : {}
    const s = (e.stats && typeof e.stats === 'object') ? (e.stats as Record<string, unknown>) : {}
    return {
      uniqueId: String(u.uniqueId || ''),
      nickname: String(u.nickname || ''),
      signature: String(u.signature || ''),
      avatarLarger: String(u.avatarLarger || u.avatarMedium || u.avatarThumb || ''),
      verified: Boolean(u.verified),
      region: u.region ? String(u.region) : undefined,
      secUid: String(u.secUid || ''),
      followerCount: toNumber(s.followerCount),
      videoCount: toNumber(s.videoCount),
      heartCount: toNumber(s.heartCount ?? s.heart),
    }
  }).filter(r => r.uniqueId)
}
