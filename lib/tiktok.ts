import { RawProfile, Post } from '@/types'

const RAPIDAPI_HOST = 'tiktok-api23.p.rapidapi.com'
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

function extractNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function parseUserInfo(json: unknown): Partial<RawProfile> {
  if (!json || typeof json !== 'object') return {}

  const root = json as Record<string, unknown>

  // Try common shapes: nested userInfo/user/stats or flattened
  const userInfo =
    (root.userInfo as Record<string, unknown>) ||
    root

  const user =
    (userInfo.user as Record<string, unknown>) ||
    (root.user as Record<string, unknown>) ||
    root

  const stats =
    (userInfo.stats as Record<string, unknown>) ||
    (user.stats as Record<string, unknown>) ||
    (root.stats as Record<string, unknown>) ||
    user

  // Prefer statsV2 (string values) when available - more accurate
  const statsV2 =
    (userInfo.statsV2 as Record<string, unknown>) ||
    (user.statsV2 as Record<string, unknown>) ||
    (root.statsV2 as Record<string, unknown>)

  const getNumber = (keys: string[]) => {
    for (const key of keys) {
      const v = statsV2?.[key] ?? stats[key] ?? user[key] ?? root[key]
      const n = extractNumber(v)
      if (n !== 0 || (typeof v === 'string' && v.includes('0'))) return n
    }
    return 0
  }

  return {
    nickname: String((user.nickname as string) || (root.nickname as string) || ''),
    followerCount: getNumber(['followerCount']),
    followingCount: getNumber(['followingCount']),
    totalLikes: getNumber(['heartCount', 'heart']),
    videoCount: getNumber(['videoCount']),
    secUid: String((user.secUid as string) || (root.secUid as string) || ''),
    region: String((user.region as string) || (root.region as string) || undefined),
    avatar:
      (user.avatarLarger as string) ||
      (user.avatarMedium as string) ||
      (user.avatarThumb as string) ||
      (root.avatar as string),
  }
}

function findPostArray(json: unknown): unknown[] {
  if (!json || typeof json !== 'object') return []
  if (Array.isArray(json)) return json

  const root = json as Record<string, unknown>
  const candidates = ['data', 'itemList', 'posts', 'awemeList', 'aweme_list', 'item_list', 'videoList']

  for (const key of candidates) {
    const value = root[key]
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object') {
      const nested = findPostArray(value)
      if (nested.length > 0) return nested
    }
  }

  return []
}

function parsePosts(json: unknown): Post[] {
  const dataList = findPostArray(json)

  if (dataList.length === 0) {
    if (json && typeof json === 'object') {
      console.warn('[tiktok] parsePosts: no data array found, keys:', Object.keys(json as Record<string, unknown>).join(', '))
    }
    return []
  }

  return dataList.map((item: unknown): Post => {
    const post = (item && typeof item === 'object') ? (item as Record<string, unknown>) : {}
    const stats =
      (post.stats as Record<string, unknown>) ||
      (post.statistics as Record<string, unknown>) ||
      (post.video as Record<string, unknown>) ||
      post

    const statsV2 =
      (post.statsV2 as Record<string, unknown>) ||
      (post.authorStats as Record<string, unknown>)

    return {
      id: String(post.id || post.videoId || post.aweme_id || post.awemeId || ''),
      playCount: extractNumber(statsV2?.playCount ?? stats.playCount ?? post.playCount ?? post.play_count),
      likeCount: extractNumber(statsV2?.diggCount ?? stats.diggCount ?? stats.likeCount ?? post.likeCount ?? post.digg_count),
      commentCount: extractNumber(statsV2?.commentCount ?? stats.commentCount ?? post.commentCount ?? post.comment_count),
      shareCount: extractNumber(statsV2?.shareCount ?? stats.shareCount ?? post.shareCount ?? post.share_count),
      createTime: extractNumber(post.createTime ?? stats.createTime ?? post.create_time),
      desc: String(post.desc ?? post.description ?? post.text ?? ''),
    }
  }).filter(p => p.id)
}

async function fetchPosts(secUid: string): Promise<Post[]> {
  if (!secUid) return []

  const endpoints = [
    `/api/user/posts?secUid=${encodeURIComponent(secUid)}&count=30`,
    `/api/user/oldest-posts?secUid=${encodeURIComponent(secUid)}&count=30&cursor=0`,
  ]

  for (const path of endpoints) {
    try {
      const res = await fetch(`https://${RAPIDAPI_HOST}${path}`, {
        method: 'GET',
        headers: apiHeaders(),
        cache: 'no-store',
      })

      const text = await res.text().catch(() => '')

      if (!res.ok) {
        console.warn(`[tiktok] ${path} failed: ${res.status}`, text.slice(0, 200))
        continue
      }

      if (!text.trim()) {
        console.warn(`[tiktok] ${path} returned empty body`)
        continue
      }

      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        console.warn(`[tiktok] ${path} returned invalid JSON:`, text.slice(0, 200))
        continue
      }

      const posts = parsePosts(json)
      console.log(`[tiktok] ${path} returned ${posts.length} posts`)
      if (posts.length > 0) {
        console.log('[tiktok] first post sample:', JSON.stringify(posts[0]).slice(0, 300))
        return posts
      }
    } catch (err) {
      console.warn(`[tiktok] ${path} request failed`, err)
    }
  }

  return []
}

export async function fetchProfile(inputUsername: string): Promise<RawProfile> {
  const username = normalizeUsername(inputUsername)
  if (!username) {
    throw new Error('INVALID_USERNAME')
  }

  // 1. Fetch user info (new API uses uniqueId)
  const infoRes = await fetch(`https://${RAPIDAPI_HOST}/api/user/info?uniqueId=${encodeURIComponent(username)}`, {
    method: 'GET',
    headers: apiHeaders(),
    cache: 'no-store',
  })

  if (!infoRes.ok) {
    const text = await infoRes.text().catch(() => '')
    console.error(`[tiktok] user info failed: ${infoRes.status}`, text.slice(0, 200))
    if (infoRes.status === 429) throw new Error('RATE_LIMIT')
    if (infoRes.status === 404) throw new Error('USER_NOT_FOUND')
    throw new Error(`API_ERROR: ${infoRes.status}`)
  }

  const infoText = await infoRes.text()

  let infoJson: unknown
  try {
    infoJson = JSON.parse(infoText)
  } catch (err) {
    console.error('[tiktok] parse info json failed', err, 'text:', infoText.slice(0, 200))
    throw new Error('API_ERROR')
  }

  const info = parseUserInfo(infoJson)

  if (!info.followerCount && !info.videoCount && !info.nickname) {
    // Could be a private/missing account
    throw new Error('USER_NOT_FOUND')
  }

  console.log('[tiktok] fetched real data for', username, 'followers:', info.followerCount, 'videos:', info.videoCount, 'secUid:', info.secUid ? 'yes' : 'no')

  // 2. Fetch posts using secUid (try multiple endpoints)
  const posts = info.secUid ? await fetchPosts(info.secUid) : []

  return {
    username,
    nickname: info.nickname || username,
    followerCount: info.followerCount || 0,
    followingCount: info.followingCount || 0,
    totalLikes: info.totalLikes || 0,
    videoCount: info.videoCount || 0,
    secUid: info.secUid || '',
    region: info.region,
    avatar: info.avatar,
    posts,
  }
}
