import { prisma } from '@repo/database'
import Anthropic from '@anthropic-ai/sdk'

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
// TIPOS
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
// KEYWORD RESEARCH CON IA
// ============================================
export async function generateKeywordResearch(productId: string) {
  console.log('🔍 Generando keyword research...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const product = await prisma.saasProduct.findUnique({
    where: { id: productId }
  })

  if (!product) throw new Error('Product not found')

  const prompt = `
Genera un keyword research completo para Google Ads de este producto SaaS:

PRODUCTO: ${product.name}
DESCRIPCIÓN: ${product.description}
TARGET: ${product.targetAudience}
CATEGORÍA: SaaS / Software

Genera keywords organizadas por:
1. Intención de búsqueda (informacional, navegacional, transaccional)
2. Etapa del funnel (awareness, consideration, decision)
3. Tipo (branded, competitor, generic, long-tail)

Responde SOLO con JSON:
{
  "keywords": {
    "transactional": [
      {
        "keyword": "keyword exacta",
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
      "name": "nombre del ad group",
      "theme": "tema principal",
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

  // Guardar en BD
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

  console.log(`✅ Keyword research generado: ${Object.keys(research.keywords).length} categorías`)

  return research
}

// ============================================
// GENERAR ESTRATEGIA GOOGLE ADS
// ============================================
export async function generateGoogleAdsStrategy(productId: string) {
  console.log('🎯 Generando estrategia Google Ads...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const product = await prisma.saasProduct.findUnique({
    where: { id: productId }
  })

  if (!product) throw new Error('Product not found')

  const prompt = `
Genera una estrategia completa de Google Ads para este producto SaaS:

PRODUCTO: ${product.name}
DESCRIPCIÓN: ${product.description}
TARGET: ${product.targetAudience}
USP: ${product.usp}
PRICING: ${JSON.stringify(product.pricing)}

Crea una estrategia con:
1. Campañas de Search (palabras clave de alta intención)
2. Campañas de Display (remarketing + prospecting)
3. Campañas de YouTube (si aplica)
4. Performance Max (opcional)

Responde SOLO con JSON:
{
  "campaigns": [
    {
      "name": "nombre de campaña",
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

  console.log(`✅ Estrategia Google Ads generada: ${strategy.campaigns.length} campañas`)

  return strategy
}

// ============================================
// CREAR CAMPAÑA EN BD
// ============================================
export async function createGoogleCampaign(params: GoogleCampaignParams) {
  console.log('📢 Creando campaña Google Ads...', params.campaignType)

  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId }
  })

  if (!product) throw new Error('Product not found')

  const campaign = await prisma.marketingAdCampaign.create({
    data: {
      organizationId: product.organizationId,
      productId: params.productId,
      name: `${product.name} - Google ${params.campaignType} Campaign`,
      platform: 'google',
      status: 'DRAFT',
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

  console.log(`✅ Campaña Google creada: ${campaign.id}`)

  return campaign
}

// ============================================
// GENERAR ANUNCIOS RESPONSIVE SEARCH
// ============================================
export async function generateResponsiveSearchAds(params: {
  productId: string
  keywords: string[]
  count?: number
}) {
  console.log('📝 Generando Responsive Search Ads...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId }
  })

  if (!product) throw new Error('Product not found')

  const prompt = `
Genera ${params.count || 3} Responsive Search Ads para Google Ads:

PRODUCTO: ${product.name}
DESCRIPCIÓN: ${product.description}
TARGET: ${product.targetAudience}
KEYWORDS: ${params.keywords.join(', ')}

Para cada RSA genera:
- 15 headlines (máx 30 caracteres cada uno)
- 4 descriptions (máx 90 caracteres cada uno)
- Incluir keywords en headlines
- Variedad de ángulos: beneficio, feature, social proof, urgency, question

Responde SOLO con JSON:
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
        "headline1": "Pin más importante en posición 1",
        "headline2": "CTA en posición 2"
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

  console.log(`✅ ${ads.ads.length} RSAs generados`)

  return ads
}

// ============================================
// OPTIMIZAR CAMPAÑA GOOGLE
// ============================================
export async function optimizeGoogleCampaign(campaignId: string) {
  console.log('⚡ Optimizando campaña Google...')

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
Analiza esta campaña de Google Ads y sugiere optimizaciones:

CAMPAÑA: ${campaign.name}
PRODUCTO: ${campaign.product?.name}
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

Analiza y sugiere optimizaciones para:
1. Keywords (añadir, pausar, negative keywords)
2. Ad copy (headlines, descriptions)
3. Bids y budget allocation
4. Quality Score improvements
5. Audience refinement

Responde SOLO con JSON:
{
  "analysis": {
    "qualityScoreIssues": ["landing page relevance", "ad relevance"],
    "wastedSpend": {
      "keywords": ["keyword con bajo performance"],
      "estimatedSavings": "€X/month"
    },
    "missedOpportunities": ["expandir a Display", "añadir extensions"]
  },
  "optimizations": [
    {
      "area": "keywords | ads | bids | targeting | extensions | landing_page",
      "action": "acción específica",
      "impact": "high | medium | low",
      "expectedResult": "+15% CTR",
      "implementation": "instrucciones paso a paso"
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

  console.log(`✅ Optimización Google generada`)

  return optimization
}

// ============================================
// SYNC METRICS (placeholder)
// ============================================
export async function syncGoogleMetrics(campaignId: string) {
  console.log('📊 Sincronizando métricas Google Ads...')

  // TODO: Integrar con Google Ads API real

  return {
    message: 'Metrics sync placeholder - integrate Google Ads API',
    campaignId
  }
}

