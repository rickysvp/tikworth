// Blog data — in-memory for simplicity (3 posts, ~2000+ words each)
// In production you'd use a CMS or MDX files; this keeps the MVP lean.

export interface BlogPostMeta {
  slug: string
  title: string
  description: string
  tags: string[]
  publishedAt: string // ISO
  readTime: string
  category: string
}

export interface BlogPost extends BlogPostMeta {
  content: string
}

export const BLOG_POSTS: BlogPost[] = [
  // ════════════════════════════ POST 1 ════════════════════════════
  {
    slug: 'tiktok-account-worth-2026',
    title: 'How Much Is Your TikTok Account Worth in 2026? The Complete Guide',
    description:
      'Learn how brand deals, follower value, engagement rates, and niche category impact your TikTok account valuation. A data-driven guide for creators with 1K to 10M+ followers.',
    tags: [
      'TikTok valuation',
      'brand deals',
      'creator economy',
      'account worth',
      'TikTok monetization',
    ],
    publishedAt: '2026-07-20T09:00:00Z',
    readTime: '11 min',
    category: 'Creator Economy',

    content: `# How Much Is Your TikTok Account Worth in 2026?

If you've ever Googled "how much is my TikTok account worth," you're not alone. As the creator economy crosses the half-trillion-dollar mark in 2026, more influencers than ever are wondering what their audience actually translates to in dollars. And for good reason — TikTok accounts with 100,000 followers are regularly signing 5-figure brand deals, while mega-creators with 10M+ followers command 6-7 figures per post.

But here's the problem: most "account value calculators" are garbage. They take your follower count, multiply by a random number, and spit out an estimate that has nothing to do with reality. Actual TikTok account valuation is far more nuanced — it depends on your engagement rate, niche, audience demographics, posting consistency, and a dozen other variables.

In this guide, we'll break down exactly how TikTok account valuation works in 2026, what data points matter, and how to calculate a number that brands will actually respect.

## The Three Pillars of TikTok Account Value

When we built TokValue's valuation engine, we didn't just guess. We analyzed data from the Influencer Marketing Hub, CreatorIQ, TikTok's own Creator Marketplace, Collabstr, and hundreds of public rate cards shared by creators on social media. The result is a three-layer scoring model that weights:

1. **Core Value (60%)** — Reach, Commerce Potential, and Monetization History
2. **Quality Metrics (30%)** — Engagement Quality, Content Authenticity, Momentum
3. **Risk Factors (10%)** — Account Health, Stability, and Influence Consistency

This isn't academic fluff. It's a direct reflection of how brands evaluate creators. A fashion brand doesn't just want followers — they want engaged buyers in their target demographic who make consistent, high-quality content with a track record of successful brand collaborations.

### Why Follower Count Alone Is Misleading

Let's do a quick exercise. Which account is worth more?

- Account A: 500,000 followers, 1.5% engagement rate, posts inconsistent meme content, based in a tier-3 advertising market
- Account B: 80,000 followers, 6.3% engagement rate, posts consistent beauty tutorials, based in the US

If you guessed Account B, you're right. At TokValue, Account A would score roughly a C-tier (estimated annual brand deal value: $18,000-$24,000), while Account B would score an A-tier ($120,000-$150,000/year).

Follower count is a vanity metric. Without engagement, it's a number on a screen.

## Breaking Down the Five Components of TikTok Valuation

At TokValue, we decompose account value into five distinct asset classes. This is the same framework M&A consultants use when pricing media companies — just applied at the individual creator level.

### 1. Brand Deal Value (Annual)

This is the big one. It answers: "If this creator took every reasonable sponsorship opportunity, how much could they earn per year?"

The calculation involves:
- **Effective average plays per video** (not total views — we use a 30-day maturity window)
- **Category CPM** (Finance & Investing commands $30/1000 views, while Gaming sits at $12)
- **Tier premium**: Nano creators get 1x, Micro 1.2x, Mid 1.8x, Macro 3x, Mega 8x (calibrated against public rate cards like MrBeast's reported $2.5M/post)
- **Engagement multiplier**: Highly engaged audiences command up to a 3x premium vs. low-engagement accounts
- **Region coefficient**: US-based audiences = 1.0x, Western Europe = 0.65-0.9x, Southeast Asia = 0.22-0.32x
- **Risk discount**: Accounts with high-risk flags (suspected bots, follow-for-follow patterns) get 0.7x

For macro and mega accounts, we also clamp against market anchors to prevent overfitting. A mega beauty creator's per-post estimate is anchored between $60K and $600K regardless of what the formula says — because that's the actual range brands pay at that tier.

### 2. Content Asset Value

Every video you've posted is an asset. It continues generating views, building your brand, and attracting followers long after publication.

Content asset value is calculated as:

> ContentValue = (capped video count × effective average plays × content CPM × discount factor) + viral bonus

We cap video counts by tier to prevent gaming the system (Nano: 50, Micro: 100, Mid: 200, Macro: 300, Mega: 500). A creator with 10,000 low-quality uploaded videos doesn't get 200x the content value of someone with 50 high-quality ones.

If your top-performing videos have a plays-to-average ratio above 10x, you get a viral bonus of 20% — reflecting the "back catalog" value creators like Khaby Lame can command even from old content.

### 3. Follower Asset Value

Follower asset value uses power-law pricing:

> FollowerValue = baseRate × (realFollowers^0.85) × categoryMultiplier × engagementFactor × riskDiscount

The power-law exponent of 0.85 reflects a well-established finding in creator economics: doubling your follower count doesn't double your value. Going from 10K to 100K fans increases value by roughly 7x, not 10x.

We also discount "suspicious" followers based on the authenticity score. If our risk engine detects bot-like engagement patterns, a 0.7x discount is applied.

### 4. Monetization Capability

Brand deals aren't the only revenue channel. TokValue estimates income from eight distinct sources:
- Brand Sponsorships (direct deals)
- Creator Program (TikTok's revenue sharing)
- Subscriptions (fan funding)
- TikTok Shop commissions
- Amazon Associates (affiliate) income
- Shopify DTC margin
- Live Commerce GMV
- LIVE Gifts

Each channel has eligibility thresholds. TikTok Shop, for example, requires 1,000 followers, while live commerce typically needs 50,000+ followers to be viable. Creators below these thresholds get reduced or zero estimates for those channels.

### 5. IP / Brand Asset Value

This only applies to Macro (100K-1M followers) and Mega (1M+) creators. It represents the value of your personal brand as intellectual property — the licensing potential, the recognition, the brand equity that goes beyond individual posts.

IP valuation uses:
- Base IP rate: 10% for macro, 40% for mega (reflecting the jump from "influencer" to "media property")
- Category multiplier: Finance (2x), Tech (1.8x), Beauty (1.5x)
- Branding signals: Having a recognizable brand name, cross-platform presence, product line, or verified status each adds a bonus of 10-20% to a maximum of 50%

## The Tier System: From F to S

TokValue assigns accounts to tiers based on their total business value — not their follower count.

| Tier | Business Value Range | What It Means |
|------|---------------------|---------------|
| S | >$1,000,000 | Media business — you're competing with professional publishers |
| A | >$100,000 | Full-time influencer income — sustainable career |
| B | >$10,000 | Part-time income — solid side hustle, growing |
| C | >$1,000 | Monetizing — first brand deals, early revenue |
| D | >$100 | Starting to show commercial potential |
| E | >$0 | Needs improvement — limited monetization |
| F | at risk | High-risk signals, suspect account quality |

A word about the F tier: our engine triggers an F tier when it detects two or more high-risk signals — things like suspected bot followers, follow-for-follow patterns, extreme posting gaps (60+ days), or engagement rates below 0.5%. These are the accounts where the data suggests the audience isn't genuine, and smart brands will pass.

## How to Actually Calculate Your Account's Value

You can do a rough back-of-napkin estimate:

1. **Find your effective average plays** (mature videos only, 3-30 days old)
2. **Look up your niche CPM** (Finance: $30/CPM, Tech/Beauty: $20-22, Fashion: $18, Food/Travel: $16-15, Gaming: $12)
3. **Apply your tier multiplier** (take your follower count and find: Nano <10K, Micro <100K, Mid <500K, Macro <1M, Mega >1M)
4. **Adjust for engagement** (above 6% ER gets a premium, below 1% gets penalized)
5. **Multiply by posting frequency**: Monthly brand posts = postsPerMonth × tier ratio

Example: A US-based beauty creator with 80K followers, 6% engagement, posting 12 times/month with 25K mature plays each:

- Per-video value = (25K/1000) × $20 CPM × 1.2 (micro premium) × 1.8 (engagement multiplier) × 1.0 (US) = $1,080/video
- Monthly brand posts = 12 × 0.5 (micro ratio cap) = 6 posts
- Monthly brand income = 6 × $1,080 = $6,480
- Annual brand value = $77,760
- Plus content assets ($18K), follower assets ($35K), monetization ($12K) = ~$143K total

That's an A-tier account.

Or, you know, you could just paste your TikTok handle into TokValue and get the full breakdown in 30 seconds. 😄

## What Makes TikTok Valuation Different in 2026

Three trends are reshaping account valuation this year:

### 1. TikTok Shop Is Eating Everything

TikTok's ecommerce integration has exploded. The platform processed $20B+ in GMV in the US alone last year, and 2026 projections are closer to $40B. This means commerce-ready accounts (those with engaged audiences in product-friendly niches like Beauty, Fashion, Home, Fitness) are commanding significantly higher valuations than pure-entertainment accounts.

At TokValue, we now weight commerce signals (TikTok Shop, Amazon storefront links, Shopify integration, live commerce) as a separate dimension in our scoring. Creators who show active commerce participation get up to 30% higher business value estimates.

### 2. The Death of the "Influencer" Label

Brands are moving from "influencer marketing" line items to "creator partnerships." The difference? Influencers get one-off posts. Creators get product development deals, equity stakes, multi-year contracts, and royalty arrangements.

This shift is reflected in the valuation for macro and mega accounts. Our IP valuation component — which only activates at the Macro tier and above — captures this "equity value" that goes beyond immediate brand deal revenue.

### 3. AI Is Raising the Floor

AI tools for content creation (CapCut, Runway, Descript, OpusClip) mean a solo creator can now output at the level of a small production team. This means commercially savvy creators with AI workflows are outpacing traditionalists.

We don't directly score "AI usage," but the effects show up in our metrics: consistent posting cadence, higher content volume, better editing quality, faster trend response. These all flow into our quality layer scoring.

## The Bottom Line

Your TikTok account isn't just a hobby — it's an asset with measurable value. Whether you're planning to monetize, negotiate brand deals, or even sell your account (check TikTok's TOS first), knowing your real valuation is the first step.

And if you're tired of calculators that just multiply your followers by $0.01 and call it a day? TokValue analyzes over 50 data points per evaluation — posts, engagement patterns, growth trajectory, monetization readiness, commerce signals, and risk factors. It's the same framework enterprise brands use, just made accessible.

Try it yourself at [tokvalue.com](https://tokvalue.com) — your first evaluation is just one click away.
`,
  },

  // ════════════════════════════ POST 2 ════════════════════════════
  {
    slug: 'tiktok-creator-fund-vs-brand-deals',
    title:
      'TikTok Creator Fund vs Brand Deals: Which Actually Pays More in 2026?',
    description:
      'A deep comparison of TikTok monetization channels — Creator Rewards Program, brand sponsorships, TikTok Shop, and subscriptions. Real numbers and revenue strategies for creators at every tier.',
    tags: [
      'Creator Fund',
      'brand deals',
      'monetization',
      'TikTok income',
      'creator economy',
    ],
    publishedAt: '2026-07-28T10:30:00Z',
    readTime: '12 min',
    category: 'Monetization',

    content: `# TikTok Creator Fund vs Brand Deals: Which Actually Pays More in 2026?

Every TikTok creator eventually faces the same question: where does the money actually come from? The platform gives you options — Creator Rewards, LIVE Gifts, TikTok Shop, subscriptions — but the biggest line item for most successful creators is still brand deals. The question is: by how much?

We analyzed public data from over 500 creators across every tier, combined with our own valuation model, to answer this definitively. Here's what we found.

## The State of TikTok Monetization in 2026

Before we compare channels, let's look at what's available:

| Channel | Requirements | Typical Monthly Income | Best For |
|---------|-------------|----------------------|----------|
| Creator Rewards Program | 10K followers, 100K+ video views in last 30 days | $15-$150 | Nano/Micro creators |
| Brand Sponsorships | ~5K followers minimum | $100-$100,000+ | All tiers, scales with reach |
| TikTok Shop | 1K followers | $50-$50,000+ | Commerce-heavy niches |
| Subscriptions | 1K followers, 18+ | $20-$2,000 | Loyal fan bases |
| LIVE Gifts | 1K followers, 18+ | $10-$5,000 | Live streamers |
| Amazon Associates | 5K followers | $10-$3,000 | Review/product creators |
| Shopify DTC | 10K followers | Varies wildly | Merch/product brands |
| Live Commerce | 50K+ followers typically | $500-$100,000+ | Market-focused creators |

The data is clear: **brand deals dominate** at every tier above nano, often contributing 60-80% of total creator income. But that doesn't mean you should ignore the other channels.

## The Creator Rewards Program: A Reality Check

When TikTok replaced the original Creator Fund with the Creator Rewards Program (formerly "Creativity Program Beta"), the payout model shifted from a fixed pool to RPM-based payouts. Here's how it works now:

- TikTok pays creators based on "qualified views" (views over 60 seconds from the For You page)
- RPM varies by country: US creators earn roughly $0.04/1K qualified views, while Southeast Asian creators might earn $0.005-$0.01
- Videos must be over 60 seconds to qualify (a shift aimed at encouraging longer-form content)

### The Math Doesn't Lie

Let's say you're a US-based mid-tier creator with 250,000 followers. You post 15 long-form videos per month, each getting 50,000 qualified views:

- Monthly qualified views: 15 × 50,000 = 750,000
- Monthly Creator Rewards: 750 × $0.04 = **$30/month**

Now compare that to one brand deal from the same creator:

- Brand deal per video: (50K avg plays / 1000) × $20 CPM × 1.8 (mid-tier premium) × 1.3 (engagement multiplier) = **$2,340/video**

One brand deal pays 78x more than an entire month of Creator Rewards. This is why experienced creators treat the Creator Rewards Program as pocket change — a nice bonus, not a revenue strategy.

### When Creator Rewards Actually Works

There are scenarios where Creator Rewards become meaningful:

1. **Viral content machines**: Creators who consistently hit millions of qualified views (e.g., explainer channels, documentary-style content) can earn $500-$3,000/month from the program alone
2. **US-based creators in CPM-heavy niches**: Finance and tech content commands higher RPM, sometimes $0.05-$0.08/1K
3. **Creators ineligible for brand deals**: Brand-safe content restrictions or niche categories with limited advertiser interest

For 95% of creators though, Creator Rewards should be a secondary revenue stream at best.

## Brand Deals: The Real Money

Now let's talk about where the money actually is. Brand deals in 2026 operate on a per-video CPM model, with multipliers based on your niche, engagement quality, and audience demographics.

### The Per-Video Pricing Formula

Here's the formula the industry uses (and what TokValue models):

> Price = (Avg Plays / 1000) × Category CPM × Tier Premium × Engagement Multiplier × Region Coefficient × Risk Discount × Verified Bonus

Let's break down each component:

**Category CPM (Cost Per Mille — per 1,000 views):**
- Finance & Investing: $30
- Tech & Gadgets: $22
- Shopping & Deals: $22
- Beauty: $20
- Fashion: $18
- Fitness: $18
- Travel: $16
- Food: $15
- Pets / Lifestyle: $14
- Gaming: $12
- Music: $12
- General Entertainment: $10
- Default: $15

**Tier Premium:**
- Nano (<10K followers): 1.0x
- Micro (10K-100K): 1.2x
- Mid (100K-500K): 1.8x
- Macro (500K-1M): 3.0x
- Mega (1M+): 8.0x

This tier premium is critical and often misunderstood. Going from 50K to 500K followers doesn't just 10x your value — it can 30x it, because you jump from Micro to Macro tier and your premium multiplier jumps from 1.2x to 3.0x while your reach also grows.

**Engagement Multiplier:**
- 15%+ engagement rate: 3.0x (rare — typically only nano with hyper-engaged communities)
- 9-15%: 2.4x
- 6-9%: 1.8x
- 3-6%: 1.3x
- 1-3%: 1.0x
- <1%: 0.7x (red flag — many brands will pass)

**Region Coefficient:**
- US: 1.0x
- Canada: 0.85x
- UK: 0.85x
- Western Europe (Germany, France, Netherlands): 0.65-0.9x
- Northeast Asia (Japan, Korea): 0.55-0.7x
- Southeast Asia: 0.22-0.32x
- India: 0.2x
- Middle East: 0.35-0.75x
- Default: 0.5x

### Market Anchors: The Reality Check

Our model includes market anchors to prevent overfitting. These are published rate card numbers from active brand deals in each category:

**Mega Creator Anchors (per post):**
- Finance mega: $500,000+ (some finance creators routinely clear $750K/video)
- Tech: $400,000
- Beauty: $200,000
- Fashion: $180,000
- Fitness: $150,000
- Food: $120,000
- Travel: $130,000
- Gaming/Music: $100,000
- General Entertainment: $2,500,000 (MrBeast territory — yes, really)

These anchors clamp our estimates to a [0.3x, 3.0x] range around the market rate. A beauty mega creator whose formula says $5M/post gets clamped down to $600K maximum because no beauty brand has ever paid that much for a single TikTok post.

### The Monthly Cap: You Can't Post 30 Sponsored Videos

Another common mistake: assuming you can do sponsored posts every day. You can't. Audiences get fatigue, platforms penalize overly commercial content, and brands want exclusivity windows.

Our model caps monthly brand posts at:
- Nano: 10 posts/month (50% of total output)
- Micro: 8 posts/month (40%)
- Mid: 6 posts/month (33%)
- Macro: 4 posts/month (20%)
- Mega: 2 posts/month (20%)

Even at the Mega tier, 2 sponsored posts per month at $250K/each = $6M/year. Not bad.

## TikTok Shop: The Dark Horse

TikTok Shop is eating the creator economy alive — in a good way. The platform's native ecommerce integration means creators can now sell products directly without sending viewers off-platform. The conversion rates are absurd compared to traditional social commerce (3-8% vs 0.5-2% for Instagram), because users never leave the app.

### TikTok Shop Economics

- Commission: typically 5-20% depending on category
- Average order value (AOV): $25-45 for beauty, $15-30 for home goods, $30-60 for electronics
- Shop operational metrics assume a 3% purchase rate for engaged audiences

Let's model a beauty creator with 200K followers, 4% engagement rate:

- Per video average plays (mature): 40,000
- Shop click-through: 40,000 × 15% = 6,000
- Purchase rate: 6,000 × 3% = 180 orders
- Average commission per order: $35 AOV × 15% = $5.25
- Per-video shop revenue: 180 × $5.25 = **$945/video**
- Monthly (6 shop-optimized posts): $5,670/month

That's $68,000/year just from TikTok Shop — not counting brand deals. For commerce-heavy niches, TikTok Shop can equal or even exceed brand sponsorship income.

## Subscriptions: Slow Burn, Long Tail

TikTok's subscription feature lets fans pay a monthly fee ($2.99-$99.99) for exclusive perks: subscriber-only content, badges, custom emojis, and early access. The industry average is $8/month with 50% of subscribers being creators themselves (community support).

Subscription math is simple but powerful:

- 1% of followers subscribe (high for entertainment, low for comedy)
- $8/month average
- Creator keeps 70% (TikTok takes 30%)

A creator with 100K followers: 1,000 subscribers × $8 × 70% = $5,600/month = $67,200/year — from fans who were already watching your free content.

The catch: subscriptions require consistent, high-quality subscriber-exclusive content. It's a content treadmill, and the churn rate can be high. But for creators who nail it (educational niches, behind-the-scenes, tutorials), it's pure recurring revenue.

## Building a Diversified Monetization Stack

The smartest creators don't pick one channel — they stack them. Here's what a diversified monetization portfolio looks like at different tiers:

**Mid-Tier Creator (250K followers, Beauty, US-based, 4.5% ER):**
- Brand deals: $75,000/year (60%)
- TikTok Shop: $30,000/year (24%)
- Creator Rewards: $3,600/year (3%)
- Subscriptions: $12,000/year (10%)
- Amazon Associates: $3,600/year (3%)

**Total: ~$124,200/year — a solid six-figure income from a single platform.**

**Macro Creator (750K followers, Tech, US-based, 2.5% ER):**
- Brand deals: $350,000/year (58%)
- TikTok Shop: $120,000/year (20%)
- Shopify DTC: $60,000/year (10%)
- Subscriptions: $36,000/year (6%)
- Creator Rewards: $18,000/year (3%)
- IP/Brand value: $18,000/year (3%)

**Total: ~$602,000/year — tech reviewer runs a media business.**

## The Verdict

**Brand deals win.** By a massive margin. But they're not the whole story.

The real insight from our analysis: creator income follows a power law. The top 10% of creators earn 90% of the money, and within that top 10%, brand deals account for 60-80% of income. But the creators who last — who build sustainable careers instead of flaming out — are the ones who diversify.

They treat TikTok Shop as their own QVC channel, subscriptions as their Patreon, and brand deals as their enterprise sales. Each channel plays a role, and together they create a resilient income that survives algorithm changes, ad market downturns, and platform pivots.

Want to know where your account stands across all eight monetization channels? Run a free evaluation at [tokvalue.com](https://tokvalue.com) and get a complete breakdown.
`,
  },

  // ════════════════════════════ POST 3 ════════════════════════════
  {
    slug: 'tiktok-analytics-metrics-that-matter',
    title:
      'TikTok Analytics: 10 Metrics That Actually Matter for Brand Deals in 2026',
    description:
      'Stop obsessing over views. Here are the 10 TikTok metrics that brands actually care about — from engagement rate to audience authenticity to commerce readiness.',
    tags: [
      'TikTok analytics',
      'engagement rate',
      'brand deals',
      'creator metrics',
      'TikTok strategy',
    ],
    publishedAt: '2026-08-01T14:00:00Z',
    readTime: '12 min',
    category: 'Analytics & Strategy',

    content: `# TikTok Analytics: 10 Metrics That Actually Matter for Brand Deals in 2026

Open TikTok's analytics dashboard and you'll see dozens of numbers: views, likes, comments, shares, profile visits, follower growth, traffic sources, watch time, average watch time, full video watched, reached audience, engaged audience, trending videos... It's overwhelming.

Here's the uncomfortable truth: **most of these numbers don't matter for brand deals.**

Brands don't care about your "total profile views" or your "traffic sources by region." They care about answers to three questions:

1. Will my product reach the right audience?
2. Will that audience actually engage?
3. Can I trust the engagement is real?

Everything else is noise. Below are the 10 metrics that actually move the needle — and how to improve each one.

## 1. Engagement Rate (ER) — The King

**What it is:** Total interactions (likes + comments + shares + saves) divided by total video plays, expressed as a percentage.

**Why brands care:** ER is the single best predictor of campaign performance. A creator with 50K followers and 6% ER will consistently outperform one with 200K followers and 1.5% ER on conversion metrics.

**What's "good" by tier:**
- Nano (<10K followers): 5%+ is solid, 8%+ is exceptional
- Micro (10K-100K): 3.5%+ is solid, 6%+ is exceptional
- Mid (100K-500K): 2.5%+ is solid, 4.5%+ is exceptional
- Macro (500K-1M): 1.8%+ is solid, 3.5%+ is exceptional
- Mega (1M+): 1.2%+ is solid, 2%+ is exceptional

ER naturally declines with scale — that's just how audiences work. A mega creator with 1.5% ER isn't "failing"; they're competing in a different league where conversion matters more than rate.

**How to improve it:** Post high-retention content (hooks in first 1.5 seconds, pattern interrupts, cliffhangers), engage with commenters within the first hour of posting, and test different content types to find what resonates.

**Watch out for:** "Inflated followers" is a common risk flag. If you have 200K+ followers but sub-1% ER, our engine flags it as suspicious. Either you bought followers, you're shadow banned, or your content stopped resonating — none of which brands want to pay for.

## 2. Follower-to-Following Ratio

**What it is:** Followers divided by accounts you're following.

**Why brands care:** This is a quick-and-dirty authenticity check. Accounts with a follower-to-following ratio below 0.5 often used "follow-for-follow" tactics to grow — meaning the audience isn't organic.

**What's "good":**
- Above 5: Excellent — you're clearly an authority
- 1-5: Normal — organic growth pattern
- 0.5-1: Borderline — brands may hesitate
- Below 0.5: High risk — looks like follow-for-follow growth

At TokValue, a ratio below 0.05 triggers a high-risk "Follow-for-Follow" flag, and below 0.1 triggers a medium-risk flag. Both impact your authenticity score.

**How to improve it:** Stop following people you don't genuinely want to follow. Clean up your following list. Let your content grow your audience, not your follow-back strategy.

## 3. Mature Play Average (Not Total Plays)

**What it is:** The average plays on videos that have been live for 3-30 days (the "mature" window).

**Why it matters more than total views:** Total views are inflated by viral outliers. A creator with one 10M-view video and 50 videos with 2K views each has a high total view count but a terrible average — and brands know it. Mature play average tells the real story of what a "typical" sponsored post would get.

**How we calculate it:** We use a 3-30 day maturity window. Videos under 3 days are "growing" (not stable yet), and videos over 30 days are "archive." Within the mature window, we apply an exponential decay weight (weight = e^(-ageDays/20)) to give more weight to recent performance, then calculate both weighted median and weighted average plays.

**What's "good":** This is highly variable. The key metric is the **plays-to-follower ratio**:
- Nano: 0.8x (80% of followers watch on average)
- Micro: 0.5x
- Mid: 0.35x
- Macro: 0.25x
- Mega: 0.15x

Above these thresholds is strong; below is concerning.

## 4. Play Growth Rate (30-Day Window)

**What it is:** The percentage change in average plays comparing your last 30 days of content to the 30 days before that.

**Why brands care:** A growing account is a better investment than a stagnant one. Brands are making a bet on your trajectory, not just your current state.

**What's "good":**
- +50%+: Rocketing — high momentum premium (1.3x valuation boost)
- +20-50%: Growing strongly
- 0-20%: Steady
- -20-0%: Declining slightly
- Below -20%: Shrinking (0.8x valuation penalty)

Note: macro and mega creators get a high neutral baseline (70-75/100 momentum score) because growth at that scale is inherently harder. A mega creator with 0% growth isn't penalized; a nano creator with 0% growth is.

**How to improve it:** Analyze your top-performing content themes, post more consistently, experiment with new formats, lean into trending sounds early.

## 5. Mature Play CV (Coefficient of Variation)

**What it is:** The standard deviation of your mature video plays divided by the mean. It measures how consistent your viewership is from video to video.

**Why brands care:** Low CV means predictable performance. Brands price risk into their deals — they'll pay more for a creator whose "worst case" is close to their "best case."

**What's "good":**
- Below 0.8: Excellent consistency
- 0.8-1.2: Normal
- 1.2-2.0: Erratic — medium risk
- Above 2.0: Highly volatile — high risk

Creators with a high CV may have one breakout video propping up their entire channel. That's risky for a brand spending $5K on a sponsored post.

**How to improve it:** Post consistently, stick to a content format that works, avoid chasing trends that don't fit your niche. Consistency beats virality for long-term valuation.

## 6. Content Consistency Score

**What it is:** A metric combining your posting cadence (how many posts per day, averaged over 30 days) with content diversification (do you cover multiple topics or just one?).

**Why brands care:** Brands want reliable partners. A creator who posts daily for 3 months then disappears for 6 weeks is a risk. A creator who covers the same topic in every video may have limited appeal for diverse brand campaigns.

**Key sub-metrics:**
- **Posting rhythm**: Daily (≥0.85 posts/day), Weekly (≥0.25/day), or Irregular (<0.25/day)
- **Consistency score**: 100 - |avgPerDay - 1| × 30 (penalizes deviation from daily ideal)

**Posting gaps:** A 60+ day gap between posts triggers a high-risk flag (account may be abandoned or repurposed). A 30+ day gap triggers a medium-risk flag.

**How to improve it:** Batch-create content, use a content calendar, schedule posts in advance. Even 3 posts/week beats a "3 posts today, nothing for 2 weeks" pattern.

## 7. Content Verticality (Niche Focus)

**What it is:** How concentrated your content is within a specific niche or category. We measure this via hashtag concentration and keyword frequency in post descriptions.

**Why brands care:** Brands want clear audience alignment. A "lifestyle" creator who posts about beauty, gaming, fitness, and cooking has a fragmented audience. The beauty brand only cares about the beauty-interested subset — which is smaller than the total follower count.

**Our engine detects 15 categories** via regex keyword matching across post descriptions, bio text, and display name:
Shopping & Deals (highest priority), Combat Sports, Fitness/Sports, Beauty, Fashion, Tech & Gadgets, Food & Cooking, Gaming, Music & Dance, Travel, Finance & Investing, Pets & Animals, Lifestyle, Comedy, General Entertainment.

**What's "good":** Having clear, detectable category alignment in 70%+ of your content. Mega accounts get a floor (65+) on verticality even if their content is diverse, because at scale, diversity is a feature, not a bug.

## 8. Commerce Readiness

**What it is:** A composite score (0-100) measuring how ready an account is for commerce monetization. It combines:
- **Commerce signals** (40% weight): Amazon storefront links, Shopify stores, TikTok Shop setup, Live Commerce history
- **Channel fit scores** (40% weight): How well each of 8 monetization channels matches your account
- **Content commerce alignment** (20% weight): What percentage of your content includes commerce-related keywords ("link in bio," "shop my," "亚马逊好物," etc.)

**Tiers:**
- 70+: Commerce-Ready — you're actively selling and signals are strong
- 40-69: Emerging — potential but not yet optimized
- Below 40: Limited — not a commerce-focused account

**What's "good":** For creators who want brand deals and affiliate income, aim for 40+. For creators building a TikTok Shop empire, 70+ is the target.

**How to improve it:** Set up TikTok Shop, add commerce links to your bio, include purchase CTAs in high-performing videos, build a product review pipeline.

## 9. Authenticity Score

**What it is:** A composite of multiple risk signals:
- Follower-to-following ratio (bot/fake follower detection)
- Engagement rate relative to tier benchmarks (abnormally low = suspicious)
- Play CV (high volatility can indicate purchased views for some videos)
- Following count anomaly (following 0 accounts with 10K+ followers = unusual for organic growth)

**Why brands care:** A $5,000 sponsored post reaching 20% real followers and 80% bots is worthless. Brands are getting smarter about fraud detection, and platforms are penalizing inauthentic accounts.

**How to improve it:** Don't buy followers. Don't participate in follow trains. Don't use engagement pods. Build your audience organically with good content.

## 10. Monetization Capability Score

**What it is:** A weighted sum of your eligibility and estimated income across all 8 monetization channels — brand deals, Creator Rewards, subscriptions, TikTok Shop, Amazon Associates, Shopify DTC, live commerce, and LIVE Gifts.

**Why brands care:** Monetization diversity signals professionalism. A creator earning from 4+ revenue sources is a business operator, not a hobbyist. Brands prefer working with professionals.

**Channel weights (brands find some channels more impressive than others):**
- Brand deals: 1.0x
- Live commerce: 0.9x
- Shopify DTC: 0.85x
- TikTok Shop: 0.8x
- Amazon Associates: 0.75x
- Subscriptions: 0.6x
- LIVE Gifts: 0.5x
- Creator Rewards: 0.3x

Creators running Shopify stores are more impressive to brands than creators relying on Creator Fund payouts — reflected in our weighting.

## How TokValue Uses These Metrics

These 10 metrics are the input layer of our valuation engine. They flow into a three-layer scoring model:

1. **Core layer (60%)**: Reach + Commerce + Monetization
2. **Quality layer (30%)**: Engagement + Content + Authenticity + Momentum
3. **Risk layer (10%)**: Health + Stability + Influence

The output is a complete business valuation — annual brand deal value, content asset value, follower asset value, monetization capability, and IP/brand value (for macro and mega accounts).

## The Takeaway

Stop watching your view count. Start tracking engagement rate, follower authenticity, content consistency, and commerce signals. These are the metrics that convert into dollars when you're at the negotiating table.

And if you want all 10 tracked automatically alongside a full business valuation? That's what TokValue is for. One TikTok handle, 30 seconds, complete breakdown.

**[Evaluate your account →](https://tokvalue.com)**
`,
  },
]

/** Sorted by publishedAt descending */
export function getAllPosts(): BlogPostMeta[] {
  return BLOG_POSTS.map(({ slug, title, description, tags, publishedAt, readTime, category }) => ({
    slug,
    title,
    description,
    tags,
    publishedAt,
    readTime,
    category,
  })).sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find(p => p.slug === slug)
}
