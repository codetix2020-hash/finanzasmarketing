import { publicProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import { runOrchestrationCycle } from '../../../jobs/marketing/orchestration-cycle'
import { processContentJobs } from '../../../jobs/marketing/content-job-processor'
import { processInbox } from '../../autosaas/webhook-handler'

// Endpoint para ejecutar orquestación (llamar cada 6 horas)
export const cronOrchestration = publicProcedure
  .route({ method: "POST", path: "/marketing/cron/orchestration" })
  .input(z.object({
    secret: z.string().optional()
  }))
  .handler(async ({ input }) => {
    // Verificar secret si está configurado
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && input.secret !== cronSecret) {
      return { success: false, error: 'Unauthorized' }
    }

    console.log('🕐 Cron: Iniciando orquestación...')
    const result = await runOrchestrationCycle()
    return result
  })

// Endpoint para procesar jobs (llamar cada 5 minutos)
export const cronJobProcessor = publicProcedure
  .route({ method: "POST", path: "/marketing/cron/jobs" })
  .input(z.object({
    secret: z.string().optional()
  }))
  .handler(async ({ input }) => {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && input.secret !== cronSecret) {
      return { success: false, error: 'Unauthorized' }
    }

    console.log('🕐 Cron: Procesando jobs...')
    const result = await processContentJobs()
    return result
  })

// Endpoint para procesar inbox de Auto-SaaS (llamar cada 10 minutos)
export const cronProcessInbox = publicProcedure
  .route({ method: "POST", path: "/marketing/cron/inbox" })
  .input(z.object({
    secret: z.string().optional(),
    organizationId: z.string().optional()
  }))
  .handler(async ({ input }) => {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && input.secret !== cronSecret) {
      return { success: false, error: 'Unauthorized' }
    }

    const orgId = input.organizationId || process.env.ORGANIZATION_ID || ''
    if (!orgId) {
      return { success: false, error: 'organizationId required' }
    }

    console.log('🕐 Cron: Procesando inbox...')
    const result = await processInbox(orgId)
    return result
  })

