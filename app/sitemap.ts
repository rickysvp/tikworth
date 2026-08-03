import type { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://tokvalue.com'

  // 静态页面（含真实 lastModified）
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: '2026-08-03', changeFrequency: 'daily', priority: 1 },
    { url: `${base}/blog`, lastModified: '2026-08-03', changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/history`, lastModified: '2026-08-03', changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/tracker`, lastModified: '2026-08-03', changeFrequency: 'weekly', priority: 0.5 },
    { url: `${base}/privacy`, lastModified: '2026-08-03', changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terms`, lastModified: '2026-08-03', changeFrequency: 'yearly', priority: 0.2 },
  ]

  // 博客文章（真实更新时间，新增文章自动带上）
  const blogPages: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.updatedAt || post.publishedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  return [...staticPages, ...blogPages]
}
