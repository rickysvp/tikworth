import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Script from 'next/script'
import { Calendar, ArrowLeft } from 'lucide-react'
import { getAllAuthors, getAuthorBySlug, getAllPosts } from '@/lib/blog'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export function generateStaticParams() {
  return getAllAuthors().map(a => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const author = getAuthorBySlug(slug)
  if (!author) return { title: 'Author Not Found — TokValue Blog' }
  const url = `https://tokvalue.com/authors/${author.slug}`
  return {
    title: `${author.name} — ${author.role} | TokValue`,
    description: author.bio.slice(0, 155),
    alternates: { canonical: url },
    openGraph: {
      title: `${author.name} — ${author.role} | TokValue`,
      description: author.bio.slice(0, 155),
      url,
    },
  }
}

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const author = getAuthorBySlug(slug)
  if (!author) notFound()

  const posts = getAllPosts().filter(p => p.author === author.slug)
  const url = `https://tokvalue.com/authors/${author.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${url}#person`,
    url,
    name: author.name,
    jobTitle: author.role,
    description: author.bio,
    image: author.avatar ? `https://tokvalue.com${author.avatar}` : undefined,
    worksFor: {
      '@type': 'Organization',
      name: 'TokValue',
      url: 'https://tokvalue.com',
    },
    sameAs: [
      author.twitter,
      author.linkedin,
      author.tiktok,
      author.website,
    ].filter(Boolean),
    knowsAbout: ['TikTok', 'Creator Economy', 'Influencer Marketing', 'Social Media Analytics'],
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <SiteHeader />
      <Script
        id="author-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-[#00F2EA] transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>

          <header className="mb-10">
            <div className="flex items-center gap-5 mb-5">
              {author.avatar ? (
                <Image
                  src={author.avatar}
                  alt={author.name}
                  width={64}
                  height={64}
                  className="rounded-full border-2 border-[#FF0050]"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#FF2D78] to-[#00F2EA] text-2xl font-bold text-white">
                  {author.avatarInitial}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">{author.name}</h1>
                <p className="mt-1 text-sm font-medium text-[#00F2EA]">{author.role}</p>
              </div>
            </div>
            <p className="text-base text-neutral-300 leading-relaxed">{author.bio}</p>

            {/* Social Links */}
            {(author.twitter || author.linkedin || author.tiktok || author.website) && (
              <div className="flex flex-wrap gap-3 mt-4">
                {author.twitter && (
                  <a
                    href={author.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#00F2EA] hover:underline"
                  >
                    Twitter →
                  </a>
                )}
                {author.linkedin && (
                  <a
                    href={author.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#00F2EA] hover:underline"
                  >
                    LinkedIn →
                  </a>
                )}
                {author.tiktok && (
                  <a
                    href={author.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#00F2EA] hover:underline"
                  >
                    TikTok →
                  </a>
                )}
                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#00F2EA] hover:underline"
                  >
                    Website →
                  </a>
                )}
              </div>
            )}
          </header>

          <section>
            <h2 className="mb-5 text-lg font-semibold text-white">
              Articles by {author.name.split(' ')[0]} ({posts.length})
            </h2>
            {posts.length === 0 ? (
              <p className="text-neutral-500">No articles yet.</p>
            ) : (
              <ul className="space-y-4">
                {posts.map(post => (
                  <li key={post.slug}>
                    <Link href={`/blog/${post.slug}`} className="group block rounded-xl border border-neutral-800 bg-neutral-900/40 p-5 transition-colors hover:border-[#00F2EA]/40">
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                        <Calendar className="h-3.5 w-3.5" />
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </time>
                        <span>·</span>
                        <span>{post.category}</span>
                      </div>
                      <h3 className="text-base font-semibold text-white group-hover:text-[#00F2EA] transition-colors">
                        {post.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-neutral-400 line-clamp-2">{post.excerpt}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
