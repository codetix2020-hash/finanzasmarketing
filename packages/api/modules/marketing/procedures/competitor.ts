import { z } from 'zod'
import { publicProcedure } from '../../../orpc/procedures'
import { analyzeCompetitors, monitorCompetitorChanges } from '../services/competitor-analyzer'

export const analyzeCompetitorsProcedure = publicProcedure
  .input(z.object({
    organizationId: z.string(),
    productId: z.string(),
    competitors: z.array(z.string()).optional()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await analyzeCompetitors(input)
    return { success: true, analysis: result }
  })

export const monitorCompetitorChangesProcedure = publicProcedure
  .input(z.object({
    organizationId: z.string(),
    productId: z.string()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await monitorCompetitorChanges(input)
    return { success: true, ...result }
  })

