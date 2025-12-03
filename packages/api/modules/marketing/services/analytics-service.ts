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
// DASHBOARD METRICS
// ============================================
export async function getDashboardMetrics(params: {
  organizationId: string
  productId?: string
  dateRange?: { start: Date; end: Date }
}) {
  console.log('📊 Obteniendo métricas del dashboard...')

  const { organizationId, productId } = params
  const dateFilter = params.dateRange || {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días
    end: new Date()
  }

  const whereClause = {
    organizationId,
    ...(productId && { productId }),
    createdAt: {
      gte: dateFilter.start,
      lte: dateFilter.end
    }
  }

  // Obtener métricas en paralelo
  const [
    contentStats,
    campaignStats,
    leadStats
  ] = await Promise.all([
    // Content metrics
    prisma.marketingContent.groupBy({
      by: ['status'],
      where: whereClause,
      _count: true
    }),

    // Campaign metrics
    prisma.marketingAdCampaign.findMany({
      where: {
        organizationId,
        ...(productId && { productId })
      },
      select: {
        status: true,
        performance: true,
        budget: true
      }
    }),

    // Lead metrics
    prisma.marketingLead.groupBy({
      by: ['temperature'],
      where: {
        organizationId,
        ...(productId && { productId })
      },
      _count: true
    })
  ])

  // Calcular totales de contenido
  const contentTotal = contentStats.reduce((sum, s) => sum + s._count, 0)
  const contentByStatus = Object.fromEntries(contentStats.map(s => [s.status, s._count]))

  // Calcular métricas de campañas
  let totalSpend = 0
  let totalImpressions = 0
  let totalClicks = 0
  let totalConversions = 0

  campaignStats.forEach(c => {
    const perf = c.performance as any || {}
    const budget = c.budget as any || {}
    totalSpend += budget.spent || 0
    totalImpressions += perf.impressions || 0
    totalClicks += perf.clicks || 0
    totalConversions += perf.conversions || 0
  })

  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0
  const avgCPA = totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : 0

  // Leads por temperatura
  const leadsByTemp = Object.fromEntries(leadStats.map(l => [l.temperature, l._count]))
  const totalLeads = leadStats.reduce((sum, l) => sum + l._count, 0)

  return {
    overview: {
      totalContent: contentTotal,
      totalCampaigns: campaignStats.length,
      activeCampaigns: campaignStats.filter(c => c.status === 'ACTIVE').length,
      totalLeads,
      hotLeads: leadsByTemp.hot || 0
    },
    content: {
      total: contentTotal,
      byStatus: contentByStatus,
      published: contentByStatus.PUBLISHED || 0,
      draft: contentByStatus.DRAFT || 0,
      scheduled: contentByStatus.SCHEDULED || 0
    },
    campaigns: {
      total: campaignStats.length,
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: avgCTR,
      cpa: avgCPA
    },
    leads: {
      total: totalLeads,
      byTemperature: leadsByTemp,
      conversionRate: totalLeads > 0 
        ? (((leadsByTemp.hot || 0) / totalLeads) * 100).toFixed(1)
        : 0
    },
    dateRange: dateFilter
  }
}

// ============================================
// CONTENT PERFORMANCE
// ============================================
export async function getContentPerformance(params: {
  organizationId: string
  productId?: string
  limit?: number
}) {
  console.log('📈 Analizando performance de contenido...')

  const content = await prisma.marketingContent.findMany({
    where: {
      organizationId: params.organizationId,
      ...(params.productId && { productId: params.productId }),
      status: 'PUBLISHED'
    },
    select: {
      id: true,
      title: true,
      type: true,
      platform: true,
      performance: true,
      createdAt: true,
      product: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: params.limit || 20
  })

  // Calcular métricas
  const analyzed = content.map(c => {
    const perf = c.performance as any || {}
    return {
      id: c.id,
      title: c.title,
      type: c.type,
      platform: c.platform,
      product: c.product?.name,
      impressions: perf.impressions || 0,
      engagement: perf.engagement || 0,
      clicks: perf.clicks || 0,
      engagementRate: perf.impressions > 0 
        ? ((perf.engagement / perf.impressions) * 100).toFixed(2)
        : 0,
      ctr: perf.impressions > 0
        ? ((perf.clicks / perf.impressions) * 100).toFixed(2)
        : 0,
      createdAt: c.createdAt
    }
  })

  // Top performers
  const topByEngagement = [...analyzed]
    .sort((a, b) => Number(b.engagementRate) - Number(a.engagementRate))
    .slice(0, 5)

  // By platform
  const byPlatform = analyzed.reduce((acc, c) => {
    if (!acc[c.platform]) {
      acc[c.platform] = { count: 0, totalEngagement: 0 }
    }
    acc[c.platform].count++
    acc[c.platform].totalEngagement += c.engagement
    return acc
  }, {} as Record<string, { count: number; totalEngagement: number }>)

  // By type
  const byType = analyzed.reduce((acc, c) => {
    if (!acc[c.type]) {
      acc[c.type] = { count: 0, avgEngagement: 0 }
    }
    acc[c.type].count++
    return acc
  }, {} as Record<string, { count: number; avgEngagement: number }>)

  return {
    content: analyzed,
    topPerformers: topByEngagement,
    byPlatform,
    byType,
    totalAnalyzed: analyzed.length
  }
}

// ============================================
// CAMPAIGN ROI
// ============================================
export async function getCampaignROI(organizationId: string) {
  console.log('💰 Calculando ROI de campañas...')

  const campaigns = await prisma.marketingAdCampaign.findMany({
    where: { organizationId },
    include: {
      product: { select: { name: true, pricing: true } }
    }
  })

  const analyzed = campaigns.map(c => {
    const perf = c.performance as any || {}
    const budget = c.budget as any || {}
    
    const spent = budget.spent || 0
    const conversions = perf.conversions || 0
    const revenue = perf.revenue || (conversions * 100) // Fallback: €100 por conversión
    
    const roi = spent > 0 ? (((revenue - spent) / spent) * 100).toFixed(1) : 0
    const roas = spent > 0 ? (revenue / spent).toFixed(2) : 0

    return {
      id: c.id,
      name: c.name,
      platform: c.platform,
      status: c.status,
      product: c.product?.name,
      spent,
      revenue,
      conversions,
      roi: `${roi}%`,
      roas: `${roas}x`,
      cpa: conversions > 0 ? (spent / conversions).toFixed(2) : 0,
      profitable: Number(roi) > 0
    }
  })

  const totalSpent = analyzed.reduce((sum, c) => sum + c.spent, 0)
  const totalRevenue = analyzed.reduce((sum, c) => sum + c.revenue, 0)
  const totalConversions = analyzed.reduce((sum, c) => sum + c.conversions, 0)
  const profitableCampaigns = analyzed.filter(c => c.profitable).length

  return {
    campaigns: analyzed,
    summary: {
      totalCampaigns: campaigns.length,
      profitableCampaigns,
      profitabilityRate: campaigns.length > 0
        ? ((profitableCampaigns / campaigns.length) * 100).toFixed(0)
        : 0,
      totalSpent,
      totalRevenue,
      totalConversions,
      overallROI: totalSpent > 0
        ? (((totalRevenue - totalSpent) / totalSpent) * 100).toFixed(1)
        : 0,
      overallROAS: totalSpent > 0
        ? (totalRevenue / totalSpent).toFixed(2)
        : 0
    }
  }
}

// ============================================
// AI INSIGHTS
// ============================================
export async function generateAIInsights(organizationId: string) {
  console.log('🤖 Generando insights con IA...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  // Obtener datos
  const [metrics, contentPerf, campaignROI] = await Promise.all([
    getDashboardMetrics({ organizationId }),
    getContentPerformance({ organizationId, limit: 50 }),
    getCampaignROI(organizationId)
  ])

  const prompt = `
Analiza estos datos de marketing y genera insights accionables:

MÉTRICAS GENERALES:
${JSON.stringify(metrics, null, 2)}

PERFORMANCE DE CONTENIDO:
- Top performers: ${JSON.stringify(contentPerf.topPerformers)}
- Por plataforma: ${JSON.stringify(contentPerf.byPlatform)}
- Por tipo: ${JSON.stringify(contentPerf.byType)}

ROI DE CAMPAÑAS:
${JSON.stringify(campaignROI.summary)}

Genera un análisis con:
1. 3-5 insights principales
2. Áreas de mejora
3. Recomendaciones prioritarias
4. Predicciones para el próximo mes

Responde SOLO con JSON:
{
  "insights": [
    {
      "type": "positive | negative | opportunity | warning",
      "title": "Título del insight",
      "description": "Explicación detallada",
      "metric": "Métrica relacionada",
      "impact": "high | medium | low"
    }
  ],
  "improvements": [
    {
      "area": "content | campaigns | leads | budget",
      "issue": "Problema detectado",
      "recommendation": "Cómo mejorarlo",
      "expectedImpact": "+20% conversiones"
    }
  ],
  "priorities": [
    {
      "action": "Acción prioritaria",
      "reason": "Por qué es prioritaria",
      "timeline": "Esta semana | Este mes"
    }
  ],
  "predictions": {
    "leads": "+/- X%",
    "conversions": "+/- X%",
    "roi": "+/- X%",
    "confidence": "high | medium | low",
    "assumptions": ["assumption 1", "assumption 2"]
  },
  "summary": "Resumen ejecutivo en 2-3 oraciones"
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const insights = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  // Guardar insights en decisiones
  await prisma.marketingDecision.create({
    data: {
      organizationId,
      agentType: 'analytics',
      decision: JSON.stringify(insights),
      reasoning: 'AI-generated marketing insights',
      context: {
        metricsSnapshot: metrics.overview,
        campaignROI: campaignROI.summary
      },
      executedAt: new Date()
    }
  })

  console.log(`✅ ${insights.insights.length} insights generados`)

  return insights
}

// ============================================
// WEEKLY REPORT
// ============================================
export async function generateWeeklyReport(organizationId: string) {
  console.log('📋 Generando reporte semanal...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  // Datos de esta semana vs semana pasada
  const thisWeekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const lastWeekStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const lastWeekEnd = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [thisWeek, lastWeek] = await Promise.all([
    getDashboardMetrics({
      organizationId,
      dateRange: { start: thisWeekStart, end: new Date() }
    }),
    getDashboardMetrics({
      organizationId,
      dateRange: { start: lastWeekStart, end: lastWeekEnd }
    })
  ])

  // Calcular variaciones
  const variations = {
    content: calculateVariation(thisWeek.content.total, lastWeek.content.total),
    leads: calculateVariation(thisWeek.leads.total, lastWeek.leads.total),
    spend: calculateVariation(thisWeek.campaigns.spend, lastWeek.campaigns.spend),
    conversions: calculateVariation(thisWeek.campaigns.conversions, lastWeek.campaigns.conversions)
  }

  const prompt = `
Genera un reporte semanal de marketing ejecutivo:

ESTA SEMANA:
${JSON.stringify(thisWeek, null, 2)}

SEMANA PASADA:
${JSON.stringify(lastWeek, null, 2)}

VARIACIONES:
- Contenido: ${variations.content}%
- Leads: ${variations.leads}%
- Gasto: ${variations.spend}%
- Conversiones: ${variations.conversions}%

Genera un reporte con:
1. Resumen ejecutivo (3-4 líneas)
2. Highlights de la semana
3. Áreas de preocupación
4. Acciones para la próxima semana

Responde SOLO con JSON:
{
  "title": "Weekly Marketing Report - [fecha]",
  "executiveSummary": "Resumen ejecutivo de 3-4 oraciones",
  "highlights": [
    {
      "metric": "Nombre de métrica",
      "value": "Valor actual",
      "change": "+/-X%",
      "status": "up | down | stable"
    }
  ],
  "concerns": [
    {
      "issue": "Problema identificado",
      "severity": "high | medium | low",
      "suggestedAction": "Qué hacer"
    }
  ],
  "nextWeekActions": [
    {
      "action": "Acción específica",
      "owner": "marketing | sales | product",
      "priority": "P0 | P1 | P2"
    }
  ],
  "kpiSummary": {
    "contentCreated": X,
    "leadsGenerated": X,
    "adSpend": X,
    "conversions": X,
    "roi": "X%"
  }
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const report = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  console.log('✅ Reporte semanal generado')

  return {
    ...report,
    thisWeekData: thisWeek,
    lastWeekData: lastWeek,
    variations,
    generatedAt: new Date()
  }
}

// Helper
function calculateVariation(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100' : '0'
  return (((current - previous) / previous) * 100).toFixed(1)
}

