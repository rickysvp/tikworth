/**
 * Analytics — event recording + aggregation queries.
 * Supports PostgreSQL (Neon) and file-based JSON fallback.
 */

import type { NeonQueryFunction } from '@neondatabase/serverless'
import type { CreditBalance } from '@/lib/credits'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { withFileLock, atomicWriteJson, dataDir as DATA_DIR } from '@/lib/file-lock'

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
  created_at: string
}

// ── DB init ──

const DATABASE_URL = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim()
const EVENTS_FILE = path.join(DATA_DIR, 'analytics_events.json')
const AUDIT_FILE = path.join(DATA_DIR, 'admin_audit_log.json')

let sql: NeonQueryFunction<false, false> | null = null
let dbReady = false
let dbInitPromise: Promise<boolean> | null = null

async function initDb(): Promise<boolean> {
  if (dbReady) return true
  if (dbInitPromise) return dbInitPromise

  dbInitPromise = (async () => {
    if (!DATABASE_URL) return false
    try {
      const { neon } = await import('@neondatabase/serverless')
      sql = neon(DATABASE_URL)
      await sql`
        CREATE TABLE IF NOT EXISTS analytics_events (
          id SERIAL PRIMARY KEY,
          event_type TEXT NOT NULL,
          path TEXT,
          username TEXT,
          email TEXT,
          metadata JSONB,
          ip_hash TEXT,
          user_agent TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
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
      await sql`CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type)`
      await sql`CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at)`
      dbReady = true
      return true
    } catch (err) {
      console.warn('[analytics] Postgres init failed, using file fallback:', err)
      return false
    }
  })()

  return dbInitPromise
}

// ── Record Event ──

export async function recordEvent(event: Omit<AnalyticsEvent, 'id' | 'created_at'>): Promise<void> {
  const useDb = await initDb()

  if (useDb && sql) {
    await sql`
      INSERT INTO analytics_events (event_type, path, username, email, metadata, ip_hash, user_agent)
      VALUES (${event.event_type}, ${event.path || null}, ${event.username || null},
        ${event.email || null}, ${JSON.stringify(event.metadata || {})}::jsonb,
        ${event.ip_hash || null}, ${event.user_agent || null})
    `
    return
  }

  // File fallback
  await withFileLock(EVENTS_FILE, async () => {
    const events = readFileStore(EVENTS_FILE)
    events.push({
      ...event,
      id: events.length + 1,
      created_at: new Date().toISOString(),
    })
    // Keep last 10000 events
    const trimmed = events.slice(-10000)
    atomicWriteJson(EVENTS_FILE, trimmed)
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

  if (useDb && sql) {
    await sql`
      INSERT INTO admin_audit_log (action, target_email, credits, reason)
      VALUES (${entry.action}, ${entry.target_email}, ${entry.credits}, ${entry.reason})
    `
    return
  }

  await withFileLock(AUDIT_FILE, async () => {
    const logs = readFileStore(AUDIT_FILE)
    logs.push({
      ...entry,
      id: logs.length + 1,
      operator: 'admin',
      created_at: new Date().toISOString(),
    })
    atomicWriteJson(AUDIT_FILE, logs.slice(-5000))
  })
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

export async function getStatsOverview(): Promise<StatsOverview> {
  const useDb = await initDb()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  if (useDb && sql) {
    const [purchaseTotal, purchaseToday, purchaseWeek, purchaseMonth,
      payerTotal, payerToday, payerWeek, payerMonth,
      evalToday, evalWeek, evalMonth] = await Promise.all([
      sql`SELECT COALESCE(SUM((metadata->>'amount')::numeric), 0) as total FROM analytics_events WHERE event_type = 'purchase'`,
      sql`SELECT COALESCE(SUM((metadata->>'amount')::numeric), 0) as today FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${todayStart}::timestamptz`,
      sql`SELECT COALESCE(SUM((metadata->>'amount')::numeric), 0) as week FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${weekStart}::timestamptz`,
      sql`SELECT COALESCE(SUM((metadata->>'amount')::numeric), 0) as month FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${monthStart}::timestamptz`,
      sql`SELECT COUNT(DISTINCT email) as total FROM analytics_events WHERE event_type = 'purchase'`,
      sql`SELECT COUNT(DISTINCT email) as today FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${todayStart}::timestamptz`,
      sql`SELECT COUNT(DISTINCT email) as week FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${weekStart}::timestamptz`,
      sql`SELECT COUNT(DISTINCT email) as month FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${monthStart}::timestamptz`,
      sql`SELECT COUNT(*) as today FROM analytics_events WHERE event_type = 'evaluate_done' AND created_at >= ${todayStart}::timestamptz`,
      sql`SELECT COUNT(*) as week FROM analytics_events WHERE event_type = 'evaluate_done' AND created_at >= ${weekStart}::timestamptz`,
      sql`SELECT COUNT(*) as month FROM analytics_events WHERE event_type = 'evaluate_done' AND created_at >= ${monthStart}::timestamptz`,
    ])

    let remainingCredits = 0
    try {
      const balancesFile = path.join(DATA_DIR, 'credit_balances.json')
      if (fs.existsSync(balancesFile)) {
        const balances = JSON.parse(fs.readFileSync(balancesFile, 'utf-8'))
        for (const bal of Object.values(balances) as Array<{ credits: number }>) {
          remainingCredits += bal.credits || 0
        }
      }
    } catch {}

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

  // File fallback: aggregate from flat files
  const events = readFileStore(EVENTS_FILE) as unknown as AnalyticsEvent[]
  const filterEvents = (type: EventType, since: number) =>
    events.filter(e => e.event_type === type && new Date(e.created_at).getTime() >= since)

  let remainingCredits = 0
  try {
    const balancesFile = path.join(DATA_DIR, 'credit_balances.json')
    if (fs.existsSync(balancesFile)) {
      const balances = JSON.parse(fs.readFileSync(balancesFile, 'utf-8'))
      for (const bal of Object.values(balances) as Array<{ credits: number }>) {
        remainingCredits += bal.credits || 0
      }
    }
  } catch {}

  const purchases = events.filter(e => e.event_type === 'purchase')
  const purchasesToday = filterEvents('purchase', new Date(todayStart).getTime())
  const purchasesWeek = filterEvents('purchase', new Date(weekStart).getTime())
  const purchasesMonth = filterEvents('purchase', new Date(monthStart).getTime())

  return {
    totalRevenue: purchases.reduce((sum, e) => sum + (Number((e.metadata as Record<string, unknown>)?.amount) || 0), 0),
    revenueToday: purchasesToday.reduce((sum, e) => sum + (Number((e.metadata as Record<string, unknown>)?.amount) || 0), 0),
    revenueWeek: purchasesWeek.reduce((sum, e) => sum + (Number((e.metadata as Record<string, unknown>)?.amount) || 0), 0),
    revenueMonth: purchasesMonth.reduce((sum, e) => sum + (Number((e.metadata as Record<string, unknown>)?.amount) || 0), 0),
    totalPayers: new Set(purchases.map(e => e.email).filter(Boolean)).size,
    payersToday: new Set(purchasesToday.map(e => e.email).filter(Boolean)).size,
    payersWeek: new Set(purchasesWeek.map(e => e.email).filter(Boolean)).size,
    payersMonth: new Set(purchasesMonth.map(e => e.email).filter(Boolean)).size,
    evaluationsToday: filterEvents('evaluate_done', new Date(todayStart).getTime()).length,
    evaluationsWeek: filterEvents('evaluate_done', new Date(weekStart).getTime()).length,
    evaluationsMonth: filterEvents('evaluate_done', new Date(monthStart).getTime()).length,
    remainingCredits,
  }
}

// ── Query: Funnel ──

export interface FunnelData {
  pageViews: number
  searches: number
  evaluateStarts: number
  paywallViews: number
  paywallClicks: number
  purchases: number
}

export async function getFunnel(days: number): Promise<FunnelData> {
  const useDb = await initDb()
  const since = new Date(Date.now() - days * 86400000).toISOString()

  if (useDb && sql) {
    const rows = await sql`
      SELECT event_type, COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ${since}::timestamptz
        AND event_type IN ('page_view', 'search', 'evaluate_start', 'paywall_view', 'paywall_click', 'purchase')
      GROUP BY event_type
    ` as Array<{ event_type: string; count: string }>

    const map: Record<string, number> = {}
    for (const r of rows) map[r.event_type] = Number(r.count)
    return {
      pageViews: map.page_view || 0,
      searches: map.search || 0,
      evaluateStarts: map.evaluate_start || 0,
      paywallViews: map.paywall_view || 0,
      paywallClicks: map.paywall_click || 0,
      purchases: map.purchase || 0,
    }
  }

  const events = readFileStore(EVENTS_FILE) as unknown as AnalyticsEvent[]
  const sinceTime = new Date(since).getTime()
  const filtered = events.filter(e => new Date(e.created_at).getTime() >= sinceTime)

  return {
    pageViews: filtered.filter(e => e.event_type === 'page_view').length,
    searches: filtered.filter(e => e.event_type === 'search').length,
    evaluateStarts: filtered.filter(e => e.event_type === 'evaluate_start').length,
    paywallViews: filtered.filter(e => e.event_type === 'paywall_view').length,
    paywallClicks: filtered.filter(e => e.event_type === 'paywall_click').length,
    purchases: filtered.filter(e => e.event_type === 'purchase').length,
  }
}

// ── Query: Revenue by Day ──

export interface DailyRevenue {
  date: string
  amount: number
}

export async function getRevenueByDay(days: number): Promise<DailyRevenue[]> {
  const useDb = await initDb()
  const since = new Date(Date.now() - days * 86400000).toISOString()

  if (useDb && sql) {
    const rows = await sql`
      SELECT DATE(created_at) as date, COALESCE(SUM((metadata->>'amount')::numeric), 0) as amount
      FROM analytics_events
      WHERE event_type = 'purchase' AND created_at >= ${since}::timestamptz
      GROUP BY DATE(created_at)
      ORDER BY date
    ` as Array<{ date: string; amount: string }>
    return rows.map(r => ({ date: String(r.date).slice(0, 10), amount: Number(r.amount) }))
  }

  const events = readFileStore(EVENTS_FILE) as unknown as AnalyticsEvent[]
  const sinceTime = new Date(since).getTime()
  const byDay = new Map<string, number>()
  for (const e of events) {
    if (e.event_type !== 'purchase') continue
    const d = new Date(e.created_at).toISOString().slice(0, 10)
    byDay.set(d, (byDay.get(d) || 0) + (Number((e.metadata as Record<string, unknown>)?.amount) || 0))
  }
  return Array.from(byDay.entries())
    .filter(([d]) => new Date(d).getTime() >= sinceTime)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ── Query: Package Distribution ──

export interface PackageStat {
  id: string
  count: number
  revenue: number
}

export async function getRevenueByPackage(days: number): Promise<PackageStat[]> {
  const useDb = await initDb()
  const since = new Date(Date.now() - days * 86400000).toISOString()

  if (useDb && sql) {
    const rows = await sql`
      SELECT metadata->>'package_id' as package_id, COUNT(*) as count,
        COALESCE(SUM((metadata->>'amount')::numeric), 0) as revenue
      FROM analytics_events
      WHERE event_type = 'purchase' AND created_at >= ${since}::timestamptz
      GROUP BY metadata->>'package_id'
    ` as Array<{ package_id: string; count: string; revenue: string }>
    return rows.map(r => ({ id: r.package_id || 'unknown', count: Number(r.count), revenue: Number(r.revenue) }))
  }

  const events = readFileStore(EVENTS_FILE) as unknown as AnalyticsEvent[]
  const sinceTime = new Date(since).getTime()
  const byPkg = new Map<string, { count: number; revenue: number }>()
  for (const e of events) {
    if (e.event_type !== 'purchase' || new Date(e.created_at).getTime() < sinceTime) continue
    const pkgId = String((e.metadata as Record<string, unknown>)?.package_id || 'unknown')
    const entry = byPkg.get(pkgId) || { count: 0, revenue: 0 }
    entry.count++
    entry.revenue += Number((e.metadata as Record<string, unknown>)?.amount) || 0
    byPkg.set(pkgId, entry)
  }
  return Array.from(byPkg.entries()).map(([id, v]) => ({ id, ...v }))
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

  if (useDb && sql) {
    const whereClause = action ? `WHERE action = '${action.replace(/'/g, "''")}'` : ''
    const [rows, countRow] = await Promise.all([
      sql`SELECT * FROM admin_audit_log ${sql.unsafe(whereClause)} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}` as unknown as Promise<Array<Record<string, unknown>>>,
      sql`SELECT COUNT(*) as total FROM admin_audit_log ${sql.unsafe(whereClause)}` as unknown as Promise<Array<{ total: string }>>,
    ])
    const items = (rows as Array<Record<string, unknown>>).map(r => ({
      id: Number(r.id),
      action: String(r.action),
      target_email: String(r.target_email || ''),
      credits: Number(r.credits),
      reason: String(r.reason || ''),
      created_at: String(r.created_at),
    }))
    return { items, total: Number(countRow[0]?.total || 0) }
  }

  const logs = readFileStore(AUDIT_FILE) as unknown as AuditEntry[]
  const filtered = action ? logs.filter(l => l.action === action) : logs
  const sorted = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return { items: sorted.slice(offset, offset + limit), total: filtered.length }
}

// ── File Helpers ──

function readFileStore(filePath: string): Array<Record<string, unknown>> {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    }
  } catch {}
  return []
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
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  if (useDb && sql) {
    const [total, today, week, month] = await Promise.all([
      sql`SELECT COUNT(*) as pv, COUNT(DISTINCT ip_hash) as uv FROM analytics_events WHERE event_type = 'page_view'`,
      sql`SELECT COUNT(*) as pv, COUNT(DISTINCT ip_hash) as uv FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ${todayStart}::timestamptz`,
      sql`SELECT COUNT(*) as pv, COUNT(DISTINCT ip_hash) as uv FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ${weekStart}::timestamptz`,
      sql`SELECT COUNT(*) as pv, COUNT(DISTINCT ip_hash) as uv FROM analytics_events WHERE event_type = 'page_view' AND created_at >= ${monthStart}::timestamptz`,
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

  // File fallback
  const events = readFileStore(EVENTS_FILE) as unknown as AnalyticsEvent[]
  const pageViews = events.filter(e => e.event_type === 'page_view')
  const filter = (since: number) => pageViews.filter(e => new Date(e.created_at).getTime() >= since)

  const pvToday = filter(new Date(todayStart).getTime())
  const pvWeek = filter(new Date(weekStart).getTime())
  const pvMonth = filter(new Date(monthStart).getTime())

  const distinctIp = (list: AnalyticsEvent[]) => new Set(list.map(e => e.ip_hash).filter(Boolean)).size

  return {
    totalPV: pageViews.length, totalUV: distinctIp(pageViews),
    pvToday: pvToday.length, uvToday: distinctIp(pvToday),
    pvWeek: pvWeek.length, uvWeek: distinctIp(pvWeek),
    pvMonth: pvMonth.length, uvMonth: distinctIp(pvMonth),
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
}

export async function getUsersList(): Promise<UserListItem[]> {
  const balancesFile = path.join(DATA_DIR, 'credit_balances.json')
  let balances: Record<string, CreditBalance> = {}

  try {
    if (fs.existsSync(balancesFile)) {
      balances = JSON.parse(fs.readFileSync(balancesFile, 'utf-8'))
    }
  } catch {}

  const users: UserListItem[] = []
  for (const [email, bal] of Object.entries(balances)) {
    const lastPurchase = bal.purchases.length > 0 ? bal.purchases[0] : null
    users.push({
      email,
      hasPaid: bal.totalPurchased > 0,
      remainingCredits: bal.credits,
      totalPurchased: bal.totalPurchased,
      verifiedAt: new Date(bal.verifiedAt).toISOString(),
      lastPurchaseAt: lastPurchase ? new Date(lastPurchase.purchasedAt).toISOString() : null,
    })
  }

  // Sort: paid users first, then by remaining credits desc
  users.sort((a, b) => {
    if (a.hasPaid !== b.hasPaid) return a.hasPaid ? -1 : 1
    return b.remainingCredits - a.remainingCredits
  })

  return users
}

// ── Hash IP ──

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
}