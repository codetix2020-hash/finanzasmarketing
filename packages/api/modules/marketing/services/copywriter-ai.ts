/**
 * Copywriter AI - Sistema avanzado de copywriting con frameworks profesionales
 * 
 * Genera copy persuasivo usando frameworks probados:
 * - AIDA (Attention, Interest, Desire, Action)
 * - PAS (Problem, Agitate, Solution)
 * - BAB (Before, After, Bridge)
 * - FAB (Features, Advantages, Benefits)
 * - 4Ps (Picture, Promise, Prove, Push)
 * 
 * Capacidades:
 * - Variaciones A/B automáticas
 * - Optimización por plataforma
 * - Secuencias de email
 * - Landing page copy
 * - Análisis de sentiment y readability
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@repo/database';
import { logger } from './logger';

type CopyFramework = 'AIDA' | 'PAS' | 'BAB' | 'FAB' | '4Ps';
type CopyTone = 'casual' | 'professional' | 'funny' | 'urgent' | 'empathetic' | 'enthusiastic';
type Platform = 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'linkedin' | 'email';

interface CopyGenerationParams {
  topic: string;
  framework: CopyFramework;
  tone: CopyTone;
  platform: Platform;
  productId: string;
  maxLength?: number;
  includeEmojis?: boolean;
  includeHashtags?: boolean;
  ctaType?: 'soft' | 'medium' | 'hard';
}

interface CopyVersion {
  text: string;
  hooks: string[];
  cta: string;
  hashtags: string[];
  estimatedPerformance: number;
}

interface CopyResult {
  versions: CopyVersion[];
  metadata: {
    framework: CopyFramework;
    tone: CopyTone;
    platform: Platform;
    readabilityScore: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

interface EmailSequence {
  emails: Array<{
    day: number;
    subject: string;
    preheader: string;
    body: string;
    cta: string;
  }>;
  goal: string;
  expectedConversion: number;
}

interface LandingPageCopy {
  headline: string;
  subheadline: string;
  benefits: string[];
  features: Array<{ title: string; description: string }>;
  testimonialSuggestions: string[];
  faq: Array<{ question: string; answer: string }>;
  ctas: Array<{ position: string; text: string }>;
  seoKeywords: string[];
}

export class CopywriterAI {
  private anthropic: Anthropic | null = null;

  constructor() {
    // Lazy initialization - solo se crea cuando se usa
  }

  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is required for CopywriterAI');
      }
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
  }

  /**
   * Genera copy persuasivo con variaciones A/B
   */
  async generateCopy(params: CopyGenerationParams): Promise<CopyResult> {
    logger.info('✍️ Generating copy', { 
      framework: params.framework, 
      platform: params.platform,
      topic: params.topic
    });

    try {
      // Obtener info del producto
      const product = await prisma.saasProduct.findUnique({
        where: { id: params.productId }
      });

      if (!product) {
        throw new Error(`Product ${params.productId} not found`);
      }

      const frameworkDescriptions = {
        AIDA: 'Attention (gancho) → Interest (generar interés) → Desire (crear deseo) → Action (llamada a la acción)',
        PAS: 'Problem (identificar problema) → Agitate (agitar el dolor) → Solution (presentar solución)',
        BAB: 'Before (situación actual problemática) → After (visión de mejora) → Bridge (cómo llegar)',
        FAB: 'Features (características) → Advantages (ventajas) → Benefits (beneficios reales)',
        '4Ps': 'Picture (pintar escenario) → Promise (promesa) → Prove (probar con evidencia) → Push (impulsar acción)'
      };

      const platformLimits: Record<Platform, number> = {
        instagram: 2200,
        tiktok: 2200,
        facebook: 5000,
        twitter: 280,
        linkedin: 3000,
        email: 10000
      };

      const maxLength = params.maxLength || platformLimits[params.platform];

      const prompt = `Eres un copywriter profesional experto en persuasión. Genera copy usando el framework ${params.framework}.

FRAMEWORK: ${params.framework}
Estructura: ${frameworkDescriptions[params.framework]}

PRODUCTO:
- Nombre: ${product.name}
- Descripción: ${product.description}
- Target: ${product.targetAudience || 'Emprendedores y startups'}
- Precio: ${product.price ? `€${product.price}` : 'Freemium'}

TEMA: ${params.topic}

REQUISITOS:
- Tono: ${params.tone}
- Plataforma: ${params.platform}
- Máximo caracteres: ${maxLength}
- Emojis: ${params.includeEmojis !== false ? 'Sí (máximo 3, estratégicos)' : 'No'}
- Hashtags: ${params.includeHashtags !== false ? 'Sí (5-8 relevantes)' : 'No'}
- CTA: ${params.ctaType || 'medium'} (soft=suave, medium=directo, hard=urgente)

GENERA 3 VARIACIONES A/B diferentes del mismo mensaje.
Cada variación debe:
1. Seguir el framework ${params.framework}
2. Tener un hook diferente y poderoso
3. Ser genuinamente persuasiva
4. Incluir CTA clara
5. Ser natural, no spam

Retorna JSON EXACTO:
{
  "versions": [
    {
      "text": "Copy completo aquí...",
      "hooks": ["Hook principal usado"],
      "cta": "CTA específico",
      "hashtags": ["hashtag1", "hashtag2"],
      "estimatedPerformance": 8.5
    }
  ]
}

Performance es 0-10 estimando engagement esperado.`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);

      const result: CopyResult = {
        versions: data.versions,
        metadata: {
          framework: params.framework,
          tone: params.tone,
          platform: params.platform,
          readabilityScore: 85, // Simplificado, en producción usar algoritmo real
          sentiment: 'positive'
        }
      };

      logger.success('✅ Copy generated successfully', {
        versionsCount: result.versions.length,
        avgPerformance: result.versions.reduce((sum, v) => sum + v.estimatedPerformance, 0) / result.versions.length
      });

      return result;
    } catch (error) {
      logger.error('Failed to generate copy', error, { params });
      throw error;
    }
  }

  /**
   * Genera secuencia completa de emails para nurturing
   */
  async generateEmailSequence(
    productId: string,
    goal: 'onboarding' | 'conversion' | 'retention' | 'upsell'
  ): Promise<EmailSequence> {
    logger.info('📧 Generating email sequence', { productId, goal });

    try {
      const product = await prisma.saasProduct.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      const goalDescriptions = {
        onboarding: 'Guiar al usuario a completar setup y usar el producto',
        conversion: 'Convertir trial/freemium a plan pago',
        retention: 'Re-enganchar usuarios inactivos',
        upsell: 'Upgrade a plan superior'
      };

      const prompt = `Genera una secuencia estratégica de emails para ${goal}.

PRODUCTO: ${product.name}
DESCRIPCIÓN: ${product.description}
OBJETIVO: ${goalDescriptions[goal]}

CREA UNA SECUENCIA DE 5-7 EMAILS:

Timing sugerido:
- Día 1: Bienvenida/introducción
- Día 3: Valor/educación
- Día 7: Social proof/testimonios
- Día 14: Beneficios/características
- Día 21: Urgencia/oferta
- Día 28: Último push

Cada email debe tener:
1. Subject line irresistible (< 50 caracteres)
2. Preheader text (< 90 caracteres)
3. Body copy persuasivo pero conversacional
4. CTA clara y específica

Retorna JSON:
{
  "emails": [
    {
      "day": 1,
      "subject": "Subject line aquí",
      "preheader": "Preheader text",
      "body": "Body completo del email...",
      "cta": "CTA específico"
    }
  ],
  "expectedConversion": 0.15
}`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const data = JSON.parse(jsonMatch[0]);

      const sequence: EmailSequence = {
        emails: data.emails,
        goal,
        expectedConversion: data.expectedConversion || 0.12
      };

      logger.success('✅ Email sequence generated', {
        emailCount: sequence.emails.length,
        expectedConversion: `${(sequence.expectedConversion * 100).toFixed(1)}%`
      });

      return sequence;
    } catch (error) {
      logger.error('Failed to generate email sequence', error, { productId, goal });
      throw error;
    }
  }

  /**
   * Genera copy completo para landing page
   */
  async generateLandingPageCopy(productId: string): Promise<LandingPageCopy> {
    logger.info('🌐 Generating landing page copy', { productId });

    try {
      const product = await prisma.saasProduct.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      const prompt = `Genera copy completo para una landing page de conversión.

PRODUCTO: ${product.name}
DESCRIPCIÓN: ${product.description}
TARGET: ${product.targetAudience || 'Emprendedores'}
PRECIO: ${product.price ? `€${product.price}` : 'Desde €0'}

GENERA:

1. HEADLINE: Propuesta de valor clara y poderosa (< 80 caracteres)
2. SUBHEADLINE: Amplifica el headline (< 150 caracteres)
3. BENEFITS: 5 beneficios principales (NO features, BENEFICIOS reales)
4. FEATURES: 6 características destacadas con descripción
5. TESTIMONIALS: 3 testimonios sugeridos (ficticios pero realistas)
6. FAQ: 6 preguntas frecuentes con respuestas
7. CTAs: 4 llamadas a la acción para distintas secciones
8. SEO KEYWORDS: 10 keywords principales

Retorna JSON:
{
  "headline": "Headline poderoso",
  "subheadline": "Subheadline descriptivo",
  "benefits": ["Beneficio 1", "Beneficio 2", ...],
  "features": [
    {"title": "Feature 1", "description": "Descripción..."}
  ],
  "testimonialSuggestions": ["Testimonial 1...", ...],
  "faq": [
    {"question": "Pregunta?", "answer": "Respuesta..."}
  ],
  "ctas": [
    {"position": "Hero", "text": "CTA text"}
  ],
  "seoKeywords": ["keyword1", "keyword2", ...]
}`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3500,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const landingPageCopy: LandingPageCopy = JSON.parse(jsonMatch[0]);

      logger.success('✅ Landing page copy generated', {
        benefitsCount: landingPageCopy.benefits.length,
        featuresCount: landingPageCopy.features.length,
        faqCount: landingPageCopy.faq.length
      });

      return landingPageCopy;
    } catch (error) {
      logger.error('Failed to generate landing page copy', error, { productId });
      throw error;
    }
  }

  /**
   * Optimiza copy existente para una plataforma específica
   */
  async optimizeCopy(text: string, platform: Platform): Promise<{
    optimized: string;
    changes: string[];
    scores: {
      readability: number;
      sentiment: number;
      spamLikelihood: number;
    };
  }> {
    logger.info('🔧 Optimizing copy', { platform, originalLength: text.length });

    try {
      const prompt = `Optimiza este copy para ${platform}:

COPY ORIGINAL:
"${text}"

OPTIMIZA PARA:
- Character limits de ${platform}
- Mejora readability
- Elimina spam words
- Mejora sentiment positivo
- Optimiza para engagement

Retorna JSON:
{
  "optimized": "Copy optimizado aquí",
  "changes": ["Cambio 1", "Cambio 2"],
  "scores": {
    "readability": 8.5,
    "sentiment": 9.0,
    "spamLikelihood": 1.5
  }
}

Scores de 0-10. Spam likelihood debe ser < 3.`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const result = JSON.parse(jsonMatch[0]);

      logger.success('✅ Copy optimized', {
        readability: result.scores.readability,
        changesMade: result.changes.length
      });

      return result;
    } catch (error) {
      logger.error('Failed to optimize copy', error);
      throw error;
    }
  }
}

export const copywriterAI = new CopywriterAI();




