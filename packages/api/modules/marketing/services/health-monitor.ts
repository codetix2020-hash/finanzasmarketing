/**
 * Health Monitor - Sistema de puntuación de salud del marketing
 * 
 * Calcula un score de 0-100 que indica la salud general del sistema de marketing:
 * - Content Health (25 puntos): Frecuencia, calidad, variedad
 * - Ads Health (25 puntos): ROI, CTR, conversiones
 * - Growth Health (25 puntos): Crecimiento de followers, leads, revenue
 * - Attribution Health (25 puntos): Cobertura de tracking, journey completeness
 * 
 * Proporciona recomendaciones priorizadas para mejorar
 */

import { prisma } from '@repo/database';
import { logger } from './logger';

interface HealthScore {
  overall: number; // 0-100
  grade: '🟢 Excellent' | '🟡 Good' | '🟠 Needs Improvement' | '🔴 Critical';
  breakdown: {
    content: number;
    ads: number;
    growth: number;
    attribution: number;
  };
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    expectedImpact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  trends: {
    overall: 'improving' | 'stable' | 'declining';
    changeLastWeek: number;
  };
}

interface ComponentMetrics {
  score: number;
  details: Record<string, any>;
  issues: string[];
}

export class HealthMonitor {
  /**
   * Calcula el health score completo del marketing
   */
  async calculateMarketingHealth(organizationId: string): Promise<HealthScore> {
    logger.info('💯 Calculating marketing health', { organizationId });

    try {
      // Calcular cada componente
      const contentHealth = await this.calculateContentHealth(organizationId);
      const adsHealth = await this.calculateAdsHealth(organizationId);
      const growthHealth = await this.calculateGrowthHealth(organizationId);
      const attributionHealth = await this.calculateAttributionHealth(organizationId);

      // Score overall
      const overall = Math.round(
        contentHealth.score +
        adsHealth.score +
        growthHealth.score +
        attributionHealth.score
      );

      // Determinar grade
      const grade = this.scoreToGrade(overall);

      // Generar recomendaciones
      const recommendations = this.generateRecommendations({
        content: contentHealth,
        ads: adsHealth,
        growth: growthHealth,
        attribution: attributionHealth
      });

      // Calcular tendencia
      const previousScore = await this.getPreviousScore(organizationId);
      const changeLastWeek = previousScore ? overall - previousScore : 0;
      const trend: HealthScore['trends']['overall'] = 
        changeLastWeek > 5 ? 'improving' :
        changeLastWeek < -5 ? 'declining' : 'stable';

      // Guardar score actual
      await this.saveScore(organizationId, overall);

      const healthScore: HealthScore = {
        overall,
        grade,
        breakdown: {
          content: Math.round(contentHealth.score),
          ads: Math.round(adsHealth.score),
          growth: Math.round(growthHealth.score),
          attribution: Math.round(attributionHealth.score)
        },
        recommendations,
        trends: {
          overall: trend,
          changeLastWeek
        }
      };

      logger.success('✅ Health score calculated', {
        overall,
        grade,
        trend
      });

      return healthScore;
    } catch (error) {
      logger.error('Failed to calculate health score', error, { organizationId });
      throw error;
    }
  }

  /**
   * Content Health (25 puntos máximo)
   */
  private async calculateContentHealth(organizationId: string): Promise<ComponentMetrics> {
    let score = 0;
    const details: Record<string, any> = {};
    const issues: string[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Métrica 1: Frecuencia de publicación (10 puntos)
    const postsCount = await prisma.marketingContent.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['PUBLISHED', 'AUTO_PUBLISHED'] }
      }
    });

    const targetPosts = 60; // 2 posts/día × 30 días
    const frequencyScore = Math.min((postsCount / targetPosts) * 10, 10);
    score += frequencyScore;
    details.postsLast30Days = postsCount;
    details.targetPosts = targetPosts;

    if (postsCount < targetPosts * 0.5) {
      issues.push('Frecuencia de publicación muy baja (< 1 post/día)');
    }

    // Métrica 2: Calidad promedio (10 puntos)
    const recentPosts = await prisma.marketingContent.findMany({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { guardScore: true }
    });

    const avgQuality = recentPosts.length > 0 ?
      recentPosts.reduce((sum, p) => sum + (p.guardScore || 60), 0) / recentPosts.length :
      60;

    const qualityScore = (avgQuality / 100) * 10;
    score += qualityScore;
    details.avgQualityScore = Math.round(avgQuality);

    if (avgQuality < 70) {
      issues.push('Calidad de contenido por debajo del objetivo (< 70/100)');
    }

    // Métrica 3: Variedad de plataformas (5 puntos)
    const platforms = await prisma.marketingContent.groupBy({
      by: ['platform'],
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const varietyScore = Math.min((platforms.length / 2) * 5, 5); // 2+ plataformas = máximo
    score += varietyScore;
    details.platformsUsed = platforms.length;

    if (platforms.length < 2) {
      issues.push('Publicando en menos de 2 plataformas');
    }

    return { score, details, issues };
  }

  /**
   * Ads Health (25 puntos máximo)
   */
  private async calculateAdsHealth(organizationId: string): Promise<ComponentMetrics> {
    let score = 0;
    const details: Record<string, any> = {};
    const issues: string[] = [];

    const activeCampaigns = await prisma.marketingAdCampaign.findMany({
      where: {
        organizationId,
        status: 'ACTIVE'
      }
    });

    if (activeCampaigns.length === 0) {
      issues.push('Sin campañas activas');
      return { score: 0, details: { activeCampaigns: 0 }, issues };
    }

    details.activeCampaigns = activeCampaigns.length;

    // Métrica 1: ROI promedio (15 puntos)
    const avgROI = activeCampaigns.reduce((sum, c) => {
      const perf = c.performance as any || {};
      return sum + (perf.roi || 0);
    }, 0) / activeCampaigns.length;

    // ROI 3x = máximo score, 0x = 0 score
    const roiScore = Math.min((avgROI / 3) * 15, 15);
    score += roiScore;
    details.avgROI = avgROI.toFixed(2);

    if (avgROI < 1.5) {
      issues.push(`ROI promedio bajo: ${avgROI.toFixed(2)}x (objetivo: 2x+)`);
    }

    // Métrica 2: CTR promedio (5 puntos)
    const avgCTR = activeCampaigns.reduce((sum, c) => {
      const perf = c.performance as any || {};
      return sum + (perf.ctr || 0);
    }, 0) / activeCampaigns.length;

    // CTR 3% = máximo score
    const ctrScore = Math.min((avgCTR / 0.03) * 5, 5);
    score += ctrScore;
    details.avgCTR = `${(avgCTR * 100).toFixed(2)}%`;

    if (avgCTR < 0.015) {
      issues.push(`CTR bajo: ${(avgCTR * 100).toFixed(2)}% (objetivo: 2%+)`);
    }

    // Métrica 3: Conversiones (5 puntos)
    const totalConversions = activeCampaigns.reduce((sum, c) => {
      const perf = c.performance as any || {};
      return sum + (perf.conversions || 0);
    }, 0);

    const conversionsScore = Math.min((totalConversions / 50) * 5, 5); // 50+ conversiones = máximo
    score += conversionsScore;
    details.totalConversions = totalConversions;

    if (totalConversions < 20) {
      issues.push(`Pocas conversiones: ${totalConversions} (objetivo: 50+/mes)`);
    }

    return { score, details, issues };
  }

  /**
   * Growth Health (25 puntos máximo)
   */
  private async calculateGrowthHealth(organizationId: string): Promise<ComponentMetrics> {
    let score = 0;
    const details: Record<string, any> = {};
    const issues: string[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Métrica 1: Crecimiento de revenue (15 puntos)
    const recentRevenue = await prisma.attributionEvent.aggregate({
      _sum: { value: true },
      where: {
        organizationId,
        eventType: 'purchase',
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const previousRevenue = await prisma.attributionEvent.aggregate({
      _sum: { value: true },
      where: {
        organizationId,
        eventType: 'purchase',
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      }
    });

    const recentRev = recentRevenue._sum.value || 0;
    const prevRev = previousRevenue._sum.value || 1;
    const revenueGrowth = (recentRev - prevRev) / prevRev;

    // 20% growth = máximo score
    const revenueScore = Math.min((revenueGrowth / 0.2) * 15, 15);
    score += Math.max(0, revenueScore); // No penalizar si negativo, solo no dar puntos
    details.revenueGrowth = `${(revenueGrowth * 100).toFixed(1)}%`;
    details.recentRevenue = `€${Math.round(recentRev)}`;

    if (revenueGrowth < 0) {
      issues.push('Revenue decreciendo mes a mes');
    }

    // Métrica 2: Crecimiento de leads (10 puntos)
    const recentLeads = await prisma.attributionEvent.count({
      where: {
        organizationId,
        eventType: 'signup',
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const previousLeads = await prisma.attributionEvent.count({
      where: {
        organizationId,
        eventType: 'signup',
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      }
    });

    const leadGrowth = previousLeads > 0 ? (recentLeads - previousLeads) / previousLeads : 0;
    const leadScore = Math.min((leadGrowth / 0.2) * 10, 10);
    score += Math.max(0, leadScore);
    details.leadGrowth = `${(leadGrowth * 100).toFixed(1)}%`;

    if (leadGrowth < 0) {
      issues.push('Captación de leads decreciendo');
    }

    return { score, details, issues };
  }

  /**
   * Attribution Health (25 puntos máximo)
   */
  private async calculateAttributionHealth(organizationId: string): Promise<ComponentMetrics> {
    let score = 0;
    const details: Record<string, any> = {};
    const issues: string[] = [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Métrica 1: Volumen de eventos trackeados (15 puntos)
    const trackedEvents = await prisma.attributionEvent.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // 500+ eventos = máximo score
    const volumeScore = Math.min((trackedEvents / 500) * 15, 15);
    score += volumeScore;
    details.trackedEvents = trackedEvents;

    if (trackedEvents < 200) {
      issues.push('Bajo volumen de tracking (< 200 eventos/mes)');
    }

    // Métrica 2: Cobertura de eventos (10 puntos)
    const eventTypes = await prisma.attributionEvent.groupBy({
      by: ['eventType'],
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    // 5+ tipos de eventos = máximo score
    const coverageScore = Math.min((eventTypes.length / 5) * 10, 10);
    score += coverageScore;
    details.eventTypesTracked = eventTypes.length;

    if (eventTypes.length < 3) {
      issues.push('Tracking insuficiente de eventos (< 3 tipos)');
    }

    return { score, details, issues };
  }

  /**
   * Genera recomendaciones priorizadas
   */
  private generateRecommendations(components: {
    content: ComponentMetrics;
    ads: ComponentMetrics;
    growth: ComponentMetrics;
    attribution: ComponentMetrics;
  }): HealthScore['recommendations'] {
    const recommendations: HealthScore['recommendations'] = [];

    // Recomendaciones de contenido
    if (components.content.score < 15) {
      recommendations.push({
        priority: 'high',
        action: 'Aumentar frecuencia de publicación a 2 posts/día',
        expectedImpact: 'Mejora orgánica del reach y engagement',
        effort: 'medium'
      });
    }

    // Recomendaciones de ads
    if (components.ads.score < 15) {
      recommendations.push({
        priority: 'critical',
        action: 'Optimizar o pausar campañas con ROI < 1.5x',
        expectedImpact: 'Reducir pérdidas y mejorar rentabilidad',
        effort: 'low'
      });
    }

    // Recomendaciones de growth
    if (components.growth.score < 15) {
      recommendations.push({
        priority: 'high',
        action: 'Implementar estrategias de growth hacking',
        expectedImpact: 'Acelerar crecimiento de leads y revenue',
        effort: 'high'
      });
    }

    // Recomendaciones de attribution
    if (components.attribution.score < 15) {
      recommendations.push({
        priority: 'medium',
        action: 'Ampliar cobertura de tracking en journey',
        expectedImpact: 'Mejor visibilidad de conversiones y ROI',
        effort: 'medium'
      });
    }

    // Recomendaciones generales
    if (components.content.score < 20 && components.ads.score < 20) {
      recommendations.push({
        priority: 'high',
        action: 'Generar calendario editorial y ejecutarlo consistentemente',
        expectedImpact: 'Presencia sólida en redes + mejor performance de ads',
        effort: 'medium'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Convierte score a grade
   */
  private scoreToGrade(score: number): HealthScore['grade'] {
    if (score >= 90) return '🟢 Excellent';
    if (score >= 70) return '🟡 Good';
    if (score >= 50) return '🟠 Needs Improvement';
    return '🔴 Critical';
  }

  /**
   * Obtiene el score de la semana anterior
   */
  private async getPreviousScore(organizationId: string): Promise<number | null> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const memory = await prisma.marketingMemory.findFirst({
      where: {
        organizationId,
        type: 'health_score',
        createdAt: { lte: sevenDaysAgo }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!memory) return null;

    try {
      const data = JSON.parse(memory.value as string);
      return data.overall || null;
    } catch {
      return null;
    }
  }

  /**
   * Guarda el score actual para tracking histórico
   */
  private async saveScore(organizationId: string, score: number): Promise<void> {
    await prisma.marketingMemory.create({
      data: {
        key: `health_score_${Date.now()}`,
        value: JSON.stringify({ overall: score, timestamp: new Date() }),
        type: 'health_score',
        organizationId
      }
    });
  }
}

export const healthMonitor = new HealthMonitor();









