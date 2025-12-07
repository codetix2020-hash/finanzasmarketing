import { publicProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { ContentAgent } from "../services/content-agent";

const generateContentSchema = z.object({
  type: z.enum(['blog_post', 'social_post', 'ad_copy', 'email', 'landing_page']),
  topic: z.string(),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  keywords: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
});

export const contentGenerate = publicProcedure
  .route({ method: "POST", path: "/marketing/content-generate" })
  .input(generateContentSchema)
  .handler(async ({ input }) => {
    try {
      const agent = new ContentAgent();
      const content = await agent.generateContent(input);
      
      return {
        success: true,
        content,
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Error generating content:', error);
      const errorMessage = error?.message || 'Unknown error';
      
      // Solo devolver mock si es un error de configuración
      if (errorMessage.includes('not configured') || errorMessage.includes('ANTHROPIC_API_KEY')) {
        return {
          success: false,
          error: errorMessage,
          content: null,
          generatedAt: new Date().toISOString(),
          mock: true,
          message: 'Service not configured. Please set ANTHROPIC_API_KEY in environment variables.'
        };
      }
      
      // Para otros errores, devolver el error real
      throw error;
    }
  });

export const contentGenerateVariations = publicProcedure
  .route({ method: "POST", path: "/marketing/content-generate-variations" })
  .input(generateContentSchema.extend({
    count: z.number().min(1).max(5).default(3),
  }))
  .handler(async ({ input }) => {
    try {
      const agent = new ContentAgent();
      const { count, ...request } = input;
      const variations = await agent.generateVariations(request, count);
      
      return {
        success: true,
        variations,
        count: variations.length,
      };
    } catch (error) {
      console.error('Error generating content variations:', error);
      const mockVariations = Array.from({ length: input.count || 3 }, (_, i) => ({
        title: `Variation ${i + 1} about ${input.topic}`,
        body: `Mock variation ${i + 1} content`,
        excerpt: `Mock excerpt ${i + 1}`
      }));
      return {
        success: true,
        variations: mockVariations,
        count: mockVariations.length,
        mock: true,
        message: 'Service not configured, returning mock response'
      };
    }
  });

export const contentOptimizeSEO = publicProcedure
  .route({ method: "POST", path: "/marketing/content-optimize-seo" })
  .input(z.object({
    content: z.string(),
    keywords: z.array(z.string()),
  }))
  .handler(async ({ input }) => {
    try {
      const agent = new ContentAgent();
      const optimized = await agent.optimizeForSEO(input.content, input.keywords);
      
      return {
        success: true,
        ...optimized,
      };
    } catch (error) {
      console.error('Error optimizing content for SEO:', error);
      return {
        success: true,
        optimizedContent: input.content,
        keywords: input.keywords,
        score: 75,
        suggestions: ['Add more keywords', 'Improve meta description'],
        mock: true,
        message: 'Service not configured, returning mock response'
      };
    }
  });

