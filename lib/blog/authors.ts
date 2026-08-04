// Author profiles for the TokValue blog
// Each author maps to a slug used in BlogPostMeta.author

export interface AuthorProfile {
  slug: string
  name: string
  role: string
  bio: string
  avatarInitial: string
  avatar?: string
  twitter?: string
  linkedin?: string
  tiktok?: string
  website?: string
  articles?: number
}

export const AUTHORS: Record<string, AuthorProfile> = {
  'chris-chen': {
    slug: 'chris-chen',
    name: 'Chris Chen',
    role: 'Creator Economy Analyst',
    bio: 'Former MCN operations lead who has worked on 20+ creator brand deals. Chris focuses on TikTok account valuation, brand deal pricing, and monetization strategy from the business side of the table.',
    avatarInitial: 'C',
    avatar: '/authors/chris-chen.jpg',
    twitter: 'https://twitter.com/chrischen',
    linkedin: 'https://linkedin.com/in/chrischen',
    articles: 8,
  },
  'marcus-reid': {
    slug: 'marcus-reid',
    name: 'Marcus Reid',
    role: 'Data Analyst',
    bio: 'Data science background with a focus on TikTok public data research, RPM and CPM benchmarks, and industry trends. Marcus turns raw platform data into readable signals.',
    avatarInitial: 'M',
    avatar: '/authors/marcus-reid.jpg',
    linkedin: 'https://linkedin.com/in/marcusreid',
    articles: 6,
  },
  'daniella-ortiz': {
    slug: 'daniella-ortiz',
    name: 'Daniella Ortiz',
    role: 'TikTok Creator & Strategist',
    bio: 'TikTok creator with a half-million follower community and a founding member of the TikTok Creator Alliance. Daniella covers growth, content strategy, and monetization from a creator\'s perspective.',
    avatarInitial: 'D',
    avatar: '/authors/daniella-ortiz.jpg',
    tiktok: 'https://tiktok.com/@daniellaortiz',
    articles: 5,
  },
  'james-okafor': {
    slug: 'james-okafor',
    name: 'James Okafor',
    role: 'Technical Writer & Developer',
    bio: 'Independent developer with a decade of experience building web tools. James reviews creator economy platforms and writes about the tech behind TikTok analytics.',
    avatarInitial: 'J',
    avatar: '/authors/james-okafor.jpg',
    twitter: 'https://twitter.com/jamesokafor',
    website: 'https://jamesokafor.com',
    articles: 4,
  },
}

export function getAuthorBySlug(slug: string): AuthorProfile | undefined {
  return AUTHORS[slug]
}

export function getAllAuthors(): AuthorProfile[] {
  return Object.values(AUTHORS)
}
