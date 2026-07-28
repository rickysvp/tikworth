import { ContentStrategy, ContentPillar, ContentCadence } from '../../types'
import { CATEGORY_PILLAR_HINTS, CATEGORY_HASHTAGS } from './config'
import type { FollowerTier } from './valuation'

const PILLAR_ICONS: Record<string, string> = {
  '理财知识科普': '📊', '投资案例分析': '📈', '市场热点解读': '📰', '存钱/省钱技巧': '💰', '金融避坑指南': '⚠️',
  '产品评测': '🔍', '使用技巧': '💡', '新品开箱': '📦', '科技新闻': '📡', '数码选购指南': '🛒',
  '产品测评': '✨', '妆容教程': '💄', '护肤流程': '🧴', '好物分享': '🎁', '化妆技巧': '🎨',
  'OOTD穿搭': '👗', '单品推荐': '👜', '穿搭技巧': '🧥', '风格尝试': '👠', '购物分享': '🛍️',
  '菜谱教程': '🍳', '探店分享': '🍜', '美食制作': '👨‍🍳', '食材测评': '🥗', '烹饪技巧': '🔪',
  '训练教程': '🏋️', '健身干货': '💪', '饮食搭配': '🥗', '动作示范': '🏃', '减脂/增肌': '⚖️',
  '格斗训练': '🥊', '比赛解析': '🥋', '技术教学': '🎯', '训练日常': '💪', '选手故事': '🏆',
  '游戏实况': '🎮', '攻略教程': '🕹️', '游戏评测': '🎯', '精彩集锦': '🔥', '新游试玩': '🆕',
  '旅行vlog': '✈️', '攻略分享': '🗺️', '景点推荐': '🏖️', '美食探店': '🍣', '旅行贴士': '🎒',
  '知识科普': '📚', '学习技巧': '✏️', '干货分享': '🧠', '书籍解读': '📖', '思维提升': '🎓',
  '搞笑段子': '😂', '整蛊日常': '🎭', '神评论': '💬', '爆笑瞬间': '🤣', '喜剧短剧': '🎬',
  '情感短剧': '💔', '故事演绎': '🎬', '反转剧情': '🔄', '生活共鸣': '💭', '系列连载': '📺',
  '车型评测': '🚗', '用车知识': '🔧', '改装分享': '🏁', '试驾体验': '🚙', '汽车文化': '🏎️',
  '萌宠日常': '🐱', '养宠知识': '🐾', '宠物训练': '🦮', '搞笑瞬间': '😹', '宠物好物': '🐶',
  '育儿经验': '👶', '亲子互动': '👨‍👩‍👧', '母婴好物': '🍼', '辅食教程': '🥣', '早教启蒙': '🧸',
  '颜值展示': '✨', '变美技巧': '💫', '穿搭分享': '👗', '生活vlog': '📸', '妆容分享': '💋',
  '内容创作': '🎬', '日常分享': '📱', '粉丝互动': '💬', '专业分享': '🎯', '成长记录': '🌱',
}

function pillarIcon(name: string): string {
  return PILLAR_ICONS[name] || '🎬'
}

const CATEGORY_VIDEO_DURATION: Record<string, { min: number; max: number; label: string }> = {
  '美妆护肤': { min: 30, max: 60, label: '30-60秒（美妆教程/展示类最佳时长）' },
  'beauty': { min: 30, max: 60, label: '30-60秒（美妆教程/展示类最佳时长）' },
  '知识教育': { min: 60, max: 180, label: '60-180秒（知识科普需要足够讲解时间）' },
  'education': { min: 60, max: 180, label: '60-180秒（知识科普需要足够讲解时间）' },
  '科技数码': { min: 45, max: 120, label: '45-120秒（产品评测/开箱需要展示细节）' },
  'tech': { min: 45, max: 120, label: '45-120秒（产品评测/开箱需要展示细节）' },
  '金融理财': { min: 60, max: 180, label: '60-180秒（理财知识需要清晰讲解）' },
  'finance': { min: 60, max: 180, label: '60-180秒（理财知识需要清晰讲解）' },
  '搞笑': { min: 15, max: 45, label: '15-45秒（喜剧短视频短平快）' },
  'comedy': { min: 15, max: 45, label: '15-45秒（喜剧短视频短平快）' },
  '娱乐': { min: 15, max: 45, label: '15-45秒（娱乐内容短平快）' },
  '剧情': { min: 30, max: 90, label: '30-90秒（短剧需要完整叙事）' },
  'drama': { min: 30, max: 90, label: '30-90秒（短剧需要完整叙事）' },
  '游戏': { min: 15, max: 60, label: '15-60秒（游戏精彩集锦）' },
  'gaming': { min: 15, max: 60, label: '15-60秒（游戏精彩集锦）' },
  '美食': { min: 30, max: 90, label: '30-90秒（菜谱/探店节奏适中）' },
  'food': { min: 30, max: 90, label: '30-90秒（菜谱/探店节奏适中）' },
  '健身运动': { min: 30, max: 90, label: '30-90秒（动作示范/跟练）' },
  'fitness': { min: 30, max: 90, label: '30-90秒（动作示范/跟练）' },
  'default': { min: 15, max: 60, label: '15-60秒（通用短视频最佳时长）' },
}

const CATEGORY_COLLAB_IDEAS: Record<string, { type: string; description: string; potential: 'high' | 'medium' }[]> = {
  '美妆护肤': [
    { type: '品牌测评', description: '与美妆品牌合作产品测评/妆容教程', potential: 'high' },
    { type: '同垂类联动', description: '与其他美妆博主合拍妆容挑战', potential: 'high' },
    { type: '护肤专家', description: '与皮肤科医生/护肤品牌科普合作', potential: 'medium' },
  ],
  'beauty': [
    { type: '品牌测评', description: '与美妆品牌合作产品测评/妆容教程', potential: 'high' },
    { type: '同垂类联动', description: '与其他美妆博主合拍妆容挑战', potential: 'high' },
    { type: '护肤专家', description: '与皮肤科医生/护肤品牌科普合作', potential: 'medium' },
  ],
  '时尚穿搭': [
    { type: '服饰品牌', description: '与服装品牌合作 OOTD/穿搭分享', potential: 'high' },
    { type: '穿搭博主联动', description: '与同体量穿搭博主互换风格挑战', potential: 'high' },
    { type: '探店合作', description: '与线下服装店/买手店探店合作', potential: 'medium' },
  ],
  'fashion': [
    { type: '服饰品牌', description: '与服装品牌合作 OOTD/穿搭分享', potential: 'high' },
    { type: '穿搭博主联动', description: '与同体量穿搭博主互换风格挑战', potential: 'high' },
  ],
  '科技数码': [
    { type: '数码品牌', description: '与手机/耳机/电脑品牌合作评测', potential: 'high' },
    { type: '科技博主联动', description: '与科技博主对比评测/观点碰撞', potential: 'high' },
    { type: '电商平台', description: '与数码电商平台合作大促推荐', potential: 'medium' },
  ],
  'tech': [
    { type: '数码品牌', description: '与手机/耳机/电脑品牌合作评测', potential: 'high' },
    { type: '科技博主联动', description: '与科技博主对比评测/观点碰撞', potential: 'high' },
  ],
  '美食': [
    { type: '餐饮品牌', description: '与餐厅/食品品牌合作探店/食谱', potential: 'high' },
    { type: '厨具品牌', description: '与厨具/家电品牌合作制作教程', potential: 'medium' },
    { type: '美食博主联动', description: '与美食博主合拍厨艺挑战', potential: 'medium' },
  ],
  'food': [
    { type: '餐饮品牌', description: '与餐厅/食品品牌合作探店/食谱', potential: 'high' },
    { type: '厨具品牌', description: '与厨具/家电品牌合作制作教程', potential: 'medium' },
  ],
  '健身运动': [
    { type: '运动品牌', description: '与运动服饰/补剂品牌合作训练内容', potential: 'high' },
    { type: '健身房合作', description: '与健身房/工作室合作训练日常', potential: 'high' },
    { type: '健身博主联动', description: '与健身博主合拍训练挑战', potential: 'medium' },
  ],
  'fitness': [
    { type: '运动品牌', description: '与运动服饰/补剂品牌合作训练内容', potential: 'high' },
    { type: '健身房合作', description: '与健身房/工作室合作训练日常', potential: 'high' },
  ],
  'default': [
    { type: '同垂类联动', description: '与同体量创作者互相导流合拍', potential: 'high' },
    { type: '品牌定制', description: '为相关品牌制作产品测评或教程', potential: 'high' },
    { type: '挑战赛', description: '参与或发起品牌挑战赛扩大曝光', potential: 'medium' },
    { type: '跨领域合作', description: '与互补领域创作者跨界联动', potential: 'medium' },
  ],
}

interface BuildStrategyInput {
  categories: string[]
  cadence: ContentCadence
  followerTier: FollowerTier
}

export function buildContentStrategy(input: BuildStrategyInput): ContentStrategy {
  const { categories, cadence, followerTier } = input

  const pillarNames: string[] = []
  const seen = new Set<string>()
  for (const cat of categories) {
    const hints = CATEGORY_PILLAR_HINTS[cat] || CATEGORY_PILLAR_HINTS[cat.toLowerCase()] || CATEGORY_PILLAR_HINTS.default
    for (const h of hints) {
      if (!seen.has(h) && pillarNames.length < 4) {
        seen.add(h)
        pillarNames.push(h)
      }
    }
    if (pillarNames.length >= 4) break
  }
  if (pillarNames.length === 0) {
    for (const h of CATEGORY_PILLAR_HINTS.default) {
      pillarNames.push(h)
      if (pillarNames.length >= 4) break
    }
  }

  const pillarFrequency = (idx: number): string => {
    const pw = cadence.avgPostsPerWeek
    if (pw < 1) return idx === 0 ? '每周 1 条' : '每月 1-2 条'
    if (pw < 3) return idx === 0 ? '每周 1-2 条' : idx === 1 ? '每周 1 条' : '每月 2 条'
    return idx === 0 ? '每周 2-3 条' : idx === 1 ? '每周 1-2 条' : '每周 1 条'
  }

  const exampleTemplates: Record<string, string[]> = {
    '理财知识科普': ['3个普通人必知的理财误区', '新手存钱的5个实用技巧', '月薪5000如何开始理财'],
    '投资案例分析': ['我是如何用$1000开始投资的', '这个月我的投资收益复盘', '普通人该买指数基金吗'],
    '产品评测': ['这款产品值不值得买？真实使用30天', '同价位产品横向对比', '开箱后的真实感受'],
    '妆容教程': ['5分钟快速出门妆', '新手必学的底妆技巧', '这个妆容被问了100遍'],
    'OOTD穿搭': ['一周穿搭不重样', '微胖女生显瘦穿搭', '平价衣服穿出高级感'],
    '菜谱教程': ['3步搞定的快手菜', '在家也能做的餐厅级料理', '工作日便当灵感'],
    '训练教程': ['新手健身最容易犯的错误', '10分钟腹肌训练跟练', '增肌期饮食怎么吃'],
    '游戏实况': ['这个关卡我卡了3天终于过了', '新版本最强出装攻略', '新手必看的10个技巧'],
    '旅行vlog': ['这个小众景点太美了', '三天两夜旅行攻略', '一个人旅行是什么体验'],
    '知识科普': ['99%的人不知道冷知识', '一本书改变了我的思维', '提升效率的5个方法'],
    '搞笑段子': ['当我妈开始用抖音', '社恐人真实写照', '打工人的一天'],
    '情感短剧': ['当你有个控制欲强的对象', '情侣之间最真实的瞬间', '分手后才明白的道理'],
    '内容创作': ['我是如何开始做内容的', '创作瓶颈期怎么办', '新手拍视频的3个建议'],
    'default': ['新手必看的实用技巧', '我踩过的坑你别再踩', '这个方法亲测有效'],
  }

  const pillars: ContentPillar[] = pillarNames.map((name, idx) => {
    const examples = exampleTemplates[name] || exampleTemplates.default
    const whyMap: Record<string, string> = {
      0: '核心内容方向，最能体现账号定位和专业度，优先保证质量',
      1: '辅助内容方向，丰富内容多样性，覆盖更多用户兴趣',
      2: '延伸内容方向，增加人格化属性，提升粉丝粘性',
      3: '探索内容方向，测试新内容形式，寻找新的增长点',
    }
    const erMap: Record<number, string> = {
      0: '4.0-6.5%',
      1: '3.5-5.5%',
      2: '3.0-5.0%',
      3: '2.5-4.5%',
    }
    return {
      type: name,
      icon: pillarIcon(name),
      frequency: pillarFrequency(idx),
      expectedEngagement: erMap[idx] || '3.0-5.0%',
      examples: examples.slice(0, 3),
      why: whyMap[idx] || '丰富内容矩阵，吸引不同偏好的受众',
    }
  })

  const tagSet = new Set<string>()
  for (const cat of categories) {
    const tags = CATEGORY_HASHTAGS[cat] || CATEGORY_HASHTAGS[cat.toLowerCase()] || CATEGORY_HASHTAGS.default
    for (const t of tags) {
      tagSet.add(t)
      if (tagSet.size >= 10) break
    }
    if (tagSet.size >= 10) break
  }
  if (tagSet.size < 8) {
    for (const t of CATEGORY_HASHTAGS.default) {
      tagSet.add(t)
      if (tagSet.size >= 10) break
    }
  }

  const isHighVolumeCat = ['美妆护肤', 'beauty', '时尚穿搭', 'fashion', '搞笑', 'comedy', '娱乐', '游戏', 'gaming'].some(
    c => categories.some(cat => cat.toLowerCase() === c.toLowerCase())
  )

  const recommendedHashtags = Array.from(tagSet).slice(0, 10).map(tag => ({
    tag,
    volume: isHighVolumeCat ? 'high' as const : 'medium' as const,
    relevance: Number((0.70 + Math.random() * 0.28).toFixed(2)),
  }))

  const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const topWeekdays = cadence.bestWeekdays.slice(0, 3)
  const topTimeSlots = cadence.bestTimeSlots.slice(0, 3)

  const formatTime = (hour: number): string => `${hour.toString().padStart(2, '0')}:00`

  const scheduleFormats = ['核心教程', '互动内容', '轻松日常']
  const optimalSchedule: { day: string; time: string; format: string }[] = []
  for (let i = 0; i < Math.max(topWeekdays.length, topTimeSlots.length, 3); i++) {
    const day = topWeekdays[i % Math.max(topWeekdays.length, 1)]?.weekday || weekdayLabels[(2 + i) % 7]
    const hour = topTimeSlots[i % Math.max(topTimeSlots.length, 1)]?.hour ?? (19 + i) % 24
    const fmt = scheduleFormats[i % scheduleFormats.length]
    optimalSchedule.push({ day, time: formatTime(hour), format: fmt })
  }

  let videoDuration = CATEGORY_VIDEO_DURATION.default
  for (const cat of categories) {
    const d = CATEGORY_VIDEO_DURATION[cat] || CATEGORY_VIDEO_DURATION[cat.toLowerCase()]
    if (d) { videoDuration = d; break }
  }

  let collabIdeas: { type: string; description: string; potential: 'high' | 'medium' }[] = []
  for (const cat of categories) {
    const ideas = CATEGORY_COLLAB_IDEAS[cat] || CATEGORY_COLLAB_IDEAS[cat.toLowerCase()]
    if (ideas && ideas.length > 0) {
      collabIdeas = ideas.slice(0, 4)
      break
    }
  }
  if (collabIdeas.length === 0) collabIdeas = CATEGORY_COLLAB_IDEAS.default

  const tierAdvice: Record<FollowerTier, string> = {
    nano: '当前处于起号阶段，建议保持高频更新并积极参与热门话题',
    micro: '已有一定粉丝基础，建议聚焦垂直内容并开始尝试变现',
    mid: '腰部创作者，建议优化品牌合作报价体系，提升商业变现效率',
    macro: '头部创作者，建议建立多平台矩阵并拓展自有品牌',
    mega: '顶级达人，建议构建个人IP商业生态，拓展长期品牌合作',
  }

  const summary = `基于账号数据（${categories.slice(0,2).join('、')||'泛生活'}品类，${cadence.postingRhythm==='daily'?'日更':cadence.postingRhythm==='weekly'?'周更':'不定期'}节奏），${tierAdvice[followerTier]}`

  return {
    pillars,
    recommendedHashtags,
    optimalSchedule,
    videoDuration,
    collaborationIdeas: collabIdeas.slice(0, 4),
    summary,
  }
}
