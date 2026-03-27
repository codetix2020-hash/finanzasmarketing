import { prisma } from '@repo/database'
import Anthropic from '@anthropic-ai/sdk'
import { FacebookAdsClient } from './facebook-ads-client'

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
interface CreateCampaignParams {
  productId: string
  objective: 'awareness' | 'traffic' | 'engagement' | 'leads' | 'sales'
  budget: {
    daily: number
    currency: string
  }
  targeting: {
    ageMin?: number
    ageMax?: number
    genders?: ('male' | 'female' | 'all')[]
    locations?: string[]
    interests?: string[]
    behaviors?: string[]
  }
  duration: {
    startDate: Date
    endDate?: Date
  }
}

interface AdCreativeParams {
  productId: string
  campaignId: string
  format: 'image' | 'video' | 'carousel' | 'stories'
  content: {
    headline: string
    primaryText: string
    description?: string
    callToAction: string
    imageUrl?: string
    videoUrl?: string
  }
}

// ============================================
// GENERATE CAMPAIGN STRATEGY WITH AI
// ============================================
export async function generateCampaignStrategy(productId: string) {
  console.log('🎯 Generating FB campaign strategy...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  // Get product
  const product = await prisma.saasProduct.findUnique({
    where: { id: productId }
  })

  if (!product) throw new Error('Product not found')

  const prompt = `
Generate a Facebook Ads strategy for this SaaS product:

PRODUCT: ${product.name}
DESCRIPTION: ${product.description}
TARGET: ${product.targetAudience}
USP: ${product.usp}
PRICING: ${JSON.stringify(product.pricing)}

Create a complete strategy with:
1. 3 campaigns with different objectives (awareness, consideration, conversion)
2. Specific targeting for each campaign
3. Suggested budget
4. Recommended creatives
5. Ad copy for each ad

Respond ONLY with JSON:
{
  "campaigns": [
    {
      "name": "campaign name",
      "objective": "awareness | traffic | engagement | leads | sales",
      "stage": "tofu | mofu | bofu",
      "targeting": {
        "ageMin": 25,
        "ageMax": 45,
        "genders": ["all"],
        "interests": ["technology", "startups", "productivity"],
        "behaviors": ["small_business_owners"],
        "customAudiences": ["website_visitors", "email_list"]
      },
      "budget": {
        "daily": 20,
        "suggested_duration_days": 14
      },
      "creatives": [
        {
          "format": "image | video | carousel",
          "headline": "Strong headline (max 40 chars)",
          "primaryText": "Primary text (max 125 chars)",
          "description": "Description (max 30 chars)",
          "callToAction": "Learn More | Sign Up | Get Started | Shop Now",
          "imagePrompt": "image description to generate",
          "hook": "first second of video if applicable"
        }
      ]
    }
  ],
  "totalBudget": {
    "daily": 60,
    "monthly": 1800
  },
  "expectedResults": {
    "reach": "50,000-100,000",
    "clicks": "500-1,000",
    "conversions": "10-30",
    "cpa": "€15-25"
  },
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ]
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const strategy = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  // Save strategy in DB
  await prisma.marketingContent.create({
    data: {
      organizationId: product.organizationId,
      productId,
      type: 'POST',
      platform: 'facebook',
      title: `FB Ads Strategy: ${product.name}`,
      content: strategy,
      status: 'DRAFT',
      metadata: {
        contentType: 'ads_strategy',
        generator: 'claude-sonnet-4'
      }
    }
  })

  console.log(`✅ Strategy generated: ${strategy.campaigns.length} campaigns`)

  return strategy
}

// ============================================
// CREATE CAMPAIGN WITH FACEBOOK ADS API (REAL)
// ============================================
export async function createCampaign(params: CreateCampaignParams) {
  console.log('📢 Creating FB campaign...', params.objective)

  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId }
  })

  if (!product) throw new Error('Product not found')

  // Create campaign in Facebook Ads API (mock or real)
  const fbClient = new FacebookAdsClient()
  
  // Map objective
  const fbObjective = {
    'awareness': 'REACH',
    'traffic': 'LINK_CLICKS',
    'engagement': 'POST_ENGAGEMENT',
    'leads': 'LEAD_GENERATION',
    'sales': 'CONVERSIONS'
  }[params.objective] || 'LINK_CLICKS'
  
  const fbCampaign = await fbClient.createCampaign({
    name: `${product.name} - ${params.objective}`,
    objective: fbObjective,
    dailyBudget: params.budget.daily,
    status: 'PAUSED'
  })

  // Create campaign record in DB
  const campaign = await prisma.marketingAdCampaign.create({
    data: {
      organizationId: product.organizationId,
      productId: params.productId,
      name: `${product.name} - ${params.objective} Campaign`,
      platform: 'facebook',
      facebookCampaignId: fbCampaign.id, // Facebook Ads ID
      status: 'ACTIVE',
      budget: {
        daily: params.budget.daily,
        currency: params.budget.currency,
        spent: 0,
        limit: params.budget.daily * 30
      },
      targeting: params.targeting,
      performance: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpa: 0,
        roas: 0
      },
      startDate: params.duration.startDate,
      endDate: params.duration.endDate
    }
  })

  console.log(`✅ Campaign created: ${campaign.id} (Facebook ID: ${fbCampaign.id})`)

  return campaign
}

// ============================================
// GENERATE CREATIVES WITH AI
// ============================================
export async function generateAdCreatives(params: {
  productId: string
  campaignObjective: string
  count?: number
}) {
  console.log('🎨 Generating ad creatives...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId }
  })

  if (!product) throw new Error('Product not found')

  const count = params.count || 3

  const prompt = `
Generate ${count} Facebook ad creatives for:

PRODUCT: ${product.name}
DESCRIPTION: ${product.description}
TARGET: ${product.targetAudience}
OBJECTIVE: ${params.campaignObjective}

For each creative, generate:
1. Headline (max 40 chars) - must capture immediate attention
2. Primary text (max 125 chars) - beneficio principal
3. Description (max 30 chars) - refuerzo
4. Appropriate CTA
5. Image description to generate with AI
6. Video hook variation (first 3 seconds)

Respond ONLY with JSON:
{
  "creatives": [
    {
      "variant": "A",
      "angle": "problem | solution | benefit | social_proof | urgency",
      "headline": "...",
      "primaryText": "...",
      "description": "...",
      "callToAction": "Learn More | Sign Up | Get Started | Shop Now | Download",
      "imagePrompt": "detailed description to generate image",
      "videoHook": "text for first 3 seconds of video",
      "expectedCTR": "1.5-2.5%"
    }
  ],
  "testingPlan": {
    "duration": "7 days",
    "metric": "CTR",
    "winnerCriteria": "Highest CTR after 1000 impressions each"
  }
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const creatives = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  // Save creatives in DB
  for (const creative of creatives.creatives) {
    await prisma.marketingContent.create({
      data: {
        organizationId: product.organizationId,
        productId: params.productId,
        type: 'POST',
        platform: 'facebook',
        title: `FB Ad: ${creative.headline}`,
        content: creative,
        status: 'DRAFT',
        metadata: {
          contentType: 'ad_creative',
          variant: creative.variant,
          angle: creative.angle,
          campaignObjective: params.campaignObjective
        }
      }
    })
  }

  console.log(`✅ ${creatives.creatives.length} creatives generated`)

  return creatives
}

// ============================================
// OPTIMIZE EXISTING CAMPAIGN
// ============================================
export async function optimizeCampaign(campaignId: string) {
  console.log('⚡ Optimizing campaign...', campaignId)

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const campaign = await prisma.marketingAdCampaign.findUnique({
    where: { id: campaignId },
    include: { product: true }
  })

  if (!campaign) throw new Error('Campaign not found')

  const performance = campaign.performance as any || {}

  const prompt = `
Analyze this Facebook Ads campaign and suggest optimizations:

CAMPAIGN: ${campaign.name}
PRODUCT: ${campaign.product?.name}
STATUS: ${campaign.status}
PLATAFORMA: ${campaign.platform}

CURRENT PERFORMANCE:
- Impressions: ${performance.impressions || 0}
- Clicks: ${performance.clicks || 0}
- CTR: ${performance.ctr || 0}%
- Conversions: ${performance.conversions || 0}
- CPA: €${performance.cpa || 0}
- ROAS: ${performance.roas || 0}x

BUDGET:
${JSON.stringify(campaign.budget)}

TARGETING:
${JSON.stringify(campaign.targeting)}

Analyze and suggest:
1. Targeting adjustments to make
2. Creatives to test
3. Budget adjustments
4. Cambios en bidding strategy

Respond ONLY with JSON:
{
  "analysis": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "opportunities": ["..."]
  },
  "optimizations": [
    {
      "area": "targeting | creative | budget | bidding",
      "current": "current state",
      "recommended": "recommended change",
      "expectedImpact": "+15% CTR",
      "priority": "high | medium | low"
    }
  ],
  "actionItems": [
    {
      "action": "specific action",
      "timeline": "immediate | this week | next week"
    }
  ],
  "projectedResults": {
    "ctr": "+X%",
    "cpa": "-X%",
    "roas": "+X%"
  }
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const optimization = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  // Save recommendation in decisions
  await prisma.marketingDecision.create({
    data: {
      organizationId: campaign.organizationId,
      agentType: 'ads',
      decision: JSON.stringify(optimization),
      reasoning: `Campaign optimization for ${campaign.name}`,
      context: {
        campaignId,
        currentPerformance: performance
      },
      executedAt: new Date()
    }
  })

  console.log(`✅ Optimization generated: ${optimization.optimizations.length} recommendations`)

  return optimization
}

// ============================================
// PAUSE/REACTIVATE CAMPAIGN
// ============================================
export async function updateCampaignStatus(
  campaignId: string, 
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT'
) {
  console.log(`📢 Updating campaign ${campaignId} a ${status}`)

  const campaign = await prisma.marketingAdCampaign.update({
    where: { id: campaignId },
    data: { status }
  })

  return campaign
}

// ============================================
// SYNC CAMPAIGN METRICS (REAL IMPLEMENTATION)
// ============================================
export async function syncCampaignMetrics(campaignId: string) {
  console.log('📊 Syncing Facebook Ads metrics...')

  const campaign = await prisma.marketingAdCampaign.findUnique({
    where: { id: campaignId }
  })

  if (!campaign) throw new Error('Campaign not found')

  if (!campaign.facebookCampaignId) {
    throw new Error('No Facebook Campaign ID found')
  }

  // Fetch insights from Facebook Ads API
  const fbClient = new FacebookAdsClient()
  const insights = await fbClient.syncInsights(campaign.facebookCampaignId)

  // Update in DB
  await prisma.marketingAdCampaign.update({
    where: { id: campaignId },
    data: {
      performance: {
        impressions: insights.impressions,
        clicks: insights.clicks,
        conversions: insights.conversions,
        ctr: insights.ctr,
        cpc: insights.cpc,
        cpm: insights.cpm,
        cpa: insights.spend / (insights.conversions || 1),
        roas: 0, // Calculate based on revenue tracking
        spend: insights.spend,
        lastSyncAt: new Date().toISOString()
      }
    }
  })

  console.log(`✅ Metrics synced for campaign ${campaignId}`)

  return insights
}

