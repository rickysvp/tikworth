'use client'

import { useState, useEffect } from 'react'

interface TOCItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  items: TOCItem[]
}

export function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )

    items.forEach(item => {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [items])

  if (items.length === 0) return null

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Contents
      </p>
      <nav className="space-y-1">
        {items.map(item => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`
              block text-sm leading-relaxed transition-colors
              ${item.level === 1 ? 'font-medium' : item.level === 2 ? 'pl-3' : 'pl-6'}
              ${activeId === item.id
                ? 'text-[#00F2EA]'
                : 'text-neutral-500 hover:text-neutral-300'
              }
            `}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </div>
  )
}
