# TokValue 代码审计报告

> **审计日期**: 2026-08-03  
> **项目**: Tikworth v0.14.1  
> **路径**: /Users/ricky/AICode/TokValue  
> **技术栈**: Next.js 15.5.22 + React 18 + TypeScript 5 + Tailwind CSS 3.4 + Neon (PostgreSQL) + Vitest 3.2  
> **核心功能**: TikTok 达人估值与商业分析平台

---

## 一、总评

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构设计 | ⭐⭐⭐⭐ | 模块化清晰，三层存储降级设计优秀 |
| 代码质量 | ⭐⭐⭐½ | TypeScript strict 模式，大量防御性编程 |
| 安全性 | ⭐⭐⭐ | 中间件鉴权薄弱，其他方面尚可 |
| 评分引擎 | ⭐⭐⭐⭐ | 10 维 × 分层权重体系成熟，幂律估值模型合理 |
| 测试覆盖 | ⭐⭐½ | 评分引擎测试较好，API/集成测试缺失 |
| 可维护性 | ⭐⭐⭐ | 配置集中但魔法数字多，缺少架构文档 |

---

## 二、严重问题 (Critical)

### 2.1 Middleware 鉴权形同虚设

**文件**: `middleware.ts:20-23`

```typescript
// 仅检查 Bearer token 是否存在，不验证有效性
const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
if (!token) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
// 直接放行，token 真伪由各路由自行判断
return NextResponse.next()
```

**风险**: 任何随机字符串都可以通过中间件。虽然各 API 路由内部会验证 token，但中间件的存在给人一种"已有保护"的错觉。攻击者可以轻松绕过中间件直接探测 API 端点结构。

**建议**: 
- 要么在中间件层真正验证 JWT（共享 JWT_SECRET），要么删除中间件的伪鉴权逻辑
- 如果保持现状，注释中应明确标注"不做实质性校验"

### 2.2 硬编码开发环境 JWT Secret

**文件**: `lib/auth.ts:61-63`

```typescript
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-jwt-secret-min-32-bytes-long!' : '')
)
```

**风险**: 开发环境的固定 secret 可能导致开发者在生产环境忘记设置 `JWT_SECRET`，此时 auth.ts 会自动返回长度为 0 的 key（因为 `NODE_ENV !== 'development'`），导致所有 token 验证返回 null。

**建议**: 生产环境未设置 JWT_SECRET 时应直接抛出启动错误，而非静默降级。开发环境也应由环境变量或随机生成。

---

## 三、高风险问题 (High)

### 3.1 数据库表重复初始化

**位置**: `lib/analytics.ts` 和 `lib/auth.ts` 均独立创建 `credit_balances` 表

`analytics.ts:56-63`:
```sql
CREATE TABLE IF NOT EXISTS credit_balances (...)
```

`auth.ts` 虽然不创建 credit_balances，但 `credits-server.ts:17-26` 也独立创建：
```sql
CREATE TABLE IF NOT EXISTS credit_balances (...)
```

**风险**: 两个模块各自维护同一张表的 `CREATE TABLE` 语句，未来某一处修改 schema 而另一处未同步，将导致新部署环境和已运行环境的 schema 不一致。

**建议**: 统一收口到 `lib/db.ts` 或独立迁移脚本，执行一次性的 `initSchema()` 而非在各模块分散建表。

### 3.2 评估接口在无视频数据时静默允许

**文件**: `lib/tiktok.ts:104-107`

```typescript
async function fetchPosts(username: string): Promise<Post[]> {
  try {
    // ...
  } catch (err) {
    console.warn('[tiktok] user/videos failed, continuing without posts:', ...)
    return []  // 静默返回空数组
  }
}
```

**风险**: 视频获取失败时返回空数组，`scoreProfile` 仍然正常运行，但所有基于视频数据的指标（互动率、播放增长、成熟度分类等）将为 0/fallback，产生一个"看起来正常但数据毫无意义"的评估报告。用户不知道自己拿到的是垃圾数据。

**建议**: 
- 在 `Evaluation` 上标记 `dataQuality: 'partial'`（profile 中已定义该字段但未实际使用）
- 或在 posts 为空时在前端明确提示"视频数据获取失败，评估可能不准确"
- 评估结果页应展示数据完整性等级

### 3.3 无 API 限流

评估接口 (`POST /api/evaluate`) 仅靠积分系统限制（1 次 = 1 积分），没有基于 IP 或 session 的频率限制。

**风险**: 如果积分系统被绕过（如 session replay），或前端 bug 导致重复请求，RapidAPI 配额会被快速消耗。

**建议**: 增加基于 IP hash 的短窗口限流（如每分钟 5 次），与积分系统形成双重保护。

---

## 四、中风险问题 (Medium)

### 4.1 模块顶层副作用

**文件**: `lib/credits.ts`

```typescript
import { getServerDict } from '@/lib/i18n/server'
// 模块顶层直接调用
const dict = getServerDict()
```

**风险**: 
- 服务端渲染时可能触发 i18n 初始化
- 如果 `lib/credits.ts` 被客户端组件间接引用，`getServerDict()` 会报错
- 模块加载顺序依赖不确定

**建议**: 将 `CREDIT_PACKAGES` 的定义改为惰性计算或函数返回。

### 4.2 评分引擎重复逻辑

**位置**: `detectRisks()` (scoring.ts) 和各 dimension score 函数

- `detectRisks()` 检测互动率、粉关比、断更等风险
- `scoreHealth()` 又独立判断互动率、CV
- `scoreAuthenticity()` 又独立判断粉关比、互动率
- `scoreStability()` 又独立判断 CV、断更

**风险**: 
- 修改风险阈值时需要同步 4+ 处代码
- 可能出现 `detectRisks` 标记为高风险但 `scoreHealth` 仍然打高分的矛盾
- 增加维护成本和理解难度

**建议**: `detectRisks()` 应该是唯一的风险源。各 dimension score 函数直接消费 `riskFlags` 数组，而非重复检测。

### 4.3 文件锁在高并发下的瓶颈

**文件**: `lib/db.ts` (file 模式) + `lib/file-lock.ts`

`withFileLock` 机制是进程级锁（依赖 Node.js 单线程 + 同步文件操作），在 Vercel Serverless 多实例部署时无效。

**风险**: 
- 多 Lambda 实例同时写 `evaluations.json` 可能丢失数据
- Vercel 的 `/tmp` 目录跨请求不共享

**建议**: 
- Vercel 部署时强制使用 Postgres（已有 Postgres 优先逻辑）
- 在 file 模式增加日志警告，提醒不适合生产环境

### 4.4 大量魔法数字缺少来源注释

**文件**: `lib/scoring/config.ts` (700+ 行)

虽然配置集中在 config.ts，但大量系数的来源注释仅写"数据来源：Influencer Marketing Hub 2024"，缺少：
- 具体是哪份报告/页面的数据
- 数据采集时间
- 是否需要定期更新

例如 `MARKET_ANCHORS.mega.Finance = 500000` 缺少来源依据。

### 4.5 未实现的占位功能

多处返回空值/0 的占位功能，可能会让用户误以为是真实数据：

| 位置 | 字段 | 状态 |
|------|------|------|
| metrics.ts | `playGrowth90d` | 恒为 0 |
| buildEngagementQuality | `completionRate` | 恒为 null |
| buildEngagementQuality | `topEngagers` | 恒为空数组 |
| buildTrendAnalysis | `trendingTopics` | 恒为空数组 |
| buildTrendAnalysis | `trendingSounds` | 恒为空数组 |
| buildPeerBenchmark | `similarCreators` | 恒为空数组 |

**建议**: 前端对这些字段做条件渲染，null/空时不展示对应模块。

---

## 五、低风险问题 (Low)

### 5.1 默认 Metrics 定义重复

`lib/db.ts` 中 `normalizeEvaluation()` 和 `rowToEvaluation()` 各自维护一份完全相同的 `defaultMetrics` 对象（22 个字段）。修改 Metrics 结构时需同步两次。

**建议**: 提取为共享常量 `DEFAULT_METRICS`。

### 5.2 evaluate route 的 CODE_TO_HTTP 包含未使用错误码

`BALANCE_ERROR`、`CONSUME_ERROR` 在 `CODE_TO_HTTP` 中定义但永远不会被抛出，因为平衡检查由 `consumeCredit()` 处理并通过其返回值映射状态码，不经过 `CODE_TO_HTTP` 路由。

### 5.3 没有 CSP Header

`next.config.mjs` 设置了 `X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`，但缺少 Content-Security-Policy。

### 5.4 Category 标签映射表维护成本高

多处维护 Category 的别名映射：
- `valuation.ts`: `CATEGORY_LABELS`、`REGION_LABELS`
- `config.ts`: `CATEGORY_BRAND_CPM` 含多种别名
- `content-strategy.ts`: `CATEGORY_PILLAR_HINTS`、`CATEGORY_HASHTAGS`、`CATEGORY_VIDEO_DURATION`

新增品类需要修改 4 个文件。

### 5.5 无 ESLint 严格规则

`.eslintrc.json` 仅启用了 `no-unused-vars`（且 args 模式忽略 `^_`）。没有启用更严格的规则集，未使用 `@typescript-eslint` 的类型感知规则。

---

## 六、积极亮点

### 6.1 评分引擎设计

- **三层权重体系** (core 60% + quality 30% + risk 10%) 逻辑清晰
- **分层差异化权重**：nano/micro/mid/macro/mega 各有专属权重表，合理反映不同粉丝量级的价值逻辑
- **幂律粉丝估值**：`baseRate × realFollowers^0.85` 避免了线性估值的"10000 倍粉丝=10000 倍价值"的荒谬结论
- **市场锚点夹紧**：mega/macro 的品牌合作报价通过 `MARKET_ANCHORS` 约束在 [0.3x, 3.0x] 区间，防止计算模型跑出常识范围
- **风险惩罚机制**：高风险信号自动降级 tier，且在估值中通过 `RISK_DISCOUNT` 折价 30%

### 6.2 防御性编程

- `normalizeEvaluation()`：为 20+ 个子对象提供完整的默认值回退
- `rowToEvaluation()`：处理 PostgreSQL JSONB 字段的字符串/对象双态
- `parseJson()`：安全解析 JSON，失败返回 undefined
- `consumeCredit()`：用 `WHERE credits > 0` 做原子扣减，避免并发超卖
- `grantCredits()`：paymentId 幂等检查，防重复发放

### 6.3 数据持久化

- PostgreSQL → JSON 文件 → Memory 的三层降级清晰
- `atomicWriteFile` (tmp + rename) 保证文件写入原子性
- `withFileLock` 进程级锁防止单实例竞态

### 6.4 时区处理

`lib/analytics.ts` 中所有统计查询均基于 `Asia/Shanghai` 时区，避免 Vercel UTC 默认导致"今日"数据错位 8 小时。这是一个容易被忽略但实际影响很大的细节。

### 6.5 多语言检测

`lib/tiktok.ts` 中 `inferRegionFromContent()` 实现了 20+ 语言的文本检测，覆盖德语、法语、西语、葡语、日语、韩语、阿拉伯语、俄语、泰语、越南语等，准确度和覆盖面远超同类工具。

---

## 七、测试情况

### 现有测试

| 文件 | 覆盖范围 |
|------|----------|
| `lib/scoring.test.ts` | scoreProfile() 端到端：健康账号、风险检测、商业评分、零帖子、分层估值（mega/nano）、幂律验证、风险折扣 |
| `lib/scoring/dimensions.test.ts` | 10 个维度函数：边界值、层级差异化、趋势方向 |

### 缺失测试

- ❌ API 路由（evaluate/auth/credits/stats）
- ❌ 中间件鉴权
- ❌ 数据库 CRUD
- ❌ auth.ts 验证码生命周期
- ❌ credits-server.ts 积分操作
- ❌ tiktok.ts API 调用
- ❌ 集成测试（完整请求-评分-存储流程）

---

## 八、建议优先级

| 优先级 | 问题 | 工作量 |
|--------|------|--------|
| P0 | 中间件鉴权要么真验证要么删除伪逻辑 | 10min |
| P0 | 视频获取失败时标记 dataQuality | 30min |
| P1 | API 限流（IP 级别短窗口） | 1h |
| P1 | 数据库表初始化收口 | 2h |
| P1 | JWT_SECRET 缺失时的生产环境保护 | 10min |
| P2 | 评分引擎去重（detectRisks 为单一风险源） | 4h |
| P2 | 占位字段前端条件渲染 | 1h |
| P2 | 添加 CSP Header | 30min |
| P3 | 提取共享常量 | 30min |
| P3 | 补充 API/集成测试 | 8h |
| P3 | 添加 README 和环境变量文档 | 1h |

---

## 九、总结

TokValue 的核心评分引擎质量较高，估值模型经过仔细设计，10 维分层权重 + 幂律粉丝估值 + 市场锚点夹紧的组合拳在同类产品中属于第一梯队。防御性编程的意识也很好。

主要短板在**运维安全层**：中间件假鉴权、缺少限流、JWT 缺失时不报错。这些问题不会影响功能正确性，但会在生产环境产生安全隐患。

代码组织方面，评分引擎内部存在一定重复逻辑（风险检测），配置文件过于巨大（700+ 行单一 config.ts），但这些属于"技术债"而非"bug"。

**综合评级：B+**（生产可用，需修复 P0/P1 项后可达 A 级）
