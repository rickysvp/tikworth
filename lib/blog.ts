// Blog library
export type { BlogPostMeta, BlogPost, Category } from './blog/content'
export { CATEGORIES } from './blog/content'
export { ALL_POSTS } from './blog/posts'
export { extractTOC } from './blog/posts'
export { AUTHORS, getAuthorBySlug, getAllAuthors } from './blog/authors'

import { ALL_POSTS } from './blog/posts'
import type { BlogPostMeta } from './blog/content'

export function getAllPosts(): BlogPostMeta[] {
  return ALL_POSTS
    .map(({ slug, title, description, excerpt, tags, publishedAt, updatedAt, readTime, category, featured, author, coverGradient }) => ({
      slug, title, description, excerpt, tags, publishedAt, updatedAt, readTime, category, featured, author, coverGradient,
    }))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export function getPostBySlug(slug: string) {
  return ALL_POSTS.find(p => p.slug === slug)
}

export function getFeaturedPost(): BlogPostMeta | undefined {
  return ALL_POSTS
    .filter(p => p.featured)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0]
}

export function getRelatedPosts(slug: string, limit = 3): BlogPostMeta[] {
  const post = getPostBySlug(slug)
  if (!post) return []
  return getAllPosts()
    .filter(p => p.slug !== slug && p.category === post.category)
    .slice(0, limit)
}
