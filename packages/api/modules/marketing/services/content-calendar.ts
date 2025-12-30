/**
 * Content Calendar - Calendario Editorial Inteligente
 * 
 * Genera planes de contenido mensuales para redes sociales
 * considerando:
 * - Balance de tipos de contenido (educativo, promocional, testimonial)
 * - Timing óptimo por plataforma
 * - Eventos y fechas relevantes
 * - Análisis de competidores
 * - Performance histórica
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@repo/database';
import { logger } from './logger';

interface CalendarPost {
  platform: 'instagram' | 'tiktok' | 'facebook';
  type: 'carousel' | 'reel' | 'post' | 'story';
  topic: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  contentType: 'educational' | 'promotional' | 'testimonial' | 'behind-the-scenes' | 'user-generated';
}

interface CalendarDay {
  date: string;
  posts: CalendarPost[];
  specialEvent?: string;
}

interface MonthlyCalendar {
  month: string;
  year: number;
  days: CalendarDay[];
  themes: string[];
  kpis: {
    expectedReach: number;
    expectedEngagement: number;
    expectedConversions: number;
  };
  summary: {
    totalPosts: number;
    byPlatform: Record<string, number>;
    byType: Record<string, number>;
  };
}

interface CampaignSuggestion {
  name: string;
  objective: string;
  platform: string;
  budget: number;
  duration: number;
  expectedROI: number;
  confidence: number;
  reasoning: string;
}

export class ContentCalendar {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for ContentCalendar');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Genera un calendario editorial completo para un mes
   */
  async generateMonthlyCalendar(
    productId: string, 
    month: string
  ): Promise<MonthlyCalendar> {
    logger.info('📅 Generating monthly content calendar', { productId, month });

    try {
      // 1. Obtener información del producto
      const product = await prisma.saasProduct.findUnique({
        where: { id: productId },
        include: {
          organization: true
        }
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // 2. Analizar performance histórica
      const historicalPerformance = await this.analyzeHistoricalPerformance(
        product.organizationId
      );

      // 3. Generar calendario con Claude
      const prompt = `Eres un Content Manager experto. Genera un calendario editorial para el mes de ${month}.

INFORMACIÓN DEL PRODUCTO:
- Nombre: ${product.name}
- Descripción: ${product.description}
- Target: ${product.targetAudience || 'General'}
- Precio: ${product.price ? `€${product.price}` : 'Freemium'}

PERFORMANCE HISTÓRICA:
${historicalPerformance}

REQUISITOS:
1. Balance de contenido:
   - 70% educativo/valor (tips, tutoriales, insights)
   - 20% social proof (testimonios, casos de éxito, reviews)
   - 10% promocional (ofertas, features, CTAs directos)

2. Frecuencia:
   - 2 posts por día (1 Instagram + 1 TikTok)
   - Variar formatos (carousel, reel, post estático)

3. Timing óptimo:
   - Instagram: 18:00-20:00 (mejor engagement)
   - TikTok: 12:00-14:00 y 19:00-21:00

4. Considerar eventos relevantes:
   - Black Friday (si aplica)
   - Navidad/Año Nuevo
   - Fechas del sector tecnológico
   - Lanzamientos de features

5. Temas variados y engaging

Genera un JSON con este formato EXACTO:
{
  "days": [
    {
      "date": "2025-02-01",
      "posts": [
        {
          "platform": "instagram",
          "type": "carousel",
          "topic": "5 errores comunes al...",
          "time": "18:00",
          "priority": "high",
          "contentType": "educational"
        },
        {
          "platform": "tiktok",
          "type": "reel",
          "topic": "Tutorial rápido de...",
          "time": "13:00",
          "priority": "medium",
          "contentType": "educational"
        }
      ],
      "specialEvent": "Inicio de mes - recap enero"
    }
  ],
  "themes": ["Product education", "Customer success", "Industry trends"],
  "kpis": {
    "expectedReach": 50000,
    "expectedEngagement": 2500,
    "expectedConversions": 15
  }
}

Genera 30 días completos de contenido.`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      // Extraer JSON de la respuesta
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const calendarData = JSON.parse(jsonMatch[0]);

      // 4. Calcular resumen
      const summary = this.calculateSummary(calendarData.days);

      // 5. Guardar en memoria del sistema
      await prisma.marketingMemory.upsert({
        where: {
          key: `calendar_${productId}_${month}`
        },
        create: {
          key: `calendar_${productId}_${month}`,
          value: JSON.stringify(calendarData),
          type: 'calendar',
          organizationId: product.organizationId
        },
        update: {
          value: JSON.stringify(calendarData),
          updatedAt: new Date()
        }
      });

      const calendar: MonthlyCalendar = {
        month,
        year: new Date().getFullYear(),
        days: calendarData.days,
        themes: calendarData.themes,
        kpis: calendarData.kpis,
        summary
      };

      logger.success('✅ Monthly calendar generated', {
        productId,
        totalPosts: summary.totalPosts,
        themes: calendarData.themes.length
      });

      return calendar;
    } catch (error) {
      logger.error('Failed to generate monthly calendar', error, { productId, month });
      throw error;
    }
  }

  /**
   * Analiza performance histórica para informar el calendario
   */
  private async analyzeHistoricalPerformance(organizationId: string): Promise<string> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPosts = await prisma.marketingContent.findMany({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['PUBLISHED', 'AUTO_PUBLISHED'] }
      },
      select: {
        platform: true,
        analytics: true
      }
    });

    if (recentPosts.length === 0) {
      return 'Sin datos históricos disponibles (producto nuevo)';
    }

    const avgEngagement = recentPosts.reduce((sum, post: any) => {
      const analytics = post.analytics || {};
      return sum + (analytics.engagement || 0);
    }, 0) / recentPosts.length;

    const platformDistribution = recentPosts.reduce((acc: any, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {});

    return `Posts últimos 30 días: ${recentPosts.length}
Engagement promedio: ${avgEngagement.toFixed(0)}
Distribución: ${JSON.stringify(platformDistribution)}`;
  }

  /**
   * Calcula resumen estadístico del calendario
   */
  private calculateSummary(days: CalendarDay[]): MonthlyCalendar['summary'] {
    let totalPosts = 0;
    const byPlatform: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const day of days) {
      for (const post of day.posts) {
        totalPosts++;
        byPlatform[post.platform] = (byPlatform[post.platform] || 0) + 1;
        byType[post.contentType] = (byType[post.contentType] || 0) + 1;
      }
    }

    return { totalPosts, byPlatform, byType };
  }

  /**
   * Sugiere campañas publicitarias basadas en estacionalidad y performance
   */
  async suggestCampaigns(productId: string): Promise<CampaignSuggestion[]> {
    logger.info('🎯 Generating campaign suggestions', { productId });

    try {
      const product = await prisma.saasProduct.findUnique({
        where: { id: productId },
        include: { organization: true }
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Analizar campañas históricas
      const pastCampaigns = await prisma.marketingAdCampaign.findMany({
        where: {
          organizationId: product.organizationId
        },
        select: {
          name: true,
          platform: true,
          budget: true,
          performance: true
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      const prompt = `Eres un Ads Manager experto. Sugiere 3-5 campañas publicitarias para:

PRODUCTO: ${product.name}
DESCRIPCIÓN: ${product.description}
PRECIO: ${product.price ? `€${product.price}` : 'Freemium'}

CAMPAÑAS PREVIAS:
${pastCampaigns.length > 0 ? JSON.stringify(pastCampaigns, null, 2) : 'Sin campañas previas'}

MES ACTUAL: ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}

Considera:
1. Estacionalidad (eventos del mes)
2. Performance de campañas pasadas
3. Presupuesto realista (€50-500/día)
4. ROI esperado basado en industria SaaS

Retorna JSON:
{
  "campaigns": [
    {
      "name": "Nombre descriptivo",
      "objective": "CONVERSIONS | TRAFFIC | AWARENESS",
      "platform": "google | facebook",
      "budget": 100,
      "duration": 14,
      "expectedROI": 2.5,
      "confidence": 0.75,
      "reasoning": "Por qué esta campaña funcionará"
    }
  ]
}`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
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

      logger.success('✅ Campaign suggestions generated', {
        count: data.campaigns.length
      });

      return data.campaigns;
    } catch (error) {
      logger.error('Failed to generate campaign suggestions', error, { productId });
      throw error;
    }
  }

  /**
   * Obtiene calendario guardado
   */
  async getCalendar(productId: string, month: string): Promise<MonthlyCalendar | null> {
    try {
      const memory = await prisma.marketingMemory.findUnique({
        where: { key: `calendar_${productId}_${month}` }
      });

      if (!memory) return null;

      const data = JSON.parse(memory.value as string);
      const summary = this.calculateSummary(data.days);

      return {
        month,
        year: new Date().getFullYear(),
        days: data.days,
        themes: data.themes,
        kpis: data.kpis,
        summary
      };
    } catch (error) {
      logger.error('Failed to get calendar', error, { productId, month });
      return null;
    }
  }
}

export const contentCalendar = new ContentCalendar();

