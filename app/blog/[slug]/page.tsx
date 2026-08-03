import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPostBySlug, getAllPosts } from '@/lib/blog'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'
import ShareButton from './ShareButton'

// ── Static generation ──

export function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post Not Found — TokValue Blog' }
  return {
    title: `${post.title} — TokValue Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedAt,
      tags: post.tags,
    },
  }
}

// ── Page ──

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  // Simple markdown-to-HTML renderer (handles h1-h3, p, ul, li, strong, em, inline code, links, tables, hr)
  function renderMd(md: string): string {
    let html = md
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold mt-10 mb-3 text-white">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold mt-12 mb-4 text-white border-b border-neutral-800 pb-2">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-6 text-white">$1</h1>')
      // Horizontal rules
      .replace(/^---+$/gm, '<hr class="my-8 border-neutral-800" />')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="rounded bg-neutral-800 px-1.5 py-0.5 text-sm text-[#00F2EA] font-mono">$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#00F2EA] underline underline-offset-2 hover:text-[#00D4CE]" target="_blank" rel="noopener">$1</a>')
      // Unordered lists
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-neutral-300 leading-relaxed">$1</li>')
      // Tables
      .replace(/^\|(.+)\|$/gm, (_, row: string) => {
        const cells = row.split('|').map(c => c.trim()).filter(Boolean)
        const isHeader = cells.some(c => /^-+$/.test(c))
        if (isHeader) return ''
        const tag = cells.length > 2 ? 'td' : 'th' // rough heuristic
        const cls = tag === 'th' ? 'border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-left text-sm font-semibold text-white' : 'border border-neutral-800 px-3 py-2 text-sm text-neutral-300'
        return `<tr>${cells.map((c: string) => {
          const inner = c.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
          return `<${tag} class="${cls}">${inner}</${tag}>`
        }).join('')}</tr>`
      })
    // Wrap table rows in <table>
    html = html.replace(/((?:<tr>.+<\/tr>\n?)+)/g, '<table class="w-full my-6 border-collapse border border-neutral-800 rounded-lg overflow-hidden"><tbody>$1</tbody></table>')
    // Paragraphs
    html = html.replace(/^(?!<[a-z])(.+)$/gm, '<p class="text-neutral-300 leading-relaxed mb-5">$1</p>')
    // Collapse empty <p> tags (from table rendering, etc.)
    html = html.replace(/<p class="text-neutral-300 leading-relaxed mb-5">\s*<\/p>/g, '')
    // Clean up consecutive list items
    html = html.replace(/(<li class="ml-4 list-disc text-neutral-300 leading-relaxed">[^<]*<\/li>\n?)+/g, match => `<ul class="mb-5 space-y-1">${match}</ul>`)
    return html
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>

        {/* Header */}
        <header className="mb-10">
          {/* Category + date */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 mb-4">
            <span className="rounded-full border border-[#00F2EA]/20 bg-[#00F2EA]/5 px-3 py-1 text-xs font-medium text-[#00F2EA]">
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime} read
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-neutral-400">{post.description}</p>

          {/* Tags */}
          <div className="mt-5 flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <span
                key={tag}
                className="inline-block rounded bg-neutral-800 px-2.5 py-1 text-xs text-neutral-400"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Content */}
        <div
          className="prose-custom"
          dangerouslySetInnerHTML={{ __html: renderMd(post.content) }}
        />

        {/* Share */}
        <div className="mt-16 border-t border-neutral-800 pt-8">
          <div className="flex items-center justify-between">
            <Link
              href="/blog"
              className="text-sm text-neutral-400 hover:text-white transition-colors"
            >
              ← Back to all posts
            </Link>
            <ShareButton />
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
          <h3 className="text-xl font-bold">Curious about your own account value?</h3>
          <p className="mt-2 text-neutral-400">
            Get a complete TikTok business valuation with our free evaluation tool.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#00F2EA] px-8 py-3 text-sm font-semibold text-black transition hover:bg-[#00D4CE]"
          >
            Evaluate My Account →
          </Link>
        </div>
      </article>
    </main>
  )
}
