# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete admin dashboard at `/tiktokmaster` with analytics tracking, payment stats, credit management, and system monitoring.

**Architecture:** New admin lib modules (auth, analytics, credits) → 5 admin API routes → admin UI pages (login + 4-tab dashboard). Middleware handles page_view tracking and admin route protection. Existing Stripe/evaluate routes gain analytics event emission.

**Tech Stack:** Next.js 15 App Router, TypeScript, Recharts (already installed), existing Neon PostgreSQL + file fallback, JWT via jose

---

## File Structure

```
lib/
  admin-auth.ts          NEW — admin JWT sign/verify + rate limiting
  analytics.ts           NEW — record/query analytics events (DB + file fallback)
  admin-credits.ts       NEW — admin grantCredits with audit logging

middleware.ts            NEW — page_view tracking + admin API route protection

app/api/tiktokmaster/
  auth/route.ts          NEW — POST: verify ADMIN_PASSWORD, return admin JWT
  stats/route.ts         NEW — GET: aggregated stats query
  credits/
    grant/route.ts       NEW — POST: single/batch credit grant
    history/route.ts     NEW — GET: grant history
  audit/route.ts         NEW — GET: audit log

app/tiktokmaster/
  layout.tsx             NEW — admin auth gate wrapper
  page.tsx               NEW — login page
  dashboard/
    page.tsx             NEW — 4-tab dashboard (Client Component)

app/api/stripe/webhook/route.ts  MODIFY — record purchase analytics event
app/api/evaluate/route.ts        MODIFY — record evaluate_start / evaluate_done events
app/page.tsx                     MODIFY — record paywall_view / paywall_click events
```

---

### Task 1: Create `lib/admin-auth.ts` — Admin JWT + Rate Limiting

**Files:**
- Create: `lib/admin-auth.ts`

- [ ] **Step 1: Write the module**

```typescript
/**
 * Admin authentication — JWT sign/verify + in-memory rate limiting.
 * Only import from API routes / server components.
 */

import { SignJWT, jwtVerify } from 'jose'
import crypto from 'crypto'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const ADMIN_JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || ADMIN_PASSWORD || 'admin-jwt-fallback-min-32-bytes!!'
)

if (!ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
  console.warn('[admin-auth] ADMIN_PASSWORD is not set. Admin login is disabled.')
}

const TOKEN_MAX_AGE = '24h'

// ── Rate limiting (in-memory, per-IP) ──
const attempts = new Map<string, { count: number; lockedUntil: number }>()

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}

export function checkRateLimit(request: Request): { allowed: boolean; retryAfterSec: number } {
  const ip = getClientIp(request)
  const now = Date.now()
  const entry = attempts.get(ip)

  if (entry && entry.lockedUntil > now) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000) }
  }

  if (!entry || entry.lockedUntil < now) {
    attempts.set(ip, { count: 1, lockedUntil: 0 })
  } else {
    entry.count++
    if (entry.count > 5) {
      entry.lockedUntil = now + 15 * 60 * 1000 // 15 min lockout
    }
  }

  return { allowed: true, retryAfterSec: 0 }
}

// ── Admin JWT ──

export interface AdminPayload {
  role: 'admin'
}

export async function signAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' as const })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_MAX_AGE)
    .setJti(crypto.randomUUID())
    .sign(ADMIN_JWT_SECRET)
}

export async function verifyAdminToken(token: string): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET)
    if (payload.role === 'admin') {
      return { role: 'admin' }
    }
    return null
  } catch {
    return null
  }
}

export function validatePassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(password),
    Buffer.from(ADMIN_PASSWORD)
  )
}
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/ricky/AICode/tikworth && npx tsc --noEmit lib/admin-auth.ts 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add lib/admin-auth.ts
git commit -m "feat: add admin auth module with JWT and rate limiting"
```

---

### Task 2: Create `lib/analytics.ts` — Analytics Event Recording + Querying

**Files:**
- Create: `lib/analytics.ts`

- [ ] **Step 1: Write the module**

```typescript
/**
 * Analytics — event recording + aggregation queries.
 * Supports PostgreSQL (Neon) and file-based JSON fallback.
 */

import type { NeonQueryFunction } from '@neondatabase/serverless'
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

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL
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
    const [purchaseRows, evalRows, payerRows] = await Promise.all([
      sql`SELECT COALESCE(SUM((metadata->>'amount')::numeric), 0) as total FROM analytics_events WHERE event_type = 'purchase'`,
      sql`SELECT COALESCE(SUM((metadata->>'amount')::numeric), 0) as today FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${todayStart}::timestamptz`,
      sql`SELECT COALESCE(SUM((metadata->>'amount')::numeric), 0) as week FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${weekStart}::timestamptz`,
      sql`SELECT COALESCE(SUM((metadata->>'amount')::numeric), 0) as month FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${monthStart}::timestamptz`,
      // Payer counts
      sql`SELECT COUNT(DISTINCT email) as total FROM analytics_events WHERE event_type = 'purchase'`,
      sql`SELECT COUNT(DISTINCT email) as today FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${todayStart}::timestamptz`,
      sql`SELECT COUNT(DISTINCT email) as week FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${weekStart}::timestamptz`,
      sql`SELECT COUNT(DISTINCT email) as month FROM analytics_events WHERE event_type = 'purchase' AND created_at >= ${monthStart}::timestamptz`,
      // Evaluation counts
      sql`SELECT COUNT(*) as today FROM analytics_events WHERE event_type = 'evaluate_done' AND created_at >= ${todayStart}::timestamptz`,
      sql`SELECT COUNT(*) as week FROM analytics_events WHERE event_type = 'evaluate_done' AND created_at >= ${weekStart}::timestamptz`,
      sql`SELECT COUNT(*) as month FROM analytics_events WHERE event_type = 'evaluate_done' AND created_at >= ${monthStart}::timestamptz`,
    ])

    // Remaining credits — read from credit_balances.json
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

    return {
      totalRevenue: Number((purchaseRows[0] as Record<string,unknown>).total) || 0,
      revenueToday: Number((purchaseRows[1] as Record<string,unknown>).today) || 0,
      revenueWeek: Number((purchaseRows[2] as Record<string,unknown>).week) || 0,
      revenueMonth: Number((purchaseRows[3] as Record<string,unknown>).month) || 0,
      totalPayers: Number((payerRows[0] as Record<string,unknown>).total) || 0,
      payersToday: Number((payerRows[1] as Record<string,unknown>).today) || 0,
      payersWeek: Number((payerRows[2] as Record<string,unknown>).week) || 0,
      payersMonth: Number((payerRows[3] as Record<string,unknown>).month) || 0,
      evaluationsToday: Number((evalRows[0] as Record<string,unknown>).today) || 0,
      evaluationsWeek: Number((evalRows[1] as Record<string,unknown>).week) || 0,
      evaluationsMonth: Number((evalRows[2] as Record<string,unknown>).month) || 0,
      remainingCredits,
    }
  }

  // File fallback: aggregate from flat files
  const events = readFileStore(EVENTS_FILE) as AnalyticsEvent[]
  const nowTime = now.getTime()
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
    totalRevenue: purchases.reduce((sum, e) => sum + (Number((e.metadata as Record<string,unknown>)?.amount) || 0), 0),
    revenueToday: purchasesToday.reduce((sum, e) => sum + (Number((e.metadata as Record<string,unknown>)?.amount) || 0), 0),
    revenueWeek: purchasesWeek.reduce((sum, e) => sum + (Number((e.metadata as Record<string,unknown>)?.amount) || 0), 0),
    revenueMonth: purchasesMonth.reduce((sum, e) => sum + (Number((e.metadata as Record<string,unknown>)?.amount) || 0), 0),
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

  const events = readFileStore(EVENTS_FILE) as AnalyticsEvent[]
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

  const events = readFileStore(EVENTS_FILE) as AnalyticsEvent[]
  const sinceTime = new Date(since).getTime()
  const byDay = new Map<string, number>()
  for (const e of events) {
    if (e.event_type !== 'purchase') continue
    const d = new Date(e.created_at).toISOString().slice(0, 10)
    byDay.set(d, (byDay.get(d) || 0) + (Number((e.metadata as Record<string,unknown>)?.amount) || 0))
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

  const events = readFileStore(EVENTS_FILE) as AnalyticsEvent[]
  const sinceTime = new Date(since).getTime()
  const byPkg = new Map<string, { count: number; revenue: number }>()
  for (const e of events) {
    if (e.event_type !== 'purchase' || new Date(e.created_at).getTime() < sinceTime) continue
    const pkgId = String((e.metadata as Record<string,unknown>)?.package_id || 'unknown')
    const entry = byPkg.get(pkgId) || { count: 0, revenue: 0 }
    entry.count++
    entry.revenue += Number((e.metadata as Record<string,unknown>)?.amount) || 0
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

  const logs = readFileStore(AUDIT_FILE) as AuditEntry[]
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

// ── Hash IP ──

export function hashIp(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16)
}
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/ricky/AICode/tikworth && npx tsc --noEmit lib/analytics.ts 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add lib/analytics.ts
git commit -m "feat: add analytics module with event recording and aggregation queries"
```

---

### Task 3: Create `middleware.ts` — Page View Tracking + Admin Route Protection

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Write the middleware**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { recordEvent, hashIp } from '@/lib/analytics'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Admin API route protection ──
  if (pathname.startsWith('/api/tiktokmaster/')) {
    // Allow auth endpoint without token
    if (pathname === '/api/tiktokmaster/auth') {
      return NextResponse.next()
    }
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const payload = await verifyAdminToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // ── Page view tracking (skip API routes and static assets) ──
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/tiktokmaster') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // Fire-and-forget page view recording
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1'

  recordEvent({
    event_type: 'page_view',
    path: pathname,
    ip_hash: hashIp(ip),
    user_agent: request.headers.get('user-agent') || undefined,
  }).catch(() => {})

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/ricky/AICode/tikworth && npm run build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: add middleware for analytics page_view tracking and admin route protection"
```

---

### Task 4: Create `lib/admin-credits.ts` — Admin Credit Grant Logic

**Files:**
- Create: `lib/admin-credits.ts`

- [ ] **Step 1: Write the module**

```typescript
/**
 * Admin credit operations — grant credits with audit logging.
 */

import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { withFileLock, atomicWriteJson, dataDir as DATA_DIR } from '@/lib/file-lock'
import { recordAuditLog } from '@/lib/analytics'
import type { CreditBalance } from '@/lib/credits'

const BALANCES_FILE = path.join(DATA_DIR, 'credit_balances.json')

function readAllBalances(): Record<string, CreditBalance> {
  try {
    if (existsSync(BALANCES_FILE)) {
      return JSON.parse(readFileSync(BALANCES_FILE, 'utf-8'))
    }
  } catch {}
  return {}
}

export async function adminGrantCredits(
  emails: string[],
  credits: number,
  reason: string,
): Promise<{ success: boolean; granted: number; totalCredits: number }> {
  let totalGranted = 0

  for (const email of emails) {
    const key = email.toLowerCase().trim()
    if (!key) continue

    await withFileLock(BALANCES_FILE, async () => {
      const all = readAllBalances()
      const bal: CreditBalance = all[key] || {
        email: key,
        credits: 0,
        totalPurchased: 0,
        purchases: [],
        verifiedAt: Date.now(),
      }
      bal.credits += credits
      // Don't increment totalPurchased for admin grants
      all[key] = bal
      atomicWriteJson(BALANCES_FILE, all)
    })

    // Record audit log
    await recordAuditLog({
      action: emails.length > 1 ? 'batch_grant_credits' : 'grant_credits',
      target_email: key,
      credits,
      reason,
    })

    totalGranted++
  }

  return { success: true, granted: totalGranted, totalCredits: totalGranted * credits }
}
```

- [ ] **Step 2: Verify syntax**

```bash
cd /Users/ricky/AICode/tikworth && npx tsc --noEmit lib/admin-credits.ts 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add lib/admin-credits.ts
git commit -m "feat: add admin credit grant logic with audit logging"
```

---

### Task 5: Create Admin API Routes

**Files:**
- Create: `app/api/tiktokmaster/auth/route.ts`
- Create: `app/api/tiktokmaster/stats/route.ts`
- Create: `app/api/tiktokmaster/credits/grant/route.ts`
- Create: `app/api/tiktokmaster/credits/history/route.ts`
- Create: `app/api/tiktokmaster/audit/route.ts`

- [ ] **Step 1: Create auth route**

`app/api/tiktokmaster/auth/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validatePassword, signAdminToken, checkRateLimit } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rateLimit.retryAfterSec} seconds.` },
      { status: 429 }
    )
  }

  try {
    const body = await req.json().catch(() => ({}))
    const password = String(body.password || '')

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const token = await signAdminToken()
    return NextResponse.json({ token })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create stats route**

`app/api/tiktokmaster/stats/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getStatsOverview, getFunnel, getRevenueByDay, getRevenueByPackage } from '@/lib/analytics'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const period = url.searchParams.get('period') || '30d'
  const days = period === 'today' ? 1 : period === '7d' ? 7 : 30

  try {
    const [overview, funnel, byDay, byPackage] = await Promise.all([
      getStatsOverview(),
      getFunnel(days),
      getRevenueByDay(days),
      getRevenueByPackage(days),
    ])

    return NextResponse.json({
      overview,
      funnel,
      revenue: { byDay, byPackage },
      operations: {
        apiCalls: 0,       // placeholder for future
        apiErrors: 0,
        cacheHitRate: 0,
        avgResponseTime: 0,
      },
    })
  } catch (err) {
    console.error('[stats] error:', err)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create credits grant route**

`app/api/tiktokmaster/credits/grant/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { adminGrantCredits } from '@/lib/admin-credits'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const emails: string[] = Array.isArray(body.emails) ? body.emails : []
    const credits = Number(body.credits)
    const reason = String(body.reason || '').trim()

    // Validation
    if (emails.length === 0 || emails.length > 50) {
      return NextResponse.json({ error: '1-50 emails required' }, { status: 400 })
    }
    for (const email of emails) {
      if (!EMAIL_RE.test(email)) {
        return NextResponse.json({ error: `Invalid email: ${email}` }, { status: 400 })
      }
    }
    if (!Number.isFinite(credits) || credits < 1 || credits > 100) {
      return NextResponse.json({ error: 'Credits must be 1-100' }, { status: 400 })
    }
    if (!reason || reason.length > 500) {
      return NextResponse.json({ error: 'Reason is required (max 500 chars)' }, { status: 400 })
    }

    const result = await adminGrantCredits(emails, credits, reason)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[credits-grant] error:', err)
    return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Create credits history route**

`app/api/tiktokmaster/credits/history/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuditLog } from '@/lib/analytics'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)

  try {
    const result = await getAuditLog(limit, offset, 'grant_credits')
    return NextResponse.json(result)
  } catch (err) {
    console.error('[credits-history] error:', err)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Create audit route**

`app/api/tiktokmaster/audit/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuditLog } from '@/lib/analytics'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const action = url.searchParams.get('action') || undefined

  try {
    const result = await getAuditLog(limit, offset, action)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[audit] error:', err)
    return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
  }
}
```

- [ ] **Step 6: Verify build**

```bash
cd /Users/ricky/AICode/tikworth && npm run build 2>&1 | tail -20
```

- [ ] **Step 7: Commit**

```bash
git add app/api/tiktokmaster/
git commit -m "feat: add admin API routes (auth, stats, credits, audit)"
```

---

### Task 6: Create Admin UI Pages

**Files:**
- Create: `app/tiktokmaster/layout.tsx`
- Create: `app/tiktokmaster/page.tsx`
- Create: `app/tiktokmaster/dashboard/page.tsx`

- [ ] **Step 1: Create admin layout**

`app/tiktokmaster/layout.tsx`:

```typescript
export const metadata = {
  title: 'TokValue Admin',
  robots: 'noindex, nofollow',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create login page**

`app/tiktokmaster/page.tsx`:

```typescript
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Shield, Lock, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [retryAfter, setRetryAfter] = useState(0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!password || loading) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/tiktokmaster/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error)
          setRetryAfter(parseInt(data.error.match(/\d+/)?.[0] || '60'))
        } else {
          setError(data.error || 'Invalid password')
        }
        return
      }
      localStorage.setItem('admin_token', data.token)
      router.push('/tiktokmaster/dashboard')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-8">
          <div className="flex justify-center mb-6">
            <Image src="/tokvalue.png" alt="TokValue" width={120} height={30} className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="h-5 w-5 text-[#00F2EA]" />
            <h1 className="text-lg font-bold">Admin Console</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-xs text-neutral-500 mb-2">Admin Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600" />
                <input
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter admin password"
                  className="w-full rounded-xl border border-neutral-700 bg-[#0f0f0f] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#00F2EA] focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-400 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full rounded-xl bg-[#00F2EA] text-black font-semibold py-2.5 text-sm hover:bg-[#00D8D0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-neutral-700 mt-4">
          TokValue Admin · Restricted Access
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Create dashboard page**

This is the largest file. Create `app/tiktokmaster/dashboard/page.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LogOut, TrendingUp, DollarSign, Users, Activity, BarChart3, Settings, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

// ── Types ──
interface StatsData {
  overview: {
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
  funnel: {
    pageViews: number
    searches: number
    evaluateStarts: number
    paywallViews: number
    paywallClicks: number
    purchases: number
  }
  revenue: {
    byDay: { date: string; amount: number }[]
    byPackage: { id: string; count: number; revenue: number }[]
  }
}

type Tab = 'overview' | 'funnel' | 'revenue' | 'ops'

// ── Helpers ──
function fmtUsd(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}
function fmtNum(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}
function pct(a: number, b: number): string {
  if (b === 0) return '0.0%'
  return `${((a / b) * 100).toFixed(1)}%`
}

const TAB_COLORS: Record<Tab, string> = {
  overview: 'border-[#00F2EA] text-[#00F2EA]',
  funnel: 'border-[#FF0050] text-[#FF0050]',
  revenue: 'border-green-400 text-green-400',
  ops: 'border-amber-400 text-amber-400',
}

const PIE_COLORS = ['#00F2EA', '#FF0050', '#22c55e', '#a855f7']

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Credit grant form state
  const [grantMode, setGrantMode] = useState<'single' | 'batch'>('single')
  const [grantEmail, setGrantEmail] = useState('')
  const [grantBatchEmails, setGrantBatchEmails] = useState('')
  const [grantCredits, setGrantCredits] = useState(5)
  const [grantReason, setGrantReason] = useState('')
  const [grantLoading, setGrantLoading] = useState(false)
  const [grantResult, setGrantResult] = useState<{ success: boolean; msg: string } | null>(null)

  // Credit history
  const [history, setHistory] = useState<Array<{ id: number; target_email: string; credits: number; reason: string; created_at: string }>>([])

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null

  const fetchStats = useCallback(async () => {
    if (!token) { router.push('/tiktokmaster'); return }
    try {
      const res = await fetch('/api/tiktokmaster/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) { localStorage.removeItem('admin_token'); router.push('/tiktokmaster'); return }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError('Failed to load stats')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token, router])

  const fetchHistory = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/tiktokmaster/credits/history?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setHistory(data.items || [])
    } catch {}
  }, [token])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { if (tab === 'ops') fetchHistory() }, [tab, fetchHistory])

  async function handleGrant() {
    if (!token) return
    const emails = grantMode === 'single'
      ? [grantEmail]
      : grantBatchEmails.split(/[\n,]+/).map(e => e.trim()).filter(Boolean)

    if (emails.length === 0) {
      setGrantResult({ success: false, msg: 'Please enter at least one email' })
      return
    }
    if (!grantReason.trim()) {
      setGrantResult({ success: false, msg: 'Reason is required' })
      return
    }

    setGrantLoading(true)
    setGrantResult(null)
    try {
      const res = await fetch('/api/tiktokmaster/credits/grant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emails, credits: grantCredits, reason: grantReason }),
      })
      const data = await res.json()
      if (res.ok) {
        setGrantResult({ success: true, msg: `Granted ${data.granted} × ${grantCredits} = ${data.totalCredits} evaluations to ${data.granted} email(s)` })
        setGrantEmail('')
        setGrantBatchEmails('')
        setGrantReason('')
        fetchHistory()
        fetchStats()
      } else {
        setGrantResult({ success: false, msg: data.error || 'Failed' })
      }
    } catch {
      setGrantResult({ success: false, msg: 'Network error' })
    } finally {
      setGrantLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('admin_token')
    router.push('/tiktokmaster')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F2EA]" />
      </main>
    )
  }

  if (error && !stats) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </main>
    )
  }

  const o = stats!.overview
  const f = stats!.funnel
  const r = stats!.revenue

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
    { key: 'funnel', label: 'Funnel', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'revenue', label: 'Revenue', icon: <DollarSign className="h-4 w-4" /> },
    { key: 'ops', label: 'Operations', icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/tokvalue.png" alt="TokValue" width={100} height={24} className="h-6 w-auto object-contain" />
            <span className="text-xs text-neutral-600 border-l border-neutral-800 pl-3">Admin Console</span>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="border-b border-neutral-800 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                tab === t.key
                  ? `${TAB_COLORS[t.key]}`
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ── Tab: Overview ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Row 1: Revenue */}
            <div className="grid grid-cols-4 gap-4">
              <MetricCard label="Total Revenue" value={fmtUsd(o.totalRevenue)} icon={<DollarSign className="h-4 w-4" />} color="cyan" />
              <MetricCard label="Revenue Today" value={fmtUsd(o.revenueToday)} icon={<DollarSign className="h-4 w-4" />} color="cyan" />
              <MetricCard label="Revenue This Week" value={fmtUsd(o.revenueWeek)} icon={<DollarSign className="h-4 w-4" />} color="cyan" />
              <MetricCard label="Revenue This Month" value={fmtUsd(o.revenueMonth)} icon={<DollarSign className="h-4 w-4" />} color="cyan" />
            </div>
            {/* Row 2: Payers */}
            <div className="grid grid-cols-4 gap-4">
              <MetricCard label="Total Payers" value={fmtNum(o.totalPayers)} icon={<Users className="h-4 w-4" />} color="pink" />
              <MetricCard label="Payers Today" value={fmtNum(o.payersToday)} icon={<Users className="h-4 w-4" />} color="pink" />
              <MetricCard label="Payers This Week" value={fmtNum(o.payersWeek)} icon={<Users className="h-4 w-4" />} color="pink" />
              <MetricCard label="Payers This Month" value={fmtNum(o.payersMonth)} icon={<Users className="h-4 w-4" />} color="pink" />
            </div>
            {/* Row 3: Evaluations */}
            <div className="grid grid-cols-4 gap-4">
              <MetricCard label="Evaluations Today" value={fmtNum(o.evaluationsToday)} icon={<Activity className="h-4 w-4" />} color="green" />
              <MetricCard label="Evaluations This Week" value={fmtNum(o.evaluationsWeek)} icon={<Activity className="h-4 w-4" />} color="green" />
              <MetricCard label="Evaluations This Month" value={fmtNum(o.evaluationsMonth)} icon={<Activity className="h-4 w-4" />} color="green" />
              <MetricCard label="Remaining Unused" value={fmtNum(o.remainingCredits)} icon={<TrendingUp className="h-4 w-4" />} color="amber" />
            </div>

            {/* PV/UV Trend Chart */}
            <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
              <h3 className="text-sm font-semibold text-neutral-400 mb-4">PV / UV Trend (30 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={r.byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#525252' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#525252' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: '#737373' }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#00F2EA" strokeWidth={2} dot={false} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Funnel ── */}
        {tab === 'funnel' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
              <h3 className="text-sm font-semibold text-neutral-400 mb-6">Conversion Funnel (30 Days)</h3>
              <div className="space-y-3">
                {[
                  { label: 'Page Views', value: f.pageViews, color: '#525252' },
                  { label: 'Searches', value: f.searches, color: '#737373' },
                  { label: 'Evaluate Starts', value: f.evaluateStarts, color: '#a855f7' },
                  { label: 'Paywall Views', value: f.paywallViews, color: '#f59e0b' },
                  { label: 'Paywall Clicks', value: f.paywallClicks, color: '#FF0050' },
                  { label: 'Purchases', value: f.purchases, color: '#22c55e' },
                ].map((step, i) => {
                  const prev = i > 0 ? [f.pageViews, f.searches, f.evaluateStarts, f.paywallViews, f.paywallClicks][i - 1] : f.pageViews
                  const rate = i === 0 ? '100%' : pct(step.value, prev)
                  const maxVal = Math.max(f.pageViews, 1)
                  const width = `${Math.max((step.value / maxVal) * 100, 2)}%`
                  return (
                    <div key={step.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-neutral-300">{step.label}</span>
                        <span className="text-xs text-neutral-500">
                          {fmtNum(step.value)} · {rate}
                        </span>
                      </div>
                      <div className="h-8 bg-[#0f0f0f] rounded-lg overflow-hidden">
                        <div
                          className="h-full rounded-lg transition-all flex items-center px-3"
                          style={{ width, backgroundColor: step.color }}
                        >
                          <span className="text-xs font-semibold text-white">{fmtNum(step.value)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Revenue ── */}
        {tab === 'revenue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Package Distribution Pie */}
              <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
                <h3 className="text-sm font-semibold text-neutral-400 mb-4">Package Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={r.byPackage} dataKey="count" nameKey="id" cx="50%" cy="50%" outerRadius={80} label={({ id, count }) => `${id}: ${count}`}>
                        {r.byPackage.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Revenue Bar */}
              <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
                <h3 className="text-sm font-semibold text-neutral-400 mb-4">Daily Revenue</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={r.byDay.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#525252' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#525252' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: 8 }} />
                      <Bar dataKey="amount" fill="#00F2EA" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Revenue Table */}
            <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
              <h3 className="text-sm font-semibold text-neutral-400 mb-4">Package Sales</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-neutral-600 border-b border-neutral-800">
                    <th className="pb-3 font-medium">Package</th>
                    <th className="pb-3 font-medium text-right">Count</th>
                    <th className="pb-3 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {r.byPackage.map((pkg, i) => (
                    <tr key={i} className="border-b border-neutral-800/50">
                      <td className="py-3 text-neutral-300">{pkg.id}</td>
                      <td className="py-3 text-right tabular-nums">{pkg.count}</td>
                      <td className="py-3 text-right tabular-nums text-[#00F2EA]">{fmtUsd(pkg.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Tab: Operations ── */}
        {tab === 'ops' && (
          <div className="space-y-6">
            {/* Credit Grant Form */}
            <div className="rounded-2xl border border-[#00F2EA]/20 bg-[#141414] p-6">
              <h3 className="text-sm font-semibold text-neutral-400 mb-4">Grant Evaluations</h3>

              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setGrantMode('single')}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${grantMode === 'single' ? 'border-[#00F2EA] text-[#00F2EA] bg-[#00F2EA]/10' : 'border-neutral-700 text-neutral-500'}`}
                >
                  Single Email
                </button>
                <button
                  onClick={() => setGrantMode('batch')}
                  className={`px-4 py-2 rounded-lg text-sm border transition-colors ${grantMode === 'batch' ? 'border-[#00F2EA] text-[#00F2EA] bg-[#00F2EA]/10' : 'border-neutral-700 text-neutral-500'}`}
                >
                  Batch (CSV)
                </button>
              </div>

              {grantMode === 'single' ? (
                <input
                  type="email"
                  value={grantEmail}
                  onChange={e => setGrantEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full rounded-xl border border-neutral-700 bg-[#0f0f0f] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#00F2EA] focus:outline-none mb-4"
                />
              ) : (
                <textarea
                  value={grantBatchEmails}
                  onChange={e => setGrantBatchEmails(e.target.value)}
                  placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
                  rows={4}
                  className="w-full rounded-xl border border-neutral-700 bg-[#0f0f0f] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#00F2EA] focus:outline-none mb-4 resize-none"
                />
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Evaluations to Grant</label>
                  <input
                    type="number"
                    value={grantCredits}
                    onChange={e => setGrantCredits(Number(e.target.value))}
                    min={1}
                    max={100}
                    className="w-full rounded-xl border border-neutral-700 bg-[#0f0f0f] px-4 py-2.5 text-sm text-white focus:border-[#00F2EA] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-neutral-500 mb-1">Reason</label>
                  <input
                    type="text"
                    value={grantReason}
                    onChange={e => setGrantReason(e.target.value)}
                    placeholder="Customer refund / promotion"
                    className="w-full rounded-xl border border-neutral-700 bg-[#0f0f0f] px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-[#00F2EA] focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleGrant}
                disabled={grantLoading}
                className="w-full rounded-xl bg-[#00F2EA] text-black font-semibold py-2.5 text-sm hover:bg-[#00D8D0] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {grantLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {grantLoading ? 'Granting...' : 'Grant Evaluations'}
              </button>

              {grantResult && (
                <div className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 ${grantResult.success ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {grantResult.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
                  {grantResult.msg}
                </div>
              )}
            </div>

            {/* Credit History */}
            <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-6">
              <h3 className="text-sm font-semibold text-neutral-400 mb-4">Recent Grant History</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-neutral-600 border-b border-neutral-800">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium text-right">Evaluations</th>
                    <th className="pb-3 font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-b border-neutral-800/50">
                      <td className="py-3 text-neutral-500 text-xs">{new Date(h.created_at).toLocaleString('en-US')}</td>
                      <td className="py-3 text-neutral-300">{h.target_email}</td>
                      <td className="py-3 text-right tabular-nums text-[#00F2EA]">{h.credits}</td>
                      <td className="py-3 text-neutral-500 text-xs">{h.reason}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-neutral-600">No grant history yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

// ── Metric Card Component ──
function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: 'cyan' | 'pink' | 'green' | 'amber' }) {
  const borderColor = color === 'cyan' ? 'border-[#00F2EA]/20' : color === 'pink' ? 'border-[#FF0050]/20' : color === 'green' ? 'border-green-500/20' : 'border-amber-500/20'
  const iconColor = color === 'cyan' ? 'text-[#00F2EA]' : color === 'pink' ? 'text-[#FF0050]' : color === 'green' ? 'text-green-400' : 'text-amber-400'
  return (
    <div className={`rounded-xl border ${borderColor} bg-[#141414] p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={iconColor}>{icon}</span>
        <span className="text-xs text-neutral-500">{label}</span>
      </div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/ricky/AICode/tikworth && npm run build 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add app/tiktokmaster/
git commit -m "feat: add admin UI pages (login + 4-tab dashboard)"
```

---

### Task 7: Modify Existing Routes — Add Analytics Events

**Files:**
- Modify: `app/api/stripe/webhook/route.ts`
- Modify: `app/api/evaluate/route.ts`
- Modify: `app/page.tsx`

- [ ] **Step 1: Add purchase event to Stripe webhook**

In `app/api/stripe/webhook/route.ts`, add import and event recording after the `grantCredits` call:

```typescript
// Add at top with other imports:
import { recordEvent } from '@/lib/analytics'

// In the checkout.session.completed handler, after grantCredits(...):
await grantCredits(email.toLowerCase(), packageId, creditsNum, parseFloat(amount || '0'), session.id)
console.log('[stripe-webhook] granted credits to', email, packageId, credits)

// Add purchase analytics event:
recordEvent({
  event_type: 'purchase',
  email: email.toLowerCase(),
  metadata: { package_id: packageId, credits: creditsNum, amount: parseFloat(amount || '0') },
}).catch(err => console.warn('[stripe-webhook] analytics record failed:', err))
```

The exact change: after `console.log('[stripe-webhook] granted credits to', email, packageId, credits)` on line 43, add the recordEvent block.

- [ ] **Step 2: Add evaluate events to evaluate route**

In `app/api/evaluate/route.ts`, add import and events:

```typescript
// Add at top with other imports:
import { recordEvent } from '@/lib/analytics'

// After successful profile fetch (after line 133):
const profile = await fetchProfile(normalized)

// Record evaluate_start event:
recordEvent({
  event_type: 'evaluate_start',
  username: normalized,
  path: '/api/evaluate',
}).catch(() => {})

let evaluation = scoreProfile(profile)
evaluation = await enrichWithAI(evaluation)

await saveEvaluation(evaluation)

// Record evaluate_done event:
recordEvent({
  event_type: 'evaluate_done',
  username: normalized,
  metadata: { score: evaluation.score, tier: evaluation.tier, cached: evaluation.cached || false },
}).catch(() => {})

// Also, in the error handler (catch block), add:
// recordEvent({ event_type: 'api_error', path: '/api/evaluate', metadata: { error_code: code } }).catch(() => {})
```

- [ ] **Step 3: Add paywall events to page.tsx**

In `app/page.tsx`, add event recording in the PaidWall component usage. The paywall events fire when the PaidWall is shown and when the user clicks the CTA. Add a helper:

```typescript
// Add at top (after import block):
import { recordEvent } from '@/lib/analytics'

// In the component, when result is set and unlocked is false, record paywall_view:
// Add this useEffect after the result state is set:
useEffect(() => {
  if (result && !isUnlocked) {
    recordEvent({ event_type: 'paywall_view', username: result.username }).catch(() => {})
  }
}, [result, isUnlocked])
```

Since `recordEvent` is a server-only function (imports fs), we need a client-side API endpoint. Instead, create a simple client-side tracking API:

**Create `app/api/track/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { recordEvent } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await recordEvent({
      event_type: body.event_type,
      username: body.username,
      path: body.path,
      metadata: body.metadata,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
```

Then in `app/page.tsx`, add a helper function:

```typescript
// Add this function inside the HomePageContent component:
function trackEvent(event_type: string, metadata?: Record<string, unknown>) {
  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type, username: result?.username, metadata }),
  }).catch(() => {})
}
```

Then call `trackEvent('paywall_view')` when PaidWall is shown, and `trackEvent('paywall_click', { package_id: selectedPackage })` when the user clicks the CTA. Also call `trackEvent('search', {})` when the search form is submitted.

- [ ] **Step 4: Verify build**

```bash
cd /Users/ricky/AICode/tikworth && npm run build 2>&1 | tail -20
```

- [ ] **Step 5: Commit**

```bash
git add app/api/stripe/webhook/route.ts app/api/evaluate/route.ts app/api/track/route.ts app/page.tsx
git commit -m "feat: add analytics event tracking to existing routes and pages"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Full build**

```bash
cd /Users/ricky/AICode/tikworth && npm run build 2>&1
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Start dev server and test login**

```bash
# Set ADMIN_PASSWORD in .env.local:
echo "ADMIN_PASSWORD=your-secure-password" >> .env.local

# Start dev server:
npm run dev
```

Navigate to http://localhost:3000/tiktokmaster and verify:
- Login page renders with TokValue logo
- Invalid password shows error
- Valid password redirects to dashboard
- Dashboard shows 4 tabs with data

- [ ] **Step 3: Commit**

```bash
git add .env.local
git commit -m "chore: add ADMIN_PASSWORD to env"
```