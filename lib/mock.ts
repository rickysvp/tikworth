import { RawProfile, Evaluation } from '@/types'
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

  const basePlays = followerCount * (0.4 + pseudoRandom(seed + 10) * 1.5)
  const growthFactor = type.growth[0] + pseudoRandom(seed + 11) * (type.growth[1] - type.growth[0])
  const stabilityCv = type.stability[0] + pseudoRandom(seed + 12) * (type.stability[1] - type.stability[0])

  for (let i = 0; i < 24; i++) {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatK(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(Math.round(n))
}

export function generateMockEvaluation(username: string): Evaluation {
  const profile = generateMockProfile(username)
  const evaluation = scoreProfile(profile)
  return { ...evaluation, mock: true }
}
