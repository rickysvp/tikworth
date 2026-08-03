/**
 * Analytics — event recording + aggregation queries.
 * PostgreSQL (Neon) only. Requires DATABASE_URL.
 *
 * 时区策略：所有"今日/本周/本月"边界和按日聚合均基于 Asia/Shanghai (UTC+8)，
 * 避免 Vercel 默认 UTC 导致用户感知的"今日"错位 8 小时。
 */

import type { NeonQueryFunction } from '@neondatabase/serverless'
import crypto from 'crypto'

// ── Types ──

export type EventType = 'page_view' | 'search' | 'evaluate_start' | 'evaluate_done'
  | 'paywall_view' | 'paywall_click' | 'purchase' | 'api_error'

export interface AnalyticsEvent {
  id?: number
  event_type: EventType
  path?: string
  username?: string
  email?: string
  metadata?: Record<string, unknown>
  ip_hash?: string
  user_agent?: string
  referrer?: string
  session_id?: string | null
  created_at: string
}

// ── Config ──

const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').replace(/\s+/g, '')
const TIMEZONE = 'Asia/Shanghai'

// ip_hash HMAC 密钥（防止 sha256 截断被彩虹表反查）
const IP_HMAC_KEY = process.env.IP_HASH_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    console.error('[analytics] ⚠️  IP_HASH_SECRET not set in production — IP hashes are reversible with default key. Set the IP_HASH_SECRET environment variable.')
  }
  return 'tikworth-ip-hmac-v1'
})()

// ── DB init ──

let sql: NeonQueryFunction<false, false> | null = null
let dbReady = false
let dbInitPromise: Promise<boolean> | null = null

async function initDb(): Promise<boolean> {
  if (dbReady) return true
  if (dbInitPromise) return dbInitPromise

  dbInitPromise = (async () => {
    if (!DATABASE_URL) {
      console.error('[analytics] DATABASE_URL is not configured')
      return false
    }
    try {
      const { neon } = await import('@neondatabase/serverless')
      sql = neon(DATABASE_URL)
      // CREATE TABLE IF NOT EXISTS — 幂等
      await sql`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id SERIAL PRIMARY KEY,
          event_type TEXT,
          path TEXT,
          username TEXT,
          email TEXT,
          metadata JSONB,
          ip_hash TEXT,
          user_agent TEXT,
          referrer TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
      // 幂等列迁移：补齐历史表可能缺失的列（CREATE TABLE IF NOT EXISTS 不会改已有表）
      // 兼容旧 schema（event_name → event_type, 旧表无 session_id 迁移）
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS event_type TEXT`
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS session_id TEXT`
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS path TEXT`
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS username TEXT`
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS email TEXT`
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS metadata JSONB`
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS ip_hash TEXT`
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS user_agent TEXT`
      await sql`ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS referrer TEXT`
      // 修复旧表 event_name NOT NULL 约束导致新代码 INSERT 失败
      try { await sql`ALTER TABLE analytics_events ALTER COLUMN event_name DROP NOT NULL` } catch { /* 迁移已执行或列不存在 */ }
      // 回填 event_name ← event_type（迁移后补齐旧列）
      await sql`UPDATE analytics_events SET event_name = event_type WHERE event_name IS NULL`
      await sql`CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type)`
      await sql`CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)`

      await sql`
        CREATE TABLE IF NOT EXISTS admin_audit_log (
          id SERIAL PRIMARY KEY,
          action TEXT NOT NULL,
          target_email TEXT,
          credits INTEGER,
          reason TEXT,
          operator TEXT DEFAULT 'admin',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `

      // credit_balances 表由 lib/credits-server.ts 统一管理，此处不再重复建表
      // 但确保 disabled 列存在（credits-server 可能还未建表）
      try {
        await sql`ALTER TABLE credit_balances ADD COLUMN IF NOT EXISTS disabled BOOLEAN NOT NULL DEFAULT false`
      } catch { /* 表尚未创建时忽略 */ }

      dbReady = true
      console.log('[analytics] Postgres init succeeded')
      return true
    } catch (err) {
      // ── 关键修复：失败时清除缓存，允许下次请求重试 ──
      console.error('[analytics] Postgres init failed:', err instanceof Error ? err.message : String(err))
      sql = null
      dbInitPromise = null
      return false
    }
  })()

  return dbInitPromise
}

// ── 时区边界工具 ──

/**
 * 计算 Asia/Shanghai 时区的今日/本周/本月起始时间（UTC ISO 字符串）。
 * Vercel 默认 TZ=UTC，直接用 new Date(y,m,d) 得到的是 UTC 边界，
 * 上海用户在 00:00-08:00 会感知到"今日"错位。
 */
function shanghaiBoundaries() {
  const now = new Date()
  // 上海当前时间的各分量
  const shanghaiNow = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const year = shanghaiNow.getFullYear()
  const month = shanghaiNow.getMonth()
  const date = shanghaiNow.getDate()

  // 上海今日 00:00 对应的 UTC 时间
  const todayStart = new Date(Date.UTC(year, month, date, -8, 0, 0))
  // 上海本月 1 日 00:00
  const monthStart = new Date(Date.UTC(year, month, 1, -8, 0, 0))
  // 滚动 7×24h
  const weekStart = new Date(now.getTime() - 7 * 86400000)

  return {
    todayStart: todayStart.toISOString(),
    weekStart: weekStart.toISOString(),
    monthStart: monthStart.toISOString(),
  }
}

// ── Record Event ──

/**
 * 写入事件到 analytics_events 表。
 * 用于无 HTTP request 上下文的场景（如 webhook、cron）。
 * 有 request 时优先用 recordEventFromRequest() 以自动填充 IP/UA/referrer。
 */
export async function recordEvent(event: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<void> {
  const useDb = await initDb()
  if (!useDb || !sql) {
    console.error('[analytics] recordEvent skipped — DB not ready:', event.event_type)
    return
  }
  await sql`
    INSERT INTO analytics_events (event_type, path, username, email, metadata, ip_hash, user_agent, referrer, session_id)
    VALUES (${event.event_type}, ${event.path || null}, ${event.username || null},
      ${event.email || null}, ${JSON.stringify(event.metadata || {})}::jsonb,
      ${event.ip_hash || null}, ${event.user_agent || null}, ${event.referrer || null},
      ${event.session_id || null})
  `
}

/**
 * 从 NextRequest 中自动提取 IP/UA/referrer 并写入事件。
 * 所有 API 路由应优先使用此函数，确保埋点数据完整。
 */
export async function recordEventFromRequest(
  req: Request,
  event: Omit<AnalyticsEvent, 'id' | 'created_at' | 'ip_hash' | 'user_agent' | 'referrer'>
): Promise<void> {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0'
  return recordEvent({
    ...event,
    ip_hash: hashIp(ip),
    user_agent: req.headers.get('user-agent') || undefined,
    referrer: req.headers.get('referer') || undefined,
  })
}

// ── Record Audit Log ──

export async function recordAuditLog(entry: {
  action: string
  target_email: string
  credits: number
  reason: string
}): Promise<void> {
  const useDb = await initDb()
  if (!useDb || !sql) {
    console.error('[analytics] recordAuditLog skipped — DB not ready')
    return
  }
  await sql`
    INSERT INTO admin_audit_log (action, target_email, credits, reason)
    VALUES (${entry.action}, ${entry.target_email}, ${entry.credits}, ${entry.reason})
  `
}

// ── Query: Stats Overview ──

export interface StatsOverview {
  totalRevenue: number
  revenueToday: number
  revenueWeek: number
  revenueMonth: number
  totalPayers: number
  payersToday: number
  payersWeek: number
  payersMonth: number
  evaluationsToday: number
  evaluationsWeek: number
  evaluationsMonth: number
  remainingCredits: number
}

// 安全的 numeric 聚合：过滤非数字字符串，避免 ::numeric 抛错
const AMOUNT_EXPR = `CASE WHEN metadata->>'amount' ~ '^[0-9]+(\\\\.[0-9]+)?$' THEN (metadata->>'amount')::numeric ELSE 0 END`

export async function getStatsOverview(): Promise<StatsOverview> {
  const useDb = await initDb()
  if (!useDb || !sql) {
    return {
      totalRevenue: 0, revenueToday: 0, revenueWeek: 0, revenueMonth: 0,
      totalPayers: 0, payersToday: 0, payersWeek: 0, payersMonth: 0,
      evaluationsToday: 0, evaluationsWeek: 0, evaluationsMonth: 0,
      remainingCredits: 0,
    }
  }

  const { todayStart, weekStart, monthStart } = shanghaiBoundaries()

  // 评估计数从 evaluations 表查询（单一事实源，避免双写不一致）
  const [purchaseTotal, purchaseToday, purchaseWeek, purchaseMonth,
    payerTotal, payerToday, payerWeek, payerMonth,
    evalToday, evalWeek, evalMonth] = await Promise.all([
    sql`SELECT COALESCE(SUM(${sql.unsafe(AMOUNT_EXPR)}), 0) as total FROM analytics_events WHERE event_type = 'purchase'`,
    sql`SELECT COALESCE(SUM(${sql.unsafe(AMOUNT_EXPR)}), 0) as today FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${todayStart}::timestamptz`,
    sql`SELECT COALESCE(SUM(${sql.unsafe(AMOUNT_EXPR)}), 0) as week FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${weekStart}::timestamptz`,
    sql`SELECT COALESCE(SUM(${sql.unsafe(AMOUNT_EXPR)}), 0) as month FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${monthStart}::timestamptz`,
    sql`SELECT COUNT(DISTINCT email) as total FROM analytics_events WHERE event_type = 'purchase'`,
    sql`SELECT COUNT(DISTINCT email) as today FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${todayStart}::timestamptz`,
    sql`SELECT COUNT(DISTINCT email) as week FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${weekStart}::timestamptz`,
    sql`SELECT COUNT(DISTINCT email) as month FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${monthStart}::timestamptz`,
    // 评估次数从 evaluations 表查（computed_at 字段）
    sql`SELECT COUNT(*) as today FROM evaluations WHERE computed_at >= ${todayStart}::timestamptz`,
    sql`SELECT COUNT(*) as week FROM evaluations WHERE computed_at >= ${weekStart}::timestamptz`,
    sql`SELECT COUNT(*) as month FROM evaluations WHERE computed_at >= ${monthStart}::timestamptz`,
  ])

  let remainingCredits = 0
  try {
    const creditRows = await sql`SELECT COALESCE(SUM(credits), 0) as total FROM credit_balances`
    remainingCredits = Number(creditRows[0]?.total) || 0
  } catch (err) {
    console.warn('[analytics] failed to query credit_balances:', err)
  }

  const row = (r: Record<string, unknown>, key: string) => Number(r[key]) || 0

  return {
    totalRevenue: row(purchaseTotal[0] as Record<string, unknown>, 'total'),
    revenueToday: row(purchaseToday[0] as Record<string, unknown>, 'today'),
    revenueWeek: row(purchaseWeek[0] as Record<string, unknown>, 'week'),
    revenueMonth: row(purchaseMonth[0] as Record<string, unknown>, 'month'),
    totalPayers: row(payerTotal[0] as Record<string, unknown>, 'total'),
    payersToday: row(payerToday[0] as Record<string, unknown>, 'today'),
    payersWeek: row(payerWeek[0] as Record<string, unknown>, 'week'),
    payersMonth: row(payerMonth[0] as Record<string, unknown>, 'month'),
    evaluationsToday: row(evalToday[0] as Record<string, unknown>, 'today'),
    evaluationsWeek: row(evalWeek[0] as Record<string, unknown>, 'week'),
    evaluationsMonth: row(evalMonth[0] as Record<string, unknown>, 'month'),
    remainingCredits,
  }
}

// ── Query: Revenue by Day ──

export interface DailyRevenue {
  date: string
  amount: number
}

export async function getRevenueByDay(days: number): Promise<DailyRevenue[]> {
  const useDb = await initDb()
  if (!useDb || !sql) return []
  const since = new Date(Date.now() - days * 86400000).toISOString()

  // 按 Asia/Shanghai 时区的日期聚合（子查询先算日期，避免 GROUP BY 表达式不一致）
  const rows = await sql`
    SELECT date, COALESCE(SUM(amount), 0) as amount
    FROM (
      SELECT
        TO_CHAR((created_at AT TIME ZONE ${TIMEZONE})::date, 'YYYY-MM-DD') as date,
        ${sql.unsafe(AMOUNT_EXPR)} as amount
      FROM analytics_events
      WHERE event_type = 'purchase' AND created_at >= ${since}::timestamptz
    ) sub
    GROUP BY date
    ORDER BY date
  ` as Array<{ date: string; amount: string }>
  return rows.map(r => ({ date: String(r.date), amount: Number(r.amount) }))
}

// ── Query: Package Distribution ──

export interface PackageStat {
  id: string
  count: number
  revenue: number
}

export async function getRevenueByPackage(days: number): Promise<PackageStat[]> {
  const useDb = await initDb()
  if (!useDb || !sql) return []
  const since = new Date(Date.now() - days * 86400000).toISOString()

  const rows = await sql`
    SELECT metadata->>'package_id' as package_id, COUNT(*) as count,
      COALESCE(SUM(${sql.unsafe(AMOUNT_EXPR)}), 0) as revenue
    FROM analytics_events
    WHERE event_type = 'purchase' AND created_at >= ${since}::timestamptz
    GROUP BY metadata->>'package_id'
  ` as Array<{ package_id: string; count: string; revenue: string }>
  return rows.map(r => ({ id: r.package_id || 'unknown', count: Number(r.count), revenue: Number(r.revenue) }))
}

// ── Query: Audit Log ──

export interface AuditEntry {
  id: number
  action: string
  target_email: string
  credits: number
  reason: string
  created_at: string
}

export async function getAuditLog(limit = 50, offset = 0, action?: string): Promise<{ items: AuditEntry[]; total: number }> {
  const useDb = await initDb()
  if (!useDb || !sql) return { items: [], total: 0 }

  // 参数化查询，彻底避免 SQL 注入（不再使用 sql.unsafe 拼接 WHERE）
  if (action) {
    const [rows, countRow] = await Promise.all([
      sql`SELECT * FROM admin_audit_log WHERE action = ${action} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      sql`SELECT COUNT(*) as total FROM admin_audit_log WHERE action = ${action}`,
    ])
    const items = (rows as Array<Record<string, unknown>>).map(r => ({
      id: Number(r.id),
      action: String(r.action),
      target_email: String(r.target_email || ''),
      credits: Number(r.credits),
      reason: String(r.reason || ''),
      created_at: String(r.created_at),
    }))
    return { items, total: Number((countRow[0] as { total: string })?.total || 0) }
  }

  const [rows, countRow] = await Promise.all([
    sql`SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
    sql`SELECT COUNT(*) as total FROM admin_audit_log`,
  ])
  const items = (rows as Array<Record<string, unknown>>).map(r => ({
    id: Number(r.id),
    action: String(r.action),
    target_email: String(r.target_email || ''),
    credits: Number(r.credits),
    reason: String(r.reason || ''),
    created_at: String(r.created_at),
  }))
  return { items, total: Number((countRow[0] as { total: string })?.total || 0) }
}

// ── Query: PV/UV ──

export interface PVUVData {
  totalPV: number
  totalUV: number
  pvToday: number
  uvToday: number
  pvWeek: number
  uvWeek: number
  pvMonth: number
  uvMonth: number
}

export async function getPVUV(): Promise<PVUVData> {
  const useDb = await initDb()
  if (!useDb || !sql) {
    return { totalPV: 0, totalUV: 0, pvToday: 0, uvToday: 0, pvWeek: 0, uvWeek: 0, pvMonth: 0, uvMonth: 0 }
  }

  const { todayStart, weekStart, monthStart } = shanghaiBoundaries()

  // 用 session_id 做 UV 计数（ip_hash 在生产部署前可能为空）
  const UV_COL = sql.unsafe('COALESCE(NULLIF(ip_hash, \'\'), session_id)')

  const [total, today, week, month] = await Promise.all([
    sql`SELECT COUNT(*) as pv, COUNT(DISTINCT ${UV_COL}) as uv FROM analytics_events WHERE event_type = 'page_view'`,
    sql`SELECT COUNT(*) as pv, COUNT(DISTINCT ${UV_COL}) as uv FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ${todayStart}::timestamptz`,
    sql`SELECT COUNT(*) as pv, COUNT(DISTINCT ${UV_COL}) as uv FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ${weekStart}::timestamptz`,
    sql`SELECT COUNT(*) as pv, COUNT(DISTINCT ${UV_COL}) as uv FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ${monthStart}::timestamptz`,
  ]) as Array<Array<{ pv: string; uv: string }>>

  const num = (r: { pv: string; uv: string }) => ({ pv: Number(r.pv), uv: Number(r.uv) })
  const t = num(total[0]), td = num(today[0]), tw = num(week[0]), tm = num(month[0])

  return {
    totalPV: t.pv, totalUV: t.uv,
    pvToday: td.pv, uvToday: td.uv,
    pvWeek: tw.pv, uvWeek: tw.uv,
    pvMonth: tm.pv, uvMonth: tm.uv,
  }
}

// ── Query: Users List ──

export interface UserListItem {
  email: string
  hasPaid: boolean
  remainingCredits: number
  totalPurchased: number
  verifiedAt: string
  lastPurchaseAt: string | null
  disabled: boolean
}

export async function getUsersList(): Promise<UserListItem[]> {
  const useDb = await initDb()
  if (!useDb || !sql) return []

  try {
    const rows = await sql`
      SELECT email, credits, total_purchased, purchases, verified_at, disabled
      FROM credit_balances
      ORDER BY total_purchased DESC, credits DESC
    `
    return rows.map((r: Record<string, unknown>) => {
      const purchases = Array.isArray(r.purchases) ? r.purchases as Array<{ purchasedAt: number }> : []
      const lastPurchase = purchases.length > 0 ? purchases[0] : null
      return {
        email: String(r.email),
        hasPaid: Number(r.total_purchased) > 0,
        remainingCredits: Number(r.credits),
        totalPurchased: Number(r.total_purchased),
        verifiedAt: new Date(Number(r.verified_at)).toISOString(),
        lastPurchaseAt: lastPurchase ? new Date(lastPurchase.purchasedAt).toISOString() : null,
        disabled: r.disabled === true,
      }
    })
  } catch (err) {
    console.warn('[analytics] failed to query credit_balances for users list:', err)
    return []
  }
}

// ── Hash IP (HMAC-SHA256 防彩虹表反查) ──

export function hashIp(ip: string): string {
  return crypto.createHmac('sha256', IP_HMAC_KEY).update(ip).digest('hex').slice(0, 32)
}

// ── Query: Traffic Sources ──

export interface TrafficSource {
  source: string
  visitors: number
  pct: number
}

export async function getTrafficSources(days = 30): Promise<TrafficSource[]> {
  const useDb = await initDb()
  if (!useDb || !sql) return []
  const since = new Date(Date.now() - days * 86400000).toISOString()

  try {
    const UV_COL = sql.unsafe('COALESCE(NULLIF(ip_hash, \'\'), session_id)')
    const rows = await sql`
      SELECT
        COALESCE(NULLIF(referrer, ''), '直接访问') as source,
        COUNT(DISTINCT ${UV_COL}) as visitors
      FROM analytics_events
      WHERE event_type = 'page_view'
        AND created_at >= ${since}::timestamptz
      GROUP BY source
      ORDER BY visitors DESC
      LIMIT 20
    `
    const raw = rows.map((r: Record<string, unknown>) => ({
      source: classifyReferrer(String(r.source)),
      visitors: Number(r.visitors),
    }))
    const total = raw.reduce((s, r) => s + r.visitors, 0)
    if (total === 0 || raw.length === 0) return []

    // 合并相同来源（classifyReferrer 可能将多个 referrer 归到同一来源）
    const merged = new Map<string, number>()
    for (const r of raw) {
      merged.set(r.source, (merged.get(r.source) || 0) + r.visitors)
    }
    const result = Array.from(merged.entries())
      .map(([source, visitors]) => ({
        source,
        visitors,
        pct: Math.round((visitors / total) * 1000) / 10,
      }))
      .sort((a, b) => b.visitors - a.visitors)

    // 修正百分比和为 100（最后一条兜底）
    const sumPct = result.reduce((s, r) => s + r.pct, 0)
    if (result.length > 0 && sumPct !== 100) {
      result[result.length - 1].pct = Math.max(0, result[result.length - 1].pct + (100 - sumPct))
    }
    return result
  } catch (err) {
    console.warn('[analytics] failed to query traffic sources:', err)
    return []
  }
}

// 域名后缀匹配（避免 includes 子串误判）
function classifyReferrer(ref: string): string {
  if (!ref || ref === '直接访问') return '直接访问'

  let hostname: string
  try {
    hostname = new URL(ref).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ref.slice(0, 40)
  }

  const endsWith = (suffix: string) => hostname === suffix || hostname.endsWith('.' + suffix)
  if (endsWith('google.com') || hostname === 'google' || hostname.endsWith('.google')) return 'Google'
  if (endsWith('bing.com')) return 'Bing'
  if (endsWith('baidu.com')) return '百度'
  if (endsWith('twitter.com') || endsWith('x.com')) return 'X/Twitter'
  if (endsWith('facebook.com') || endsWith('fb.com')) return 'Facebook'
  if (endsWith('instagram.com')) return 'Instagram'
  if (endsWith('youtube.com')) return 'YouTube'
  if (endsWith('tiktok.com')) return 'TikTok'
  if (endsWith('reddit.com')) return 'Reddit'
  if (endsWith('linkedin.com')) return 'LinkedIn'
  if (endsWith('github.com')) return 'GitHub'
  if (hostname.includes('producthunt')) return 'Product Hunt'
  if (endsWith('duckduckgo.com')) return 'DuckDuckGo'
  if (hostname.includes('yandex')) return 'Yandex'
  return hostname
}
