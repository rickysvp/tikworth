# 定价模块重设计

**日期**: 2026-08-03
**状态**: 已确认，待实现
**范围**: 落地页定价区 + i18n 字典 + 套餐标签

---

## 背景

现有定价模块存在严重的信息真实性问题：

1. **虚构退款承诺** — 绿色横幅写"30-Day Money-Back Guarantee"，项目无此政策
2. **虚假权益分层** — Starter 4 项 / Popular 9 项 / Pro 12 项，但实际所有付费用户看到的评估页完全一致
3. **虚构 API 权益** — Pro 列含 `Enterprise API Access`，项目无 API
4. **套餐名误导** — Starter/Popular/Pro 听起来像订阅分层，实际只是 1/6/30 次评估包
5. **对比表列名错位** — 表标题"Why TokValue? How we stack up against manual valuation and other tools"，但列名却是 Starter/Popular/Pro（自家套餐互比）

实际商业模式：**一次性付费，3 档套餐仅评估次数不同（1/6/30 次），所有付费用户享有完全相同的评估功能**。

---

## 设计

### 区域结构（自上而下）

1. Section Header（标题 + 副标题）
2. Trust Bar（替代旧退款横幅）— 3 个信任标识横排
3. Pricing Cards（3 张套餐卡，并列）
4. All Plans Include（统一权益清单，单次展示）
5. TokValue vs Alternatives 对比表
6. Footer（保留现有）

### Trust Bar

删除绿色 "30-Day Money-Back Guarantee" 横幅。替换为 3 个中性信任标识，横排居中：

| 图标 | 标题 | 副文案 |
|------|------|--------|
| `Zap` | Instant Delivery | Unlock the full report seconds after purchase |
| `Mail` | Email-Linked | Access your evaluations from any device |
| `CreditCard` | No Subscription | One-time payment, credits never expire |

**视觉**：每个标识用 `border-neutral-800 bg-[#0a0a0a]` 卡片，图标抖音青 `#00F2EA`，无绿色无 shield 图标（避免暗示保障）。

### Pricing Cards

3 张卡片视觉一致，差异仅在 **场景描述 + 评估次数 + 价格 + 单价**：

| 套餐 | Single | Growth | Studio |
|------|--------|--------|--------|
| pack id | pack1 | pack6 | pack30 |
| 场景描述 | Test the waters with a single account valuation | For creators building their brand deal pipeline | For power users managing multiple accounts |
| 评估次数 | 1 evaluation | 6 evaluations | 30 evaluations |
| 价格 | $9 | $29 | $99 |
| 单价 | $9.00/eval | $4.83/eval | $3.30/eval |
| 徽章 | — | Best Value（抖音粉） | — |
| 高亮边框 | 否 | 是（抖音粉 `#FF0050`） | 否 |

**CTA 按钮**：高亮卡用抖音粉实心，其余用描边。所有按钮触发同一个 `setShowVerifyModal(true)`。

**每张卡片移除 includes 列表**（由下方统一权益清单替代）。

### All Plans Include

位置：3 张卡片**下方**。

区块标题："Every plan includes everything"

权益清单（所有套餐一致，11 项，2 列网格）：

- 10-Dimension AI Scoring
- Brand Deal Pricing Engine
- 8-Channel Revenue Breakdown
- Professional PDF Report
- Peer Group Benchmarking
- Unlimited History Access
- Growth Projection (12 Months)
- Commerce Readiness Score
- Risk & Authenticity Audit
- IP & Brand Asset Valuation
- Content Strategy Generator

**移除虚构的 `Enterprise API Access`**（项目无 API）。

### TokValue vs Alternatives 对比表

表标题保留 "Why TokValue?"，副标题 "How we stack up against manual valuation and other tools"。

**列名从 Starter/Popular/Pro 改为 TokValue / Manual Valuation / Other Tools**。

| Feature | TokValue | Manual Valuation | Other Tools |
|---------|----------|------------------|-------------|
| 10-Dimension AI Scoring | ✓ | — | ✓ |
| Brand Deal Pricing Engine | ✓ | — | ✓ |
| 8-Channel Revenue Breakdown | ✓ | — | — |
| Professional PDF Report | ✓ | — | — |
| Peer Group Benchmarking | ✓ | — | — |
| Unlimited History Access | ✓ | — | — |
| Growth Projection (12 Months) | ✓ | — | — |
| Commerce Readiness Score | ✓ | — | — |
| Risk & Authenticity Audit | ✓ | — | — |
| IP & Brand Asset Valuation | ✓ | — | — |
| Content Strategy Generator | ✓ | — | — |
| Instant Delivery (seconds) | ✓ | — | ✓ |
| Objective Data-Driven | ✓ | — | ✓ |

- **TokValue 列**：全部 ✓，抖音粉高亮背景 `bg-[#FF0050]/[0.04]`
- **Manual Valuation 列**：全部 —（人工估价慢、主观、无标准化评分）
- **Other Tools 列**：部分 ✓（多数工具有评分，但少有商业估值和多维分析）

### Footer

保留现有 `['No auto-renewal', 'Email-linked', 'Cross-device access']`，文案已准确无虚。

---

## 文件改动范围

| 文件 | 改动 |
|------|------|
| [lib/i18n/dictionaries/en.ts](file:///Users/ricky/AICode/TokValue/lib/i18n/dictionaries/en.ts) | 删除 `guarantee/guaranteeDesc`，新增 `trustBar` 块；套餐名改 Single/Growth/Studio，描述改为场景定位；移除 `plans[].includes`（统一清单替代）；新增 `allPlansInclude` 块；对比表列名改 TokValue/Manual/Other，行数据重写；移除 `api` 行 |
| [app/page.tsx](file:///Users/ricky/AICode/TokValue/app/page.tsx) | 渲染 Trust Bar 替代绿色横幅；卡片移除 includes 区；新增 "Every plan includes everything" 区块；对比表头列改写、行数据改为三列对比 |
| [lib/credits.ts](file:///Users/ricky/AICode/TokValue/lib/credits.ts) | `label` 字段改 Single/Growth/Studio（保持 pack1/pack6/pack30 id 不变，不影响订单逻辑） |

---

## 不在范围内

- 价格金额调整（$9/$29/$99 保持不变）
- 评估次数调整（1/6/30 保持不变）
- 付费墙 UI（`components/PaidWall.tsx`）— 本次不涉及
- 支付流程（Creem 集成）— 本次不涉及

---

## 验证标准

1. `npm run build` 通过
2. `npx vitest run` 通过
3. 定价区无任何"退款"字样
4. 定价区无"Enterprise API"字样
5. 3 张套餐卡下方均无 includes 列表
6. "Every plan includes everything" 区块出现在 3 张卡片下方、对比表上方
7. 对比表列名为 TokValue / Manual Valuation / Other Tools（不再出现 Starter/Popular/Pro）
8. 套餐卡标题为 Single / Growth / Studio（不再出现 Starter/Popular/Pro）
9. Trust Bar 出现在标题副标题下方、3 张卡片上方
10. Trust Bar 含 3 个标识：Instant Delivery / Email-Linked / No Subscription
