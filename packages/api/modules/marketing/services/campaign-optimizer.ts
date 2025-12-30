/**
 * Campaign Optimizer - Optimización automática de campañas publicitarias
 * 
 * Analiza performance y toma decisiones automáticas para maximizar ROI:
 * - Budget reallocation (aumentar/reducir presupuesto)
 * - Bid adjustments (ajustar pujas)
 * - Audience expansion (crear lookalikes, excluir audiencias)
 * - Creative rotation (pausar creatividades bajas, escalar ganadoras)
 * - Schedule optimization (dayparting automático)
 * 
 * Se ejecuta cada 6 horas vía cron job
 */

import { prisma } from '@repo/database';
import { GoogleAdsClient } from './google-ads-client';
import { FacebookAdsClient } from './facebook-ads-client';
import { logger } from './logger';
import { notificationService } from './notification-service';

interface OptimizationDecision {
  action: string;
  currentValue: any;
  newValue: any;
  reason: string;
  expectedImpact: string;
  confidence: number;
}

interface CampaignAnalysis {
  campaignId: string;
  platform: string;
  performance: {
    roi: number;
    ctr: number;
    cpa: number;
    conversions: number;
    spend: number;
  };
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  issues: string[];
  opportunities: string[];
}

interface OptimizationResult {
  campaignId: string;
  decisions: OptimizationDecision[];
  applied: number;
  skipped: number;
  estimatedImpact: {
    roiIncrease: number;
    costReduction: number;
  };
}

export class CampaignOptimizer {
  private googleClient: GoogleAdsClient;
  private facebookClient: FacebookAdsClient;

  constructor() {
    this.googleClient = new GoogleAdsClient();
    this.facebookClient = new FacebookAdsClient();
  }

  /**
   * Analiza performance de una campaña
   */
  async analyzeCampaignPerformance(campaignId: string): Promise<CampaignAnalysis> {
    logger.info('📊 Analyzing campaign performance', { campaignId });

    try {
      const campaign = await prisma.marketingAdCampaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }

      const performance = campaign.performance as any || {};
      const roi = performance.roi || 0;
      const ctr = performance.ctr || 0;
      const cpa = performance.cpa || 0;

      const issues: string[] = [];
      const opportunities: string[] = [];

      // Análisis de ROI
      if (roi < 1) {
        issues.push(`ROI crítico: ${roi.toFixed(2)}x (objetivo: 2x+)`);
      } else if (roi < 2) {
        issues.push(`ROI bajo: ${roi.toFixed(2)}x (objetivo: 2x+)`);
      } else if (roi > 3) {
        opportunities.push(`ROI excelente: ${roi.toFixed(2)}x - considerar aumentar budget`);
      }

      // Análisis de CTR
      if (ctr < 0.01) {
        issues.push(`CTR muy bajo: ${(ctr * 100).toFixed(2)}% - revisar creatividades`);
      } else if (ctr < 0.02) {
        issues.push(`CTR bajo: ${(ctr * 100).toFixed(2)}% - optimizar copy`);
      }

      // Análisis de CPA
      const targetCPA = 50; // €50 objetivo
      if (cpa > targetCPA * 2) {
        issues.push(`CPA alto: €${cpa.toFixed(2)} (objetivo: €${targetCPA})`);
      }

      // Determinar status
      let status: CampaignAnalysis['status'];
      if (roi >= 3 && ctr >= 0.03) {
        status = 'excellent';
      } else if (roi >= 2 && ctr >= 0.02) {
        status = 'good';
      } else if (roi >= 1) {
        status = 'needs_improvement';
      } else {
        status = 'critical';
      }

      const analysis: CampaignAnalysis = {
        campaignId,
        platform: campaign.platform,
        performance: {
          roi,
          ctr,
          cpa,
          conversions: performance.conversions || 0,
          spend: performance.spend || 0
        },
        status,
        issues,
        opportunities
      };

      logger.success('✅ Campaign analysis complete', {
        status,
        issuesCount: issues.length,
        opportunitiesCount: opportunities.length
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze campaign', error, { campaignId });
      throw error;
    }
  }

  /**
   * Optimiza automáticamente una campaña
   */
  async autoOptimize(campaignId: string): Promise<OptimizationResult> {
    logger.info('🎯 Auto-optimizing campaign', { campaignId });

    try {
      const analysis = await this.analyzeCampaignPerformance(campaignId);
      const campaign = await prisma.marketingAdCampaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }

      const decisions: OptimizationDecision[] = [];
      const budget = (campaign.budget as any)?.daily || 100;

      // DECISIÓN 1: Budget Reallocation
      if (analysis.performance.roi > 3) {
        decisions.push({
          action: 'increase_budget',
          currentValue: budget,
          newValue: budget * 1.2,
          reason: `ROI ${analysis.performance.roi.toFixed(2)}x justifica +20% budget`,
          expectedImpact: '+20-30% conversiones',
          confidence: 0.85
        });
      } else if (analysis.performance.roi < 1 && analysis.performance.spend > 100) {
        decisions.push({
          action: 'decrease_budget',
          currentValue: budget,
          newValue: budget * 0.5,
          reason: `ROI ${analysis.performance.roi.toFixed(2)}x requiere -50% budget`,
          expectedImpact: 'Reducir pérdidas, mantener aprendizaje',
          confidence: 0.9
        });
      } else if (analysis.performance.roi < 0.5) {
        decisions.push({
          action: 'pause_campaign',
          currentValue: 'ACTIVE',
          newValue: 'PAUSED',
          reason: `ROI ${analysis.performance.roi.toFixed(2)}x es crítico - pausar para evitar pérdidas`,
          expectedImpact: 'Detener sangrado de budget',
          confidence: 0.95
        });
      }

      // DECISIÓN 2: Bid Adjustments
      if (analysis.performance.ctr < 0.015 && campaign.platform === 'google') {
        decisions.push({
          action: 'optimize_bids',
          currentValue: 'current_bids',
          newValue: 'reduced_by_15%',
          reason: `CTR ${(analysis.performance.ctr * 100).toFixed(2)}% indica baja relevancia - reducir bids`,
          expectedImpact: 'Reducir CPA 10-15%',
          confidence: 0.7
        });
      }

      // DECISIÓN 3: Creative Rotation
      if (analysis.performance.ctr < 0.02) {
        decisions.push({
          action: 'refresh_creatives',
          currentValue: 'current_creatives',
          newValue: 'new_variations',
          reason: `CTR ${(analysis.performance.ctr * 100).toFixed(2)}% sugiere fatiga de anuncios`,
          expectedImpact: 'Aumentar CTR 30-50%',
          confidence: 0.75
        });
      }

      // DECISIÓN 4: Audience Expansion
      if (analysis.performance.roi > 2.5 && analysis.performance.conversions > 10) {
        decisions.push({
          action: 'expand_audience',
          currentValue: 'current_targeting',
          newValue: 'lookalike_1%',
          reason: 'Performance sólida permite escalar con lookalikes',
          expectedImpact: '+40-60% volumen manteniendo ROI',
          confidence: 0.8
        });
      }

      // Aplicar decisiones automáticamente (solo las de alta confianza)
      let applied = 0;
      let skipped = 0;

      for (const decision of decisions) {
        if (decision.confidence >= 0.8) {
          await this.applyDecision(campaignId, decision);
          applied++;
        } else {
          skipped++;
        }
      }

      // Guardar optimización en DB
      await prisma.marketingMemory.create({
        data: {
          key: `optimization_${campaignId}_${Date.now()}`,
          value: JSON.stringify({ analysis, decisions }),
          type: 'optimization_log',
          organizationId: campaign.organizationId
        }
      });

      // Notificar cambios importantes
      if (decisions.length > 0) {
        await notificationService.sendSlackNotification(
          `🎯 *Campaña optimizada automáticamente*\n` +
          `📢 ${campaign.name}\n` +
          `✅ ${applied} decisiones aplicadas\n` +
          `⏸️ ${skipped} decisiones pendientes revisión\n\n` +
          decisions.slice(0, 3).map(d => `• ${d.action}: ${d.reason}`).join('\n')
        );
      }

      const result: OptimizationResult = {
        campaignId,
        decisions,
        applied,
        skipped,
        estimatedImpact: {
          roiIncrease: decisions.length > 0 ? 0.3 : 0,
          costReduction: decisions.some(d => d.action === 'decrease_budget') ? 0.2 : 0
        }
      };

      logger.success('✅ Campaign optimized', {
        decisionsCount: decisions.length,
        applied,
        skipped
      });

      return result;
    } catch (error) {
      logger.error('Failed to optimize campaign', error, { campaignId });
      throw error;
    }
  }

  /**
   * Aplica una decisión de optimización
   */
  private async applyDecision(
    campaignId: string,
    decision: OptimizationDecision
  ): Promise<void> {
    logger.info('⚙️ Applying optimization decision', {
      campaignId,
      action: decision.action
    });

    try {
      const campaign = await prisma.marketingAdCampaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) return;

      switch (decision.action) {
        case 'increase_budget':
          await prisma.marketingAdCampaign.update({
            where: { id: campaignId },
            data: {
              budget: {
                ...(campaign.budget as any),
                daily: decision.newValue
              }
            }
          });
          break;

        case 'decrease_budget':
          await prisma.marketingAdCampaign.update({
            where: { id: campaignId },
            data: {
              budget: {
                ...(campaign.budget as any),
                daily: decision.newValue
              }
            }
          });
          break;

        case 'pause_campaign':
          await prisma.marketingAdCampaign.update({
            where: { id: campaignId },
            data: { status: 'PAUSED' }
          });
          break;

        case 'optimize_bids':
          // En modo real, llamaría a google-ads-client o facebook-ads-client
          if (campaign.platform === 'google' && campaign.googleCampaignId) {
            // await this.googleClient.updateBids(campaign.googleCampaignId, newBids);
          }
          break;

        case 'refresh_creatives':
          // Marcar para que se generen nuevas creatividades
          await prisma.marketingMemory.create({
            data: {
              key: `refresh_creatives_${campaignId}`,
              value: JSON.stringify({ reason: decision.reason }),
              type: 'task',
              organizationId: campaign.organizationId
            }
          });
          break;

        case 'expand_audience':
          // Marcar para expansión de audiencia
          await prisma.marketingMemory.create({
            data: {
              key: `expand_audience_${campaignId}`,
              value: JSON.stringify({ targetType: 'lookalike_1%' }),
              type: 'task',
              organizationId: campaign.organizationId
            }
          });
          break;
      }

      logger.success('✅ Decision applied', { action: decision.action });
    } catch (error) {
      logger.error('Failed to apply decision', error, { decision });
    }
  }

  /**
   * Genera recomendaciones priorizadas
   */
  async generateRecommendations(campaignId: string): Promise<Array<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    expectedImpact: string;
  }>> {
    logger.info('💡 Generating recommendations', { campaignId });

    const analysis = await this.analyzeCampaignPerformance(campaignId);
    const recommendations: Array<any> = [];

    if (analysis.performance.roi < 2) {
      recommendations.push({
        title: 'Mejorar segmentación de audiencia',
        description: 'El ROI bajo sugiere que no estamos llegando a la audiencia correcta',
        priority: 'high',
        effort: 'medium',
        expectedImpact: 'Aumento de ROI del 50-100%'
      });
    }

    if (analysis.performance.ctr < 0.02) {
      recommendations.push({
        title: 'Actualizar creatividades',
        description: 'CTR bajo indica que los anuncios no son atractivos',
        priority: 'high',
        effort: 'low',
        expectedImpact: 'Aumento de CTR del 30-60%'
      });
    }

    if (analysis.performance.cpa > 50) {
      recommendations.push({
        title: 'Optimizar landing page',
        description: 'CPA alto puede indicar problemas en la conversión',
        priority: 'medium',
        effort: 'high',
        expectedImpact: 'Reducción de CPA del 20-40%'
      });
    }

    recommendations.push({
      title: 'Implementar retargeting',
      description: 'Captura usuarios que visitaron pero no convirtieron',
      priority: 'medium',
      effort: 'low',
      expectedImpact: 'ROI típicamente 3-5x'
    });

    return recommendations;
  }

  /**
   * Predice impacto de cambios propuestos
   */
  async predictPerformance(
    campaignId: string,
    changes: {
      budgetMultiplier?: number;
      targetingExpansion?: boolean;
      newCreatives?: boolean;
    }
  ): Promise<{
    currentProjection: any;
    newProjection: any;
    confidence: number;
  }> {
    logger.info('🔮 Predicting performance changes', { campaignId, changes });

    const analysis = await this.analyzeCampaignPerformance(campaignId);

    // Modelo predictivo simplificado (en producción usar ML)
    const currentProjection = {
      conversions: analysis.performance.conversions,
      spend: analysis.performance.spend,
      roi: analysis.performance.roi
    };

    let newConversions = currentProjection.conversions;
    let newSpend = currentProjection.spend;

    if (changes.budgetMultiplier) {
      newSpend *= changes.budgetMultiplier;
      // Ley de rendimientos decrecientes
      newConversions *= Math.pow(changes.budgetMultiplier, 0.7);
    }

    if (changes.newCreatives) {
      // Mejora típica de 30% en conversiones con mejores creatividades
      newConversions *= 1.3;
    }

    if (changes.targetingExpansion) {
      // Expansión aumenta volumen pero reduce ligeramente ROI
      newConversions *= 1.5;
      newSpend *= 1.1;
    }

    const newRoi = (newConversions * 50) / newSpend; // Asumiendo €50 valor por conversión

    return {
      currentProjection,
      newProjection: {
        conversions: Math.round(newConversions),
        spend: Math.round(newSpend),
        roi: parseFloat(newRoi.toFixed(2))
      },
      confidence: 0.75
    };
  }
}

export const campaignOptimizer = new CampaignOptimizer();

