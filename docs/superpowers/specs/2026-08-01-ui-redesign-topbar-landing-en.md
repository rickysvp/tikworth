# UI Redesign: Topbar + Landing Page + Email Verification Modal

**Date:** 2026-08-01
**Status:** Draft
**Approach:** Immersive (方案 3)

---

## 1. Overview

全面重新设计 TikWorth 前端 UI，包括三个核心模块：

1. **Topbar** — 玻璃态重设计，未购买时增加邮箱验证入口，已购买时显示额度
2. **Landing Page** — 英文沉浸式落地页，叙事性展示产品价值
3. **Email Verification Modal** — 独立 Modal 完成邮箱验证 + 套餐选择 + 支付闭环

同时将默认语言从中文切换为英文。

---

## 2. Topbar

### 2.1 未登录/未购买状态

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]  Tracker  History  Pricing  How It Works   [Verify Email] │
│  TikWorth                                                     │
└──────────────────────────────────────────────────────────────┘
```

- **Logo：** 保留现有音符图标 + 抖音青→粉渐变文字，宽度 160px
- **导航链接：** 4 个链接，hover 时底部出现青光线动画
  - Tracker (`/tracker`)
  - History (`/history`)
  - Pricing（锚点滚动到定价区）
  - How It Works（锚点滚动到核心能力区）
- **Verify Email CTA：** 抖音粉渐变按钮（`from-[#FF0050] to-[#ff2d6a]`），白字，hover 微光扫描动画，点击弹出 Modal
- **视觉：** `bg-black/80 backdrop-blur-xl`，底部 `h-px` 青光线，高度 64px

### 2.2 已购买状态

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]  Tracker  History  Pricing  How It Works   [⚡3] [R@]  │
│  TikWorth                                   credits  email   │
└──────────────────────────────────────────────────────────────┘
```

- **Credit 胶囊：** 抖音青边框 + 背景光晕，显示剩余额度数
- **用户头像圆：** 邮箱首字母，粉→青渐变底色
- **邮箱名：** truncated，hover 显示完整
- **切换按钮：** 点击清除当前绑定，回到未登录状态

### 2.3 响应式

- 移动端：导航收起到汉堡菜单，仅保留 Logo + CTA/额度
- 平板：导航隐藏，Logo + CTA 居中

---

## 3. Landing Page

### 3.1 Hero Section

**标题：** `How Much Is Any TikTok Account Worth?`
**副标题：** `Enter a username, get a professional valuation in 10 seconds.`

- 搜索框 + 示例账号按钮（保持现有功能逻辑）
- 背景：抖音粉/青光晕 + 动态粒子（canvas 粒子，200 个粒子，抖音青/粉/白三色）
- 排版：文本居中，字体大小 responsive（mobile: 32px, desktop: 56px）

### 3.2 Social Proof Bar

```
┌──────────────────────────────────────────────────┐
│  12,847+          $2.4B+           98.2%         │
│  Accounts         Total Value       Satisfaction  │
│  Evaluated        Assessed          Rate           │
└──────────────────────────────────────────────────┘
```

- 三列数字，滚动进入视口时触发 count-up 动画
- 数字使用 `formatNumber` 格式化

### 3.3 Use Cases（角色场景）

三栏卡片，每栏对应一个角色：

| Brand / Advertiser | Creator / Influencer | Agency / MCN |
|---|---|---|
| Icon: Building2 | Icon: User | Icon: Users |
| Pre-investment due diligence | Know your market value | Batch evaluation at scale |
| Avoid bot accounts, fake followers | Price your brand deals correctly | Make data-driven decisions |
| CTA: "Try Free →" | CTA: "Evaluate Now →" | CTA: "See Pricing →" |

- 卡片 hover 时边框变青，微上浮
- CTA 直接跳转到对应操作（搜索框 / 定价区）

### 3.4 Core Capabilities（10 大模块）

复用 `UNLOCK_MODULES` 数据，以功能展示形式呈现：

- 5 列 x 2 行网格
- 每个模块：图标 + 标题 + 描述
- 与 PaidWall 视觉一致，但无锁定图标

### 3.5 Pricing Preview（定价预览）

三栏套餐卡片（复用 `CREDIT_PACKAGES`）：

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Starter  │  │   Pro    │  │  Agency  │
│   $3     │  │   $19    │  │   $49    │
│ 3 Evals  │  │ 10 Evals │  │ 100 Evals│
│          │  │ ★ Popular│  │          │
│ [Get     │  │ [Get     │  │ [Get     │
│  Started]│  │  Pro]    │  │  Agency] │
└──────────┘  └──────────┘  └──────────┘
```

- 点击任一 CTA 弹出 Modal
- 信任信号：`No auto-renewal · Email-bound · Cross-device access`

### 3.6 FAQ

折叠面板，4-6 个常见问题：
- How does the valuation work?
- Is my data secure?
- Can I use credits across devices?
- What if I'm not satisfied?
- How accurate is the estimate?
- Do you support regions outside the US?

### 3.7 Footer

- 版本号 `v{APP_VERSION}`
- 免责声明：`Data sourced from third-party APIs. For reference only.`

---

## 4. Email Verification Modal

### 4.1 组件结构

新建 `components/VerifyEmailModal.tsx`，独立组件，不依赖 `PaidWall`。

### 4.2 四步流转

**Step 1: Choose Package**

```
┌────────────────────────────────┐
│  Unlock Full Report        [X] │
│  ──────────────────────────────│
│  ┌──────┐ ┌──────┐ ┌──────┐  │
│  │   $3 │ │  $19 │ │  $49 │  │
│  │3 Eval│ │10 Eva│ │100 Ev│  │
│  └──────┘ └──────┘ └──────┘  │
│                                │
│  [Continue with Email →]       │
│                                │
│  Already have credits? [Use]   │
└────────────────────────────────┘
```

- 已有额度用户：顶部显示额度信息，提供 "Use 1 Credit" 直接解锁按钮
- 切换账号：底部 "Use a different email" 链接

**Step 2: Email**

```
┌────────────────────────────────┐
│  Verify Your Email         [X] │
│  ──────────────────────────────│
│  [📧] Enter your email to      │
│       bind your credits        │
│                                │
│  ┌──────────────────────────┐  │
│  │ your@email.com           │  │
│  └──────────────────────────┘  │
│                                │
│  [Send Verification Code]      │
│                                │
│  No registration. Code only.   │
│  ← Back to packages            │
└────────────────────────────────┘
```

**Step 3: Code**

```
┌────────────────────────────────┐
│  Enter Code               [X] │
│  ──────────────────────────────│
│  Sent to your@email.com        │
│                                │
│  [DEV] Code: 123456            │
│                                │
│  ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐    │
│  │  ││  ││  ││  ││  ││  │    │
│  └──┘└──┘└──┘└──┘└──┘└──┘    │
│                                │
│  [Verify & Unlock]             │
│                                │
│  ← Change email    Resend(60s) │
│                                │
│  Package: Pro · $19 · 10 evals │
└────────────────────────────────┘
```

**Step 4: Success**

```
┌────────────────────────────────┐
│                          [X]   │
│       ┌──────────┐             │
│       │    ✓     │             │
│       └──────────┘             │
│                                │
│     Unlock Successful!         │
│     your@email.com has 10      │
│     credits remaining          │
│                                │
│     Auto-closing in 1.5s...    │
└────────────────────────────────┘
```

### 4.3 交互逻辑

- **打开：** 点击 Topbar "Verify Email" 按钮或 Pricing CTA
- **关闭：** 点击 X、点击遮罩、或按 Escape
- **成功回调：** 关闭 Modal → 刷新 Topbar 额度显示 → 平滑滚动到解锁内容区
- **支付跳转：** Stripe Checkout URL（保持现有逻辑）
- **URL 回调：** `?paid=success&email=xxx` → 刷新额度 + 显示成功提示

### 4.4 视觉规范

- 宽度：480px（移动端 100vw）
- 背景：`#0a0a0a` + 顶部粉色光斑
- 边框：`border-neutral-800` + 渐变光晕
- 遮罩：`bg-black/60 backdrop-blur-sm`
- 入场动画：`animate-fade-in-up` + scale(0.95→1)
- 套餐选中态：粉色边框 + 粉色背景 + 阴影

---

## 5. 语言切换（中文 → 英文）

### 5.1 修改范围

| 文件 | 修改内容 |
|------|----------|
| `app/layout.tsx` | `html lang="zh-CN"` → `html lang="en"`，metadata 标题/描述改为英文 |
| `app/page.tsx` | 所有面向用户的文案改为英文 |
| `components/PaidWall.tsx` | 模块标题/描述/按钮文案改为英文 |
| `components/VerifyEmailModal.tsx` | 新组件，英文 |
| `components/SectionHeader.tsx` | 步骤标题改为英文 |
| `components/sections/*.tsx` | 各 Section 标题/标签改为英文 |

### 5.2 新增英文文案示例

- 评分相关：`Account Score` / `Business Value` / `Risk Assessment`
- 收入相关：`Income Estimate` / `Revenue Roadmap` / `Growth Plan`
- 分析相关：`Peer Ranking` / `Brand Matching` / `Content Strategy`
- 导航：`Tracker` / `History` / `Pricing` / `How It Works`

---

## 6. 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `app/layout.tsx` | lang + metadata 英文 |
| 修改 | `app/page.tsx` | Topbar 重写 + Landing 新增 + 全文中英切换 |
| 新增 | `components/VerifyEmailModal.tsx` | 独立邮箱验证 Modal |
| 修改 | `components/PaidWall.tsx` | 文案英文 |
| 修改 | `components/SectionHeader.tsx` | 文案英文 |
| 修改 | `components/ScoreGauge.tsx` | 标签英文 |
| 修改 | `components/RiskList.tsx` | 文案英文 |
| 修改 | `components/DeepAnalysisSection.tsx` | 文案英文 |
| 修改 | `components/sections/*.tsx` | 各 Section 标题/标签英文（约 10 个文件） |
| 修改 | `app/globals.css` | 新增 Modal 动画 + 粒子效果样式 |

---

## 7. 不变更范围

- 评估 API 逻辑（`/api/evaluate`）
- 认证 API（`/api/auth/send-code`, `/api/auth/verify-code`）
- 额度管理（`lib/credits*.ts`, `lib/auth.ts`）
- 评分系统（`lib/scoring/*.ts`）
- 路由结构（`/tracker`, `/history`）
- `/tracker` 和 `/history` 页面内容（仅文案翻译）

---

## 8. 验收标准

- [ ] Topbar 在未登录状态显示 "Verify Email" 按钮，点击弹出 Modal
- [ ] Topbar 在已购买状态显示额度胶囊 + 用户信息
- [ ] Modal 完成邮箱验证 → 支付 → 成功全流程
- [ ] 支付成功后 Topbar 立即刷新额度，页面平滑滚动到解锁内容
- [ ] 落地页 7 个区域全部渲染正确
- [ ] 所有面向用户的文案为英文
- [ ] 移动端响应式布局正常
- [ ] 现有评估功能不受影响
- [ ] TypeScript 编译无错误
- [ ] 现有 23 个测试全部通过