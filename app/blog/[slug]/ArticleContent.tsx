'use client'
import { useMemo } from 'react'
// Markdown renderer (SSR-safe — pure string transformation)
function renderMd(md: string): string {
  let html = md
  const anchorMap: Record<string, string> = {}
  for (const line of html.split('\n')) {
    const m = line.match(/^(#{1,3}) (.+)$/)
    if (m) {
      const text = m[2].trim()
      const id = text
        .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
      anchorMap[text] = id
    }
  }
  html = html
    .replace(/^### (.+)$/gm, (_m: string, text: string) => {
      const id = anchorMap[text] || text.toLowerCase().replace(/\s+/g, '-')
      return `<h3 id="${id}" class="text-xl font-semibold mt-10 mb-3 text-white">${text}</h3>`
    })
    .replace(/^## (.+)$/gm, (_m: string, text: string) => {
      const id = anchorMap[text] || text.toLowerCase().replace(/\s+/g, '-')
      return `<h2 id="${id}" class="text-2xl font-bold mt-12 mb-4 text-white border-b border-neutral-800 pb-2">${text}</h2>`
    })
    .replace(/^# (.+)$/gm, (_m: string, text: string) => {
      const id = anchorMap[text] || text.toLowerCase().replace(/\s+/g, '-')
      return `<h1 id="${id}" class="text-3xl font-bold mt-8 mb-6 text-white">${text}</h1>`
    })
  html = html
    .replace(/^---+$/gm, '<hr class="my-8 border-neutral-800" />')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-neutral-800 px-1.5 py-0.5 text-sm text-[#00F2EA] font-mono">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-[#00F2EA] underline underline-offset-2 hover:text-[#00D4CE]" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote class="my-6 rounded-xl border-l-4 border-[#00F2EA] bg-[#00F2EA]/5 px-5 py-4 text-neutral-300 italic">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-neutral-300 leading-relaxed">$1</li>')
  // Tables
  html = html.replace(/^\|(.+)\|$/gm, (_: string, row: string) => {
    const cells = row.split('|').map((c: string) => c.trim()).filter(Boolean)
    const isHeader = cells.some((c: string) => /^-+$/.test(c))
    if (isHeader) return ''
    const tdCls = 'border border-neutral-800 px-3 py-2 text-sm text-neutral-300'
    const inner = cells.map((c: string) => {
      const inner2 = c.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
      return `<td class="${tdCls}">${inner2}</td>`
    }).join('')
    return `<tr>${inner}</tr>`
  })
  html = html.replace(/((?:<tr>.+?<\/tr>\n?)+)/g,
    '<table class="w-full my-6 border-collapse border border-neutral-800 rounded-lg overflow-hidden"><tbody>$1</tbody></table>')
  html = html.replace(/^(?!<[a-z])(.+)$/gm, '<p class="text-neutral-300 leading-relaxed mb-5">$1</p>')
  html = html.replace(/<p class="text-neutral-300 leading-relaxed mb-5">\s*<\/p>/g, '')
  html = html.replace(/(<li class="ml-4 list-disc text-neutral-300 leading-relaxed">[^<]*<\/li>\n?)+/g,
    (match: string) => `<ul class="mb-5 space-y-1">${match}</ul>`)
  return html
}
interface ArticleContentProps {
  content: string
}
export function ArticleContent({ content }: ArticleContentProps) {
  const html = useMemo(() => renderMd(content), [content])
  // Inject CTA after second H2
  const parts = html.split('</h2>')
  const midIndex = Math.max(2, Math.floor(parts.length * 0.4))
  const withCta = [
    parts.slice(0, midIndex).join('</h2>') + '</h2>',
    `<div class="my-10 rounded-2xl border border-[#FF2D78]/20 bg-gradient-to-r from-[#FF2D78]/10 to-[#00F2EA]/10 p-6 text-center">
      <p class="mb-2 text-sm text-neutral-400">Curious about your own account?</p>
      <h3 class="mb-3 text-lg font-semibold text-white">What&apos;s your TikTok account worth right now?</h3>
      <p class="mb-4 text-sm text-neutral-400">Get a complete business valuation with brand deal estimates and monetization analysis — free.</p>
      <a href="/" class="inline-flex items-center gap-2 rounded-full bg-[#FF2D78] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#FF2D78]/80">Evaluate My Account →</a>
    </div>`,
    parts.slice(midIndex).join('</h2>'),
  ].join('')
  return (
    <div
      className="prose-custom"
      dangerouslySetInnerHTML={{ __html: withCta }}
    />
  )
}
