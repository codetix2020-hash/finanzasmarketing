import { prisma } from '@repo/database'
import { saveMemory } from '../../src/lib/ai/embeddings'
import { analyzeCompetitors } from '../marketing/services/competitor-analyzer'
import { orchestrateLaunch } from '../marketing/services/launch-orchestrator'
import { orchestrateProduct } from '../../src/lib/ai/orchestrator'

interface NewProductPayload {
  productId: string
  name: string
  description: string
  targetAudience: string
  usp: string
  pricing: any
  launchDate?: string
}

// Manejar nuevo producto desde Auto-SaaS Builder
export async function handleNewProduct(organizationId: string, payload: NewProductPayload) {
  console.log('🆕 Nuevo producto recibido de Auto-SaaS:', payload.name)

  try {
    // 1. Crear o actualizar producto en BD
    const product = await prisma.saasProduct.upsert({
      where: { id: payload.productId },
      update: {
        name: payload.name,
        description: payload.description,
        targetAudience: payload.targetAudience,
        usp: payload.usp,
        pricing: payload.pricing,
        marketingEnabled: true
      },
      create: {
        id: payload.productId,
        organizationId,
        name: payload.name,
        description: payload.description,
        targetAudience: payload.targetAudience,
        usp: payload.usp,
        pricing: payload.pricing,
        marketingEnabled: true
      }
    })

    console.log('  ✅ Producto guardado:', product.id)

    // 2. Poblar memoria con información del producto
    await saveMemory(
      organizationId,
      'business_dna',
      `Product: ${payload.name}. ${payload.description}. Target: ${payload.targetAudience}. USP: ${payload.usp}. Pricing: ${JSON.stringify(payload.pricing)}`,
      { productId: product.id, type: 'product_info' },
      9 // Alta importancia
    )

    console.log('  ✅ Memoria poblada')

    // 3. Ejecutar análisis competitivo inicial
    try {
      await analyzeCompetitors({
        organizationId,
        productId: product.id
      })
      console.log('  ✅ Análisis competitivo completado')
    } catch (error) {
      console.error('  ⚠️ Error en análisis competitivo:', error)
    }

    // 4. AUTOMÁTICAMENTE iniciar orquestación de marketing
    console.log('  🤖 Iniciando orquestación automática de marketing...')
    let orchestrationResult = null
    try {
      orchestrationResult = await orchestrateProduct(product.id)
      console.log('  ✅ Orquestación completada')
    } catch (error) {
      console.error('  ⚠️ Error en orquestación:', error)
    }

    // 5. Si hay fecha de lanzamiento, programar
    if (payload.launchDate) {
      try {
        await orchestrateLaunch({
          organizationId,
          productId: product.id,
          launchDate: new Date(payload.launchDate),
          launchType: 'full'
        })
        console.log('  ✅ Lanzamiento programado')
      } catch (error) {
        console.error('  ⚠️ Error programando lanzamiento:', error)
      }
    }

    // 6. Notificar por Slack si está configurado
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🤖 MarketingOS ha recibido nuevo producto: *${payload.name}*\n` +
                  `📦 Producto ID: ${product.id}\n` +
                  `✅ Orquestación: ${orchestrationResult ? 'Completada' : 'Error'}\n` +
                  `📊 Acciones: Producto guardado, memoria poblada, análisis competitivo iniciado`
          })
        })
      } catch (e) {
        console.log('  ⚠️ Slack notification failed:', e)
      }
    }

    // 7. Marcar mensaje como procesado
    await prisma.autoSaasInbox.updateMany({
      where: {
        organizationId,
        processed: false
      },
      data: {
        processed: true,
        processedAt: new Date()
      }
    })

    console.log('✅ Producto procesado completamente')

    return {
      success: true,
      productId: product.id,
      orchestration: orchestrationResult,
      actions: [
        'product_saved',
        'memory_populated',
        'competitor_analysis',
        'orchestration_started',
        payload.launchDate ? 'launch_scheduled' : null
      ].filter(Boolean)
    }

  } catch (error) {
    console.error('❌ Error procesando producto:', error)
    throw error
  }
}

// Enviar feature request a Auto-SaaS
export async function sendFeatureRequest(params: {
  organizationId: string
  productId: string
  feature: string
  reasoning: string
  priority: 'high' | 'medium' | 'low'
}) {
  console.log('📤 Enviando feature request a Auto-SaaS...')

  const message = await prisma.autoSaasOutbox.create({
    data: {
      organizationId: params.organizationId,
      messageType: 'feature_request',
      payload: {
        productId: params.productId,
        feature: params.feature,
        reasoning: params.reasoning,
        priority: params.priority,
        requestedAt: new Date().toISOString()
      },
      sent: false
    }
  })

  console.log('✅ Feature request guardado:', message.id)

  return { success: true, messageId: message.id }
}

// Procesar mensajes entrantes
export async function processInbox(organizationId: string) {
  console.log('📥 Procesando inbox de Auto-SaaS...')

  const messages = await prisma.autoSaasInbox.findMany({
    where: {
      organizationId,
      processed: false
    },
    orderBy: { createdAt: 'asc' }
  })

  console.log(`  📬 Mensajes pendientes: ${messages.length}`)

  const results = []

  for (const message of messages) {
    try {
      switch (message.messageType) {
        case 'new_product':
          await handleNewProduct(organizationId, message.payload as any)
          break
        case 'product_update':
          // TODO: Manejar actualizaciones
          break
        default:
          console.log(`  ⚠️ Tipo de mensaje no manejado: ${message.messageType}`)
      }

      await prisma.autoSaasInbox.update({
        where: { id: message.id },
        data: { processed: true, processedAt: new Date() }
      })

      results.push({ messageId: message.id, success: true })
    } catch (error) {
      results.push({ messageId: message.id, success: false, error: String(error) })
    }
  }

  return { processed: results.length, results }
}

export default {
  handleNewProduct,
  sendFeatureRequest,
  processInbox
}

