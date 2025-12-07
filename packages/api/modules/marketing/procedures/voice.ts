import { z } from 'zod'
import { publicProcedure } from '../../../orpc/procedures'
import { generateVoiceover, generateVideoScript, generateScriptAndVoice } from '../services/voice-agent'

export const voiceGenerate = publicProcedure
  .route({ method: "POST", path: "/marketing/voice-generate" })
  .input(z.object({
    organizationId: z.string(),
    productId: z.string().optional(),
    script: z.string(),
    voiceProfile: z.enum(['professional', 'friendly', 'energetic', 'calm']),
    language: z.string().optional()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    try {
      const result = await generateVoiceover(input)
      return result
    } catch (error: any) {
      console.error('Error generating voiceover:', error)
      const errorMessage = error?.message || 'Unknown error';
      
      if (errorMessage.includes('not configured') || errorMessage.includes('ELEVENLABS_API_KEY')) {
        return {
          success: false,
          error: errorMessage,
          audioUrl: null,
          mock: true,
          message: 'Service not configured. Please set ELEVENLABS_API_KEY in environment variables.'
        };
      }
      
      throw error;
    }
  })

export const voiceScript = publicProcedure
  .route({ method: "POST", path: "/marketing/voice-script" })
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
    try {
      const result = await generateVideoScript(input)
      return { success: true, script: result }
    } catch (error: any) {
      console.error('Error generating video script:', error)
      const errorMessage = error?.message || 'Unknown error';
      
      if (errorMessage.includes('not configured') || errorMessage.includes('ANTHROPIC_API_KEY')) {
        return {
          success: false,
          error: errorMessage,
          script: null,
          mock: true,
          message: 'Service not configured. Please set ANTHROPIC_API_KEY in environment variables.'
        };
      }
      
      throw error;
    }
  })

export const voiceComplete = publicProcedure
  .route({ method: "POST", path: "/marketing/voice-complete" })
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
    try {
      const result = await generateScriptAndVoice(input)
      return result
    } catch (error: any) {
      console.error('Error generating script and voice:', error)
      const errorMessage = error?.message || 'Unknown error';
      
      if (errorMessage.includes('not configured') || errorMessage.includes('ANTHROPIC_API_KEY') || errorMessage.includes('ELEVENLABS_API_KEY')) {
        return {
          success: false,
          error: errorMessage,
          script: null,
          audioUrl: null,
          mock: true,
          message: 'Service not configured. Please set ANTHROPIC_API_KEY and ELEVENLABS_API_KEY in environment variables.'
        };
      }
      
      throw error;
    }
  })

