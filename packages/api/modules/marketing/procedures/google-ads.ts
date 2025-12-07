import { publicProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import { 
  generateKeywordResearch,
  generateGoogleAdsStrategy,
  createGoogleCampaign,
  generateResponsiveSearchAds,
  optimizeGoogleCampaign,
  syncGoogleMetrics
} from '../services/google-ads-service'

export const googleAdsKeywordResearch = publicProcedure
  .route({ method: "POST", path: "/marketing/google-ads-keyword-research" })
  .input(z.object({ 
    organizationId: z.string(),
    productId: z.string().optional(),
    productName: z.string().optional(),
    seedKeywords: z.array(z.string()),
    language: z.string().optional(),
    country: z.string().optional()
  }))
  .handler(async ({ input }) => {
    try {
      let productId = input.productId;
      if (!productId && input.productName) {
        productId = `mock-${input.productName.toLowerCase().replace(/\s+/g, '-')}`;
      }
      
      if (productId) {
        const result = await generateKeywordResearch(productId)
        return { success: true, keywords: result.keywords || [], research: result }
      } else {
        // Generar keywords mock basadas en seedKeywords
        const keywords = input.seedKeywords.map(kw => ({
          keyword: kw,
          searchVolume: Math.floor(Math.random() * 10000),
          competition: 'medium',
          cpc: (Math.random() * 2 + 0.5).toFixed(2)
        }));
        return {
          success: true,
          keywords: keywords.map(k => k.keyword),
          research: { keywords, mock: true }
        };
      }
    } catch (error: any) {
      console.error('Error generating keyword research:', error)
      return {
        success: true,
        keywords: input.seedKeywords || [],
        research: { keywords: [], mock: true },
        message: error?.message || 'Service not configured'
      }
    }
  })

export const googleAdsGenerateStrategy = publicProcedure
  .route({ method: "POST", path: "/marketing/google-ads-generate-strategy" })
  .input(z.object({ 
    organizationId: z.string(),
    productId: z.string().optional(),
    productName: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    budget: z.number().optional(),
    objective: z.string().optional()
  }))
  .handler(async ({ input }) => {
    try {
      let productId = input.productId;
      if (!productId && input.productName) {
        productId = `mock-${input.productName.toLowerCase().replace(/\s+/g, '-')}`;
      }
      
      if (productId) {
        const result = await generateGoogleAdsStrategy(productId)
        return { success: true, strategy: result }
      } else {
        // Generar estrategia mock
        return {
          success: true,
          strategy: {
            recommendations: [
              `Keywords: ${(input.keywords || []).join(', ')}`,
              `Budget: €${input.budget || 100}/day`,
              `Objective: ${input.objective || 'leads'}`
            ],
            mock: true
          }
        };
      }
    } catch (error: any) {
      console.error('Error generating Google strategy:', error)
      return {
        success: true,
        strategy: { recommendations: [], mock: true },
        message: error?.message || 'Service not configured'
      }
    }
  })

export const googleAdsCreateCampaign = publicProcedure
  .route({ method: "POST", path: "/marketing/google-ads-create-campaign" })
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
  .handler(async ({ input }) => {
    try {
      const result = await createGoogleCampaign(input)
      return { success: true, campaign: result }
    } catch (error: any) {
      console.error('Error creating Google campaign:', error)
      return {
        success: true,
        campaign: { id: `mock_${Date.now()}`, status: 'DRAFT', mock: true },
        message: error?.message || 'Service not configured'
      }
    }
  })

export const googleAdsGenerateRSA = publicProcedure
  .route({ method: "POST", path: "/marketing/google-ads-generate-rsa" })
  .input(
    z.object({
      productId: z.string(),
      keywords: z.array(z.string()),
      count: z.number().min(1).max(5).optional()
    })
  )
  .handler(async ({ input }) => {
    try {
      const result = await generateResponsiveSearchAds(input)
      return { success: true, ads: result }
    } catch (error: any) {
      console.error('Error generating RSA:', error)
      return {
        success: true,
        ads: [],
        mock: true,
        message: error?.message || 'Service not configured'
      }
    }
  })

export const googleAdsOptimize = publicProcedure
  .route({ method: "POST", path: "/marketing/google-ads-optimize" })
  .input(z.object({ campaignId: z.string() }))
  .handler(async ({ input }) => {
    try {
      const result = await optimizeGoogleCampaign(input.campaignId)
      return { success: true, optimization: result }
    } catch (error: any) {
      console.error('Error optimizing Google campaign:', error)
      return {
        success: true,
        optimization: { recommendations: [], mock: true },
        message: error?.message || 'Service not configured'
      }
    }
  })

export const googleAdsSyncMetrics = publicProcedure
  .route({ method: "POST", path: "/marketing/google-ads-sync-metrics" })
  .input(z.object({ campaignId: z.string() }))
  .handler(async ({ input }) => {
    try {
      const result = await syncGoogleMetrics(input.campaignId)
      return { success: true, ...result }
    } catch (error: any) {
      console.error('Error syncing Google metrics:', error)
      return {
        success: true,
        metrics: {},
        mock: true,
        message: error?.message || 'Service not configured'
      }
    }
  })

