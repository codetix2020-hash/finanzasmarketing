import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@repo/database'
import { saveMemory } from '../../../src/lib/ai/embeddings'

let anthropicClient: Anthropic | null = null

function getAnthropicClient() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropicClient
}

interface CompetitorAnalysisParams {
  organizationId: string
  productId: string
  competitors?: string[]
}

// Analyze competitors
export async function analyzeCompetitors(params: CompetitorAnalysisParams) {
  console.log('🔍 Analyzing competitors...')

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  // Get product
  const product = await prisma.saasProduct.findUnique({
    where: { id: params.productId }
  })

  if (!product) throw new Error('Product not found')

  const prompt = `
You are an expert in DIGITAL MARKETING and COMPETITIVE ANALYSIS.
Your goal is to analyze competitors and find differentiation opportunities.

OUR PRODUCT:
- Name: ${product.name}
- Description: ${product.description}
- Target: ${product.targetAudience}
- USP: ${product.usp}
- Pricing: ${JSON.stringify(product.pricing)}

${params.competitors?.length ? `KNOWN COMPETITORS: ${params.competitors.join(', ')}` : 'IDENTIFY THE TOP 5 COMPETITORS'}

Analyze the competitive landscape and generate:

1. Profile of each main competitor
2. Analysis of their marketing strategies
3. Gaps and opportunities for us
4. Positioning recommendations

Respond ONLY with JSON:
{
  "competitors": [
    {
      "name": "competitor name",
      "website": "url",
      "positioning": "how they are positioned",
      "targetAudience": "who they target",
      "pricingModel": "pricing model",
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1", "weakness 2"],
      "marketingChannels": ["channel 1", "channel 2"],
      "contentStrategy": "description of their content strategy",
      "messagingAngle": "their main messaging angle"
    }
  ],
  "marketGaps": [
    {
      "gap": "gap description",
      "opportunity": "how we can leverage it",
      "priority": "high | medium | low"
    }
  ],
  "positioningRecommendations": [
    {
      "recommendation": "specific recommendation",
      "reasoning": "why",
      "expectedImpact": "expected impact on conversions or engagement"
    }
  ],
  "contentOpportunities": [
    {
      "topic": "topic competitors do not cover well",
      "format": "recommended content format",
      "platform": "where to publish"
    }
  ],
  "differentiators": [
    "key differentiator 1",
    "key differentiator 2",
    "key differentiator 3"
  ]
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const analysis = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  // Save analysis to memory (high importance)
  await saveMemory(
    params.organizationId,
    'learning',
    `Competitive Analysis for ${product.name}: ${analysis.differentiators.join(', ')}. Key gaps: ${analysis.marketGaps.map((g: any) => g.gap).join(', ')}`,
    { type: 'competitor_analysis', productId: params.productId, competitors: analysis.competitors.map((c: any) => c.name) },
    8 // High importance
  )

  // Save decision
  await prisma.marketingDecision.create({
    data: {
      organizationId: params.organizationId,
      agentType: 'competitor_analyzer',
      decision: analysis,
      reasoning: `Competitive analysis for ${product.name}`,
      context: {
        productId: params.productId,
        competitorsAnalyzed: analysis.competitors.length
      },
      executedAt: new Date()
    }
  })

  console.log(`✅ Analysis completed: ${analysis.competitors.length} competitors analyzed`)

  return analysis
}

// Monitor competitor changes
export async function monitorCompetitorChanges(params: {
  organizationId: string
  productId: string
}) {
  console.log('👀 Monitoring competitor changes...')

  // Get previous analysis
  const previousAnalysis = await prisma.marketingDecision.findFirst({
    where: {
      organizationId: params.organizationId,
      agentType: 'competitor_analyzer',
      context: { path: ['productId'], equals: params.productId }
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!previousAnalysis) {
    console.log('⚠️ No previous analysis found, running initial analysis')
    return analyzeCompetitors(params)
  }

  // Run new analysis
  const newAnalysis = await analyzeCompetitors(params)

  // Compare and detect changes
  const previousCompetitors = (previousAnalysis.decision as any).competitors || []
  const newCompetitors = newAnalysis.competitors || []

  const changes = {
    newCompetitors: newCompetitors.filter(
      (nc: any) => !previousCompetitors.find((pc: any) => pc.name === nc.name)
    ),
    removedCompetitors: previousCompetitors.filter(
      (pc: any) => !newCompetitors.find((nc: any) => nc.name === pc.name)
    ),
    newGaps: newAnalysis.marketGaps?.filter(
      (ng: any) => !(previousAnalysis.decision as any).marketGaps?.find((pg: any) => pg.gap === ng.gap)
    ) || []
  }

  console.log(`✅ Monitoring completed: ${changes.newGaps.length} new opportunities detected`)

  return {
    currentAnalysis: newAnalysis,
    changes,
    lastAnalysisDate: previousAnalysis.createdAt
  }
}

export default {
  analyzeCompetitors,
  monitorCompetitorChanges
}

