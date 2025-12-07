import { publicProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import { prisma } from '@repo/database'

// Obtener todos los productos
export const getProducts = publicProcedure
  .route({ method: "POST", path: "/marketing/dashboard/products" })
  .input(z.object({
    organizationId: z.string()
  }))
  .handler(async ({ input }) => {
    const products = await prisma.saasProduct.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return { success: true, products }
  })

// Obtener todo el contenido generado
export const getGeneratedContent = publicProcedure
  .route({ method: "POST", path: "/marketing/dashboard/content" })
  .input(z.object({
    organizationId: z.string(),
    productId: z.string().optional(),
    type: z.string().optional()
  }))
  .handler(async ({ input }) => {
    const content = await prisma.marketingContent.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.productId && { productId: input.productId }),
        ...(input.type && { type: input.type as any })
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { product: true }
    })
    return { success: true, content }
  })

// Obtener imágenes generadas
export const getGeneratedImages = publicProcedure
  .route({ method: "POST", path: "/marketing/dashboard/images" })
  .input(z.object({
    organizationId: z.string(),
    productId: z.string().optional()
  }))
  .handler(async ({ input }) => {
    const images = await prisma.marketingContent.findMany({
      where: {
        organizationId: input.organizationId,
        type: 'IMAGE',
        ...(input.productId && { productId: input.productId })
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { product: true }
    })
    return { success: true, images }
  })

// Obtener decisiones/planes de marketing
export const getMarketingDecisions = publicProcedure
  .route({ method: "POST", path: "/marketing/dashboard/decisions" })
  .input(z.object({
    organizationId: z.string(),
    productId: z.string().optional()
  }))
  .handler(async ({ input }) => {
    const decisions = await prisma.marketingDecision.findMany({
      where: {
        organizationId: input.organizationId
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    return { success: true, decisions }
  })

// Obtener costos de APIs
export const getApiCosts = publicProcedure
  .route({ method: "POST", path: "/marketing/dashboard/costs" })
  .input(z.object({
    organizationId: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional()
  }))
  .handler(async ({ input }) => {
    // Por ahora, calcular desde los logs de uso
    // Después se puede mejorar con una tabla específica
    try {
      const costs = await prisma.apiUsageLog.findMany({
        where: {
          organizationId: input.organizationId,
          ...(input.startDate && {
            createdAt: { gte: new Date(input.startDate) }
          }),
          ...(input.endDate && {
            createdAt: { lte: new Date(input.endDate) }
          })
        },
        orderBy: { createdAt: 'desc' }
      })

      // Calcular totales por API
      const totals = {
        anthropic: { tokens: 0, cost: 0 },
        openai: { tokens: 0, cost: 0 },
        replicate: { calls: 0, cost: 0 },
        elevenlabs: { characters: 0, cost: 0 },
        total: 0
      }

      for (const log of costs) {
        const meta = log.metadata as any
        switch (log.apiName) {
          case 'anthropic':
            totals.anthropic.tokens += log.tokens || 0
            totals.anthropic.cost += log.cost || 0
            break
          case 'openai':
            totals.openai.tokens += log.tokens || 0
            totals.openai.cost += log.cost || 0
            break
          case 'replicate':
            totals.replicate.calls += 1
            totals.replicate.cost += log.cost || 0.003 // ~$0.003 por imagen
            break
          case 'elevenlabs':
            totals.elevenlabs.characters += meta?.characters || 0
            totals.elevenlabs.cost += log.cost || 0
            break
        }
      }

      totals.total = totals.anthropic.cost + totals.openai.cost + 
                     totals.replicate.cost + totals.elevenlabs.cost

      return { 
        success: true, 
        costs: totals,
        logs: costs.slice(0, 100)
      }
    } catch (error) {
      // Si la tabla no existe, devolver valores por defecto
      return {
        success: true,
        costs: {
          anthropic: { tokens: 0, cost: 0 },
          openai: { tokens: 0, cost: 0 },
          replicate: { calls: 0, cost: 0 },
          elevenlabs: { characters: 0, cost: 0 },
          total: 0
        },
        logs: []
      }
    }
  })

// Obtener estado del sistema
export const getSystemStatus = publicProcedure
  .route({ method: "POST", path: "/marketing/dashboard/status" })
  .input(z.object({
    organizationId: z.string()
  }))
  .handler(async ({ input }) => {
    try {
      // Verificar si el sistema está pausado
      const config = await prisma.marketingConfig.findUnique({
        where: { organizationId: input.organizationId }
      })

      const stats = {
        isPaused: config?.isPaused || false,
        totalProducts: await prisma.saasProduct.count({
          where: { organizationId: input.organizationId }
        }),
        totalContent: await prisma.marketingContent.count({
          where: { organizationId: input.organizationId }
        }),
        totalImages: await prisma.marketingContent.count({
          where: { organizationId: input.organizationId, type: 'IMAGE' }
        }),
        totalDecisions: await prisma.marketingDecision.count({
          where: { organizationId: input.organizationId }
        }),
        pendingJobs: await prisma.marketingJob.count({
          where: { organizationId: input.organizationId, status: 'pending' }
        }),
        lastActivity: await prisma.marketingContent.findFirst({
          where: { organizationId: input.organizationId },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        })
      }

      return { success: true, status: stats }
    } catch (error) {
      // Si hay error, devolver valores por defecto
      return {
        success: true,
        status: {
          isPaused: false,
          totalProducts: 0,
          totalContent: 0,
          totalImages: 0,
          totalDecisions: 0,
          pendingJobs: 0,
          lastActivity: null
        }
      }
    }
  })

// Pausar/Reanudar sistema
export const toggleSystemPause = publicProcedure
  .route({ method: "POST", path: "/marketing/dashboard/toggle-pause" })
  .input(z.object({
    organizationId: z.string(),
    pause: z.boolean()
  }))
  .handler(async ({ input }) => {
    try {
      const config = await prisma.marketingConfig.upsert({
        where: { organizationId: input.organizationId },
        create: {
          organizationId: input.organizationId,
          isPaused: input.pause
        },
        update: {
          isPaused: input.pause
        }
      })

      return { 
        success: true, 
        isPaused: config.isPaused,
        message: input.pause ? 'Sistema pausado' : 'Sistema activo'
      }
    } catch (error) {
      // Si la tabla no existe, devolver error
      return {
        success: false,
        error: 'MarketingConfig table not found. Please run database migration.'
      }
    }
  })

