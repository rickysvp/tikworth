'use client'

import { Share2 } from 'lucide-react'
import { useState } from 'react'

export default function ShareButton() {
  const [copied, setCopied] = useState(false)

  function handleShare() {
    const url = window.location.href
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
    >
      <Share2 className="h-4 w-4" />
      {copied ? 'Copied!' : 'Share this post'}
    </button>
  )
}
