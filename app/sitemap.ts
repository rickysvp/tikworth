import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://tokvalue.com', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://tokvalue.com/history', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://tokvalue.com/tracker', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ]
}
