---
design_type: feature
created_at: 2026-08-03
---

# 估值与评分模型合理性修复

## Intent Contract

```
intent: 让 tier 由 10 维综合 score 驱动而非估值金额，估值各组件与播放量挂钩，消除"高粉丝低播放"账号的异常高估值和高 tier
constraints: 保留现有 10 维评分框架和 5 组件估值结构；不破坏 API 接口和前端展示
success_criteria: 1M 粉丝但播放 1-3 万的账号 tier 降到 B/C 级，单条报价 ≤ $8K，总估值 ≤ $500K；真正头部账号（MrBeast 级）仍能评 S 级
risk_level: high
```

## Verification Contract

```
verify_steps:
  - run tests: npx vitest run
  - check: tsc --noEmit 零错误
  - check: 新增测试用例验证 — 1M 粉丝 + 3 万播放账号 tier ≤ B，businessValue ≤ $500K
  - check: 新增测试用例验证 — 10M 粉丝 + 500 万播放账号 tier = S，businessValue ≥ $1M（不误伤头部）
  - check: 现有 50 个测试用例全部通过（无回归）
  - confirm: @dudamartins_52 类账号不再评 S 级
```

## Governance Contract

```
approval_gates:
  - 设计文档审阅（当前阶段）
  - 实现完成后 tsc + vitest 验证
  - 真实账号评估结果对比验证
rollback: git revert 单次 commit；config.ts 和 dimensions.ts 的修改互相独立可单独回滚
ownership: 工程实现由 AI agent 执行，用户验收最终评估结果
```

## Scope

| 范围 | 内容 |
|------|------|
| **In** | tier 决定机制从 businessValue 改为 score；移除 dimensions.ts 中 mega/macro 硬地板；reach 维度改为纯播放粉比；stability 增加播放绝对值惩罚；市场锚点下限降低 + 播放折损；IP 倍数降低；Follower Asset 增加播放因子 |
| **Out** | 10 维权重大调整（保留现有 THREE_LAYER_WEIGHTS）；新增维度；前端 UI 改动；API 接口变更；品类系数调整（上次已完成） |

## Decisions

| # | 决策 | 选择 | 拒绝的替代方案 |
|---|------|------|----------------|
| 1 | Tier 决定机制 | Score 驱动（恢复 TIER_THRESHOLDS） | ① Score+估值双轨取低（复杂度高）② 播放门槛拦截（治标不治本） |
| 2 | 评分硬地板 | 完全移除 mega/macro 硬地板，纯数据驱动 | ① 降低地板（仍有人为干预）② 全局折损因子（过于粗暴） |
| 3 | reach 维度 | 100% 播放粉比（移除 45% 粉丝对数地板） | 保留部分粉丝权重（仍会托底） |
| 4 | 市场锚点 | 下限从 0.3×anchor 降到 0.1×anchor + 播放折损系数 | ① 移除锚点（头部账号报价偏低）② 动态锚点（计算复杂） |
| 5 | IP 倍数 | mega 5x→3x，macro 2x→1.5x | 完全移除 IP 资产（丢失维度） |
| 6 | Follower Asset | 增加播放因子（playFanRatio / tier 基准，clamp 0.3-1.5） | 仅靠 commercialProximity 调整（不够） |

## Surface

### lib/scoring/verdict.ts
- `tierFromBusinessValue` 标记弃用，不再被 scoreProfile 调用
- `tierFromScore` 恢复为正式函数，增加高风险降级逻辑

### lib/scoring.ts
- `scoreProfile` 中 tier 计算从 `tierFromBusinessValue` 改为 `tierFromScore(score, risks)`

### lib/scoring/dimensions.ts
- `scoreReach`：移除 followerScore 45% 权重，改为 100% reachScore
- `scoreContent`：移除 mega/macro 的 verticality 和 breakoutScore 硬地板
- `scoreStability`：增加 playFanRatio 惩罚（< 0.05 时扣 15-25 分）

### lib/scoring/valuation.ts
- `calcBrandDealValue`：锚点下限从 0.3 降到 0.1；新增播放折损系数
- `calcFollowerAssetValue`：增加 playFanFactor 因子
- `calcIpBrandValue`：TIER_IP_MULTIPLE mega 5→3, macro 2→1.5

### lib/scoring/config.ts
- `MARKET_ANCHOR_CLAMP.low`：0.3 → 0.1
- `TIER_IP_MULTIPLE`：mega 5→3, macro 2→1.5
- 新增 `PLAY_FAN_PENALTY_THRESHOLD` 和 `PLAY_FAN_FACTOR_CLAMP` 配置

### lib/scoring.test.ts
- 新增测试：1M 粉丝 + 3 万播放账号 tier ≤ B
- 新增测试：10M 粉丝 + 500 万播放账号 tier = S

## Risks & Open Questions

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 移除硬地板后头部账号 score 可能下降 | MrBeast 级账号 tier 可能从 S 降到 A | 新增测试用例验证头部账号不误伤；scoreFromRatio 的 ratio>1 时仍会给高分 |
| 播放折损可能让某些垂直品类报价偏低 | 食品/宠物类正常播放粉比偏低 | 折损阈值 0.1 已足够保守；品类差异由 CPM 体现 |
| IP 倍数降低影响所有 mega 账号 | 真正有品牌的账号 IP 资产减少 | brandingBonus 仍可加成 1.5x；IP 倍数降低是合理的——IP 价值不应 5 倍于年收入 |
| Follower Asset 播放因子可能过于激进 | playFanFactor clamp 0.3 防止归零 | 下限 0.3 保证粉丝资产不为零，只是反映真实触达能力 |
