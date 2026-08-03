# TokValue PV/UV / History / CTA 问题分析与修复方案

## 问题 1：Recently Evaluated 引导文案错误

**现状**: 卡片底部显示 "X accounts · Click a card to unlock the full report · View history →"
**问题**: 引导用户去看别人的评估结果，而不是评估自己的账号
**修复**: 删除统计数字和 View history 链接，替换为引导评估自己账号的 CTA

## 问题 2：History 页面公开暴露全量评估记录

**现状**: `/app/history/page.tsx` 是 SSR 页面，直接调用 `findRecentEvaluations(50)` 无任何鉴权
**问题**: 所有人可查看所有评估记录（含昵称、头像、估值等敏感数据），严重隐私泄露
**修复**:
1. 评估时记录 `evaluated_by` (email)，DB migration 加列
2. `/api/recent-evaluations` → 要求 Bearer token，仅返回该用户的评估记录
3. `/app/history/page.tsx` → 改为客户端鉴权页面，未登录重定向首页
4. 公共着陆页 Recently Evaluated 仅展示数量统计（无个人信息）

## 问题 3：PV/UV 统计始终为 0

**根因**: 
1. `initDb()` 的失败缓存 bug — 一旦失败，`dbInitPromise` 永久缓存失败结果，后续所有请求不再重试
2. `/api/track` catch 块静默吞错误，返回 `{ok: true}`，导致前端无法感知写入失败
3. Vercel 生产环境可能未配置 DATABASE_URL

**修复**:
1. `initDb()` 失败时清除 `dbInitPromise` 和 `sql`，允许下次请求重试
2. `/api/track` 增强错误日志（console.error 而非 console.warn）
3. analytics.ts 的 `recordEvent` 函数失败时不静默，记录详细错误
