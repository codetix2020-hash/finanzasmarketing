import { prisma } from '@repo/database'
import { ContentAgent } from '../../modules/marketing/services/content-agent'
import { generateImage } from '../../modules/marketing/services/visual-agent'
import { generateVoiceover } from '../../modules/marketing/services/voice-agent'

/**
 * Procesa jobs de generación de contenido pendientes
 * Se ejecuta cada 5 minutos
 */
export async function processContentJobs() {
  console.log('⚙️ Procesando jobs de contenido marketing...')
  
  try {
    // Obtener jobs pendientes ordenados por prioridad
    const pendingJobs = await prisma.marketingJob.findMany({
      where: {
        status: 'pending',
        OR: [
          { scheduledAt: null },
          { scheduledAt: { lte: new Date() } }
        ],
        attempts: { lt: prisma.marketingJob.fields.maxAttempts }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: 10, // Procesar máximo 10 jobs por ciclo
      include: {
        product: { select: { name: true } }
      }
    })
    
    console.log(`📋 Jobs pendientes: ${pendingJobs.length}`)
    
    if (pendingJobs.length === 0) {
      return { processed: 0, message: 'No hay jobs pendientes' }
    }
    
    const results = []
    
    for (const job of pendingJobs) {
      try {
        // Marcar como running
        await prisma.marketingJob.update({
          where: { id: job.id },
          data: {
            status: 'running',
            startedAt: new Date(),
            attempts: { increment: 1 },
            progress: 10
          }
        })
        
        console.log(`🔄 Procesando job ${job.id}: ${job.jobType}`)
        
        // Procesar según tipo
        let output: any
        
        switch (job.jobType) {
          case 'content_generation':
            output = await processContentGeneration(job)
            break
          case 'image_generation':
            output = await processImageGeneration(job)
            break
          case 'email_sequence':
            output = await processEmailSequence(job)
            break
          case 'voice_generation':
            output = await processVoiceGeneration(job)
            break
          case 'campaign_optimization':
            output = await processCampaignOptimization(job)
            break
          default:
            throw new Error(`Tipo de job no soportado: ${job.jobType}`)
        }
        
        // Marcar como completado
        await prisma.marketingJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            output,
            progress: 100
          }
        })
        
        console.log(`✅ Job ${job.id} completado`)
        results.push({ jobId: job.id, success: true })
        
      } catch (error) {
        console.error(`❌ Job ${job.id} falló:`, error)
        
        const updatedJob = await prisma.marketingJob.update({
          where: { id: job.id },
          data: {
            status: job.attempts + 1 >= job.maxAttempts ? 'failed' : 'pending',
            error: String(error),
            progress: 0
          }
        })
        
        results.push({ jobId: job.id, success: false, error: String(error) })
      }
    }
    
    const successful = results.filter(r => r.success).length
    console.log(`\n📊 Jobs procesados: ${successful}/${pendingJobs.length} exitosos`)
    
    return {
      processed: pendingJobs.length,
      successful,
      failed: pendingJobs.length - successful,
      results
    }
    
  } catch (error) {
    console.error('❌ Error procesando jobs:', error)
    return { success: false, error: String(error) }
  }
}

// Funciones auxiliares para cada tipo de job
async function processContentGeneration(job: any) {
  const input = job.input as any
  console.log(`  📝 Generando contenido: ${input.type} para ${input.platform}`)
  
  await prisma.marketingJob.update({
    where: { id: job.id },
    data: { progress: 50 }
  })
  
  const contentAgent = new ContentAgent()
  const result = await contentAgent.generateContent({
    type: input.type || 'blog_post',
    topic: input.topic || job.product?.name || 'Marketing content',
    tone: input.tone || 'professional',
    length: input.length || 'medium',
    organizationId: job.organizationId
  })
  
  return {
    success: true,
    content: result,
    type: input.type,
    platform: input.platform
  }
}

async function processImageGeneration(job: any) {
  const input = job.input as any
  console.log(`  🎨 Generando imagen: ${input.prompt?.substring(0, 50)}...`)
  
  await prisma.marketingJob.update({
    where: { id: job.id },
    data: { progress: 50 }
  })
  
  const result = await generateImage({
    prompt: input.prompt || `Marketing image for ${job.product?.name || 'product'}`,
    purpose: input.purpose || 'social_post',
    aspectRatio: input.aspectRatio || '1:1',
    organizationId: job.organizationId,
    productId: job.productId || undefined
  })
  
  return {
    success: true,
    image: result,
    prompt: input.prompt
  }
}

async function processEmailSequence(job: any) {
  // TODO: Integrar con email-agent.ts
  const input = job.input as any
  console.log(`  📧 Generando secuencia email: ${input.sequenceType}`)
  
  await prisma.marketingJob.update({
    where: { id: job.id },
    data: { progress: 50 }
  })
  
  return {
    message: 'Email sequence placeholder',
    sequenceType: input.sequenceType
  }
}

async function processVoiceGeneration(job: any) {
  const input = job.input as any
  console.log(`  🎙️ Generando voz: ${input.script?.substring(0, 50)}...`)
  
  await prisma.marketingJob.update({
    where: { id: job.id },
    data: { progress: 50 }
  })
  
  const result = await generateVoiceover({
    script: input.script || '',
    voiceProfile: input.voiceProfile || 'professional',
    organizationId: job.organizationId,
    productId: job.productId || undefined
  })
  
  return {
    success: true,
    voice: result,
    script: input.script
  }
}

async function processCampaignOptimization(job: any) {
  // TODO: Integrar con strategy-agent.ts
  const input = job.input as any
  console.log(`  📈 Optimizando campaña: ${input.campaignId}`)
  
  await prisma.marketingJob.update({
    where: { id: job.id },
    data: { progress: 50 }
  })
  
  return {
    message: 'Campaign optimization placeholder',
    campaignId: input.campaignId
  }
}

export default processContentJobs

