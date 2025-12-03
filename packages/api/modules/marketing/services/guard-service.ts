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

interface GuardCheck {
  organizationId: string
  productId?: string
}

// ============================================
// GUARDIA FINANCIERA
// Monitorea CPA, ROAS, budget
// ============================================
export async function checkFinancialGuard(params: GuardCheck) {
  console.log('💰 Ejecutando guardia financiera...')

  const { organizationId, productId } = params

  // 1. Obtener campañas activas
  const campaigns = await prisma.marketingAdCampaign.findMany({
    where: {
      organizationId,
      status: 'ACTIVE',
      ...(productId && { productId })
    },
    include: {
      product: true
    }
  })

  const alerts: any[] = []
  const actions: any[] = []

  for (const campaign of campaigns) {
    const performance = campaign.performance as any || {}
    const budget = campaign.budget as any || {}

    const cpa = performance.cpa || 0
    const roas = performance.roas || 0
    const spent = budget.spent || 0
    const limit = budget.limit || 1000

    // Check CPA límite (ejemplo: €50 máximo)
    const cpaLimit = 50
    if (cpa > cpaLimit) {
      alerts.push({
        type: 'cpa_exceeded',
        severity: 'critical',
        campaign: campaign.name,
        value: cpa,
        threshold: cpaLimit,
        message: `CPA de €${cpa} excede límite de €${cpaLimit}`
      })

      // Acción automática: pausar campaña
      actions.push({
        type: 'pause_campaign',
        campaignId: campaign.id,
        reason: 'CPA exceeded threshold'
      })
    }

    // Check ROAS mínimo (ejemplo: 2.0 mínimo)
    const roasMin = 2.0
    if (roas > 0 && roas < roasMin) {
      alerts.push({
        type: 'roas_low',
        severity: 'warning',
        campaign: campaign.name,
        value: roas,
        threshold: roasMin,
        message: `ROAS de ${roas}x está por debajo del mínimo ${roasMin}x`
      })
    }

    // Check budget (80% consumido = warning)
    const budgetUsage = (spent / limit) * 100
    if (budgetUsage > 80) {
      alerts.push({
        type: 'budget_warning',
        severity: budgetUsage > 95 ? 'critical' : 'warning',
        campaign: campaign.name,
        value: budgetUsage,
        threshold: 80,
        message: `Presupuesto al ${budgetUsage.toFixed(0)}%`
      })
    }
  }

  // Guardar/actualizar guardia en BD
  await upsertGuard(organizationId, 'financial', {
    status: alerts.length > 0 ? (alerts.some(a => a.severity === 'critical') ? 'critical' : 'warning') : 'ok',
    triggered: alerts.length > 0,
    alerts,
    actions,
    lastCheck: new Date()
  })

  // Ejecutar acciones automáticas
  for (const action of actions) {
    if (action.type === 'pause_campaign') {
      await prisma.marketingAdCampaign.update({
        where: { id: action.campaignId },
        data: { status: 'PAUSED' }
      })
      console.log(`⏸️ Campaña pausada: ${action.campaignId}`)
    }
  }

  return { alerts, actions, campaignsChecked: campaigns.length }
}

// ============================================
// GUARDIA REPUTACIONAL
// Monitorea sentiment, menciones negativas
// ============================================
export async function checkReputationGuard(params: GuardCheck) {
  console.log('🛡️ Ejecutando guardia reputacional...')

  const { organizationId, productId } = params

  // 1. Obtener contenido reciente publicado
  const recentContent = await prisma.marketingContent.findMany({
    where: {
      organizationId,
      status: 'PUBLISHED',
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Últimos 7 días
      ...(productId && { productId })
    },
    select: {
      id: true,
      title: true,
      platform: true,
      performance: true
    }
  })

  const alerts: any[] = []
  const actions: any[] = []

  for (const content of recentContent) {
    const performance = content.performance as any || {}
    const sentiment = performance.sentiment || 'neutral'
    const negativeComments = performance.negativeComments || 0
    const totalComments = performance.totalComments || 1

    // Check sentiment negativo
    if (sentiment === 'negative') {
      alerts.push({
        type: 'negative_sentiment',
        severity: 'warning',
        content: content.title,
        platform: content.platform,
        message: `Contenido con sentiment negativo detectado`
      })
    }

    // Check ratio de comentarios negativos (>20% = warning)
    const negativeRatio = (negativeComments / totalComments) * 100
    if (negativeRatio > 20) {
      alerts.push({
        type: 'negative_comments',
        severity: negativeRatio > 40 ? 'critical' : 'warning',
        content: content.title,
        value: negativeRatio,
        threshold: 20,
        message: `${negativeRatio.toFixed(0)}% de comentarios negativos`
      })

      // Acción: ocultar contenido si es muy negativo
      if (negativeRatio > 40) {
        actions.push({
          type: 'hide_content',
          contentId: content.id,
          reason: 'High negative comment ratio'
        })
      }
    }
  }

  await upsertGuard(organizationId, 'reputation', {
    status: alerts.length > 0 ? (alerts.some(a => a.severity === 'critical') ? 'critical' : 'warning') : 'ok',
    triggered: alerts.length > 0,
    alerts,
    actions,
    lastCheck: new Date()
  })

  return { alerts, actions, contentChecked: recentContent.length }
}

// ============================================
// GUARDIA LEGAL
// Valida contenido contra restricciones
// ============================================
export async function checkLegalGuard(params: GuardCheck) {
  console.log('⚖️ Ejecutando guardia legal...')

  const { organizationId, productId } = params
  const anthropic = getAnthropicClient()

  // 1. Obtener contenido en DRAFT pendiente de publicar
  const draftContent = await prisma.marketingContent.findMany({
    where: {
      organizationId,
      status: 'DRAFT',
      ...(productId && { productId })
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true
    },
    take: 10 // Limitar para no exceder tokens
  })

  const alerts: any[] = []
  const actions: any[] = []

  // 2. Verificar cada contenido con IA
  for (const content of draftContent) {
    if (!anthropic) continue

    const contentText = typeof content.content === 'string' 
      ? content.content 
      : JSON.stringify(content.content)

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Analiza este contenido de marketing y detecta posibles problemas legales:

CONTENIDO:
${contentText.substring(0, 2000)}

Busca:
1. Claims sin evidencia (ej: "el mejor", "garantizado")
2. Información médica/financiera sin disclaimers
3. Comparaciones con competidores sin fundamento
4. Promesas exageradas
5. Contenido potencialmente ofensivo

Responde SOLO con JSON:
{
  "issues": [
    {
      "type": "unsupported_claim | medical_advice | competitor_comparison | offensive | other",
      "text": "texto problemático",
      "suggestion": "cómo arreglarlo"
    }
  ],
  "riskLevel": "low | medium | high",
  "approved": true/false
}`
        }]
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const analysis = JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())

      if (!analysis.approved || analysis.riskLevel === 'high') {
        alerts.push({
          type: 'legal_risk',
          severity: analysis.riskLevel === 'high' ? 'critical' : 'warning',
          content: content.title,
          issues: analysis.issues,
          message: `Contenido con riesgo legal ${analysis.riskLevel}`
        })

        if (analysis.riskLevel === 'high') {
          actions.push({
            type: 'block_publication',
            contentId: content.id,
            reason: 'High legal risk',
            issues: analysis.issues
          })
        }
      }
    } catch (error) {
      console.error('Error analizando contenido:', error)
    }
  }

  await upsertGuard(organizationId, 'legal', {
    status: alerts.length > 0 ? (alerts.some(a => a.severity === 'critical') ? 'critical' : 'warning') : 'ok',
    triggered: alerts.length > 0,
    alerts,
    actions,
    lastCheck: new Date()
  })

  return { alerts, actions, contentChecked: draftContent.length }
}

// ============================================
// EJECUTAR TODAS LAS GUARDIAS
// ============================================
export async function runAllGuards(organizationId: string) {
  console.log('🛡️ Ejecutando todas las guardias...')

  const [financial, reputation, legal] = await Promise.allSettled([
    checkFinancialGuard({ organizationId }),
    checkReputationGuard({ organizationId }),
    checkLegalGuard({ organizationId })
  ])

  const results = {
    financial: financial.status === 'fulfilled' ? financial.value : { error: financial.reason },
    reputation: reputation.status === 'fulfilled' ? reputation.value : { error: reputation.reason },
    legal: legal.status === 'fulfilled' ? legal.value : { error: legal.reason }
  }

  // Contar alertas totales
  const totalAlerts = 
    (results.financial.alerts?.length || 0) +
    (results.reputation.alerts?.length || 0) +
    (results.legal.alerts?.length || 0)

  console.log(`✅ Guardias ejecutadas. Alertas: ${totalAlerts}`)

  return {
    ...results,
    totalAlerts,
    executedAt: new Date()
  }
}

// ============================================
// HELPER: Upsert guard en BD
// ============================================
async function upsertGuard(
  organizationId: string,
  guardType: string,
  data: any
) {
  const existing = await prisma.marketingGuard.findFirst({
    where: { organizationId, guardType }
  })

  if (existing) {
    await prisma.marketingGuard.update({
      where: { id: existing.id },
      data: {
        status: data.status,
        triggered: data.triggered,
        currentValue: data.alerts?.length || 0,
        action: JSON.stringify(data.actions),
        lastCheck: data.lastCheck
      }
    })
  } else {
    await prisma.marketingGuard.create({
      data: {
        organizationId,
        guardType,
        metric: `${guardType}_alerts`,
        threshold: 0,
        currentValue: data.alerts?.length || 0,
        status: data.status,
        triggered: data.triggered,
        action: JSON.stringify(data.actions),
        lastCheck: data.lastCheck
      }
    })
  }
}

