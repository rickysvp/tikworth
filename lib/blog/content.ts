// Blog content source — structured for SEO + scalability
// Each post has schema.org-compliant fields; content is markdown for portability

export interface BlogPostMeta {
  slug: string
  title: string
  description: string
  excerpt: string // Short summary for cards (max 160 chars)
  tags: string[]
  publishedAt: string // ISO
  updatedAt?: string // ISO, for last modified
  readTime: string
  category: string
  featured?: boolean
  author: string // slug of author profile in lib/blog/authors.ts
  coverGradient?: string // CSS gradient for cover
}

export interface BlogPost extends BlogPostMeta {
  content: string
  tableOfContents?: Array<{ id: string; text: string; level: number }>
}

export const CATEGORIES = [
  'Creator Economy',
  'Monetization',
  'Analytics & Strategy',
  'Guides',
  'Case Studies',
] as const

export type Category = (typeof CATEGORIES)[number]

