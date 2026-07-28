/** S/A/B/C/D/E/F 等级分数阈值（满分 100）。S=顶级头部，F=无效账号 */
export const TIER_THRESHOLDS = { S: 85, A: 70, B: 55, C: 40, D: 25, E: 10 } as const

/** 10 维权重，和为 1.0。调整权重即调整评分侧重点 */
export const DIMENSION_WEIGHTS = {
  reach: 0.12,        // 流量触达力（基础盘）
  engagement: 0.15,   // 互动健康度（核心指标）
  content: 0.13,      // 内容爆款力（成长性）
  authenticity: 0.12, // 粉丝真实性（可信度）
  momentum: 0.10,     // 增长势能（趋势）
  stability: 0.10,    // 流量稳定性（风险）
  commerce: 0.10,     // 商业适配度（带货能力）
  monetization: 0.08, // 变现潜力（基础设施）
  health: 0.05,       // 账号健康度（违规风险）
  influence: 0.05,    // 行业位势（同侪对比）
} as const

/**
 * 品牌合作 CPM（千次播放成本），单位 USD/千次播放
 * 数据来源：Influencer Marketing Hub 2024、Collabstr 平台行情
 * 美国市场中值，其他地区通过 REGION_VALUE_MULTIPLIER 调整
 */
export const CATEGORY_BRAND_CPM: Record<string, number> = {
  '金融理财': 30, 'finance': 30,
  '科技数码': 22, 'tech': 22,
  '知识教育': 22, 'education': 22,
  '汽车': 25, 'auto': 25, 'cars': 25,
  '美妆护肤': 20, 'beauty': 20, 'makeup': 20,
  '时尚穿搭': 18, 'fashion': 18,
  '健身运动': 18, 'fitness': 18, '健身': 18, '格斗运动': 18,
  '美女/颜值': 18, '颜值': 18,
  '运动': 16, 'sports': 16,
  '美食': 15, 'food': 15, 'cooking': 15,
  '旅游': 16, 'travel': 16,
  '母婴亲子': 15, 'mom': 15, 'parenting': 15,
  '生活方式': 14, 'lifestyle': 14,
  '宠物': 14, 'pets': 14,
  '游戏': 12, 'gaming': 12, 'games': 12,
  '才艺': 12, 'talent': 12, 'music': 12, 'dance': 12,
  '剧情': 10, 'drama': 10, 'storytelling': 10,
  '搞笑': 9, 'comedy': 9, 'funny': 9,
  '娱乐': 10, 'entertainment': 10,
  'default': 15,
}

/**
 * 创作者基金 RPM（千次播放收益），单位 USD/千次播放
 * 数据来源：TikTok 官方 Creator Fund / Creativity Program Beta 2024
 * 美国创作者 $0.03-0.05，西欧 $0.02-0.03，东南亚 $0.005-0.01
 */
export const CATEGORY_CREATOR_RPM: Record<string, number> = {
  'US': 0.04, 'UK': 0.03, 'CA': 0.035, 'AU': 0.035,
  'DE': 0.025, 'FR': 0.025, 'IT': 0.022, 'ES': 0.022, 'NL': 0.025,
  'JP': 0.02, 'KR': 0.02,
  'BR': 0.012, 'MX': 0.01,
  'ID': 0.008, 'TH': 0.008, 'VN': 0.007, 'PH': 0.007, 'MY': 0.009,
  'IN': 0.006, 'PK': 0.005, 'BD': 0.005,
  'RU': 0.015, 'TR': 0.012, 'SA': 0.018, 'AE': 0.02,
  'default': 0.015,
}

/**
 * 地区价值系数（相对于美国市场 1.0）
 * 反映该地区广告主购买力、CPM 溢价
 */
export const REGION_VALUE_MULTIPLIER: Record<string, number> = {
  'US': 1.0, 'CA': 0.85, 'UK': 0.85, 'AU': 0.85,
  'DE': 0.75, 'FR': 0.7, 'IT': 0.65, 'ES': 0.65, 'NL': 0.75, 'SE': 0.75, 'CH': 0.9,
  'JP': 0.7, 'KR': 0.65, 'SG': 0.7, 'HK': 0.7, 'TW': 0.55,
  'AE': 0.75, 'SA': 0.6, 'IL': 0.65,
  'BR': 0.35, 'MX': 0.35, 'AR': 0.3,
  'ID': 0.25, 'TH': 0.28, 'VN': 0.22, 'PH': 0.25, 'MY': 0.32,
  'IN': 0.2, 'PK': 0.15, 'BD': 0.12,
  'RU': 0.35, 'TR': 0.3, 'PL': 0.4, 'CZ': 0.45,
  'ZA': 0.35, 'EG': 0.2, 'NG': 0.18,
  'default': 0.5,
}

/**
 * 视频成熟度时间窗口（小时）
 * 来源：TikTok 推荐算法公开分析：冷启动 0-24h，放量期 24-72h，成熟期 3-30d
 */
export const MATURITY_WINDOWS = {
  immatureHours: 24,    // <24h 冷启动期（不计入均播）
  growingHours: 72,     // 24-72h 放量期（降权计入）
  matureDays: 30,       // 3-30d 成熟期（主指标）
  archiveDays: 365,     // >30d 长尾期（历史爆款参考）
} as const

/**
 * 互动率分段阈值（%）与对应乘数
 * 用于 engagementMultiplier，影响品牌报价
 */
export const ENGAGEMENT_TIERS = [
  { min: 9, multiplier: 1.6, label: '顶级互动' },
  { min: 6, multiplier: 1.4, label: '高互动' },
  { min: 3, multiplier: 1.2, label: '良好互动' },
  { min: 1, multiplier: 1.0, label: '正常互动' },
  { min: 0, multiplier: 0.7, label: '低互动' },
] as const

/**
 * 风险信号阈值
 */
export const RISK_THRESHOLDS = {
  followerFollowingCritical: 0.05,    // 粉关比<0.05=高风险（大量买粉）
  followerFollowingWarning: 0.1,      // 粉关比<0.1=中风险
  engagementRateCritical: 0.5,        // 互动率<0.5%=高风险
  engagementRateWarning: 1.0,         // 互动率<1%=中风险
  inactiveDaysCritical: 60,           // 断更>60天=高风险
  inactiveDaysWarning: 30,            // 断更>30天=中风险
  cvPlaysCritical: 2.0,               // CV>2=流量极不稳定
  cvPlaysWarning: 1.2,                // CV>1.2=波动较大
} as const

/**
 * 粉丝资产价值（每千粉 USD）
 * 基于 HypeAuditor 数据：美国活跃粉 LTV $0.10-0.50
 */
export const FOLLOWER_VALUE_PER_1K = {
  nano: 5,       // <10K，粉丝粘性高
  micro: 15,     // 10K-100K
  mid: 30,       // 100K-500K
  macro: 50,     // 500K-1M
  mega: 80,      // >1M
} as const

/** 品类粉丝价值系数（垂类粉丝更值钱） */
export const CATEGORY_FAN_VALUE_MULT: Record<string, number> = {
  '金融理财': 2.0, 'finance': 2.0,
  '科技数码': 1.5, 'tech': 1.5,
  '汽车': 1.8, 'auto': 1.8, 'cars': 1.8,
  '知识教育': 1.5, 'education': 1.5,
  '美妆护肤': 1.3, 'beauty': 1.3,
  '时尚穿搭': 1.2, 'fashion': 1.2,
  '健身运动': 1.2, 'fitness': 1.2,
  'default': 1.0,
}

/** 内容资产系数（老视频折现后每千次播放价值占品牌 CPM 的比例） */
export const CONTENT_VALUE_MULTIPLIER = {
  contentCpmRatio: 0.2,    // 老视频 CPM = 品牌 CPM × 0.2
  discountFactor: 0.3,     // 资产折现率（历史内容只按 30% 计入当前价值）
} as const

/**
 * 同侪基准函数
 * 基于 followerCount 用 log 曲线生成同档位平均互动率/播放粉比
 * 数据拟合：1K粉 er≈4.5%，100K粉 er≈2.5%，1M粉 er≈1.5%，10M粉 er≈1.0%
 */
export function getPeerBenchmarks(followerCount: number) {
  const logF = Math.log10(Math.max(followerCount, 100))
  // er = -0.6*log10(f) + 5.0
  const avgER = clamp(-0.6 * logF + 5.0, 0.8, 6.0)
  const top10ER = avgER * 1.8
  // avgPlaysRatio: 1K粉 0.8，100K粉 0.5，1M粉 0.35，10M粉 0.2
  const avgPlaysRatio = clamp(-0.1 * logF + 1.0, 0.1, 1.0)
  // postsPerMonth: 1K粉 12条，1M粉 8条
  const postsPerMonth = clamp(-1.0 * logF + 15, 4, 20)
  return { avgER, top10ER, avgPlaysRatio, postsPerMonth }
}

/**
 * 订阅转化率阶梯（月均）
 * 数据来源：TikTok LIVE Subscription 公开报告
 */
export const SUBSCRIPTION_CONVERSION_RATES = {
  nano: 0.005,    // <10K: 0.5%
  micro: 0.003,   // 10K-100K: 0.3%
  mid: 0.002,     // 100K-500K: 0.2%
  macro: 0.001,   // 500K-1M: 0.1%
  mega: 0.0005,   // >1M: 0.05%
} as const

/** 订阅加权均价（USD/月），平台抽成 50% 后创作者实得 */
export const SUBSCRIPTION_AVG_PRICE = 8
export const SUBSCRIPTION_CREATOR_CUT = 0.5

/**
 * TikTok Shop 运营系数（按品类）
 * 仅支持开启 Shop 的品类，conversionRate 为月活跃粉购买转化率
 */
export const SHOP_OPERATIONAL_METRICS: Record<string, { aov: number; commission: number; conversionRate: number }> = {
  '美妆护肤': { aov: 25, commission: 0.15, conversionRate: 0.004 },
  'beauty': { aov: 25, commission: 0.15, conversionRate: 0.004 },
  '时尚穿搭': { aov: 35, commission: 0.18, conversionRate: 0.003 },
  'fashion': { aov: 35, commission: 0.18, conversionRate: 0.003 },
  '美食': { aov: 20, commission: 0.12, conversionRate: 0.003 },
  'food': { aov: 20, commission: 0.12, conversionRate: 0.003 },
  '生活方式': { aov: 30, commission: 0.15, conversionRate: 0.002 },
  'lifestyle': { aov: 30, commission: 0.15, conversionRate: 0.002 },
  '母婴亲子': { aov: 40, commission: 0.15, conversionRate: 0.003 },
  'mom': { aov: 40, commission: 0.15, conversionRate: 0.003 },
  '健身运动': { aov: 45, commission: 0.12, conversionRate: 0.002 },
  'fitness': { aov: 45, commission: 0.12, conversionRate: 0.002 },
  '科技数码': { aov: 80, commission: 0.08, conversionRate: 0.0015 },
  'tech': { aov: 80, commission: 0.08, conversionRate: 0.0015 },
}

/** LIVE 礼物月收入系数（每粉 USD/月） */
export const LIVE_GIFT_MULTIPLIERS = {
  nano: 0.01,
  micro: 0.008,
  mid: 0.005,
  macro: 0.003,
  mega: 0.002,
  default: 0.001,
} as const

/** 收入区间系数（low=mid×factor, high=mid×factor） */
export const INCOME_LOW_HIGH_FACTORS = {
  low: 0.6,
  high: 1.5,
} as const

/** 最低单条品牌合作报价（USD）——nano 账号也有基础制作成本 */
export const MIN_BRAND_DEAL_PRICE = 100

/** 品牌合作月均接单上限（占月发布量比例 + 绝对上限） */
export const BRAND_DEAL_LIMITS = {
  maxRatioOfMonthlyPosts: 0.3,
  maxPerMonth: 4,
} as const

/** 成熟视频点赞率 clamp 范围（防异常） */
export const LIKE_PLAY_RATIO_RANGE = { min: 0.005, max: 0.20 }

/** 默认播放/粉比（无 posts 数据时的 fallback） */
export const DEFAULT_PLAY_FOLLOWER_RATIO = 0.2

/**
 * 增长路线图参数（月化）
 * baseGrowth 来自 playGrowth，engagementBonus 来自互动率高于/低于基准
 */
export const GROWTH_RATE_PARAMS = {
  playGrowthTransmission: 0.3,     // 播放增长→收入增长传导系数
  baseGrowthMin: -0.05,
  baseGrowthMax: 0.08,
  engagementBonusPerPoint: 0.01,   // 互动率每高/低1%调整1%增速
  engagementBonusMax: 0.03,
  engagementBonusMin: -0.02,
  highRiskPenalty: -0.03,
  mediumRiskPenalty: -0.01,
  scaleSuppressPerLog: -0.005,     // 粉丝每多一个数量级，月增速 -0.5%
  monthlyGrowthMin: -0.10,
  monthlyGrowthMax: 0.15,
} as const

/** 变现资格门槛 */
export const MONETIZATION_THRESHOLDS = {
  creatorFundFollowers: 10000,           // 普通 Fund 10K 粉
  creativityBetaFollowers: 10000,        // Creativity Program Beta 10K 粉
  creativityBetaMonthlyViews: 100000,    // Beta 要求 100K 月播放
  creativityBetaPerVideoViews: 10000,    // Beta 要求 10K 均播
  tiktokShopFollowers: 1000,             // Shop 1K 粉
  subscriptionFollowers: 1000,           // 订阅 1K 粉
  liveGiftFollowers: 1000,               // LIVE 礼物 1K 粉
} as const

/**
 * 品类内容支柱提示（用于动态生成 contentStrategy.pillars）
 * 每个品类 4-6 个核心内容方向
 */
export const CATEGORY_PILLAR_HINTS: Record<string, string[]> = {
  '金融理财': ['理财知识科普', '投资案例分析', '市场热点解读', '存钱/省钱技巧', '金融避坑指南'],
  'finance': ['理财知识科普', '投资案例分析', '市场热点解读', '存钱/省钱技巧', '金融避坑指南'],
  '科技数码': ['产品评测', '使用技巧', '新品开箱', '科技新闻', '数码选购指南'],
  'tech': ['产品评测', '使用技巧', '新品开箱', '科技新闻', '数码选购指南'],
  '美妆护肤': ['产品测评', '妆容教程', '护肤流程', '好物分享', '化妆技巧'],
  'beauty': ['产品测评', '妆容教程', '护肤流程', '好物分享', '化妆技巧'],
  '时尚穿搭': ['OOTD穿搭', '单品推荐', '穿搭技巧', '风格尝试', '购物分享'],
  'fashion': ['OOTD穿搭', '单品推荐', '穿搭技巧', '风格尝试', '购物分享'],
  '美食': ['菜谱教程', '探店分享', '美食制作', '食材测评', '烹饪技巧'],
  'food': ['菜谱教程', '探店分享', '美食制作', '食材测评', '烹饪技巧'],
  '健身运动': ['训练教程', '健身干货', '饮食搭配', '动作示范', '减脂/增肌'],
  'fitness': ['训练教程', '健身干货', '饮食搭配', '动作示范', '减脂/增肌'],
  '格斗运动': ['格斗训练', '比赛解析', '技术教学', '训练日常', '选手故事'],
  '游戏': ['游戏实况', '攻略教程', '游戏评测', '精彩集锦', '新游试玩'],
  'gaming': ['游戏实况', '攻略教程', '游戏评测', '精彩集锦', '新游试玩'],
  '旅游': ['旅行vlog', '攻略分享', '景点推荐', '美食探店', '旅行贴士'],
  'travel': ['旅行vlog', '攻略分享', '景点推荐', '美食探店', '旅行贴士'],
  '知识教育': ['知识科普', '学习技巧', '干货分享', '书籍解读', '思维提升'],
  'education': ['知识科普', '学习技巧', '干货分享', '书籍解读', '思维提升'],
  '搞笑': ['搞笑段子', '整蛊日常', '神评论', '爆笑瞬间', '喜剧短剧'],
  'comedy': ['搞笑段子', '整蛊日常', '神评论', '爆笑瞬间', '喜剧短剧'],
  '剧情': ['情感短剧', '故事演绎', '反转剧情', '生活共鸣', '系列连载'],
  'drama': ['情感短剧', '故事演绎', '反转剧情', '生活共鸣', '系列连载'],
  '汽车': ['车型评测', '用车知识', '改装分享', '试驾体验', '汽车文化'],
  'auto': ['车型评测', '用车知识', '改装分享', '试驾体验', '汽车文化'],
  '宠物': ['萌宠日常', '养宠知识', '宠物训练', '搞笑瞬间', '宠物好物'],
  'pets': ['萌宠日常', '养宠知识', '宠物训练', '搞笑瞬间', '宠物好物'],
  '母婴亲子': ['育儿经验', '亲子互动', '母婴好物', '辅食教程', '早教启蒙'],
  'mom': ['育儿经验', '亲子互动', '母婴好物', '辅食教程', '早教启蒙'],
  '美女/颜值': ['颜值展示', '变美技巧', '穿搭分享', '生活vlog', '妆容分享'],
  'default': ['内容创作', '日常分享', '粉丝互动', '专业分享', '成长记录'],
}

/**
 * 品类热门 Hashtags（真实标签参考 TikTok 实际热门）
 * 每个品类 8-12 个标签
 */
export const CATEGORY_HASHTAGS: Record<string, string[]> = {
  '金融理财': ['#personalfinance', '#investing', '#financialfreedom', '#moneymanagement', '#stockmarket', '#wealthbuilding', '#sidehustle', '#budgeting'],
  'finance': ['#personalfinance', '#investing', '#financialfreedom', '#moneymanagement', '#stockmarket', '#wealthbuilding', '#sidehustle', '#budgeting'],
  '科技数码': ['#techtok', '#gadgets', '#techreview', '#smartphone', '#unboxing', '#technews', '#coding', '#ai'],
  'tech': ['#techtok', '#gadgets', '#techreview', '#smartphone', '#unboxing', '#technews', '#coding', '#ai'],
  '美妆护肤': ['#beautytok', '#makeup', '#skincare', '#makeuptutorial', '#grwm', '#beautyhacks', '#makeuplook', '#skincareroutine'],
  'beauty': ['#beautytok', '#makeup', '#skincare', '#makeuptutorial', '#grwm', '#beautyhacks', '#makeuplook', '#skincareroutine'],
  '时尚穿搭': ['#fashiontiktok', '#ootd', '#fashionhaul', '#styleinspo', '#streetwear', '#outfitoftheday', '#thriftflip', '#lookbook'],
  'fashion': ['#fashiontiktok', '#ootd', '#fashionhaul', '#styleinspo', '#streetwear', '#outfitoftheday', '#thriftflip', '#lookbook'],
  '美食': ['#foodtiktok', '#cooking', '#recipe', '#foodie', '#easyrecipe', '#cookingtiktok', '#snack', '#foodtok'],
  'food': ['#foodtiktok', '#cooking', '#recipe', '#foodie', '#easyrecipe', '#cookingtiktok', '#snack', '#foodtok'],
  '健身运动': ['#fitnesstok', '#workout', '#gymtok', '#fitnessmotivation', '#homeworkout', '#gym', '#fitnessjourney', '#weightloss'],
  'fitness': ['#fitnesstok', '#workout', '#gymtok', '#fitnessmotivation', '#homeworkout', '#gym', '#fitnessjourney', '#weightloss'],
  '格斗运动': ['#boxing', '#mma', '#martialarts', '#fighter', '#training', '#fight', '#bjj', '#muaythai'],
  '游戏': ['#gaming', '#gametok', '#gamingontiktok', '#xbox', '#ps5', '#pcgaming', '#gamergirl', '#twitch'],
  'gaming': ['#gaming', '#gametok', '#gamingontiktok', '#xbox', '#ps5', '#pcgaming', '#gamergirl', '#twitch'],
  '旅游': ['#traveltiktok', '#travelgram', '#wanderlust', '#vacation', '#travelbucketlist', '#solotravel', '#hiddengems', '#tiktoktravel'],
  'travel': ['#traveltiktok', '#travelgram', '#wanderlust', '#vacation', '#travelbucketlist', '#solotravel', '#hiddengems', '#tiktoktravel'],
  '知识教育': ['#learnontiktok', '#edutok', '#didyouknow', '#facts', '#tiktoktaughtme', '#knowledge', '#studytok', '#lifelessons'],
  'education': ['#learnontiktok', '#edutok', '#didyouknow', '#facts', '#tiktoktaughtme', '#knowledge', '#studytok', '#lifelessons'],
  '搞笑': ['#comedy', '#funny', '#lol', '#humor', '#viral', '#memes', '#relatable', '#skit'],
  'comedy': ['#comedy', '#funny', '#lol', '#humor', '#viral', '#memes', '#relatable', '#skit'],
  '剧情': ['#drama', '#storytime', '#acting', '#shortfilm', '#pov', '#minimovie', '#relationship', '#emotional'],
  '汽车': ['#cartok', '#cars', '#carsoftiktok', '#cardiy', '#automobile', '#carguys', '#supercars', '#cartips'],
  'auto': ['#cartok', '#cars', '#carsoftiktok', '#cardiy', '#automobile', '#carguys', '#supercars', '#cartips'],
  '宠物': ['#petsoftiktok', '#catsoftiktok', '#dogsoftiktok', '#petlovers', '#cuteanimals', '#funnypets', '#petcheck', '#puppy'],
  'pets': ['#petsoftiktok', '#catsoftiktok', '#dogsoftiktok', '#petlovers', '#cuteanimals', '#funnypets', '#petcheck', '#puppy'],
  '母婴亲子': ['#momtok', '#parenting', '#baby', '#newmom', '#momlife', '#toddler', '#pregnancy', '#familyvlog'],
  '美女/颜值': ['#beautiful', '#pretty', '#model', '#glowup', '#aesthetic', '#photography', '#fypbeauty', '#lookoftheday'],
  'default': ['#fyp', '#foryou', '#foryoupage', '#viral', '#trending', '#tiktok', '#fypシ', '#xyzbca'],
}

/**
 * 商业意图关键词（中英双语），用于 commerce 维度检测带货/商业合作线索
 */
export const COMMERCE_INTENT_KEYWORDS = {
  en: ['link in bio', 'shop now', 'use code', 'discount', 'promo', 'affiliate', 'sponsored', 'ad', 'partner', 'get yours', 'buy now', 'limited edition', 'available now', 'sale', 'coupon', 'collab', 'gifted', 'branddeal'],
  zh: ['链接在主页', '购物车', '同款', '购买', '优惠', '折扣', '带货', '种草', '安利', '测评', '合作', '推广', '赞助', '码', '购买链接', '上新', '促销', '包邮', '好物推荐', '旗舰店'],
}

/** 工具：clamp */
export function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)) }
