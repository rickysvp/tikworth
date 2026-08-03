import Script from 'next/script'

interface BlogPostJsonLdProps {
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  author: string
  tags: string[]
  url: string
}

export function BlogPostJsonLd({
  title,
  description,
  publishedAt,
  updatedAt,
  author,
  tags,
  url,
}: BlogPostJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://tokvalue.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TokValue',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tokvalue.com/logo.png',
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

  return (
    <Script
      id="blog-post-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
