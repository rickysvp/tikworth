'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 全站 page_view 埋点。
 * - 监听 pathname 变化，覆盖 SPA 客户端导航（避免只在首屏触发）
 * - 卸载时用 sendBeacon 兜底刷新，避免事件丢失
 * - 单一来源：app/page.tsx 不再重复发 page_view
 */
export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    const body = JSON.stringify({
      event_type: 'page_view',
      path: pathname,
      referrer: document.referrer || '',
    })
    // 优先用 fetch（携带完整 header），失败回退 sendBeacon
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      try {
        navigator.sendBeacon('/api/track', body)
      } catch (e) {
        console.warn('[analytics] page_view sendBeacon failed:', e)
      }
    })
  }, [pathname])

  return null
}
