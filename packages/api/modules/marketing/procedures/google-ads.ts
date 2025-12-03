import { protectedProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import { 
  generateKeywordResearch,
  generateGoogleAdsStrategy,
  createGoogleCampaign,
  generateResponsiveSearchAds,
  optimizeGoogleCampaign,
  syncGoogleMetrics
} from '../services/google-ads-service'

export const generateKeywordResearchProcedure = protectedProcedure
  .input(z.object({ productId: z.string() }))
  .mutation(async ({ input }) => {
    const result = await generateKeywordResearch(input.productId)
    return { success: true, research: result }
  })

export const generateGoogleStrategyProcedure = protectedProcedure
  .input(z.object({ productId: z.string() }))
  .mutation(async ({ input }) => {
    const result = await generateGoogleAdsStrategy(input.productId)
    return { success: true, strategy: result }
  })

export const createGoogleCampaignProcedure = protectedProcedure
  .input(
    z.object({
      productId: z.string(),
      campaignType: z.enum(['search', 'display', 'youtube', 'performance_max']),
      budget: z.object({
        daily: z.number(),
        currency: z.string().default('EUR')
      }),
      targeting: z.object({
        keywords: z.array(z.string()).optional(),
        locations: z.array(z.string()).optional(),
        languages: z.array(z.string()).optional(),
        audiences: z.array(z.string()).optional(),
        demographics: z.object({
          ageRanges: z.array(z.string()).optional(),
          genders: z.array(z.string()).optional(),
          householdIncome: z.array(z.string()).optional()
        }).optional()
      }),
      bidStrategy: z.enum(['maximize_clicks', 'maximize_conversions', 'target_cpa', 'target_roas']),
      duration: z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional()
      })
    })
  )
  .mutation(async ({ input }) => {
    const result = await createGoogleCampaign(input)
    return { success: true, campaign: result }
  })

export const generateRSAProcedure = protectedProcedure
  .input(
    z.object({
      productId: z.string(),
      keywords: z.array(z.string()),
      count: z.number().min(1).max(5).optional()
    })
  )
  .mutation(async ({ input }) => {
    const result = await generateResponsiveSearchAds(input)
    return { success: true, ads: result }
  })

export const optimizeGoogleCampaignProcedure = protectedProcedure
  .input(z.object({ campaignId: z.string() }))
  .mutation(async ({ input }) => {
    const result = await optimizeGoogleCampaign(input.campaignId)
    return { success: true, optimization: result }
  })

export const syncGoogleMetricsProcedure = protectedProcedure
  .input(z.object({ campaignId: z.string() }))
  .mutation(async ({ input }) => {
    const result = await syncGoogleMetrics(input.campaignId)
    return { success: true, ...result }
  })

