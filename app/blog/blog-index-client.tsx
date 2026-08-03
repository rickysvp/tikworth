'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Calendar, Clock, ArrowRight, Sparkles } from 'lucide-react'
import { CATEGORIES } from '@/lib/blog'
import type { BlogPostMeta } from '@/lib/blog'

interface BlogIndexClientProps {
  posts: BlogPostMeta[]
  featured: BlogPostMeta | undefined
}

const CATEGORY_COLORS: Record<string, string> = {
  'Creator Economy': 'border-[#FF2D78]/30 bg-[#FF2D78]/5 text-[#FF2D78]',
  'Monetization': 'border-[#FFD700]/30 bg-[#FFD700]/5 text-[#FFD700]',
  'Analytics & Strategy': 'border-[#00F2EA]/30 bg-[#00F2EA]/5 text-[#00F2EA]',
  Guides: 'border-[#FF6B9D]/30 bg-[#FF6B9D]/5 text-[#FF6B9D]',
  'Case Studies': 'border-[#FFA500]/30 bg-[#FFA500]/5 text-[#FFA500]',
}

function FeaturedPost({ post }: { post: BlogPostMeta }) {
  const colorClass = CATEGORY_COLORS[post.category] || 'border-[#00F2EA]/30 bg-[#00F2EA]/5 text-[#00F2EA]'
  const gradient = post.coverGradient || 'from-[#FF2D78] to-[#00F2EA]'

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition hover:border-neutral-700 sm:flex-row"
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
      <div className="flex-1 p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-[#FF2D78] border-[#FF2D78]/30 bg-[#FF2D78]/5">
            <Sparkles className="h-3 w-3" />
            Featured
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${colorClass}`}>
            {post.category}
          </span>
        </div>
        <h2 className="text-2xl font-bold leading-tight text-white group-hover:text-[#00F2EA] transition-colors sm:text-3xl">
          {post.title}
        </h2>
        <p className="mt-3 line-clamp-2 text-base text-neutral-400 leading-relaxed">
          {post.excerpt}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {post.readTime} read
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 text-[#00F2EA] group-hover:gap-2.5 transition-all">
            Read article <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
      <div className={`hidden w-40 flex-shrink-0 bg-gradient-to-br ${gradient} opacity-20 sm:block`} />
    </Link>
  )
}

function PostCard({ post }: { post: BlogPostMeta }) {
  const colorClass = CATEGORY_COLORS[post.category] || 'border-[#00F2EA]/30 bg-[#00F2EA]/5 text-[#00F2EA]'

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 transition hover:border-neutral-700 hover:bg-neutral-900"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
          {post.category}
        </span>
        <span className="text-xs text-neutral-500">
          {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <h3 className="font-semibold leading-snug text-white group-hover:text-[#00F2EA] transition-colors line-clamp-2">
        {post.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-neutral-400">
        {post.excerpt}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 2).map(tag => (
            <span key={tag} className="rounded bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">
              {tag}
            </span>
          ))}
        </div>
        <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
          <Clock className="h-3 w-3" /> {post.readTime}
        </span>
      </div>
    </Link>
  )
}

export default function BlogIndexClient({ posts, featured }: BlogIndexClientProps) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('All')

  const filtered = useMemo(() => {
    let result = posts
    if (activeCategory !== 'All') result = result.filter(p => p.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)))
    }
    return result
  }, [posts, activeCategory, search])

  const nonFeatured = filtered.filter(p => !p.featured)
  const featuredFiltered = featured && filtered.includes(featured) ? featured : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Search + Filter */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text" placeholder="Search articles..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-[#00F2EA]/50 transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveCategory('All')}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === 'All'
                ? 'border-[#00F2EA] bg-[#00F2EA] text-black'
                : 'border-neutral-700 bg-transparent text-neutral-400 hover:border-neutral-500 hover:text-white'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'border-[#00F2EA] bg-[#00F2EA] text-black'
                  : 'border-neutral-700 bg-transparent text-neutral-400 hover:border-neutral-500 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured */}
      {featuredFiltered && (
        <div className="mb-10"><FeaturedPost post={featuredFiltered} /></div>
      )}

      {/* Results count */}
      {search && (
        <p className="mb-6 text-sm text-neutral-500">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &quot;{search}&quot;
          {activeCategory !== 'All' && ` in ${activeCategory}`}
        </p>
      )}

      {/* Grid */}
      {nonFeatured.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {nonFeatured.map(post => <PostCard key={post.slug} post={post} />)}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-neutral-500">No articles found.</p>
          <button
            onClick={() => { setSearch(''); setActiveCategory('All') }}
            className="mt-3 text-sm text-[#00F2EA] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
