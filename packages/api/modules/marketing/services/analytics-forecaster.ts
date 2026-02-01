/**
 * Analytics Forecaster - Análisis Predictivo y Forecasting
 * 
 * Predice métricas futuras basándose en datos históricos:
 * - Forecast de revenue
 * - Predicción de churn
 * - Lifetime value (LTV)
 * - Identificación de tendencias
 * - Detección de anomalías
 * - Benchmarking competitivo
 */

import { prisma } from '@repo/database';
import { logger } from './logger';
import { notificationService } from './notification-service';

interface RevenueForecast {
  forecasts: Array<{
    month: string;
    revenue: number;
    confidence: number;
  }>;
  scenarios: {
    conservative: number;
    expected: number;
    optimistic: number;
  };
  factors: string[];
}

interface TrendInsight {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  change: number;
  significance: 'high' | 'medium' | 'low';
  recommendation: string;
}

interface Anomaly {
  metric: string;
  current: number;
  expected: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  detectedAt: Date;
}

export class AnalyticsForecaster {
  /**
   * Predice revenue para los próximos meses
   */
  async forecastRevenue(
    productId: string,
    months: number
  ): Promise<RevenueForecast> {
    logger.info('💰 Forecasting revenue', { productId, months });

    try {
      const product = await prisma.saasProduct.findUnique({
        where: { id: productId },
        include: { organization: true }
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Obtener histórico de conversiones/revenue
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const historicalEvents = await prisma.attributionEvent.findMany({
        where: {
          organizationId: product.organizationId,
          eventType: 'purchase',
          createdAt: { gte: sixMonthsAgo }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Calcular revenue mensual histórico
      const monthlyRevenue = new Map<string, number>();
      for (const event of historicalEvents) {
        const month = event.createdAt.toISOString().substring(0, 7);
        monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + (event.value || 0));
      }

      const historicalData = Array.from(monthlyRevenue.entries())
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month));

      if (historicalData.length === 0) {
        // Sin datos, forecast conservador
        return {
          forecasts: Array.from({ length: months }, (_, i) => ({
            month: this.getMonthOffset(i + 1),
            revenue: 1000,
            confidence: 0.3
          })),
          scenarios: {
            conservative: 800,
            expected: 1000,
            optimistic: 1500
          },
          factors: ['Sin datos históricos suficientes']
        };
      }

      // Simple linear regression para proyección
      const avgRevenue = historicalData.reduce((sum, d) => sum + d.revenue, 0) / historicalData.length;
      
      // Calcular tendencia
      const recentRevenue = historicalData.slice(-3).reduce((sum, d) => sum + d.revenue, 0) / 3;
      const growthRate = historicalData.length >= 3 ? (recentRevenue / avgRevenue) - 1 : 0.05;

      const forecasts = [];
      let projectedRevenue = recentRevenue || avgRevenue;

      for (let i = 0; i < months; i++) {
        projectedRevenue *= (1 + growthRate);
        
        forecasts.push({
          month: this.getMonthOffset(i + 1),
          revenue: Math.round(projectedRevenue),
          confidence: Math.max(0.5, 0.9 - (i * 0.1)) // Confianza decrece con el tiempo
        });
      }

      const expectedMonthly = forecasts[0]?.revenue || avgRevenue;

      const forecast: RevenueForecast = {
        forecasts,
        scenarios: {
          conservative: Math.round(expectedMonthly * 0.7),
          expected: Math.round(expectedMonthly),
          optimistic: Math.round(expectedMonthly * 1.4)
        },
        factors: [
          `Crecimiento histórico: ${(growthRate * 100).toFixed(1)}%`,
          `Revenue promedio: €${Math.round(avgRevenue)}`,
          `Tendencia: ${growthRate > 0 ? 'Creciente' : 'Decreciente'}`
        ]
      };

      logger.success('✅ Revenue forecast generated', {
        expectedMonthly: forecast.scenarios.expected,
        growthRate: `${(growthRate * 100).toFixed(1)}%`
      });

      return forecast;
    } catch (error) {
      logger.error('Failed to forecast revenue', error, { productId });
      throw error;
    }
  }

  /**
   * Predice probabilidad de churn de un usuario
   */
  async predictChurn(userId: string): Promise<{
    churnProbability: number;
    score: number;
    factors: Array<{ factor: string; impact: number }>;
    recommendation: string;
  }> {
    logger.info('⚠️ Predicting churn', { userId });

    // Modelo simplificado basado en engagement
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const events = await prisma.attributionEvent.findMany({
      where: {
        userId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const factors = [];
    let score = 100;

    // Factor 1: Frecuencia de uso
    const eventCount = events.length;
    if (eventCount < 5) {
      score -= 40;
      factors.push({ factor: 'Uso muy bajo (< 5 eventos/mes)', impact: -40 });
    } else if (eventCount < 15) {
      score -= 20;
      factors.push({ factor: 'Uso bajo (< 15 eventos/mes)', impact: -20 });
    }

    // Factor 2: Último evento
    const lastEvent = events[events.length - 1];
    if (lastEvent) {
      const daysSinceLastEvent = (Date.now() - lastEvent.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastEvent > 14) {
        score -= 30;
        factors.push({ factor: `${Math.round(daysSinceLastEvent)} días sin actividad`, impact: -30 });
      }
    } else {
      score -= 50;
      factors.push({ factor: 'Sin actividad reciente', impact: -50 });
    }

    const churnProbability = Math.max(0, Math.min(1, (100 - score) / 100));

    let recommendation = '';
    if (churnProbability > 0.7) {
      recommendation = 'Riesgo ALTO - Contactar urgentemente con oferta especial';
    } else if (churnProbability > 0.4) {
      recommendation = 'Riesgo MEDIO - Enviar email de re-engagement';
    } else {
      recommendation = 'Riesgo BAJO - Mantener nurturing normal';
    }

    return {
      churnProbability,
      score,
      factors,
      recommendation
    };
  }

  /**
   * Predice Lifetime Value de un usuario
   */
  async predictLTV(userId: string): Promise<{
    ltv: number;
    averageOrderValue: number;
    expectedLifetime: number;
    confidence: number;
  }> {
    logger.info('💎 Predicting LTV', { userId });

    const purchases = await prisma.attributionEvent.findMany({
      where: {
        userId,
        eventType: 'purchase'
      },
      orderBy: { createdAt: 'asc' }
    });

    if (purchases.length === 0) {
      return {
        ltv: 0,
        averageOrderValue: 0,
        expectedLifetime: 12, // 12 meses por defecto
        confidence: 0.3
      };
    }

    const totalRevenue = purchases.reduce((sum, p) => sum + (p.value || 0), 0);
    const avgOrderValue = totalRevenue / purchases.length;

    // Calcular frecuencia de compra
    const firstPurchase = purchases[0].createdAt;
    const lastPurchase = purchases[purchases.length - 1].createdAt;
    const daysBetween = (lastPurchase.getTime() - firstPurchase.getTime()) / (1000 * 60 * 60 * 24);
    const purchaseFrequency = purchases.length / (daysBetween / 30); // Compras por mes

    // Estimar lifetime (simplificado: 24 meses promedio SaaS)
    const expectedLifetime = 24;

    // LTV = Avg Order Value × Purchase Frequency × Expected Lifetime
    const ltv = avgOrderValue * purchaseFrequency * expectedLifetime;

    return {
      ltv: Math.round(ltv),
      averageOrderValue: Math.round(avgOrderValue),
      expectedLifetime,
      confidence: purchases.length >= 3 ? 0.8 : 0.5
    };
  }

  /**
   * Identifica tendencias en métricas clave
   */
  async identifyTrends(organizationId: string): Promise<TrendInsight[]> {
    logger.info('📈 Identifying trends', { organizationId });

    const insights: TrendInsight[] = [];

    // Tendencia de contenido publicado
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const recentPosts = await prisma.marketingContent.count({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const olderPosts = await prisma.marketingContent.count({
      where: {
        organizationId,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      }
    });

    const postChange = olderPosts > 0 ? ((recentPosts - olderPosts) / olderPosts) : 0;

    insights.push({
      metric: 'Frecuencia de publicación',
      trend: postChange > 0.1 ? 'increasing' : postChange < -0.1 ? 'decreasing' : 'stable',
      change: postChange,
      significance: Math.abs(postChange) > 0.3 ? 'high' : Math.abs(postChange) > 0.1 ? 'medium' : 'low',
      recommendation: postChange < 0 ? 'Incrementar frecuencia de posts' : 'Mantener ritmo actual'
    });

    // Tendencia de conversiones
    const recentConversions = await prisma.attributionEvent.count({
      where: {
        organizationId,
        eventType: 'purchase',
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const olderConversions = await prisma.attributionEvent.count({
      where: {
        organizationId,
        eventType: 'purchase',
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
      }
    });

    const conversionChange = olderConversions > 0 ? ((recentConversions - olderConversions) / olderConversions) : 0;

    insights.push({
      metric: 'Conversiones',
      trend: conversionChange > 0.05 ? 'increasing' : conversionChange < -0.05 ? 'decreasing' : 'stable',
      change: conversionChange,
      significance: Math.abs(conversionChange) > 0.3 ? 'high' : Math.abs(conversionChange) > 0.1 ? 'medium' : 'low',
      recommendation: conversionChange < 0 ? 'Revisar embudo de conversión' : 'Escalar estrategias actuales'
    });

    return insights;
  }

  /**
   * Detecta anomalías en métricas
   */
  async anomalyDetection(organizationId: string): Promise<Anomaly[]> {
    logger.info('🔍 Detecting anomalies', { organizationId });

    const anomalies: Anomaly[] = [];

    // Comparar últimas 24h con promedio de 7 días anteriores
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    // Eventos hoy
    const todayEvents = await prisma.attributionEvent.count({
      where: {
        organizationId,
        createdAt: { gte: oneDayAgo }
      }
    });

    // Promedio últimos 7 días
    const previousEvents = await prisma.attributionEvent.count({
      where: {
        organizationId,
        createdAt: { gte: eightDaysAgo, lt: oneDayAgo }
      }
    });

    const avgDailyEvents = previousEvents / 7;

    if (avgDailyEvents > 0) {
      const deviation = ((todayEvents - avgDailyEvents) / avgDailyEvents) * 100;

      if (Math.abs(deviation) > 30) { // Cambio > 30% es anomalía
        const severity: Anomaly['severity'] = 
          Math.abs(deviation) > 70 ? 'high' : 
          Math.abs(deviation) > 50 ? 'medium' : 'low';

        anomalies.push({
          metric: 'Eventos totales',
          current: todayEvents,
          expected: Math.round(avgDailyEvents),
          deviation,
          severity,
          detectedAt: new Date()
        });

        // Notificar si es severo
        if (severity === 'high') {
          await notificationService.notifyAnomaly({
            metric: 'Eventos totales',
            current: todayEvents,
            expected: Math.round(avgDailyEvents),
            change: deviation,
            severity
          });
        }
      }
    }

    logger.success('✅ Anomaly detection complete', { anomaliesFound: anomalies.length });

    return anomalies;
  }

  /**
   * Benchmarking con industria
   */
  async competitorBenchmarking(organizationId: string): Promise<{
    metrics: Record<string, { value: number; industry: number; comparison: string }>;
    overall: 'above_average' | 'average' | 'below_average';
  }> {
    logger.info('📊 Running competitor benchmarking', { organizationId });

    // Benchmarks típicos de industria SaaS (datos ficticios, en producción usar APIs)
    const industryBenchmarks = {
      conversionRate: 0.03, // 3%
      churnRate: 0.05, // 5%
      ctr: 0.025, // 2.5%
      roi: 2.5
    };

    // Calcular métricas propias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalEvents = await prisma.attributionEvent.count({
      where: { organizationId, createdAt: { gte: thirtyDaysAgo } }
    });

    const conversions = await prisma.attributionEvent.count({
      where: {
        organizationId,
        eventType: 'purchase',
        createdAt: { gte: thirtyDaysAgo }
      }
    });

    const conversionRate = totalEvents > 0 ? conversions / totalEvents : 0;

    const metrics = {
      conversionRate: {
        value: conversionRate,
        industry: industryBenchmarks.conversionRate,
        comparison: conversionRate > industryBenchmarks.conversionRate ? 
          `${((conversionRate / industryBenchmarks.conversionRate - 1) * 100).toFixed(0)}% mejor que industria` :
          `${((1 - conversionRate / industryBenchmarks.conversionRate) * 100).toFixed(0)}% peor que industria`
      }
    };

    const overall = conversionRate > industryBenchmarks.conversionRate ? 'above_average' : 
                    conversionRate > industryBenchmarks.conversionRate * 0.8 ? 'average' : 'below_average';

    return { metrics, overall };
  }

  /**
   * Helper: Obtiene mes con offset
   */
  private getMonthOffset(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().substring(0, 7);
  }
}

export const analyticsForecaster = new AnalyticsForecaster();









