import { prisma } from '@repo/database'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleAdsClient } from './google-ads-client'

let anthropicClient: Anthropic | null = null

function getAnthropicClient() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }
  return anthropicClient
}

// ============================================
// TYPES
// ============================================
interface GoogleCampaignParams {
  productId: string
  campaignType: 'search' | 'display' | 'youtube' | 'performance_max'
  budget: {
    daily: number
    currency: string
  }
  targeting: {
    keywords?: string[]
    locations?: string[]
    languages?: string[]
    audiences?: string[]
    demographics?: {
      ageRanges?: string[]
      genders?: string[]
      householdIncome?: string[]
    }
  }
  bidStrategy: 'maximize_clicks' | 'maximize_conversions' | 'target_cpa' | 'target_roas'
  duration: {
    startDate: Date
    endDate?: Date
  }
}

// ============================================
// KEYWORD RESEARCH WITH AI
// ============================================
export async function generateKeywordResearch(productId: string) {
  console.log('🔍 Generating keyword research...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const product = await prisma.saasProduct.findUnique({
    where: { id: productId }
  })

  if (!product) throw new Error('Product not found')

  const prompt = `
Generate complete Google Ads keyword research for this SaaS product:

PRODUCT: ${product.name}
DESCRIPTION: ${product.description}
TARGET: ${product.targetAudience}
CATEGORY: SaaS / Software

Generate keywords organized by:
1. Search intent (informational, navigational, transactional)
2. Funnel stage (awareness, consideration, decision)
3. Type (branded, competitor, generic, long-tail)

Respond ONLY with JSON:
{
  "keywords": {
    "transactional": [
      {
        "keyword": "exact keyword",
        "matchType": "exact | phrase | broad",
        "estimatedCPC": 2.5,
        "estimatedVolume": "1K-10K",
        "competition": "high | medium | low",
        "intent": "buy | compare | trial",
        "suggestedBid": 3.0
      }
    ],
    "informational": [...],
    "navigational": [...],
    "competitor": [...]
  },
  "negativeKeywords": [
    "free",
    "crack",
    "pirate",
    "tutorial"
  ],
  "adGroups": [
    {
      "name": "ad group name",
      "theme": "main theme",
      "keywords": ["keyword1", "keyword2"],
      "suggestedBudgetShare": "30%"
    }
  ],
  "estimatedMetrics": {
    "totalMonthlySearches": "10K-50K",
    "averageCPC": 2.5,
    "estimatedMonthlyClicks": "500-1000",
    "estimatedMonthlyBudget": "€1,250-2,500"
  }
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const research = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  // Save in DB
  await prisma.marketingContent.create({
    data: {
      organizationId: product.organizationId,
      productId,
      type: 'POST',
      platform: 'google',
      title: `Keyword Research: ${product.name}`,
      content: research,
      status: 'DRAFT',
      metadata: {
        contentType: 'keyword_research',
        generator: 'claude-sonnet-4'
      }
    }
  })

  console.log(`✅ Keyword research generated: ${Object.keys(research.keywords).length} categories`)

  return research
}

// ============================================
// GENERATE GOOGLE ADS STRATEGY
// ============================================
export async function generateGoogleAdsStrategy(productId: string) {
  console.log('🎯 Generating Google Ads strategy...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const product = await prisma.saasProduct.findUnique({
    where: { id: productId }
  })

  if (!product) throw new Error('Product not found')

  const prompt = `
Generate a complete Google Ads strategy for this SaaS product:

PRODUCT: ${product.name}
DESCRIPTION: ${product.description}
TARGET: ${product.targetAudience}
USP: ${product.usp}
PRICING: ${JSON.stringify(product.pricing)}

Create a strategy with:
1. Search campaigns (high-intent keywords)
2. Display campaigns (remarketing + prospecting)
3. YouTube campaigns (if applicable)
4. Performance Max (optional)

Respond ONLY with JSON:
{
  "campaigns": [
    {
      "name": "campaign name",
      "type": "search | display | youtube | performance_max",
      "objective": "leads | sales | traffic | awareness",
      "budget": {
        "daily": 30,
        "bidStrategy": "maximize_conversions | target_cpa | target_roas | maximize_clicks"
      },
      "targeting": {
        "keywords": ["keyword1", "keyword2"],
        "audiences": ["in-market: software", "affinity: tech enthusiasts"],
        "placements": ["youtube.com", "tech blogs"],
        "demographics": {
          "ageRanges": ["25-34", "35-44"],
          "householdIncome": ["top 30%"]
        }
      },
      "adGroups": [
        {
          "name": "ad group name",
          "keywords": ["kw1", "kw2"],
          "ads": [
            {
              "type": "responsive_search | responsive_display | video",
              "headlines": ["Headline 1 (30 chars)", "Headline 2", "Headline 3"],
              "descriptions": ["Description 1 (90 chars)", "Description 2"],
              "finalUrl": "{product_url}",
              "callToAction": "Sign Up | Learn More | Get Started"
            }
          ]
        }
      ]
    }
  ],
  "totalBudget": {
    "daily": 100,
    "monthly": 3000
  },
  "expectedResults": {
    "impressions": "100K-500K",
    "clicks": "2K-5K",
    "conversions": "50-150",
    "cpa": "€20-40",
    "roas": "3-5x"
  },
  "optimizationPlan": {
    "week1": "Launch and gather data",
    "week2": "Optimize bids and pause underperformers",
    "week3": "Scale winners, test new ad copy",
    "week4": "Review and adjust strategy"
  }
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3500,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const strategy = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  await prisma.marketingContent.create({
    data: {
      organizationId: product.organizationId,
      productId,
      type: 'POST',
      platform: 'google',
      title: `Google Ads Strategy: ${product.name}`,
      content: strategy,
      status: 'DRAFT',
      metadata: {
        contentType: 'ads_strategy',
        generator: 'claude-sonnet-4'
      }
    }
  })

  console.log(`✅ Google Ads strategy generated: ${strategy.campaigns.length} campaigns`)

  return strategy
}

// ============================================
// CREATE CAMPAIGN IN GOOGLE ADS (REAL)
// ============================================
export async function createGoogleCampaign(params: GoogleCampaignParams) {
  console.log('📢 Creating Google Ads campaign...', params.campaignType)

  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId }
  })

  if (!product) throw new Error('Product not found')

  // Create campaign in Google Ads API (mock or real)
  const googleClient = new GoogleAdsClient()
  const googleCampaign = await googleClient.createCampaign({
    name: `${product.name} - Google ${params.campaignType}`,
    budget: params.budget.daily,
    keywords: params.targeting.keywords,
    targetLocation: params.targeting.locations?.[0],
  })

  // Save in DB
  const campaign = await prisma.marketingAdCampaign.create({
    data: {
      organizationId: product.organizationId,
      productId: params.productId,
      name: `${product.name} - Google ${params.campaignType} Campaign`,
      platform: 'google',
      googleCampaignId: googleCampaign.id, // Google Ads ID
      status: 'ACTIVE',
      budget: {
        daily: params.budget.daily,
        currency: params.budget.currency,
        spent: 0,
        limit: params.budget.daily * 30,
        bidStrategy: params.bidStrategy
      },
      targeting: params.targeting,
      performance: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpa: 0,
        roas: 0,
        qualityScore: 0
      },
      startDate: params.duration.startDate,
      endDate: params.duration.endDate
    }
  })

  console.log(`✅ Google campaign created: ${campaign.id} (Google ID: ${googleCampaign.id})`)

  return campaign
}

// ============================================
// GENERATE RESPONSIVE SEARCH ADS
// ============================================
export async function generateResponsiveSearchAds(params: {
  productId: string
  keywords: string[]
  count?: number
}) {
  console.log('📝 Generating Responsive Search Ads...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId }
  })

  if (!product) throw new Error('Product not found')

  const prompt = `
Generate ${params.count || 3} Responsive Search Ads for Google Ads:

PRODUCT: ${product.name}
DESCRIPTION: ${product.description}
TARGET: ${product.targetAudience}
KEYWORDS: ${params.keywords.join(', ')}

For each RSA generate:
- 15 headlines (max 30 characters each)
- 4 descriptions (max 90 characters each)
- Include keywords in headlines
- Variety of angles: benefit, feature, social proof, urgency, question

Respond ONLY with JSON:
{
  "ads": [
    {
      "name": "RSA Variant A",
      "headlines": [
        "Headline 1 (max 30 chars)",
        "Headline 2",
        "..."
      ],
      "descriptions": [
        "Description 1 - max 90 chars with clear benefit",
        "Description 2",
        "Description 3",
        "Description 4"
      ],
      "finalUrl": "{product_url}",
      "path1": "path1",
      "path2": "path2",
      "pinning": {
        "headline1": "Most important pin in position 1",
        "headline2": "CTA in position 2"
      }
    }
  ],
  "adStrength": "Excellent | Good | Average",
  "recommendations": [
    "Include more unique headlines",
    "Add dynamic keyword insertion"
  ]
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const ads = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  for (const ad of ads.ads) {
    await prisma.marketingContent.create({
      data: {
        organizationId: product.organizationId,
        productId: params.productId,
        type: 'POST',
        platform: 'google',
        title: `Google RSA: ${ad.name}`,
        content: ad,
        status: 'DRAFT',
        metadata: {
          contentType: 'responsive_search_ad',
          keywords: params.keywords
        }
      }
    })
  }

  console.log(`✅ ${ads.ads.length} RSAs generated`)

  return ads
}

// ============================================
// OPTIMIZE GOOGLE CAMPAIGN
// ============================================
export async function optimizeGoogleCampaign(campaignId: string) {
  console.log('⚡ Optimizing Google campaign...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const campaign = await prisma.marketingAdCampaign.findUnique({
    where: { id: campaignId },
    include: { product: true }
  })

  if (!campaign) throw new Error('Campaign not found')

  const performance = campaign.performance as any || {}
  const budget = campaign.budget as any || {}

  const prompt = `
Analyze this Google Ads campaign and suggest optimizations:

CAMPAIGN: ${campaign.name}
PRODUCT: ${campaign.product?.name}
PLATAFORMA: Google Ads (${campaign.platform})

PERFORMANCE:
- Impressions: ${performance.impressions || 0}
- Clicks: ${performance.clicks || 0}
- CTR: ${performance.ctr || 0}%
- Conversions: ${performance.conversions || 0}
- CPA: €${performance.cpa || 0}
- ROAS: ${performance.roas || 0}x
- Quality Score: ${performance.qualityScore || 0}/10

BUDGET:
- Daily: €${budget.daily || 0}
- Bid Strategy: ${budget.bidStrategy || 'unknown'}

TARGETING:
${JSON.stringify(campaign.targeting)}

Analyze and suggest optimizations for:
1. Keywords (add, pause, negative keywords)
2. Ad copy (headlines, descriptions)
3. Bids and budget allocation
4. Quality Score improvements
5. Audience refinement

Respond ONLY with JSON:
{
  "analysis": {
    "qualityScoreIssues": ["landing page relevance", "ad relevance"],
    "wastedSpend": {
      "keywords": ["keyword with low performance"],
      "estimatedSavings": "€X/month"
    },
    "missedOpportunities": ["expand to Display", "add extensions"]
  },
  "optimizations": [
    {
      "area": "keywords | ads | bids | targeting | extensions | landing_page",
      "action": "specific action",
      "impact": "high | medium | low",
      "expectedResult": "+15% CTR",
      "implementation": "step-by-step instructions"
    }
  ],
  "keywordsToAdd": ["new keyword 1", "new keyword 2"],
  "keywordsToPause": ["poor performer 1"],
  "negativeKeywordsToAdd": ["irrelevant term"],
  "adExtensionsToAdd": ["sitelinks", "callouts", "structured snippets"],
  "projectedImpact": {
    "ctr": "+X%",
    "qualityScore": "+X points",
    "cpa": "-X%",
    "conversions": "+X%"
  }
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const optimization = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  await prisma.marketingDecision.create({
    data: {
      organizationId: campaign.organizationId,
      agentType: 'ads',
      decision: JSON.stringify(optimization),
      reasoning: `Google Ads optimization for ${campaign.name}`,
      context: {
        campaignId,
        platform: 'google',
        currentPerformance: performance
      },
      executedAt: new Date()
    }
  })

  console.log(`✅ Google optimization generated`)

  return optimization
}

// ============================================
// SYNC METRICS (REAL IMPLEMENTATION)
// ============================================
export async function syncGoogleMetrics(campaignId: string) {
  console.log('📊 Syncing Google Ads metrics...')

  const campaign = await prisma.marketingAdCampaign.findUnique({
    where: { id: campaignId }
  })

  if (!campaign || !campaign.googleCampaignId) {
    throw new Error('Campaign not found or no Google Campaign ID')
  }

  // Fetch metrics from Google Ads API
  const googleClient = new GoogleAdsClient()
  const metrics = await googleClient.syncMetrics(campaign.googleCampaignId)

  // Update in DB
  await prisma.marketingAdCampaign.update({
    where: { id: campaignId },
    data: {
      performance: {
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        conversions: metrics.conversions,
        ctr: metrics.ctr,
        cpc: metrics.cpc,
        cpa: metrics.cost / (metrics.conversions || 1),
        roas: 0, // Calculate based on revenue tracking
        qualityScore: 0, // Fetch from Google Ads
        spend: metrics.cost,
        lastSyncAt: new Date().toISOString()
      }
    }
  })

  console.log(`✅ Metrics synced for campaign ${campaignId}`)

  return metrics
}

