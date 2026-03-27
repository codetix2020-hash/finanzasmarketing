/**
 * Campaign Optimizer - Automatic optimization of ad campaigns
 * 
 * Analyzes performance and makes automatic decisions to maximize ROI:
 * - Budget reallocation (increase/reduce budget)
 * - Bid adjustments (adjust bids)
 * - Audience expansion (create lookalikes, exclude audiences)
 * - Creative rotation (pause low performers, scale winners)
 * - Schedule optimization (automatic dayparting)
 * 
 * Runs every 6 hours via cron job
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
  private googleClient: GoogleAdsClient | null = null;
  private facebookClient: FacebookAdsClient | null = null;

  constructor() {
    // Lazy initialization - clients are only created when needed
  }

  private getGoogleClient(): GoogleAdsClient {
    if (!this.googleClient) {
      this.googleClient = new GoogleAdsClient();
    }
    return this.googleClient;
  }

  private getFacebookClient(): FacebookAdsClient {
    if (!this.facebookClient) {
      this.facebookClient = new FacebookAdsClient();
    }
    return this.facebookClient;
  }

  /**
   * Analyze campaign performance
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

      // ROI analysis
      if (roi < 1) {
        issues.push(`Critical ROI: ${roi.toFixed(2)}x (target: 2x+)`);
      } else if (roi < 2) {
        issues.push(`Low ROI: ${roi.toFixed(2)}x (target: 2x+)`);
      } else if (roi > 3) {
        opportunities.push(`Excellent ROI: ${roi.toFixed(2)}x - consider increasing budget`);
      }

      // CTR analysis
      if (ctr < 0.01) {
        issues.push(`Very low CTR: ${(ctr * 100).toFixed(2)}% - review creatives`);
      } else if (ctr < 0.02) {
        issues.push(`Low CTR: ${(ctr * 100).toFixed(2)}% - optimize ad copy`);
      }

      // CPA analysis
      const targetCPA = 50; // €50 target
      if (cpa > targetCPA * 2) {
        issues.push(`High CPA: €${cpa.toFixed(2)} (target: €${targetCPA})`);
      }

      // Determine status
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
   * Automatically optimize a campaign
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

      // DECISION 1: Budget Reallocation
      if (analysis.performance.roi > 3) {
        decisions.push({
          action: 'increase_budget',
          currentValue: budget,
          newValue: budget * 1.2,
          reason: `ROI ${analysis.performance.roi.toFixed(2)}x justifies +20% budget`,
          expectedImpact: '+20-30% conversions',
          confidence: 0.85
        });
      } else if (analysis.performance.roi < 1 && analysis.performance.spend > 100) {
        decisions.push({
          action: 'decrease_budget',
          currentValue: budget,
          newValue: budget * 0.5,
          reason: `ROI ${analysis.performance.roi.toFixed(2)}x requires -50% budget`,
          expectedImpact: 'Reduce losses while preserving learning',
          confidence: 0.9
        });
      } else if (analysis.performance.roi < 0.5) {
        decisions.push({
          action: 'pause_campaign',
          currentValue: 'ACTIVE',
          newValue: 'PAUSED',
          reason: `ROI ${analysis.performance.roi.toFixed(2)}x is critical - pause to avoid losses`,
          expectedImpact: 'Stop budget bleed',
          confidence: 0.95
        });
      }

      // DECISION 2: Bid Adjustments
      if (analysis.performance.ctr < 0.015 && campaign.platform === 'google') {
        decisions.push({
          action: 'optimize_bids',
          currentValue: 'current_bids',
          newValue: 'reduced_by_15%',
          reason: `CTR ${(analysis.performance.ctr * 100).toFixed(2)}% indicates low relevance - reduce bids`,
          expectedImpact: 'Reduce CPA by 10-15%',
          confidence: 0.7
        });
      }

      // DECISION 3: Creative Rotation
      if (analysis.performance.ctr < 0.02) {
        decisions.push({
          action: 'refresh_creatives',
          currentValue: 'current_creatives',
          newValue: 'new_variations',
          reason: `CTR ${(analysis.performance.ctr * 100).toFixed(2)}% suggests ad fatigue`,
          expectedImpact: 'Increase CTR by 30-50%',
          confidence: 0.75
        });
      }

      // DECISION 4: Audience Expansion
      if (analysis.performance.roi > 2.5 && analysis.performance.conversions > 10) {
        decisions.push({
          action: 'expand_audience',
          currentValue: 'current_targeting',
          newValue: 'lookalike_1%',
          reason: 'Strong performance allows scaling with lookalikes',
          expectedImpact: '+40-60% volume while maintaining ROI',
          confidence: 0.8
        });
      }

      // Apply decisions automatically (only high-confidence ones)
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

      // Save optimization in DB
      await prisma.marketingMemory.create({
        data: {
          key: `optimization_${campaignId}_${Date.now()}`,
          value: JSON.stringify({ analysis, decisions }),
          type: 'optimization_log',
          organizationId: campaign.organizationId
        }
      });

      // Notify major changes
      if (decisions.length > 0) {
        await notificationService.sendSlackNotification(
          `🎯 *Campaign auto-optimized*\n` +
          `📢 ${campaign.name}\n` +
          `✅ ${applied} decisiones aplicadas\n` +
          `⏸️ ${skipped} decisions pending review\n\n` +
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
   * Apply an optimization decision
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
          // In real mode, call google-ads-client or facebook-ads-client
          if (campaign.platform === 'google' && campaign.googleCampaignId) {
            // await this.googleClient.updateBids(campaign.googleCampaignId, newBids);
          }
          break;

        case 'refresh_creatives':
          // Mark to generate new creatives
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
          // Mark for audience expansion
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
   * Generate prioritized recommendations
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
        title: 'Improve audience targeting',
        description: 'Low ROI suggests we are not reaching the right audience',
        priority: 'high',
        effort: 'medium',
        expectedImpact: 'ROI increase of 50-100%'
      });
    }

    if (analysis.performance.ctr < 0.02) {
      recommendations.push({
        title: 'Refresh creatives',
        description: 'Low CTR indicates ads are not engaging',
        priority: 'high',
        effort: 'low',
        expectedImpact: 'CTR increase of 30-60%'
      });
    }

    if (analysis.performance.cpa > 50) {
      recommendations.push({
        title: 'Optimize landing page',
        description: 'High CPA may indicate conversion issues',
        priority: 'medium',
        effort: 'high',
        expectedImpact: 'CPA reduction of 20-40%'
      });
    }

    recommendations.push({
        title: 'Implement retargeting',
        description: 'Capture users who visited but did not convert',
      priority: 'medium',
      effort: 'low',
      expectedImpact: 'Typically 3-5x ROI'
    });

    return recommendations;
  }

  /**
   * Predict impact of proposed changes
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

    // Simplified predictive model (use ML in production)
    const currentProjection = {
      conversions: analysis.performance.conversions,
      spend: analysis.performance.spend,
      roi: analysis.performance.roi
    };

    let newConversions = currentProjection.conversions;
    let newSpend = currentProjection.spend;

    if (changes.budgetMultiplier) {
      newSpend *= changes.budgetMultiplier;
      // Law of diminishing returns
      newConversions *= Math.pow(changes.budgetMultiplier, 0.7);
    }

    if (changes.newCreatives) {
      // Typical 30% improvement in conversions with better creatives
      newConversions *= 1.3;
    }

    if (changes.targetingExpansion) {
      // Expansion increases volume but slightly lowers ROI
      newConversions *= 1.5;
      newSpend *= 1.1;
    }

    const newRoi = (newConversions * 50) / newSpend; // Assuming €50 value per conversion

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




