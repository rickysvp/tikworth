import Script from 'next/script'

interface BlogPostJsonLdProps {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  authorName: string
  authorUrl?: string
  tags: string[]
  url: string
  content?: string
}

function extractFaqs(content?: string): Array<{ q: string; a: string }> {
  if (!content) return []
  const faqs: Array<{ q: string; a: string }> = []
  const detailsRe = /<details>[\s\S]*?<summary>(.+?)<\/summary>([\s\S]*?)<\/details>/g
  let m: RegExpExecArray | null
  while ((m = detailsRe.exec(content)) !== null) {
    const q = m[1].trim()
    const a = m[2]
      .replace(/<[^>]+>/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (q && a) faqs.push({ q, a })
  }
  return faqs
}

export function BlogPostJsonLd({
  title,
  description,
  publishedAt,
  updatedAt,
  authorName,
  authorUrl,
  tags,
  url,
  content,
}: BlogPostJsonLdProps) {
  const faqs = extractFaqs(content)
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    author: {
      '@type': 'Person',
      name: authorName,
      ...(authorUrl ? { url: authorUrl } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'TokValue',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tokvalue.com/tokvalue.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: tags.join(', '),
    articleSection: 'Creator Economy',
    inLanguage: 'en-US',
  }

  if (faqs.length > 0) {
    schema.mainEntity = {
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.a,
        },
      })),
    }
  }

  return (
    <Script
      id="blog-post-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
