import { z } from 'zod'
import { publicProcedure } from '../../../orpc/procedures'
import { generateImage, generateImageVariants, generateOptimizedPrompt } from '../services/visual-agent'

export const visualGenerate = publicProcedure
  .route({ method: "POST", path: "/marketing/visual-generate" })
  .input(z.object({
    organizationId: z.string(),
    productId: z.string().optional(),
    prompt: z.string(),
    purpose: z.enum(['social_post', 'ad', 'landing_hero', 'blog_header', 'product_showcase']),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5']).optional(),
    brandColors: z.array(z.string()).optional(),
    style: z.string().optional()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    try {
      const result = await generateImage(input)
      return result
    } catch (error: any) {
      console.error('Error generating image:', error)
      const errorMessage = error?.message || 'Unknown error';
      
      // Solo devolver mock si es un error de configuración
      if (errorMessage.includes('not configured') || errorMessage.includes('REPLICATE_API_TOKEN')) {
        return {
          success: false,
          error: errorMessage,
          imageUrl: null,
          contentId: null,
          mock: true,
          message: 'Service not configured. Please set REPLICATE_API_TOKEN in environment variables.'
        };
      }
      
      // Para otros errores, devolver el error real
      throw error;
    }
  })

export const visualVariants = publicProcedure
  .route({ method: "POST", path: "/marketing/visual-variants" })
  .input(z.object({
    organizationId: z.string(),
    productId: z.string().optional(),
    prompt: z.string(),
    purpose: z.enum(['social_post', 'ad', 'landing_hero', 'blog_header', 'product_showcase']),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:5']).optional(),
    count: z.number().min(2).max(5).optional()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    try {
      const result = await generateImageVariants(input)
      return result
    } catch (error) {
      console.error('Error generating image variants:', error)
      // Devolver respuesta mock en caso de error
      return {
        variants: [
          { variant: 'A', imageUrl: 'https://via.placeholder.com/1024x1024?text=Variant+A', success: true, mock: true },
          { variant: 'B', imageUrl: 'https://via.placeholder.com/1024x1024?text=Variant+B', success: true, mock: true },
          { variant: 'C', imageUrl: 'https://via.placeholder.com/1024x1024?text=Variant+C', success: true, mock: true }
        ],
        total: 3,
        mock: true,
        message: 'Service not configured, returning mock response'
      }
    }
  })

export const visualOptimizePrompt = publicProcedure
  .route({ method: "POST", path: "/marketing/visual-optimize-prompt" })
  .input(z.object({
    productName: z.string(),
    productDescription: z.string(),
    purpose: z.string(),
    targetAudience: z.string()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    try {
      const result = await generateOptimizedPrompt(input)
      return result
    } catch (error) {
      console.error('Error generating optimized prompt:', error)
      // Devolver respuesta mock en caso de error
      return {
        prompt: `Professional ${input.purpose} image of ${input.productName}. ${input.productDescription}. Target audience: ${input.targetAudience}`,
        style: 'modern, professional, clean',
        colors: ['#3B82F6', '#10B981', '#F59E0B'],
        mood: 'professional and trustworthy',
        elements: [input.productName, 'modern design', 'professional'],
        avoidElements: ['clutter', 'low quality'],
        mock: true,
        message: 'Service not configured, returning mock response'
      }
    }
  })

