'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * 全站 page_view 埋点。
 * - 监听 pathname 变化，覆盖 SPA 客户端导航（避免只在首屏触发）
 * - 用 sessionStorage 存 session_id 做 UV 去重
 * - 单一来源：app/page.tsx 不再重复发 page_view
 */
export function PageViewTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    // 从 sessionStorage 读取或生成 session_id（标签页级别去重）
    let sessionId = sessionStorage.getItem('tokvalue_sid')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('tokvalue_sid', sessionId)
    }
    const body = JSON.stringify({
      event_type: 'page_view',
      path: pathname,
      referrer: document.referrer || '',
      session_id: sessionId,
    })
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => { /* silent fail, beacon below */ })
  }, [pathname])

  return null
}
