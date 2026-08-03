import { RawProfile, Post, SearchUserResult } from '@/types'

const RAPIDAPI_HOST = 'tiktok-api6.p.rapidapi.com'

/** 重试配置 */
const MAX_RETRIES = 2          // 每个 key 最多重试 2 次（共 3 次尝试）
const RETRY_DELAYS = [600, 1500]  // 退避延迟（ms），指数增长

/**
 * 动态读取 API key 列表（每次调用时读取，支持 env 热更新）
 * 优先级：RAPIDAPI_KEYS (逗号分隔多 key) > RAPIDAPI_KEY (单 key)
 */
function getApiKeys(): string[] {
  const multi = process.env.RAPIDAPI_KEYS
  if (multi) {
    const keys = multi.split(',').map(k => k.trim()).filter(Boolean)
    if (keys.length) return keys
  }
  const single = process.env.RAPIDAPI_KEY
  return single ? [single] : []
}

function apiHeaders(apiKey: string) {
  return {
    'x-rapidapi-key': apiKey,
    'x-rapidapi-host': RAPIDAPI_HOST,
    'Content-Type': 'application/json',
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalizeUsername(input: string): string {
  return input.trim().replace(/^@/, '').toLowerCase()
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = parseInt(value.replace(/[^0-9]/g, ''), 10)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  return 0
}

function pickField(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in obj) return obj[key]
  }
  return undefined
}

class TikTokApiError extends Error {
  code: string
  status: number
  constructor(message: string, code: string, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}

// ========== 语言检测 → 地区推断 ==========

/** 基于文本内容推断账号所属地区（当 API 未返回 region 时使用） */
function inferRegionFromContent(bio: string, nickname: string, posts: Post[]): string | undefined {
  const postsText = posts.slice(0, 10).map(p => p.desc || '').join(' ')
  const text = `${nickname} ${bio} ${postsText}`.toLowerCase()

  const detectors: { test: (t: string) => number; region: string }[] = [
    // 德语：äöüß + 常见德语词
    { test: (t) => {
      const umlauts = (t.match(/[äöüß]/g) || []).length
      const words = (t.match(/\b(und|der|die|das|ich|nicht|mit|von|sich|auch|auf|für|ist|ein|eine|einen|im|als|wie|bei|nach|aus|über|oder|aber|wenn|dann|dass|schon|kann|habe|haben|wird|wurde|gemacht|video|videos|neu|heute|mehr|folgen|liken|kommentar|kommentare|danke|bitte|hallo|guten|morgen|abend|leute|freunde)\b/g) || []).length
      return umlauts * 3 + words * 2
    }, region: 'DE' },

    // 法语：éèêëàâîïôûç + 常见法语词
    { test: (t) => {
      const accents = (t.match(/[éèêëàâîïôûùçœ]/g) || []).length
      const words = (t.match(/\b(le|la|les|des|une|une|est|pas|que|qui|dans|pour|sur|avec|plus|bien|fait|faire|comme|tout|tous|aussi|leur|leurs|mon|mes|ton|tes|son|ses|notre|nos|votre|vos|bonjour|merci|salut|vidéo|vidéos|abonne|abonner|jaime|partage|partager|commentaire|nouveau|nouvelle|aujourdhui|demain|hier|français|france|paris)\b/g) || []).length
      return accents * 3 + words * 2
    }, region: 'FR' },

    // 西班牙语：ñ + 常见西语词
    { test: (t) => {
      const nTilde = (t.match(/ñ/g) || []).length
      const words = (t.match(/\b(el|la|los|las|un|una|unos|unas|de|en|que|por|para|con|sin|más|muy|pero|también|como|porque|cuando|donde|todo|todos|este|esta|estos|estas|ese|esa|esos|esas|aquel|mi|mis|tu|tus|su|sus|nuestro|nuestra|hola|gracias|buenos|buenas|días|tardes|noches|video|videos|nuevo|nueva|hoy|mañana|ayer|español|españa|mexico|méxico|argentina|colombia|chile|peru|perú)\b/g) || []).length
      return nTilde * 3 + words * 2
    }, region: 'ES' },

    // 葡萄牙语：ãõ + 常见葡语词
    { test: (t) => {
      const special = (t.match(/[ãõáéíóúâêôàèìòùç]/g) || []).length
      const words = (t.match(/\b(o|a|os|as|de|da|do|das|dos|em|no|na|nos|nas|que|não|para|com|por|mais|muito|bem|também|como|quando|onde|tudo|todos|este|esta|esse|essa|meu|minha|seus|suas|nosso|nossa|olá|obrigado|obrigada|bom|boa|dia|tarde|noite|video|vídeo|videos|vídeos|novo|nova|hoje|amanhã|ontem|brasil|portugal|rio|são|paulo)\b/g) || []).length
      return special * 2 + words * 2
    }, region: 'BR' },

    // 日语：平假名/片假名
    { test: (t) => {
      const hiragana = (t.match(/[\u3040-\u309f]/g) || []).length
      const katakana = (t.match(/[\u30a0-\u30ff]/g) || []).length
      return hiragana * 5 + katakana * 3
    }, region: 'JP' },

    // 韩语：谚文
    { test: (t) => {
      const hangul = (t.match(/[\uac00-\ud7af]/g) || []).length
      return hangul * 5
    }, region: 'KR' },

    // 阿拉伯语
    { test: (t) => {
      const arabic = (t.match(/[\u0600-\u06ff]/g) || []).length
      if (arabic > 10) return arabic
      const words = (t.match(/\b(ال|من|في|على|أن|هذا|هذه|هو|هي|مع|عن|كان|كانت|ليس|ليس|ما|لا|كل|بعض|أي|أو|ثم|إذا|لكن|حيث|مثل|عند|بعد|قبل|فوق|تحت|خلال|داخل|خارج|اليوم|غدا|أمس|فيديو|فيديوهات|جديد|جديدة|شكرا|مرحبا|السلام|عليكم)\b/g) || []).length
      return words * 3
    }, region: 'SA' },

    // 俄语：西里尔字母
    { test: (t) => {
      const cyrillic = (t.match(/[\u0400-\u04ff]/g) || []).length
      return cyrillic * 5
    }, region: 'RU' },

    // 泰语
    { test: (t) => {
      const thai = (t.match(/[\u0e00-\u0e7f]/g) || []).length
      return thai * 5
    }, region: 'TH' },

    // 越南语：âêôơư + 常见越语词
    { test: (t) => {
      const special = (t.match(/[àáảãạâầấẩẫậăằắẳẵặèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựýỳỷỹỵđ]/g) || []).length
      if (special > 3) return special * 2
      const words = (t.match(/\b(của|và|một|không|có|được|trong|cho|những|với|các|đã|này|đó|tôi|bạn|anh|em|chị|video|mới|hôm|nay|cảm|ơn|chào|buổi|sáng|trưa|chiều|tối|việt|nam)\b/g) || []).length
      return words * 3
    }, region: 'VN' },

    // 印尼语/马来语
    { test: (t) => {
      const words = (t.match(/\b(dan|yang|di|ke|dari|ini|itu|saya|kamu|dia|mereka|kita|kami|anda|tidak|bisa|akan|sudah|belum|ada|juga|atau|kalau|karena|tapi|untuk|dengan|seperti|tentang|setelah|sebelum|baru|video|hari|ini|terima|kasih|selamat|pagi|siang|sore|malam|indonesia|malaysia|singapore|singapura|jakarta|kuala|lumpur)\b/g) || []).length
      return words * 3
    }, region: 'ID' },

    // 印地语（天城文）
    { test: (t) => {
      const devanagari = (t.match(/[\u0900-\u097f]/g) || []).length
      return devanagari * 5
    }, region: 'IN' },

    // 土耳其语
    { test: (t) => {
      const special = (t.match(/[ğüşıöçİĞÜŞÖÇ]/g) || []).length
      if (special > 3) return special * 3
      const words = (t.match(/\b(ve|bir|bu|de|da|ne|ben|sen|o|biz|siz|onlar|var|yok|çok|daha|ama|çünkü|için|gibi|kadar|sonra|önce|şimdi|bugün|yarın|video|yeni|teşekkür|merhaba|selam|türkiye|istanbul|ankara|izmir)\b/g) || []).length
      return words * 3
    }, region: 'TR' },

    // 波兰语
    { test: (t) => {
      const special = (t.match(/[ąćęłńóśźż]/g) || []).length
      if (special > 3) return special * 3
      const words = (t.match(/\b(i|w|na|z|do|nie|to|że|się|jest|być|był|była|było|dla|ale|jak|co|ten|ta|to|te|mój|moja|moje|twój|twoja|twoje|jego|jej|ich|nasz|nasza|nasze|wasz|wasza|wasze|dziękuję|cześć|dzień|dobry|video|nowy|nowa|nowe|polska|polski|polskie|warszawa|kraków)\b/g) || []).length
      return words * 3
    }, region: 'PL' },

    // 希腊语：希腊字母
    { test: (t) => {
      const greek = (t.match(/[\u0370-\u03ff]/g) || []).length
      if (greek > 5) return greek * 5
      const words = (t.match(/\b(και|το|η|ο|τα|οι|του|των|της|τον|την|στην|στο|στα|από|με|σε|για|που|αυτό|αυτή|αυτός|είναι|δεν|θα|να|ένα|μια|έχω|έχει|κάνω|κάνει|τώρα|σήμερα|αύριο|χθες|βίντεο|νέο|νέα|ευχαριστώ|γεια|καλημέρα|καλησπέρα|ελλάδα|αθήνα|θεσσαλονίκη)\b/g) || []).length
      return words * 3
    }, region: 'GR' },

    // 乌克兰语：西里尔字母 + 乌克兰语特有字符
    { test: (t) => {
      const cyrillic = (t.match(/[\u0400-\u04ff]/g) || []).length
      const ukrSpecific = (t.match(/[іїєґ]/g) || []).length
      if (ukrSpecific > 3) return cyrillic * 3 + ukrSpecific * 5
      const words = (t.match(/\b(і|та|в|на|з|до|не|це|що|як|він|вона|вони|ми|ви|ти|я|є|був|була|було|для|але|коли|де|чому|тому|відео|новий|нова|нове|сьогодні|завтра|вчора|дякую|привіт|добрий|день|україна|київ|львів|харків|одеса)\b/g) || []).length
      return words * 3
    }, region: 'UA' },

    // 芬兰语
    { test: (t) => {
      const special = (t.match(/[äöå]/g) || []).length
      if (special > 3) return special * 3
      const words = (t.match(/\b(ja|on|ei|että|se|hän|mitä|kun|niin|kuin|jos|olen|olet|olemme|olette|ovat|oli|ollut|minä|sinä|me|te|he|tämä|tuo|se|nämä|nuo|ne|video|uusi|uutta|tänään|huomenna|eilen|kiitos|hei|moi|terve|huomenta|päivää|iltaa|suomi|helsinki|tampere|turun|espoo|oulu)\b/g) || []).length
      return words * 3
    }, region: 'FI' },

    // 罗马尼亚语
    { test: (t) => {
      const special = (t.match(/[ăâîșț]/g) || []).length
      if (special > 3) return special * 3
      const words = (t.match(/\b(si|de|la|cu|din|pe|pentru|care|este|sunt|fost|un|o|în|sau|dar|dacă|mai|ca|și|nu|da|acest|această|meu|mea|tău|ta|noi|voi|ei|ele|video|nou|nouă|astăzi|mâine|ieri|mulțumesc|salut|bună|ziua|seara|românia|bucurești|cluj|timisoara|iasi|constanta)\b/g) || []).length
      return words * 3
    }, region: 'RO' },

    // 匈牙利语
    { test: (t) => {
      const special = (t.match(/[áéíóúöüőű]/g) || []).length
      if (special > 3) return special * 3
      const words = (t.match(/\b(és|nem|hogy|egy|ez|az|de|is|ha|már|csak|még|van|volt|lesz|vagyok|vagy|van|vannak|én|te|ő|mi|ti|ők|video|új|ma|holnap|tegnap|köszönöm|szia|helló|jó|reggelt|napot|estét|magyarország|budapest|debrecen|szeged|pécs|győr|miskolc)\b/g) || []).length
      return words * 3
    }, region: 'HU' },

    // 捷克语
    { test: (t) => {
      const special = (t.match(/[áčďéěíňóřšťúůýž]/g) || []).length
      if (special > 3) return special * 3
      const words = (t.match(/\b(a|je|se|na|s|do|k|o|od|pro|před|po|při|za|ale|nebo|protože|když|jak|co|kdo|kde|kdy|proč|já|ty|on|ona|my|vy|oni|video|nový|nová|nové|dnes|zítra|včera|děkuji|ahoj|dobrý|den|večer|česká|republika|praha|brno|ostrava|plzeň|liberec|olomouc)\b/g) || []).length
      return words * 3
    }, region: 'CZ' },

    // 挪威语/丹麦语
    { test: (t) => {
      const special = (t.match(/[æøå]/g) || []).length
      if (special > 3) return special * 3
      const words = (t.match(/\b(og|er|det|jeg|du|vi|de|han|hun|den|det|ikke|har|var|kan|skal|vil|må|for|med|på|til|om|fra|ved|men|eller|som|at|når|hvis|da|så|video|ny|nytt|nye|i dag|i morgen|i går|takk|hei|hallo|god|morgen|dag|kveld|norge|norsk|danmark|dansk|oslo|bergen|stavanger|trondheim|københavn|århus|odense|aalborg)\b/g) || []).length
      return words * 3
    }, region: 'NO' },

    // 葡萄牙语（葡萄牙）
    { test: (t) => {
      const words = (t.match(/\b(portugal|lisboa|porto|algarve|coimbra|braga|funchal|açores|madeira|alentejo|português|portuguesa|portugueses|tu|você|vocês|ele|ela|eles|elas|está|estão|obrigado|obrigada|olá|bom dia|boa tarde|boa noite|fixe|giro|gira|bué|tuga|tugão)\b/g) || []).length
      return words * 4
    }, region: 'PT' },

    // 英语（兜底检测，放在最后避免误判）
    // 只有英文内容占比极高（>80% ASCII）且没有其他语言特征时才会命中
    { test: (t) => {
      // 移除 URL、mention、hashtag 后计算纯文本
      const clean = t.replace(/https?:\/\/\S+/g, '').replace(/@\S+/g, '').replace(/#\S+/g, '')
      if (clean.length < 30) return 0 // 文本太短不判断
      const asciiChars = (clean.match(/[a-zA-Z0-9\s.,!?;:'"()\-–—&/+]/g) || []).length
      const totalChars = clean.replace(/\s/g, '').length
      if (totalChars === 0) return 0
      const asciiRatio = asciiChars / totalChars
      if (asciiRatio < 0.8) return 0 // 非英文字符太多，不是英语内容

      // 常见英文高频词 + TikTok 平台术语
      const words = (t.match(/\b(the|and|that|for|are|with|his|they|this|have|from|was|not|but|all|can|were|her|she|has|been|will|when|who|more|some|would|about|like|just|what|know|think|really|because|make|people|right|also|even|only|still|being|than|then|into|over|back|after|year|good|life|world|video|videos|like|follow|share|comment|subscribe|check|link|bio|new|daily|content|creator|viral|fyp|foryou|tiktok|post|watch|trending|love|best|top|how|why|tips|hack|review|tutorial|unboxing|grwm|pov|vlog|storytime|reaction|challenge|duet|stitch)\b/g) || []).length
      return 5 + words * 2 // 基础分 5 + 每词 2 分
    }, region: 'US' },
  ]

  let bestMatch: { region: string; score: number } | null = null
  for (const d of detectors) {
    const score = d.test(text)
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { region: d.region, score }
    }
  }

  // 需要显著信号才推断（score >= 5），避免误判
  return bestMatch && bestMatch.score >= 5 ? bestMatch.region : undefined
}

// 新 API 统一用 POST + JSON body
// 支持：多 key 轮转 + 指数退避重试 + 限流自动切换 key
async function apiPost<T = unknown>(
  path: string,
  body: Record<string, unknown>,
  label: string,
  options: { timeoutMs?: number; throwOnError?: boolean } = {}
): Promise<T> {
  const { timeoutMs = 15000, throwOnError = true } = options
  const apiKeys = getApiKeys()

  if (apiKeys.length === 0) {
    throw new TikTokApiError('RAPIDAPI_KEY not configured', 'MISSING_API_KEY', 503)
  }

  const url = `https://${RAPIDAPI_HOST}${path}`
  let lastError: unknown = null

  // 遍历所有 key，每个 key 重试 MAX_RETRIES 次
  for (let keyIdx = 0; keyIdx < apiKeys.length; keyIdx++) {
    const apiKey = apiKeys[keyIdx]
    const keyTag = apiKeys.length > 1 ? `key#${keyIdx + 1}` : ''

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const start = Date.now()
      let res: Response
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: apiHeaders(apiKey),
          body: JSON.stringify(body),
          cache: 'no-store',
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
        const isNetwork = isTimeout || msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('EAI_AGAIN') || msg.includes('EPIPE')

        if (isNetwork) {
          const code = isTimeout ? 'Request timed out' : `Network error: ${msg}`
          lastError = new TikTokApiError(code, 'NETWORK_ERROR', 502)
          console.warn(`[tiktok] ${label} ${keyTag} attempt#${attempt + 1} network error: ${msg}`)
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAYS[attempt])
            continue
          }
          break  // 同 key 重试耗尽，切到下一个 key
        }
        throw err  // 未知异常不重试
      }

      // 限流/配额：切下一个 key，不重试当前 key
      if (res.status === 429 || res.status === 403) {
        console.warn(`[tiktok] ${label} ${keyTag} attempt#${attempt + 1} HTTP ${res.status} (rate/quota), switching key...`)
        lastError = new TikTokApiError('Rate limited', 'RATE_LIMIT', 429)
        break
      }

      const text = await res.text()
      const duration = Date.now() - start

      if (!res.ok) {
        console.error(`[tiktok] ${label} ${keyTag} HTTP ${res.status} (${duration}ms):`, text.slice(0, 300))
        lastError = new TikTokApiError(`API HTTP ${res.status}`, 'API_ERROR', 500)
        // 5xx 服务端错误可重试
        if (res.status >= 500 && attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAYS[attempt])
          continue
        }
        if (!throwOnError) return undefined as T
        break
      }

      let json: unknown
      try {
        json = JSON.parse(text)
      } catch {
        console.error(`[tiktok] ${label} ${keyTag} invalid JSON (${duration}ms):`, text.slice(0, 200))
        lastError = new TikTokApiError('Invalid API response', 'API_ERROR', 500)
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAYS[attempt])
          continue
        }
        if (!throwOnError) return undefined as T
        break
      }

      const root = json as Record<string, unknown>

      // 错误格式：{ detail: "User xxx does not exist" } 或 { message: "..." }
      const detailMsg = typeof root.detail === 'string' ? root.detail : ''
      const errMsg = typeof root.message === 'string' ? root.message : detailMsg

      if (errMsg) {
        if (/does not exist|not found|no user|user not found|invalid/i.test(errMsg)) {
          if (!throwOnError) return undefined as T
          throw new TikTokApiError(errMsg, 'USER_NOT_FOUND', 404)
        }
        if (/rate limit|quota|too many/i.test(errMsg)) {
          console.warn(`[tiktok] ${label} ${keyTag} response rate limit, switching key...`)
          lastError = new TikTokApiError(errMsg, 'RATE_LIMIT', 429)
          break  // 切下一个 key
        }
        if (/endpoint.*does not exist/i.test(errMsg)) {
          console.error(`[tiktok] ${label} ${keyTag} endpoint error:`, errMsg)
          lastError = new TikTokApiError(errMsg, 'API_ERROR', 500)
          if (!throwOnError) return undefined as T
          break
        }
      }

      console.log(`[tiktok] ${label} ${keyTag} OK (${duration}ms)`)
      return root as T
    }
  }

  // 所有 key 都失败
  if (!throwOnError) return undefined as T
  throw lastError || new TikTokApiError('All API keys exhausted', 'API_ERROR', 500)
}

export async function fetchProfile(inputUsername: string): Promise<RawProfile> {
  const username = normalizeUsername(inputUsername)
  if (!username) throw new TikTokApiError('Empty username', 'INVALID_USERNAME', 400)

  // 并行获取用户详情和视频；视频失败时不阻断整体评估
  const [info, posts] = await Promise.all([
    apiPost<Record<string, unknown>>('/user/details', { username }, 'user/details', { timeoutMs: 20000 }),
    fetchPosts(username),
  ])

  const followerCount = toNumber(pickField(info, 'followers', 'follower_count', 'followerCount'))
  const videoCount = toNumber(pickField(info, 'total_videos', 'video_count', 'videoCount'))
  const totalLikes = toNumber(pickField(info, 'total_heart', 'heart_count', 'total_favorited'))
  const nickname = String(pickField(info, 'nickname', 'username') || username)
  const secUid = String(pickField(info, 'secondary_id', 'sec_uid', 'secUid') || '')

  if (!followerCount && !videoCount && !nickname) {
    throw new TikTokApiError('User has empty stats', 'USER_NOT_FOUND', 404)
  }

  const postsFetched = posts.length > 0

  return {
    username,
    nickname,
    followerCount,
    followingCount: toNumber(pickField(info, 'following', 'following_count', 'followingCount')),
    totalLikes,
    videoCount,
    secUid,
    region: info.region ? String(info.region) : inferRegionFromContent(nickname, String(pickField(info, 'description', 'signature') || ''), posts),
    avatar: String(pickField(info, 'profile_image', 'avatar_larger', 'avatar_medium', 'avatar_thumb') || ''),
    bio: String(pickField(info, 'description', 'signature') || ''),
    posts,
    dataQuality: postsFetched ? 'full' as const : 'partial' as const,
    postsFetchError: postsFetched ? undefined : 'Video data unavailable — evaluation may be less accurate',
  }
}

async function fetchPosts(username: string): Promise<Post[]> {
  try {
    const root = await apiPost<Record<string, unknown>>(
      '/user/videos',
      { username, count: 30, cursor: 0 },
      'user/videos',
      { timeoutMs: 12000 }
    )

    const items = Array.isArray(root.videos) ? root.videos : []

    const posts: Post[] = items.map((v: unknown): Post => {
      const item = (v && typeof v === 'object') ? (v as Record<string, unknown>) : {}
      const stats = (item.statistics && typeof item.statistics === 'object')
        ? (item.statistics as Record<string, unknown>)
        : {}
      return {
        id: String(item.video_id ?? item.aweme_id ?? item.id ?? ''),
        playCount: toNumber(pickField(stats, 'number_of_plays', 'play_count', 'playCount')),
        likeCount: toNumber(pickField(stats, 'number_of_hearts', 'digg_count', 'like_count')),
        commentCount: toNumber(pickField(stats, 'number_of_comments', 'comment_count', 'commentCount')),
        shareCount: toNumber(pickField(stats, 'number_of_reposts', 'share_count', 'shareCount')),
        createTime: toNumber(item.create_time ?? item.createTime),
        desc: String(item.description ?? item.desc ?? item.title ?? ''),
      }
    }).filter(p => p.id)

    return posts
  } catch (err) {
    console.warn('[tiktok] user/videos failed, continuing without posts:', err instanceof Error ? err.message : err)
    return []
  }
}

// 新 API 没有专门的用户搜索端点，用 /search/general/query 搜索视频，从中提取作者去重
export async function searchUsers(keywords: string, count = 10): Promise<SearchUserResult[]> {
  try {
    const root = await apiPost<Record<string, unknown>>(
      '/search/general/query',
      { query: keywords, cursor: 0, sort_type: '0' },
      'search/general/query'
    )

    const videos = Array.isArray(root.videos) ? root.videos : []
    const seen = new Set<string>()
    const results: SearchUserResult[] = []

    for (const v of videos) {
      const item = (v && typeof v === 'object') ? (v as Record<string, unknown>) : {}
      const username = normalizeUsername(String(item.author || ''))
      if (!username || seen.has(username)) continue
      seen.add(username)
      results.push({
        username,
        nickname: String(item.author_name || ''),
        followerCount: 0, // 搜索结果不含粉丝数，需点击评估时拉取
        avatar: String(item.avatar_thumb || ''),
      })
      if (results.length >= count) break
    }

    return results
  } catch (err) {
    console.warn('[tiktok] search/general/query failed:', err instanceof Error ? err.message : err)
    return []
  }
}
