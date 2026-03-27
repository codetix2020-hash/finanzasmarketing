import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@repo/database'
import { searchMemory, saveMemory } from './embeddings'
import { ContentAgent } from '../../../modules/marketing/services/content-agent'
import { generateImage } from '../../../modules/marketing/services/visual-agent'

let anthropicClient: Anthropic | null = null

function getAnthropicClient() {
  if (!anthropicClient && process.env.ANTHROPIC_API_KEY) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }
  return anthropicClient
}

interface OrchestrationContext {
  organizationId: string
  productId?: string
}

// Orchestrate marketing for a specific product
export async function orchestrateProduct(productId: string) {
  console.log('🎯 Orchestrating marketing for product:', productId)

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  // 1. Get product
  const product = await prisma.saasProduct.findUnique({
    where: { id: productId },
    include: { organization: true }
  })

  if (!product) throw new Error('Product not found')

  // 2. Get product marketing memory
  const marketingMemory = await searchMemory(
    product.organizationId,
    `${product.name} marketing strategy campaigns content`,
    'business_dna',
    3
  )

  // 3. Get campaign learnings (cross-learning)
  const campaignLearnings = await searchMemory(
    product.organizationId,
    'successful campaigns conversions leads ROAS optimization',
    'learning',
    3
  )

  // 4. Get recent content
  const recentContent = await prisma.marketingContent.findMany({
    where: {
      productId,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  // 5. Get active campaigns
  const activeCampaigns = await prisma.marketingAdCampaign.findMany({
    where: { productId, status: 'ACTIVE' }
  })

  // 6. Generate marketing decisions with Claude
  const prompt = `
You are an expert in DIGITAL MARKETING and AD CAMPAIGN AUTOMATION.
Your goal is to orchestrate the marketing strategy for a SaaS product.

PRODUCT:
- Name: ${product.name}
- Description: ${product.description}
- Target Audience: ${product.targetAudience}
- USP: ${product.usp}

MARKETING MEMORY:
${marketingMemory.map(m => m.content || m.reasoning).join('\n\n')}

PREVIOUS CAMPAIGN LEARNINGS:
${campaignLearnings.map(m => m.content || m.reasoning).join('\n\n')}

RECENT CONTENT (last 7 days):
${recentContent.map(c => `- ${c.type}: ${c.title || 'Untitled'}`).join('\n')}

ACTIVE CAMPAIGNS:
${activeCampaigns.map(c => `- ${c.name}: ${c.status}`).join('\n')}

Generate a marketing plan for the next 6 hours. Reply ONLY with JSON:

{
  "contentPlan": [
    {
      "type": "post | carousel | video_script | email | landing_page | blog",
      "platform": "instagram | twitter | linkedin | tiktok | email | web",
      "topic": "specific marketing topic",
      "angle": "unique engagement angle",
      "hook": "viral opening line",
      "cta": "conversion-focused call to action",
      "priority": "high | medium | low",
      "reasoning": "why now is the right timing"
    }
  ],
  "experiments": [
    {
      "hypothesis": "what we want to test in the campaign",
      "variants": ["A", "B"],
      "metric": "CPA | ROAS | CTR | Conversion Rate",
      "duration": "7 days"
    }
  ],
  "optimizations": [
    {
      "target": "which channel or campaign to optimize",
      "action": "specific optimization action",
      "expectedImpact": "expected improvement in ROAS or CPA"
    }
  ],
  "insights": [
    "insight 1 based on campaign performance",
    "insight 2 about content engagement"
  ]
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const decision = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  // 7. Save marketing decision
  await prisma.marketingDecision.create({
    data: {
      organizationId: product.organizationId,
      agentType: 'orchestrator',
      decision: decision,
      reasoning: `Marketing orchestration for ${product.name}`,
      context: {
        productId,
        recentContentCount: recentContent.length,
        activeCampaignsCount: activeCampaigns.length
      },
      executedAt: new Date()
    }
  })

  console.log(`✅ Marketing orchestration completed: ${decision.contentPlan?.length || 0} planned content items`)

  // 8. RUN ACTIONS AUTOMATICALLY (only high-priority ones)
  const executedActions = []
  const contentAgent = new ContentAgent()
  
  for (const item of (decision.contentPlan || []).slice(0, 3)) { // Execute a maximum of 3 immediate actions
    if (item.priority === 'high') {
      try {
        console.log(`🎯 Executing automatic action: ${item.type} - ${item.topic}`)
        
        if (item.type === 'blog' || item.type === 'post' || item.type === 'email') {
          const contentResult = await contentAgent.generateContent({
            type: item.type === 'blog' ? 'blog_post' : item.type === 'email' ? 'email' : 'social_post',
            topic: item.topic,
            tone: 'professional',
            length: 'medium'
          })
          
          // Save generated content
          await prisma.marketingContent.create({
            data: {
              organizationId: product.organizationId,
              productId: product.id,
              type: item.type === 'blog' ? 'BLOG' : item.type === 'email' ? 'EMAIL' : 'POST',
              platform: item.platform || 'web',
              title: contentResult.title || item.topic,
              content: contentResult.content,
              status: 'DRAFT',
              metadata: {
                generatedBy: 'orchestrator',
                planItem: item,
                metadata: contentResult.metadata
              }
            }
          })
          
          executedActions.push({ type: 'content', success: true, topic: item.topic })
        } else if (item.type === 'image' || item.type === 'carousel') {
          const imageResult = await generateImage({
            prompt: `${item.topic}. ${item.angle || ''}. Marketing image for ${product.name}`,
            purpose: 'social_post',
            aspectRatio: '1:1',
            organizationId: product.organizationId,
            productId: product.id
          })
          
          executedActions.push({ type: 'image', success: true, topic: item.topic })
        }
      } catch (error) {
        console.error(`❌ Error executing action ${item.type}:`, error)
        executedActions.push({ type: item.type, success: false, error: String(error) })
      }
    }
  }

  // 9. Notify in Slack if configured
  if (process.env.SLACK_WEBHOOK_URL && executedActions.length > 0) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🤖 MarketingOS orchestrated marketing for *${product.name}*\n` +
                `📊 Planned content items: ${decision.contentPlan?.length || 0}\n` +
                `✅ Executed actions: ${executedActions.filter(a => a.success).length}\n` +
                `📝 Strategy: ${decision.insights?.[0] || 'See dashboard'}`
        })
      })
    } catch (e) {
      console.log('Slack notification failed:', e)
    }
  }

  return {
    productId,
    productName: product.name,
    decision,
    executedActions,
    orchestratedAt: new Date().toISOString()
  }
}

// Orchestrate all products in an organization
export async function orchestrateMaster(organizationId: string) {
  console.log('🎯 Master marketing orchestration for org:', organizationId)

  // Get all active products
  const products = await prisma.saasProduct.findMany({
    where: {
      organizationId,
      marketingEnabled: true
    }
  })

  console.log(`📦 Products for marketing: ${products.length}`)

  if (products.length === 0) {
    // Generic orchestration without specific products
    return orchestrateGeneric(organizationId)
  }

  // Orchestrate each product in parallel
  const results = await Promise.allSettled(
    products.map(product => orchestrateProduct(product.id))
  )

  const successful = results.filter(r => r.status === 'fulfilled')
  const failed = results.filter(r => r.status === 'rejected')

  console.log(`✅ Marketing orchestration: ${successful.length} successes, ${failed.length} failures`)

  return {
    organizationId,
    productsOrchestrated: successful.length,
    failed: failed.length,
    results: results.map((r, i) => ({
      productId: products[i].id,
      status: r.status,
      result: r.status === 'fulfilled' ? r.value : null,
      error: r.status === 'rejected' ? String(r.reason) : null
    }))
  }
}

// Generic orchestration (without specific products)
async function orchestrateGeneric(organizationId: string) {
  console.log('🎯 Generic marketing orchestration for org:', organizationId)

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  // Get organization marketing memory
  const memory = await searchMemory(organizationId, 'marketing strategy campaigns content goals', undefined, 5)

  const prompt = `
You are an expert in DIGITAL MARKETING and CONTENT GENERATION.
Generate a generic marketing plan for an organization.

AVAILABLE MARKETING MEMORY:
${memory.map(m => m.content || m.reasoning).join('\n\n')}

Generate a content plan for the next 6 hours. Reply ONLY with JSON:

{
  "contentPlan": [
    {
      "type": "post | blog | email",
      "platform": "instagram | twitter | linkedin",
      "topic": "marketing topic",
      "angle": "engagement angle",
      "hook": "hook viral",
      "cta": "call to action",
      "priority": "high | medium | low"
    }
  ],
  "recommendations": [
    "marketing recommendation 1",
    "optimization recommendation 2"
  ]
}
`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const decision = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

  await prisma.marketingDecision.create({
    data: {
      organizationId,
      agentType: 'orchestrator',
      decision,
      reasoning: 'Generic marketing orchestration - no products defined',
      context: { type: 'generic' },
      executedAt: new Date()
    }
  })

  return { organizationId, decision, type: 'generic' }
}

// Main orchestration function
export async function orchestrate(context: OrchestrationContext) {
  if (context.productId) {
    return orchestrateProduct(context.productId)
  }
  return orchestrateMaster(context.organizationId)
}

