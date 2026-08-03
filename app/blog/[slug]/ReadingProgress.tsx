'use client'

import { useState, useEffect } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0
      setProgress(pct)
    }

    window.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-neutral-900">
      <div
        className="h-full bg-gradient-to-r from-[#FF2D78] to-[#00F2EA] transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
