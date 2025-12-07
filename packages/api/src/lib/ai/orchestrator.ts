import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@repo/database'
import { searchMemory, saveMemory } from './embeddings'
import { ContentAgent } from '../../modules/marketing/services/content-agent'
import { generateImage } from '../../modules/marketing/services/visual-agent'

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

// Orquestar marketing para un producto específico
export async function orchestrateProduct(productId: string) {
  console.log('🎯 Orquestando marketing para producto:', productId)

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  // 1. Obtener producto
  const product = await prisma.saasProduct.findUnique({
    where: { id: productId },
    include: { organization: true }
  })

  if (!product) throw new Error('Product not found')

  // 2. Obtener memoria de marketing del producto
  const marketingMemory = await searchMemory(
    product.organizationId,
    `${product.name} marketing strategy campaigns content`,
    'business_dna',
    3
  )

  // 3. Obtener learnings de campañas (cross-learning)
  const campaignLearnings = await searchMemory(
    product.organizationId,
    'successful campaigns conversions leads ROAS optimization',
    'learning',
    3
  )

  // 4. Obtener contenido reciente
  const recentContent = await prisma.marketingContent.findMany({
    where: {
      productId,
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  // 5. Obtener campañas activas
  const activeCampaigns = await prisma.marketingAdCampaign.findMany({
    where: { productId, status: 'ACTIVE' }
  })

  // 6. Generar decisiones de marketing con Claude
  const prompt = `
Eres un experto en MARKETING DIGITAL y AUTOMATIZACIÓN DE CAMPAÑAS PUBLICITARIAS.
Tu objetivo es orquestar la estrategia de marketing para un producto SaaS.

PRODUCTO:
- Nombre: ${product.name}
- Descripción: ${product.description}
- Target Audience: ${product.targetAudience}
- USP: ${product.usp}

MEMORIA DE MARKETING:
${marketingMemory.map(m => m.content || m.reasoning).join('\n\n')}

LEARNINGS DE CAMPAÑAS PREVIAS:
${campaignLearnings.map(m => m.content || m.reasoning).join('\n\n')}

CONTENIDO RECIENTE (últimos 7 días):
${recentContent.map(c => `- ${c.type}: ${c.title || 'Sin título'}`).join('\n')}

CAMPAÑAS ACTIVAS:
${activeCampaigns.map(c => `- ${c.name}: ${c.status}`).join('\n')}

Genera un plan de marketing para las próximas 6 horas. Responde SOLO con JSON:

{
  "contentPlan": [
    {
      "type": "post | carousel | video_script | email | landing_page | blog",
      "platform": "instagram | twitter | linkedin | tiktok | email | web",
      "topic": "tema específico de marketing",
      "angle": "ángulo único para engagement",
      "hook": "primera línea viral",
      "cta": "call to action para conversión",
      "priority": "high | medium | low",
      "reasoning": "por qué ahora es buen momento"
    }
  ],
  "experiments": [
    {
      "hypothesis": "qué queremos probar en la campaña",
      "variants": ["A", "B"],
      "metric": "CPA | ROAS | CTR | Conversion Rate",
      "duration": "7 days"
    }
  ],
  "optimizations": [
    {
      "target": "qué canal o campaña optimizar",
      "action": "acción específica de optimización",
      "expectedImpact": "mejora esperada en ROAS o CPA"
    }
  ],
  "insights": [
    "insight 1 basado en performance de campañas",
    "insight 2 sobre engagement del contenido"
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

  // 7. Guardar decisión de marketing
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

  console.log(`✅ Orquestación marketing completada: ${decision.contentPlan?.length || 0} contenidos planificados`)

  // 8. EJECUTAR ACCIONES AUTOMÁTICAMENTE (solo las de alta prioridad)
  const executedActions = []
  const contentAgent = new ContentAgent()
  
  for (const item of (decision.contentPlan || []).slice(0, 3)) { // Ejecutar máximo 3 acciones inmediatas
    if (item.priority === 'high') {
      try {
        console.log(`🎯 Ejecutando acción automática: ${item.type} - ${item.topic}`)
        
        if (item.type === 'blog' || item.type === 'post' || item.type === 'email') {
          const contentResult = await contentAgent.generateContent({
            type: item.type === 'blog' ? 'blog_post' : item.type === 'email' ? 'email' : 'social_post',
            topic: item.topic,
            tone: 'professional',
            length: 'medium',
            organizationId: product.organizationId
          })
          
          // Guardar contenido generado
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
        console.error(`❌ Error ejecutando acción ${item.type}:`, error)
        executedActions.push({ type: item.type, success: false, error: String(error) })
      }
    }
  }

  // 9. Notificar por Slack si está configurado
  if (process.env.SLACK_WEBHOOK_URL && executedActions.length > 0) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🤖 MarketingOS ha orquestado marketing para *${product.name}*\n` +
                `📊 Contenidos planificados: ${decision.contentPlan?.length || 0}\n` +
                `✅ Acciones ejecutadas: ${executedActions.filter(a => a.success).length}\n` +
                `📝 Estrategia: ${decision.insights?.[0] || 'Ver dashboard'}`
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

// Orquestar todos los productos de una organización
export async function orchestrateMaster(organizationId: string) {
  console.log('🎯 Orquestación master marketing para org:', organizationId)

  // Obtener todos los productos activos
  const products = await prisma.saasProduct.findMany({
    where: {
      organizationId,
      marketingEnabled: true
    }
  })

  console.log(`📦 Productos para marketing: ${products.length}`)

  if (products.length === 0) {
    // Orquestación genérica sin productos específicos
    return orchestrateGeneric(organizationId)
  }

  // Orquestar cada producto en paralelo
  const results = await Promise.allSettled(
    products.map(product => orchestrateProduct(product.id))
  )

  const successful = results.filter(r => r.status === 'fulfilled')
  const failed = results.filter(r => r.status === 'rejected')

  console.log(`✅ Marketing orchestration: ${successful.length} éxitos, ${failed.length} fallos`)

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

// Orquestación genérica (sin productos específicos)
async function orchestrateGeneric(organizationId: string) {
  console.log('🎯 Orquestación marketing genérica para org:', organizationId)

  const anthropic = getAnthropicClient()
  if (!anthropic) throw new Error('Anthropic not configured')

  // Obtener memoria de marketing de la organización
  const memory = await searchMemory(organizationId, 'marketing strategy campaigns content goals', undefined, 5)

  const prompt = `
Eres un experto en MARKETING DIGITAL y GENERACIÓN DE CONTENIDO.
Genera un plan de marketing genérico para una organización.

MEMORIA DE MARKETING DISPONIBLE:
${memory.map(m => m.content || m.reasoning).join('\n\n')}

Genera un plan de contenido para las próximas 6 horas. Responde SOLO con JSON:

{
  "contentPlan": [
    {
      "type": "post | blog | email",
      "platform": "instagram | twitter | linkedin",
      "topic": "tema de marketing",
      "angle": "ángulo para engagement",
      "hook": "hook viral",
      "cta": "call to action",
      "priority": "high | medium | low"
    }
  ],
  "recommendations": [
    "recomendación 1 de marketing",
    "recomendación 2 de optimización"
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

// Función principal de orquestación
export async function orchestrate(context: OrchestrationContext) {
  if (context.productId) {
    return orchestrateProduct(context.productId)
  }
  return orchestrateMaster(context.organizationId)
}

