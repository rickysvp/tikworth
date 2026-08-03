# TokValue 二次审计报告

> **审计日期**: 2026-08-03  
> **基线**: 首次审计（docs/audit-report-2026-08-03.md）  
> **修改范围**: 11 个文件，+99/-112 行  
> **构建状态**: ✅ TypeScript 零错误 | ✅ 测试 36/46 pass（10 个失败为预先存在的中文 locale 断言不匹配）

---

## 一、已修复问题

### 1. PV/UV 埋点统一 ✅

| 项目 | 修改前 | 修改后 |
|------|--------|--------|
| 写入管道 | `/api/track` 和 `lib/analytics.ts` 独立写 SQL | 全部走 `lib/analytics` |
| IP 提取 | 服务端 recordEvent 不传 ip_hash（全部 NULL） | `recordEventFromRequest()` 自动从 `x-forwarded-for` 提取 |
| 哈希算法 | `/api/track` SHA256 16 字符 vs `analytics` HMAC-SHA256 32 字符 | 统一 HMAC-SHA256 32 字符 |
| 建表位置 | 3 处独立 `CREATE TABLE analytics_events` | 仅 `lib/analytics.ts::initDb()` 一处建表 |
| credit_balances 建表 | `analytics.ts` 和 `credits-server.ts` 各自建 | `analytics.ts` 删除建表，仅保留 ALTER COLUMN 兜底 |

**影响**: `COUNT(DISTINCT ip_hash)` 现在对所有事件有效，UV 数据从 NULL 变为真实值。

### 2. 中间件鉴权修复 ✅

**修改前**: `middleware.ts` 检查 Bearer header 存在但不验证内容，任何随机字符串可通过。

**修改后**: 删除伪检查。Admin 路由的鉴权完全由 `verifyAdminRequest()`（lib/admin-api-utils.ts → lib/admin-auth.ts）负责，做真实 JWT HS256 验证 + timing-safe 密码比对 + IP 级别限流（5 次/15 分钟锁定）。

### 3. JWT_SECRET 强制 ✅

**修改前**: 模块顶层 `new TextEncoder().encode(env || '')`，缺 secret 时静默降级为空字符串，导致 `verifySessionToken` 中 `JWT_SECRET.length < 32 → return null`，**所有鉴权失效**。

**修改后**: `getJwtSecret()` 函数检查 ≥32 字节，缺失时 `throw Error`（生产环境），开发环境用显式 dev fallback。

### 4. 视频数据质量标记 ✅

**修改前**: `fetchProfile()` 获取视频失败时静默返回空数组，`dataQuality` 字段已定义但未赋值实际差异信息。

**修改后**:
- `RawProfile` 新增 `postsFetchError?: string`
- `fetchProfile()` 在 `posts.length === 0` 时返回 `dataQuality: 'partial'` + `postsFetchError: 'Video data unavailable — evaluation may be less accurate'`
- `Evaluation` 类型新增 `dataQuality` 和 `postsFetchError` 字段
- `scoreProfile()` 将这两个字段透传到返回的 Evaluation 对象

前端可据此展示数据不完整警告。

### 5. 统计路由收口 ✅

**修改前**: `/api/stats/route.ts` 独立建 `analytics_events` 表 + 自己写 SQL 查询 UV。

**修改后**: 调用 `getPVUV()` 统一查询，不再自己建表。

---

## 二、未修复问题（非本次范围）

| 级别 | 问题 | 状态 |
|------|------|------|
| P1 | 视频获取失败静默空数组（dataQuality 已标记，但数据本身仍为空） | dataQuality flag 已加，需前端展示 |
| P1 | API 限流缺失 | 待后续 PR |
| P1 | 评分引擎 detectRisks 与各 dimension score 函数的风险逻辑重复 | 待后续 PR |
| P2 | 多处魔法数硬编码（0.55/0.45, hitRate×250 等） | 待后续 PR |
| P2 | /api/evaluate 先扣额度再 fetchProfile，异常时额度已扣但无结果 | 待后续 PR |
| P2 | buildRevenueRoadmap 的 unlocksFor 文案硬编码中文 | 待后续 PR |
| P2 | 10 个测试失败（中文 locale vs 英文断言不匹配） | 需修复测试断言 |
| P3 | buildTrendAnalysis 的 trendingTopics/trendingSounds 恒空数组 | AI 接口占位 |
| P3 | buildEngagementQuality 的 completionRate=null | RapidAPI 不提供数据 |

---

## 三、文件变更清单

```
app/api/credits/claim/route.ts   │   4 +--  (recordEvent → recordEventFromRequest)
app/api/evaluate/route.ts        │  10 ++-- (4 处 recordEvent → recordEventFromRequest)
app/api/stats/route.ts           │  21 +--- (删冗余建表，改用 getPVUV)
app/api/stripe/webhook/route.ts  │   6 ++-- (webhook 走 recordEvent + hashIp 标记)
app/api/track/route.ts           │  60 ++-- (重写，走统一管道)
lib/analytics.ts                 │  40 ++-- (新增 recordEventFromRequest，删 credit_balances 建表)
lib/auth.ts                      │  32 ++-- (getJwtSecret() throw on missing secret)
lib/scoring.ts                   │   2 ++   (scoreProfile 透传 dataQuality/postsFetchError)
lib/tiktok.ts                    │   5 ++-- (fetchProfile 返回 postsFetchError)
middleware.ts                    │  28 ++-- (删除伪鉴权)
types.ts                         │   3 ++   (Evaluation/RawProfile 新增 dataQuality/postsFetchError)
```

**净变更**: 11 文件，+99 / -112 行。

---

## 四、回归验证

| 验证项 | 结果 |
|--------|------|
| TypeScript 编译 (`tsc --noEmit`) | ✅ 零错误 |
| Vitest (`npx vitest run`) | ✅ 36/46 pass（10 个失败预先存在，与本次改动无关） |
| 新函数签名一致性 | ✅ `recordEventFromRequest(req: Request, event)` 符合 Web API |
| 数据流完整性 | ✅ recordEventFromRequest → recordEvent → initDb → INSERT |
| JWT_SECRET 行为 | ✅ dev 环境 fallback，production 缺 secret throw |
