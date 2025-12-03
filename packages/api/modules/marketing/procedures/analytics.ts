import { protectedProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import { 
  getDashboardMetrics,
  getContentPerformance,
  getCampaignROI,
  generateAIInsights,
  generateWeeklyReport
} from '../services/analytics-service'

export const getDashboardMetricsProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
      productId: z.string().optional(),
      dateRange: z.object({
        start: z.coerce.date(),
        end: z.coerce.date()
      }).optional()
    })
  )
  .query(async ({ input }) => {
    const result = await getDashboardMetrics(input)
    return { success: true, metrics: result }
  })

export const getContentPerformanceProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
      productId: z.string().optional(),
      limit: z.number().optional()
    })
  )
  .query(async ({ input }) => {
    const result = await getContentPerformance(input)
    return { success: true, performance: result }
  })

export const getCampaignROIProcedure = protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .query(async ({ input }) => {
    const result = await getCampaignROI(input.organizationId)
    return { success: true, roi: result }
  })

export const generateInsightsProcedure = protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .mutation(async ({ input }) => {
    const result = await generateAIInsights(input.organizationId)
    return { success: true, insights: result }
  })

export const generateWeeklyReportProcedure = protectedProcedure
  .input(z.object({ organizationId: z.string() }))
  .mutation(async ({ input }) => {
    const result = await generateWeeklyReport(input.organizationId)
    return { success: true, report: result }
  })

