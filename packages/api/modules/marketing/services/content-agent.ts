import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export interface ContentRequest {
  type: 'blog_post' | 'social_post' | 'ad_copy' | 'email' | 'landing_page';
  topic: string;
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent';
  length?: 'short' | 'medium' | 'long';
  keywords?: string[];
  targetAudience?: string;
}

export interface GeneratedContent {
  title?: string;
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    seoScore: number;
    keywords: string[];
  };
  variations?: string[];
}

export class ContentAgent {
  private anthropic: Anthropic;
  private openai: OpenAI;

  constructor() {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    
    if (!anthropicKey) {
      console.warn('⚠️ ANTHROPIC_API_KEY not configured - content generation will fail');
    }
    if (!openaiKey) {
      console.warn('⚠️ OPENAI_API_KEY not configured - some features may fail');
    }
    
    this.anthropic = new Anthropic({
      apiKey: anthropicKey || "",
    });
    
    this.openai = new OpenAI({
      apiKey: openaiKey || "",
    });
  }

  /**
   * Generar contenido con IA
   */
  async generateContent(request: ContentRequest): Promise<GeneratedContent> {
    const prompt = this.buildPrompt(request);

    try {
      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: request.length === 'long' ? 4000 : request.length === 'medium' ? 2000 : 1000,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type");
      }

      const generatedText = content.text;
      
      // Calcular metadata
      const wordCount = generatedText.split(/\s+/).length;
      const readingTime = Math.ceil(wordCount / 200); // 200 palabras por minuto
      const seoScore = this.calculateSEOScore(generatedText, request.keywords || []);

      return {
        title: request.type === 'blog_post' ? this.extractTitle(generatedText) : undefined,
        content: generatedText,
        metadata: {
          wordCount,
          readingTime,
          seoScore,
          keywords: request.keywords || [],
        },
      };
    } catch (error) {
      console.error("Error generating content:", error);
      // Lanzar error en lugar de devolver mock - el handler lo manejará
      throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generar múltiples variaciones
   */
  async generateVariations(request: ContentRequest, count: number = 3): Promise<string[]> {
    const variations: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const content = await this.generateContent({
        ...request,
        tone: i === 0 ? 'professional' : i === 1 ? 'casual' : 'friendly',
      });
      variations.push(content.content);
    }

    return variations;
  }

  /**
   * Optimizar contenido para SEO
   */
  async optimizeForSEO(content: string, keywords: string[]): Promise<{
    optimizedContent: string;
    suggestions: string[];
    seoScore: number;
  }> {
    const prompt = `Optimiza este contenido para SEO con estas keywords: ${keywords.join(', ')}

CONTENIDO ORIGINAL:

${content}

Proporciona:

1. Contenido optimizado con keywords naturalmente integradas

2. Lista de sugerencias de mejora SEO

3. Score SEO (0-100)

Responde en JSON:

{
  "optimizedContent": "string",
  "suggestions": ["string"],
  "seoScore": number
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });

      const responseContent = message.content[0];
      if (responseContent.type !== "text") {
        throw new Error("Unexpected response type");
      }

      const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error optimizing for SEO:", error);
      return {
        optimizedContent: content,
        suggestions: ["Añadir más keywords", "Mejorar estructura"],
        seoScore: 50,
      };
    }
  }

  /**
   * Programar publicación de contenido
   */
  async scheduleContent(params: {
    content: string;
    publishDate: Date;
    platforms: string[];
  }): Promise<{ scheduled: boolean; scheduledFor: Date }> {
    // En producción, integraría con Buffer o similar
    console.log("Scheduling content for:", params.publishDate);
    
    return {
      scheduled: true,
      scheduledFor: params.publishDate,
    };
  }

  /**
   * Construir prompt basado en tipo de contenido
   */
  private buildPrompt(request: ContentRequest): string {
    const toneMap = {
      professional: "Usa un tono profesional y formal",
      casual: "Usa un tono casual y relajado",
      friendly: "Usa un tono amigable y cercano",
      urgent: "Usa un tono urgente y directo",
    };

    const lengthMap = {
      short: "Mantén el contenido corto y conciso (100-300 palabras)",
      medium: "Crea contenido de longitud media (300-800 palabras)",
      long: "Genera contenido extenso y detallado (800-2000 palabras)",
    };

    let prompt = `Genera contenido de tipo: ${request.type}\n\n`;
    prompt += `TEMA: ${request.topic}\n`;
    
    if (request.tone) {
      prompt += `\nTONO: ${toneMap[request.tone]}\n`;
    }
    
    if (request.length) {
      prompt += `LONGITUD: ${lengthMap[request.length]}\n`;
    }
    
    if (request.keywords && request.keywords.length > 0) {
      prompt += `\nKEYWORDS A INCLUIR: ${request.keywords.join(', ')}\n`;
    }
    
    if (request.targetAudience) {
      prompt += `\nAUDIENCIA: ${request.targetAudience}\n`;
    }

    if (request.type === 'blog_post') {
      prompt += "\nIncluye un título atractivo al inicio.\n";
    }

    prompt += "\nGenera el contenido ahora:";

    return prompt;
  }

  /**
   * Extraer título de un blog post
   */
  private extractTitle(content: string): string {
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    // Si la primera línea es un título markdown
    if (firstLine.startsWith('#')) {
      return firstLine.replace(/^#+\s*/, '');
    }
    
    // Usar las primeras 10 palabras
    return content.split(/\s+/).slice(0, 10).join(' ') + '...';
  }

  /**
   * Calcular score SEO básico
   */
  private calculateSEOScore(content: string, keywords: string[]): number {
    if (keywords.length === 0) return 50;

    const contentLower = content.toLowerCase();
    let score = 50;

    // +10 por cada keyword encontrada
    keywords.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        score += 10;
      }
    });

    // +5 si el contenido es largo
    if (content.length > 500) score += 5;

    // +5 si tiene buena estructura (saltos de línea)
    if (content.split('\n').length > 3) score += 5;

    return Math.min(score, 100);
  }
}

