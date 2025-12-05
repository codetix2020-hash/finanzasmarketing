import { z } from 'zod'
import { publicProcedure } from '../../../orpc/procedures'
import { generateVoiceover, generateVideoScript, generateScriptAndVoice } from '../services/voice-agent'

export const generateVoiceoverProcedure = publicProcedure
  .input(z.object({
    organizationId: z.string(),
    productId: z.string().optional(),
    script: z.string(),
    voiceProfile: z.enum(['professional', 'friendly', 'energetic', 'calm']),
    language: z.string().optional()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await generateVoiceover(input)
    return { success: true, ...result }
  })

export const generateVideoScriptProcedure = publicProcedure
  .input(z.object({
    organizationId: z.string(),
    productId: z.string().optional(),
    topic: z.string(),
    duration: z.number().min(15).max(180),
    style: z.enum(['tutorial', 'promo', 'explainer', 'testimonial']),
    targetAudience: z.string()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await generateVideoScript(input)
    return { success: true, script: result }
  })

export const generateScriptAndVoiceProcedure = publicProcedure
  .input(z.object({
    organizationId: z.string(),
    productId: z.string().optional(),
    topic: z.string(),
    duration: z.number().min(15).max(180),
    style: z.enum(['tutorial', 'promo', 'explainer', 'testimonial']),
    voiceProfile: z.enum(['professional', 'friendly', 'energetic', 'calm']),
    targetAudience: z.string()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await generateScriptAndVoice(input)
    return { success: true, ...result }
  })

