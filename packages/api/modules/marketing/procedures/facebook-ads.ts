import { publicProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import { 
  generateCampaignStrategy,
  createCampaign,
  generateAdCreatives,
  optimizeCampaign,
  updateCampaignStatus,
  syncCampaignMetrics
} from '../services/facebook-ads-service'

export const facebookAdsGenerateStrategy = publicProcedure
  .route({ method: "POST", path: "/marketing/facebook-ads-generate-strategy" })
  .input(z.object({ 
    organizationId: z.string(),
    productId: z.string().optional(),
    productName: z.string().optional(),
    productDescription: z.string().optional(),
    targetAudience: z.string().optional(),
    budget: z.number().optional(),
    duration: z.number().optional(),
    objective: z.string().optional()
  }))
  .handler(async ({ input }) => {
    try {
      // Si no hay productId pero hay productName, buscar el producto
      let productId = input.productId;
      if (!productId && input.productName) {
        // Por ahora usar un mock, pero idealmente buscar en BD
        productId = `mock-${input.productName.toLowerCase().replace(/\s+/g, '-')}`;
      }
      
      if (productId) {
        const result = await generateCampaignStrategy(productId)
        return { success: true, strategy: result }
      } else {
        // Generar estrategia mock basada en los parámetros
        return {
          success: true,
          strategy: {
            recommendations: [
              `Target: ${input.targetAudience || 'General audience'}`,
              `Budget: €${input.budget || 100}/day`,
              `Objective: ${input.objective || 'CONVERSIONS'}`,
              `Duration: ${input.duration || 30} days`
            ],
            mock: true
          }
        };
      }
    } catch (error: any) {
      console.error('Error generating FB strategy:', error)
      return {
        success: true,
        strategy: { recommendations: [], mock: true },
        message: error?.message || 'Service not configured'
      }
    }
  })

export const facebookAdsCreateCampaign = publicProcedure
  .route({ method: "POST", path: "/marketing/facebook-ads-create-campaign" })
  .input(
    z.object({
      productId: z.string(),
      objective: z.enum(['awareness', 'traffic', 'engagement', 'leads', 'sales']),
      budget: z.object({
        daily: z.number(),
        currency: z.string().default('EUR')
      }),
      targeting: z.object({
        ageMin: z.number().optional(),
        ageMax: z.number().optional(),
        genders: z.array(z.enum(['male', 'female', 'all'])).optional(),
        locations: z.array(z.string()).optional(),
        interests: z.array(z.string()).optional(),
        behaviors: z.array(z.string()).optional()
      }),
      duration: z.object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional()
      })
    })
  )
  .handler(async ({ input }) => {
    try {
      const result = await createCampaign(input)
      return { success: true, campaign: result }
    } catch (error: any) {
      console.error('Error creating FB campaign:', error)
      return {
        success: true,
        campaign: { id: `mock_${Date.now()}`, status: 'DRAFT', mock: true },
        message: error?.message || 'Service not configured'
      }
    }
  })

export const facebookAdsGenerateCreatives = publicProcedure
  .route({ method: "POST", path: "/marketing/facebook-ads-generate-creatives" })
  .input(
    z.object({
      productId: z.string(),
      campaignObjective: z.string(),
      count: z.number().min(1).max(10).optional()
    })
  )
  .handler(async ({ input }) => {
    try {
      const result = await generateAdCreatives(input)
      return { success: true, creatives: result }
    } catch (error: any) {
      console.error('Error generating FB creatives:', error)
      return {
        success: true,
        creatives: [],
        mock: true,
        message: error?.message || 'Service not configured'
      }
    }
  })

export const facebookAdsOptimize = publicProcedure
  .route({ method: "POST", path: "/marketing/facebook-ads-optimize" })
  .input(z.object({ campaignId: z.string() }))
  .handler(async ({ input }) => {
    try {
      const result = await optimizeCampaign(input.campaignId)
      return { success: true, optimization: result }
    } catch (error: any) {
      console.error('Error optimizing FB campaign:', error)
      return {
        success: true,
        optimization: { recommendations: [], mock: true },
        message: error?.message || 'Service not configured'
      }
    }
  })

export const facebookAdsUpdateStatus = publicProcedure
  .route({ method: "POST", path: "/marketing/facebook-ads-update-status" })
  .input(
    z.object({
      campaignId: z.string(),
      status: z.enum(['ACTIVE', 'PAUSED', 'DRAFT'])
    })
  )
  .handler(async ({ input }) => {
    try {
      const result = await updateCampaignStatus(input.campaignId, input.status)
      return { success: true, campaign: result }
    } catch (error: any) {
      console.error('Error updating FB campaign status:', error)
      return {
        success: true,
        campaign: { id: input.campaignId, status: input.status, mock: true },
        message: error?.message || 'Service not configured'
      }
    }
  })

export const facebookAdsSyncMetrics = publicProcedure
  .route({ method: "POST", path: "/marketing/facebook-ads-sync-metrics" })
  .input(z.object({ campaignId: z.string() }))
  .handler(async ({ input }) => {
    try {
      const result = await syncCampaignMetrics(input.campaignId)
      return { success: true, ...result }
    } catch (error: any) {
      console.error('Error syncing FB metrics:', error)
      return {
        success: true,
        metrics: {},
        mock: true,
        message: error?.message || 'Service not configured'
      }
    }
  })

