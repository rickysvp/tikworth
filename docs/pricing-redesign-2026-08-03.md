# TokValue 定价模块重设计 + Blog 导航 — 2026-08-03

## 背景
用户要求：
1. 首页定价模块太简单，需要优化设计 + 丰富信息
2. Blog 链接需要加到首页导航

## 改动内容

### 定价模块重设计 (`app/page.tsx`, `lib/i18n/dictionaries/en.ts`)
原版只有3个卡片 + 底部一行 tagline，信息密度低。
新版包含：
- **退款保障徽章**：绿色高亮 `30-Day Money-Back Guarantee`
- **富信息卡片**：每个套餐有描述文案 + 底部功能清单（checklist 格式），Popular 卡有渐变背景+粉色阴影
- **功能对比表**：12 项功能×3 个套餐，表格式交叉对比（Scoring/BrandDeal/Monetization/Report/Benchmark/History/Growth/Commerce/Risk/IP/Content/API）
- 视觉优化：容器 max-w-6xl、cyan dot footer separators、price 字号 5xl、CTA shadow glow
- i18n 扩展：`nav.blog`、`pricing.guarantee/guaranteeDesc/compareTitle/compareSubtitle/features/plans`

### Blog 导航入口
- header nav：`<Link href="/blog">`（客户端路由，同在 isLoggedIn 条件块外）
- footer Product 区：新增 Blog 链接

## 验证
- tsc 编译零错误
- Vitest 46/46 通过（3 文件）
- commit 64ac9a2 已推送 main
