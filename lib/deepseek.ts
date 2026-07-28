import { TrendAnalysis, CommercializationAdvice, ContentStrategy } from '@/types'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const AI_ENABLED = !!DEEPSEEK_API_KEY && DEEPSEEK_API_KEY !== 'your_deepseek_api_key_here'

interface AccountSnapshot {
  username: string
  nickname: string
  followerCount: number
  videoCount: number
  totalLikes: number
  engagementRate: number
  avgPlays: number
  playGrowth: number
  region: string
  categories: string[]
  tier: string
  score: number
  videoDescriptions: string[]
}

async function callDeepSeek(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!AI_ENABLED) return null

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      console.error('[deepseek] API error', res.status, await res.text().catch(() => ''))
      return null
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || null
  } catch (err) {
    console.error('[deepseek] call failed:', err)
    return null
  }
}

function extractJson(content: string): unknown {
  content = content.trim()
  // Strip markdown code block if present
  if (content.startsWith('```')) {
    const lines = content.split('\n')
    const withoutFirst = lines.slice(1)
    const withoutLast = withoutFirst[withoutFirst.length - 1]?.trim() === '```'
      ? withoutFirst.slice(0, -1)
      : withoutFirst
    content = withoutLast.join('\n').trim()
  }

  try {
    return JSON.parse(content)
  } catch {
    // Try to fix common LLM JSON errors: unquoted string values after colon
    const fixed = content
      .replace(/:(\s*)(#[a-zA-Z0-9_]+)/g, ': "$2"')
      .replace(/:(\s*)([a-zA-Z][a-zA-Z0-9_\s]*)([,}\]])/g, ': "$2"$3')
    return JSON.parse(fixed)
  }
}

// ========== AI-Powered Trend Analysis ==========

export async function generateTrendAnalysis(snapshot: AccountSnapshot): Promise<TrendAnalysis | null> {
  const systemPrompt = `你是一个 TikTok 趋势分析专家。根据账号数据，分析当前最适合该账号的热门话题、趋势音乐、内容预测和最佳发布时间。
返回 JSON 格式，不要包含 markdown 代码块标记。`

  const userPrompt = `分析以下 TikTok 账号并给出趋势建议：

账号信息：
- 用户名：@${snapshot.username}
- 昵称：${snapshot.nickname}
- 粉丝数：${snapshot.followerCount.toLocaleString()}
- 视频数：${snapshot.videoCount}
- 互动率：${snapshot.engagementRate}%
- 平均播放：${snapshot.avgPlays.toLocaleString()}
- 播放增长：${snapshot.playGrowth}%
- 地区：${snapshot.region}
- 内容分类：${snapshot.categories.join('、')}
- 评级：${snapshot.tier} 级（${snapshot.score}分）

最近视频描述片段：
${snapshot.videoDescriptions.slice(0, 5).map((d, i) => `${i + 1}. ${d}`).join('\n')}

请返回以下 JSON 结构：
{
  "trendingTopics": [
    { "topic": "话题名称", "hashtag": "Hashtag格式", "growth": 数字(增长百分比), "relevance": 数字(0-100匹配度) }
  ] (返回5个),
  "trendingSounds": [
    { "name": "音乐名称", "artist": "艺术家", "usageCount": "使用量描述", "growth": 数字(增长百分比) }
  ] (返回3个),
  "contentPredictions": [
    { "direction": "内容方向描述", "confidence": 数字(0-100置信度), "expectedEngagement": "预计互动率范围", "why": "为什么这个方向有效" }
  ] (返回3个),
  "bestPostTimes": [
    { "day": "周X", "hour": 数字(0-23), "score": 数字(0-100) }
  ] (返回7个，每天一个),
  "summary": "基于账号数据的趋势分析总结（2-3句话）"
}`

  const result = await callDeepSeek(systemPrompt, userPrompt)
  if (!result) return null

  try {
    return extractJson(result) as TrendAnalysis
  } catch {
    console.error('[deepseek] failed to parse trend analysis JSON, raw:', result.slice(0, 200))
    return null
  }
}

// ========== AI-Powered Commercialization Advice ==========

export async function generateCommercializationAdvice(snapshot: AccountSnapshot): Promise<CommercializationAdvice | null> {
  const systemPrompt = `你是一个 TikTok 商业化顾问。基于账号数据，为创作者推荐最适合的变现方向和具体行动步骤。
返回 JSON 格式，不要包含 markdown 代码块标记。`

  const userPrompt = `分析以下 TikTok 账号，推荐商业化方向：

账号信息：
- 用户名：@${snapshot.username}
- 昵称：${snapshot.nickname}
- 粉丝数：${snapshot.followerCount.toLocaleString()}
- 视频数：${snapshot.videoCount}
- 互动率：${snapshot.engagementRate}%
- 平均播放：${snapshot.avgPlays.toLocaleString()}
- 播放增长：${snapshot.playGrowth > 0 ? '+' : ''}${snapshot.playGrowth}%
- 地区：${snapshot.region}
- 内容分类：${snapshot.categories.join('、')}
- 评级：${snapshot.tier} 级（${snapshot.score}分）

最近视频描述片段：
${snapshot.videoDescriptions.slice(0, 5).map((d, i) => `${i + 1}. ${d}`).join('\n')}

请从以下8个方向中推荐最适合的5个：品牌推广合作、短视频带货、直播带货、直播打赏、创作者基金、知识付费/课程、社群运营、电商独立站

对每个方向，给出：
- 匹配度(0-100)
- 难度(low/medium/high)
- 预估月收入范围(low/mid/high，美元)
- 收益潜力(low/medium/high)
- 一句话描述
- 3-4个具体行动步骤
- 为什么推荐这个方向
- 2-3个前置条件

返回 JSON 结构：
{
  "directions": [
    {
      "name": "方向名称",
      "icon": "Building2/ShoppingBag/Radio/Gift/Coins/BookOpen/Users/Store",
      "fitScore": 数字,
      "difficulty": "low/medium/high",
      "estimatedMonthlyRevenue": { "low": 数字, "mid": 数字, "high": 数字 },
      "revenuePotential": "low/medium/high",
      "description": "描述",
      "actionSteps": ["步骤1", "步骤2", "步骤3", "步骤4"],
      "why": "推荐理由",
      "prerequisites": ["条件1", "条件2"]
    }
  ] (5个，按 fitScore 降序),
  "primaryRecommendation": "首选推荐的一句话总结",
  "secondaryRecommendation": "次选推荐的一句话总结",
  "estimatedTotalMonthly": { "low": 数字, "mid": 数字, "high": 数字 },
  "summary": "综合商业化建议总结（2-3句话）"
}`

  const result = await callDeepSeek(systemPrompt, userPrompt)
  if (!result) return null

  try {
    return extractJson(result) as CommercializationAdvice
  } catch {
    console.error('[deepseek] failed to parse commercialization JSON, raw:', result.slice(0, 200))
    return null
  }
}

// ========== AI-Powered Content Strategy ==========

export async function generateContentStrategy(snapshot: AccountSnapshot): Promise<ContentStrategy | null> {
  const systemPrompt = `你是一个 TikTok 内容策略专家。基于账号数据，提供定制化的内容策略建议。
返回 JSON 格式，不要包含 markdown 代码块标记。`

  const userPrompt = `分析以下 TikTok 账号，给出内容策略建议：

账号信息：
- 用户名：@${snapshot.username}
- 昵称：${snapshot.nickname}
- 粉丝数：${snapshot.followerCount.toLocaleString()}
- 视频数：${snapshot.videoCount}
- 互动率：${snapshot.engagementRate}%
- 平均播放：${snapshot.avgPlays.toLocaleString()}
- 播放增长：${snapshot.playGrowth > 0 ? '+' : ''}${snapshot.playGrowth}%
- 地区：${snapshot.region}
- 内容分类：${snapshot.categories.join('、')}
- 评级：${snapshot.tier} 级（${snapshot.score}分）

最近视频描述片段：
${snapshot.videoDescriptions.slice(0, 5).map((d, i) => `${i + 1}. ${d}`).join('\n')}

返回 JSON 结构：
{
  "pillars": [
    {
      "type": "内容类型",
      "icon": "BookOpen/Camera/TrendingUp",
      "frequency": "每周X条",
      "expectedEngagement": "预计互动率范围",
      "examples": ["示例标题1", "示例标题2", "示例标题3"],
      "why": "为什么推荐这个类型"
    }
  ] (3个),
  "recommendedHashtags": [
    { "tag": "#hashtag", "volume": "high/medium/low", "relevance": 数字(0-100) }
  ] (5个),
  "optimalSchedule": [
    { "day": "周X", "time": "HH:00", "format": "内容类型" }
  ] (5个),
  "collaborationIdeas": [
    { "type": "合作类型", "description": "合作描述", "potential": "high/medium/low" }
  ] (2-3个),
  "summary": "内容策略总结（2-3句话）"
}`

  const result = await callDeepSeek(systemPrompt, userPrompt)
  if (!result) return null

  try {
    return extractJson(result) as ContentStrategy
  } catch {
    console.error('[deepseek] failed to parse content strategy JSON, raw:', result.slice(0, 200))
    return null
  }
}