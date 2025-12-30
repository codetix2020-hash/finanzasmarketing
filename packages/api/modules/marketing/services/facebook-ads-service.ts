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
// TIPOS
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
// GENERAR ESTRATEGIA DE CAMPAÑA CON IA
// ============================================
export async function generateCampaignStrategy(productId: string) {
  console.log('🎯 Generando estrategia de campaña FB...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  // Obtener producto
  const product = await prisma.saasProduct.findUnique({
    where: { id: productId }
  })

  if (!product) throw new Error('Product not found')

  const prompt = `
Genera una estrategia de Facebook Ads para este producto SaaS:

PRODUCTO: ${product.name}
DESCRIPCIÓN: ${product.description}
TARGET: ${product.targetAudience}
USP: ${product.usp}
PRICING: ${JSON.stringify(product.pricing)}

Crea una estrategia completa con:
1. 3 campañas con diferentes objetivos (awareness, consideration, conversion)
2. Targeting específico para cada campaña
3. Presupuesto sugerido
4. Creatividades recomendadas
5. Copy para cada anuncio

Responde SOLO con JSON:
{
  "campaigns": [
    {
      "name": "nombre de la campaña",
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
          "headline": "Headline potente (max 40 chars)",
          "primaryText": "Texto principal (max 125 chars)",
          "description": "Descripción (max 30 chars)",
          "callToAction": "Learn More | Sign Up | Get Started | Shop Now",
          "imagePrompt": "descripción de imagen a generar",
          "hook": "primer segundo de video si aplica"
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
    "recomendación 1",
    "recomendación 2"
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

  // Guardar estrategia en BD
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

  console.log(`✅ Estrategia generada: ${strategy.campaigns.length} campañas`)

  return strategy
}

// ============================================
// CREAR CAMPAÑA CON FACEBOOK ADS API (REAL)
// ============================================
export async function createCampaign(params: CreateCampaignParams) {
  console.log('📢 Creando campaña FB...', params.objective)

  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId }
  })

  if (!product) throw new Error('Product not found')

  // Crear campaña en Facebook Ads API (mock o real)
  const fbClient = new FacebookAdsClient()
  
  // Mapear objective
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

  // Crear registro de campaña en BD
  const campaign = await prisma.marketingAdCampaign.create({
    data: {
      organizationId: product.organizationId,
      productId: params.productId,
      name: `${product.name} - ${params.objective} Campaign`,
      platform: 'facebook',
      facebookCampaignId: fbCampaign.id, // ID de Facebook Ads
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

  console.log(`✅ Campaña creada: ${campaign.id} (Facebook ID: ${fbCampaign.id})`)

  return campaign
}

// ============================================
// GENERAR CREATIVIDADES CON IA
// ============================================
export async function generateAdCreatives(params: {
  productId: string
  campaignObjective: string
  count?: number
}) {
  console.log('🎨 Generando creatividades de anuncios...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId }
  })

  if (!product) throw new Error('Product not found')

  const count = params.count || 3

  const prompt = `
Genera ${count} creatividades de anuncios de Facebook para:

PRODUCTO: ${product.name}
DESCRIPCIÓN: ${product.description}
TARGET: ${product.targetAudience}
OBJETIVO: ${params.campaignObjective}

Para cada creatividad genera:
1. Headline (max 40 chars) - debe captar atención inmediata
2. Primary text (max 125 chars) - beneficio principal
3. Description (max 30 chars) - refuerzo
4. CTA apropiado
5. Descripción de imagen para generar con IA
6. Variante de hook para video (primeros 3 segundos)

Responde SOLO con JSON:
{
  "creatives": [
    {
      "variant": "A",
      "angle": "problema | solución | beneficio | social_proof | urgency",
      "headline": "...",
      "primaryText": "...",
      "description": "...",
      "callToAction": "Learn More | Sign Up | Get Started | Shop Now | Download",
      "imagePrompt": "descripción detallada para generar imagen",
      "videoHook": "texto para primeros 3 segundos de video",
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

  // Guardar creatividades en BD
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

  console.log(`✅ ${creatives.creatives.length} creatividades generadas`)

  return creatives
}

// ============================================
// OPTIMIZAR CAMPAÑA EXISTENTE
// ============================================
export async function optimizeCampaign(campaignId: string) {
  console.log('⚡ Optimizando campaña...', campaignId)

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  const campaign = await prisma.marketingAdCampaign.findUnique({
    where: { id: campaignId },
    include: { product: true }
  })

  if (!campaign) throw new Error('Campaign not found')

  const performance = campaign.performance as any || {}

  const prompt = `
Analiza esta campaña de Facebook Ads y sugiere optimizaciones:

CAMPAÑA: ${campaign.name}
PRODUCTO: ${campaign.product?.name}
ESTADO: ${campaign.status}
PLATAFORMA: ${campaign.platform}

PERFORMANCE ACTUAL:
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

Analiza y sugiere:
1. Qué ajustes hacer al targeting
2. Qué creatividades probar
3. Ajustes de presupuesto
4. Cambios en bidding strategy

Responde SOLO con JSON:
{
  "analysis": {
    "strengths": ["..."],
    "weaknesses": ["..."],
    "opportunities": ["..."]
  },
  "optimizations": [
    {
      "area": "targeting | creative | budget | bidding",
      "current": "estado actual",
      "recommended": "cambio recomendado",
      "expectedImpact": "+15% CTR",
      "priority": "high | medium | low"
    }
  ],
  "actionItems": [
    {
      "action": "acción específica",
      "timeline": "inmediato | esta semana | próxima semana"
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

  // Guardar recomendación en decisiones
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

  console.log(`✅ Optimización generada: ${optimization.optimizations.length} recomendaciones`)

  return optimization
}

// ============================================
// PAUSAR/REACTIVAR CAMPAÑA
// ============================================
export async function updateCampaignStatus(
  campaignId: string, 
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT'
) {
  console.log(`📢 Actualizando campaña ${campaignId} a ${status}`)

  const campaign = await prisma.marketingAdCampaign.update({
    where: { id: campaignId },
    data: { status }
  })

  return campaign
}

// ============================================
// SYNC CAMPAIGN METRICS (IMPLEMENTACIÓN REAL)
// ============================================
export async function syncCampaignMetrics(campaignId: string) {
  console.log('📊 Sincronizando métricas de Facebook Ads...')

  const campaign = await prisma.marketingAdCampaign.findUnique({
    where: { id: campaignId }
  })

  if (!campaign) throw new Error('Campaign not found')

  if (!campaign.facebookCampaignId) {
    throw new Error('No Facebook Campaign ID found')
  }

  // Obtener insights de Facebook Ads API
  const fbClient = new FacebookAdsClient()
  const insights = await fbClient.syncInsights(campaign.facebookCampaignId)

  // Actualizar en BD
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
        roas: 0, // Calcular según revenue tracking
        spend: insights.spend,
        lastSyncAt: new Date().toISOString()
      }
    }
  })

  console.log(`✅ Métricas sincronizadas para campaña ${campaignId}`)

  return insights
}

