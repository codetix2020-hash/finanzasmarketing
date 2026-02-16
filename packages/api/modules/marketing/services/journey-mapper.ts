/**
 * Journey Mapper - Mapeo de Customer Journey
 * 
 * Visualiza y analiza el recorrido completo del cliente:
 * - Cronología de eventos por usuario
 * - Identificación de puntos de abandono (dropoff)
 * - Análisis de fricción en el embudo
 * - Optimización del journey
 */

import { prisma } from '@repo/database';
import { logger } from './logger';

interface JourneyEvent {
  event: string;
  source?: string;
  campaign?: string;
  timestamp: Date;
  value?: number;
  metadata?: any;
}

interface JourneyMap {
  userId: string;
  events: JourneyEvent[];
  duration: number; // minutos desde primer evento
  stages: string[];
  converted: boolean;
  conversionValue?: number;
}

interface DropoffAnalysis {
  steps: Array<{
    name: string;
    entered: number;
    completed: number;
    completionRate: number;
  }>;
  dropoffPoints: Array<{
    from: string;
    to: string;
    dropoffRate: number;
    usersLost: number;
  }>;
  recommendations: string[];
}

interface FunnelMetrics {
  stage: string;
  users: number;
  conversionRate: number;
  avgTimeInStage: number; // minutos
  dropoffRate: number;
}

export class JourneyMapper {
  /**
   * Mapea el journey completo de un usuario
   */
  async mapJourney(userId: string): Promise<JourneyMap> {
    logger.info('🗺️ Mapping user journey', { userId });

    try {
      const events = await prisma.attributionEvent.findMany({
        where: {
          OR: [
            { userId },
            { visitorId: userId }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });

      if (events.length === 0) {
        logger.warning('No events found for user', { userId });
        return {
          userId,
          events: [],
          duration: 0,
          stages: [],
          converted: false
        };
      }

      const journeyEvents: JourneyEvent[] = events.map(e => ({
        event: e.eventType,
        source: e.source || undefined,
        campaign: e.campaign || undefined,
        timestamp: e.createdAt,
        value: e.value || undefined,
        metadata: e.metadata || undefined
      }));

      // Calcular duración del journey
      const firstEvent = events[0];
      const lastEvent = events[events.length - 1];
      const duration = (lastEvent.createdAt.getTime() - firstEvent.createdAt.getTime()) / (1000 * 60);

      // Identificar stages alcanzados
      const stages = [...new Set(events.map(e => this.eventToStage(e.eventType)))];

      // Verificar conversión
      const converted = events.some(e => e.eventType === 'purchase');
      const conversionValue = converted ? 
        events.find(e => e.eventType === 'purchase')?.value : 
        undefined;

      const journeyMap: JourneyMap = {
        userId,
        events: journeyEvents,
        duration: Math.round(duration),
        stages,
        converted,
        conversionValue
      };

      logger.success('✅ Journey mapped', {
        eventsCount: journeyEvents.length,
        duration: `${Math.round(duration)} min`,
        converted
      });

      return journeyMap;
    } catch (error) {
      logger.error('Failed to map journey', error, { userId });
      throw error;
    }
  }

  /**
   * Identifica puntos de abandono en el funnel
   */
  async identifyDropoffPoints(organizationId: string): Promise<DropoffAnalysis> {
    logger.info('📉 Identifying dropoff points', { organizationId });

    try {
      // Definir stages del funnel
      const funnelSteps = [
        'page_view',
        'signup',
        'trial_start',
        'feature_used',
        'purchase'
      ];

      const steps: DropoffAnalysis['steps'] = [];

      // Calcular cuántos usuarios completaron cada step
      for (const step of funnelSteps) {
        const count = await prisma.attributionEvent.findMany({
          where: {
            organizationId,
            eventType: step
          },
          distinct: ['visitorId']
        });

        steps.push({
          name: step,
          entered: count.length,
          completed: count.length,
          completionRate: 1.0 // Se calculará después
        });
      }

      // Calcular completion rates relativos
      const dropoffPoints: DropoffAnalysis['dropoffPoints'] = [];

      for (let i = 0; i < steps.length - 1; i++) {
        const currentStep = steps[i];
        const nextStep = steps[i + 1];

        const completionRate = currentStep.entered > 0 ? 
          nextStep.entered / currentStep.entered : 
          0;

        nextStep.completionRate = completionRate;

        const dropoffRate = 1 - completionRate;
        const usersLost = currentStep.entered - nextStep.entered;

        if (dropoffRate > 0.3) { // Más del 30% abandona
          dropoffPoints.push({
            from: currentStep.name,
            to: nextStep.name,
            dropoffRate,
            usersLost
          });
        }
      }

      // Generar recomendaciones
      const recommendations: string[] = [];

      for (const dropoff of dropoffPoints) {
        if (dropoff.dropoffRate > 0.7) {
          recommendations.push(
            `CRÍTICO: ${(dropoff.dropoffRate * 100).toFixed(0)}% abandona entre ${dropoff.from} y ${dropoff.to}. Revisar flujo urgentemente.`
          );
        } else if (dropoff.dropoffRate > 0.5) {
          recommendations.push(
            `ALTO: ${(dropoff.dropoffRate * 100).toFixed(0)}% abandona entre ${dropoff.from} y ${dropoff.to}. Simplificar proceso.`
          );
        } else {
          recommendations.push(
            `MEDIO: ${(dropoff.dropoffRate * 100).toFixed(0)}% abandona entre ${dropoff.from} y ${dropoff.to}. Optimizar messaging.`
          );
        }
      }

      if (recommendations.length === 0) {
        recommendations.push('Funnel saludable. Continuar monitoreando.');
      }

      const analysis: DropoffAnalysis = {
        steps,
        dropoffPoints,
        recommendations
      };

      logger.success('✅ Dropoff analysis complete', {
        stepsAnalyzed: steps.length,
        dropoffPointsFound: dropoffPoints.length
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to identify dropoff points', error, { organizationId });
      throw error;
    }
  }

  /**
   * Analiza métricas del funnel completo
   */
  async analyzeFunnel(organizationId: string): Promise<FunnelMetrics[]> {
    logger.info('📊 Analyzing funnel metrics', { organizationId });

    try {
      const stages = ['awareness', 'consideration', 'decision', 'purchase'];
      const metrics: FunnelMetrics[] = [];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const stage of stages) {
        const stageEvents = this.stageToEvents(stage);

        const events = await prisma.attributionEvent.findMany({
          where: {
            organizationId,
            eventType: { in: stageEvents },
            createdAt: { gte: thirtyDaysAgo }
          },
          distinct: ['visitorId']
        });

        const uniqueUsers = events.length;

        // Calcular tiempo promedio en stage (simplificado)
        let totalTime = 0;
        for (const event of events) {
          const nextEvents = await prisma.attributionEvent.findFirst({
            where: {
              organizationId,
              visitorId: event.visitorId,
              createdAt: { gt: event.createdAt }
            },
            orderBy: { createdAt: 'asc' }
          });

          if (nextEvents) {
            totalTime += (nextEvents.createdAt.getTime() - event.createdAt.getTime()) / (1000 * 60);
          }
        }

        const avgTimeInStage = uniqueUsers > 0 ? totalTime / uniqueUsers : 0;

        metrics.push({
          stage,
          users: uniqueUsers,
          conversionRate: 0, // Se calcula después
          avgTimeInStage: Math.round(avgTimeInStage),
          dropoffRate: 0 // Se calcula después
        });
      }

      // Calcular conversion rates
      for (let i = 0; i < metrics.length - 1; i++) {
        const current = metrics[i];
        const next = metrics[i + 1];

        if (current.users > 0) {
          next.conversionRate = next.users / current.users;
          current.dropoffRate = 1 - next.conversionRate;
        }
      }

      logger.success('✅ Funnel metrics calculated', { stagesCount: metrics.length });

      return metrics;
    } catch (error) {
      logger.error('Failed to analyze funnel', error, { organizationId });
      throw error;
    }
  }

  /**
   * Visualiza el journey de manera legible
   */
  async visualizeJourney(userId: string): Promise<string> {
    const journey = await this.mapJourney(userId);

    if (journey.events.length === 0) {
      return 'No journey data available';
    }

    let visualization = `👤 User Journey: ${userId}\n`;
    visualization += `⏱️ Duration: ${journey.duration} minutes\n`;
    visualization += `🎯 Converted: ${journey.converted ? 'Yes' : 'No'}\n\n`;
    visualization += `📍 Journey Steps:\n`;

    for (const [index, event] of journey.events.entries()) {
      const emoji = this.eventToEmoji(event.event);
      visualization += `${index + 1}. ${emoji} ${event.event}`;
      
      if (event.source) {
        visualization += ` (from: ${event.source})`;
      }
      
      if (event.value) {
        visualization += ` - €${event.value}`;
      }
      
      visualization += `\n   ${event.timestamp.toLocaleString()}\n`;
    }

    return visualization;
  }

  /**
   * Helpers
   */
  private eventToStage(eventType: string): string {
    const stageMap: Record<string, string> = {
      'page_view': 'awareness',
      'signup': 'consideration',
      'trial_start': 'consideration',
      'feature_used': 'decision',
      'clicked_pricing': 'decision',
      'purchase': 'purchase'
    };

    return stageMap[eventType] || 'awareness';
  }

  private stageToEvents(stage: string): string[] {
    const eventMap: Record<string, string[]> = {
      'awareness': ['page_view'],
      'consideration': ['signup', 'trial_start'],
      'decision': ['feature_used', 'clicked_pricing'],
      'purchase': ['purchase']
    };

    return eventMap[stage] || [];
  }

  private eventToEmoji(eventType: string): string {
    const emojiMap: Record<string, string> = {
      'page_view': '👀',
      'signup': '✍️',
      'trial_start': '🚀',
      'feature_used': '⚡',
      'clicked_pricing': '💰',
      'purchase': '🎉'
    };

    return emojiMap[eventType] || '📍';
  }
}

export const journeyMapper = new JourneyMapper();













