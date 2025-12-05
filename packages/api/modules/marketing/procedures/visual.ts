import { z } from 'zod'
import { publicProcedure } from '../../../orpc/procedures'
import { generateImage, generateImageVariants, generateOptimizedPrompt } from '../services/visual-agent'

export const generateImageProcedure = publicProcedure
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
    const result = await generateImage(input)
    return { success: true, ...result }
  })

export const generateImageVariantsProcedure = publicProcedure
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
    const result = await generateImageVariants(input)
    return { success: true, ...result }
  })

export const generateOptimizedPromptProcedure = publicProcedure
  .input(z.object({
    productName: z.string(),
    productDescription: z.string(),
    purpose: z.string(),
    targetAudience: z.string()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await generateOptimizedPrompt(input)
    return { success: true, ...result }
  })

