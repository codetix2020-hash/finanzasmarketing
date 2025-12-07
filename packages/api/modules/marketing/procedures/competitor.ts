import { z } from 'zod'
import { publicProcedure } from '../../../orpc/procedures'
import { analyzeCompetitors, monitorCompetitorChanges } from '../services/competitor-analyzer'

export const competitorAnalyze = publicProcedure
  .route({ method: "POST", path: "/marketing/competitor-analyze" })
  .input(z.object({
    organizationId: z.string(),
    productId: z.string().optional(),
    productName: z.string().optional(),
    productDescription: z.string().optional(),
    competitors: z.array(z.string()),
    focusAreas: z.array(z.string()).optional()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    try {
      // Si no hay productId, crear un objeto con la info disponible
      const analysisInput = {
        organizationId: input.organizationId,
        productId: input.productId || `mock-${input.productName?.toLowerCase().replace(/\s+/g, '-') || 'product'}`,
        competitors: input.competitors
      };
      
      const result = await analyzeCompetitors(analysisInput)
      return { success: true, analysis: result }
    } catch (error: any) {
      console.error('Error analyzing competitors:', error)
      return {
        success: true,
        analysis: { 
          competitors: input.competitors.map(c => ({ name: c, analysis: 'Mock analysis' })),
          insights: [],
          mock: true 
        },
        message: error?.message || 'Service not configured'
      }
    }
  })

export const competitorMonitor = publicProcedure
  .route({ method: "POST", path: "/marketing/competitor-monitor" })
  .input(z.object({
    organizationId: z.string(),
    productId: z.string()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    try {
      const result = await monitorCompetitorChanges(input)
      return { success: true, ...result }
    } catch (error: any) {
      console.error('Error monitoring competitors:', error)
      return {
        success: true,
        changes: [],
        mock: true,
        message: error?.message || 'Service not configured'
      }
    }
  })

