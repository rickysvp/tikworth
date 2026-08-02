'use client'

import { useEffect } from 'react'

export function PageViewTracker() {
  useEffect(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'page_view',
        path: window.location.pathname,
        referrer: document.referrer || '',
      }),
    }).catch(() => {})
  }, [])

  return null
}
