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
  console.log('📊 Fetching dashboard metrics...')

  const { organizationId, productId } = params
  const dateFilter = params.dateRange || {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
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

  // Fetch metrics in parallel
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

  // Calculate content totals
  const contentTotal = contentStats.reduce((sum, s) => sum + s._count, 0)
  const contentByStatus = Object.fromEntries(contentStats.map(s => [s.status, s._count]))

  // Calculate campaign metrics
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

  // Leads by temperature
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
  console.log('📈 Analyzing content performance...')

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

  // Calculate metrics
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
  console.log('💰 Calculating campaign ROI...')

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
    const revenue = perf.revenue || (conversions * 100) // Fallback: €100 per conversion
    
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
  console.log('🤖 Generating AI insights...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  // Fetch data
  const [metrics, contentPerf, campaignROI] = await Promise.all([
    getDashboardMetrics({ organizationId }),
    getContentPerformance({ organizationId, limit: 50 }),
    getCampaignROI(organizationId)
  ])

  const prompt = `
Analyze this marketing data and generate actionable insights:

GENERAL METRICS:
${JSON.stringify(metrics, null, 2)}

CONTENT PERFORMANCE:
- Top performers: ${JSON.stringify(contentPerf.topPerformers)}
- By platform: ${JSON.stringify(contentPerf.byPlatform)}
- By type: ${JSON.stringify(contentPerf.byType)}

CAMPAIGN ROI:
${JSON.stringify(campaignROI.summary)}

Generate an analysis with:
1. 3-5 key insights
2. Areas for improvement
3. Priority recommendations
4. Predictions for next month

Respond ONLY with JSON:
{
  "insights": [
    {
      "type": "positive | negative | opportunity | warning",
      "title": "Insight title",
      "description": "Detailed explanation",
      "metric": "Related metric",
      "impact": "high | medium | low"
    }
  ],
  "improvements": [
    {
      "area": "content | campaigns | leads | budget",
      "issue": "Detected issue",
      "recommendation": "How to improve it",
      "expectedImpact": "+20% conversions"
    }
  ],
  "priorities": [
    {
      "action": "Priority action",
      "reason": "Why it is a priority",
      "timeline": "This week | This month"
    }
  ],
  "predictions": {
    "leads": "+/- X%",
    "conversions": "+/- X%",
    "roi": "+/- X%",
    "confidence": "high | medium | low",
    "assumptions": ["assumption 1", "assumption 2"]
  },
  "summary": "Executive summary in 2-3 sentences"
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const insights = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  // Save insights as decisions
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

  console.log(`✅ ${insights.insights.length} insights generated`)

  return insights
}

// ============================================
// WEEKLY REPORT
// ============================================
export async function generateWeeklyReport(organizationId: string) {
  console.log('📋 Generating weekly report...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  // This week vs last week data
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

  // Calculate variations
  const variations = {
    content: calculateVariation(thisWeek.content.total, lastWeek.content.total),
    leads: calculateVariation(thisWeek.leads.total, lastWeek.leads.total),
    spend: calculateVariation(thisWeek.campaigns.spend, lastWeek.campaigns.spend),
    conversions: calculateVariation(thisWeek.campaigns.conversions, lastWeek.campaigns.conversions)
  }

  const prompt = `
Generate an executive weekly marketing report:

THIS WEEK:
${JSON.stringify(thisWeek, null, 2)}

LAST WEEK:
${JSON.stringify(lastWeek, null, 2)}

VARIATIONS:
- Content: ${variations.content}%
- Leads: ${variations.leads}%
- Spend: ${variations.spend}%
- Conversions: ${variations.conversions}%

Generate a report with:
1. Executive summary (3-4 lines)
2. Weekly highlights
3. Areas of concern
4. Actions for next week

Respond ONLY with JSON:
{
  "title": "Weekly Marketing Report - [fecha]",
  "executiveSummary": "Executive summary in 3-4 sentences",
  "highlights": [
    {
      "metric": "Metric name",
      "value": "Current value",
      "change": "+/-X%",
      "status": "up | down | stable"
    }
  ],
  "concerns": [
    {
      "issue": "Identified issue",
      "severity": "high | medium | low",
      "suggestedAction": "What to do"
    }
  ],
  "nextWeekActions": [
    {
      "action": "Specific action",
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

  console.log('✅ Weekly report generated')

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

