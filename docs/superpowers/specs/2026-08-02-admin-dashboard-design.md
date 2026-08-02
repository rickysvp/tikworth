# Admin Dashboard Design — TokValue 运营后台

## Summary

为 TokValue 构建运营管理后台，包含网站访问统计、付费数据、手动发放评估次数、运维监控等功能。后台入口路径使用 `/tiktokmaster` 避免被扫描。

## Architecture

```
/tiktokmaster                    → 密码登录页
/tiktokmaster/dashboard          → 运营 Dashboard（4 Tab）

/api/tiktokmaster/auth           → POST 验证 ADMIN_PASSWORD，签发 admin JWT
/api/tiktokmaster/stats          → GET 运营统计数据（按时间段查询）
/api/tiktokmaster/credits/grant  → POST 手动发放评估次数（单邮箱 + 批量）
/api/tiktokmaster/credits/history→ GET 发放历史记录
/api/tiktokmaster/audit          → GET 操作审计日志
```

### Security

- 所有 `/api/tiktokmaster/*` 路由通过 middleware 校验 admin JWT
- `ADMIN_PASSWORD` 存于环境变量，不落数据库
- Admin JWT 有效期 24 小时，与用户 JWT 隔离（不同 secret 或不同 payload claim）
- 登录失败超过 5 次后锁定 15 分钟

### Analytics Data Collection

- **自建埋点**：Next.js middleware + API route 内联记录事件到 `analytics_events` 表
- **Google Analytics**：`layout.tsx` 注入 GA Script（不做额外集成，纯前端上报）

## Data Model

### New Tables

#### `analytics_events` — 埋点事件

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment |
| event_type | TEXT | `page_view` / `search` / `evaluate_start` / `evaluate_done` / `paywall_view` / `paywall_click` / `purchase` / `api_error` |
| path | TEXT | Page path (e.g. `/`, `/history`) |
| username | TEXT? | TikTok username being searched/evaluated |
| email | TEXT? | User email (for purchase events) |
| metadata | JSONB | Extensible: error_code, package_id, amount, etc. |
| ip_hash | TEXT | SHA256-hashed IP for UV dedup (no raw IP stored) |
| user_agent | TEXT | Browser UA |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

#### `admin_audit_log` — 操作审计

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment |
| action | TEXT | `grant_credits` / `batch_grant_credits` |
| target_email | TEXT | Target email(s) |
| credits | INTEGER | Credits granted |
| reason | TEXT | Reason for the operation |
| operator | TEXT | Always "admin" |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |

### Event Tracking Points

| Event | Trigger Location | Metadata |
|-------|-----------------|----------|
| `page_view` | Middleware (every page request) | path, referrer |
| `search` | Search form submit | username |
| `evaluate_start` | `/api/evaluate` called | username |
| `evaluate_done` | Evaluation completed | username, score, tier, cached |
| `paywall_view` | PaidWall component mount | username |
| `paywall_click` | Paywall CTA clicked | username, package_id |
| `purchase` | Stripe webhook success | email, package_id, amount |
| `api_error` | API error responses | error_code, path |

### DB Fallback

When PostgreSQL is unavailable, fall back to file-based JSON storage:
- `data/analytics_events.json`
- `data/admin_audit_log.json`

Same `withFileLock` pattern as existing `credit_balances.json`.

## API Design

### POST /api/tiktokmaster/auth

**Request:**
```json
{ "password": "xxx" }
```

**Response (200):**
```json
{ "token": "admin-jwt-token" }
```

**Response (401):**
```json
{ "error": "Invalid password" }
```

Rate limit: 5 attempts per 15 minutes per IP.

---

### GET /api/tiktokmaster/stats

**Query params:** `period=today|7d|30d`

**Response:**
```json
{
  "overview": {
    "totalRevenue": 12345,
    "revenueToday": 123,
    "revenueWeek": 890,
    "revenueMonth": 2345,
    "totalPayers": 67,
    "payersToday": 3,
    "payersWeek": 12,
    "payersMonth": 28,
    "evaluationsToday": 15,
    "evaluationsWeek": 89,
    "evaluationsMonth": 320,
    "remainingCredits": 450
  },
  "funnel": {
    "pageViews": 5000,
    "searches": 800,
    "evaluateStarts": 600,
    "paywallViews": 400,
    "paywallClicks": 120,
    "purchases": 45
  },
  "revenue": {
    "byDay": [{ "date": "2026-08-01", "amount": 123 }, ...],
    "byPackage": [{ "id": "pack6", "count": 20, "revenue": 580 }, ...]
  },
  "operations": {
    "apiCalls": 1200,
    "apiErrors": 3,
    "cacheHitRate": 0.65,
    "avgResponseTime": 320
  }
}
```

---

### POST /api/tiktokmaster/credits/grant

**Request (single):**
```json
{
  "emails": ["user@example.com"],
  "credits": 5,
  "reason": "Customer refund compensation"
}
```

**Request (batch):**
```json
{
  "emails": ["a@x.com", "b@y.com", "c@z.com"],
  "credits": 3,
  "reason": "Promotional giveaway"
}
```

**Response (200):**
```json
{
  "success": true,
  "granted": 3,
  "totalCredits": 9
}
```

Validation:
- `emails`: 1-50 emails, all valid format
- `credits`: 1-100
- `reason`: 1-500 chars, required

---

### GET /api/tiktokmaster/credits/history

**Query params:** `limit=50`, `offset=0`

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "action": "grant_credits",
      "target_email": "user@example.com",
      "credits": 5,
      "reason": "Customer refund",
      "created_at": "2026-08-02T10:00:00Z"
    }
  ],
  "total": 120
}
```

---

### GET /api/tiktokmaster/audit

**Query params:** `limit=50`, `offset=0`, `action=grant_credits`

Same structure as credits/history, includes all audit log entries.

## UI Design

### Login Page (`/tiktokmaster`)

- Dark theme, centered card
- TokValue logo at top
- Password input + "Sign In" button
- Error message on invalid password
- Rate limit countdown display

### Dashboard (`/tiktokmaster/dashboard`)

**Layout:** Top bar with logo + "Admin Dashboard" title + logout button. 4 tabs below.

#### Tab 1: Overview

**3 rows × 4 columns metric cards:**

Row 1 — Revenue:
- Total Revenue (all-time)
- Revenue Today
- Revenue This Week
- Revenue This Month

Row 2 — Payers:
- Total Payers (all-time)
- Payers Today
- Payers This Week
- Payers This Month

Row 3 — Evaluations:
- Evaluations Today
- Evaluations This Week
- Evaluations This Month
- Remaining Unused Credits

**Below cards:**
- Line chart: 7/30-day PV + UV trend (Recharts)
- Table: Last 10 evaluations (username, score, tier, time)

#### Tab 2: Funnel

- Funnel chart: Page Views → Searches → Evaluate Starts → Paywall Views → Paywall Clicks → Purchases
- Each step shows count and conversion rate
- Time period selector: Today / 7 days / 30 days

#### Tab 3: Revenue

- Revenue summary: Month total + month-over-month %
- Pie chart: Package sales distribution
- Bar chart: Daily revenue
- Table: Revenue details (time, email, package, amount)

#### Tab 4: Operations

**Credit Grant Form:**
- Radio: Single email / Batch (CSV paste)
- Email input(s)
- Credits count input
- Reason textarea
- "Grant Credits" button with confirmation dialog

**Credit History Table:**
- Time, email, credits, reason
- Paginated

**System Stats:**
- API call count + error rate
- Cache hit rate
- Average response time

### Visual Style

- Consistent with main site: dark background (#0a0a0a), card bg (#141414), cyan (#00F2EA) + pink (#FF0050) accents
- Metric cards: large number + label + subtle trend indicator
- Charts: Recharts with dark theme, cyan/pink color palette
- Tables: striped rows, hover highlight, monospace numbers

## File Changes

| File | Change |
|------|--------|
| `lib/admin-auth.ts` | **New** — admin JWT sign/verify helpers |
| `lib/analytics.ts` | **New** — analytics event recording + query helpers |
| `lib/admin-credits.ts` | **New** — admin credit grant logic |
| `middleware.ts` | **Modify** — add analytics page_view tracking + admin route protection |
| `app/api/tiktokmaster/auth/route.ts` | **New** |
| `app/api/tiktokmaster/stats/route.ts` | **New** |
| `app/api/tiktokmaster/credits/grant/route.ts` | **New** |
| `app/api/tiktokmaster/credits/history/route.ts` | **New** |
| `app/api/tiktokmaster/audit/route.ts` | **New** |
| `app/tiktokmaster/page.tsx` | **New** — login page |
| `app/tiktokmaster/dashboard/page.tsx` | **New** — dashboard (Client Component) |
| `app/tiktokmaster/layout.tsx` | **New** — admin layout (auth gate) |
| `app/api/stripe/webhook/route.ts` | **Modify** — add `purchase` analytics event |
| `app/api/evaluate/route.ts` | **Modify** — add `evaluate_start`/`evaluate_done` events |
| `app/page.tsx` | **Modify** — add `paywall_view`/`paywall_click` events |
| `package.json` | **Modify** — add `recharts` dependency |

## Out of Scope

- GA 集成细节（仅 script 注入，不做额外配置）
- 实时 WebSocket 推送
- 多管理员角色/权限
- 邮件通知/告警
- 数据导出（CSV/Excel）
- 移动端适配（后台仅桌面端使用）