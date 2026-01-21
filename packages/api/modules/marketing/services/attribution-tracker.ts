/**
 * Attribution Tracker Service
 * Sistema completo de tracking de conversiones y atribución
 */

import { prisma } from "@repo/database";

export interface TrackEventParams {
  userId?: string;
  sessionId?: string;
  visitorId: string;
  organizationId?: string;
  eventType: "page_view" | "ad_click" | "signup" | "trial_start" | "purchase" | "cta_click";
  eventValue?: number;
  source?: string;
  medium?: string;
  campaign?: string;
  adGroup?: string;
  keyword?: string;
  adId?: string;
  landingPage?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  device?: string;
  country?: string;
  city?: string;
  metadata?: any;
}

export interface AttributionBreakdown {
  userId: string;
  conversionValue: number;
  firstTouch: { source: string; campaign: string; value: number };
  lastTouch: { source: string; campaign: string; value: number };
  linear: { touchpoints: Array<{ source: string; campaign: string; value: number }> };
  timeDecay: { touchpoints: Array<{ source: string; campaign: string; value: number }> };
}

export interface ROIMetrics {
  campaignId: string;
  campaignName: string;
  totalSpend: number;
  totalRevenue: number;
  roi: number; // (revenue - spend) / spend * 100
  roas: number; // revenue / spend
  conversions: number;
  breakdown: {
    source: string;
    spend: number;
    revenue: number;
    roi: number;
    roas: number;
  }[];
}

export class AttributionTracker {
  /**
   * Track an attribution event
   */
  async trackEvent(params: TrackEventParams): Promise<string> {
    const event = await prisma.attributionEvent.create({
      data: {
        userId: params.userId,
        sessionId: params.sessionId || this.generateSessionId(),
        visitorId: params.visitorId,
        organizationId: params.organizationId,
        eventType: params.eventType,
        eventValue: params.eventValue,
        source: params.source || params.utmSource,
        medium: params.medium || params.utmMedium,
        campaign: params.campaign || params.utmCampaign,
        adGroup: params.adGroup,
        keyword: params.keyword,
        adId: params.adId,
        landingPage: params.landingPage,
        referrer: params.referrer,
        utmSource: params.utmSource,
        utmMedium: params.utmMedium,
        utmCampaign: params.utmCampaign,
        utmContent: params.utmContent,
        utmTerm: params.utmTerm,
        device: params.device,
        country: params.country,
        city: params.city,
        metadata: params.metadata,
      },
    });

    // Si hay userId, actualizar journey
    if (params.userId) {
      await this.trackJourney(params.userId, {
        source: params.source || params.utmSource || "direct",
        campaign: params.campaign || params.utmCampaign || "none",
        eventType: params.eventType,
      });
    }

    console.log(`✅ Event tracked: ${params.eventType} - ${event.id}`);
    return event.id;
  }

  /**
   * Update customer journey with new touchpoint
   */
  async trackJourney(
    userId: string,
    touchpoint: { source: string; campaign: string; eventType: string }
  ): Promise<void> {
    const now = new Date();

    // Buscar o crear journey
    let journey = await prisma.customerJourney.findUnique({
      where: { userId },
    });

    if (!journey) {
      // First touch - crear journey
      journey = await prisma.customerJourney.create({
        data: {
          userId,
          firstTouchSource: touchpoint.source,
          firstTouchCampaign: touchpoint.campaign,
          firstTouchDate: now,
          lastTouchSource: touchpoint.source,
          lastTouchCampaign: touchpoint.campaign,
          lastTouchDate: now,
          touchpointsCount: 1,
        },
      });

      console.log(`🆕 First touch for user ${userId}: ${touchpoint.source} / ${touchpoint.campaign}`);
    } else {
      // Update last touch always
      const updateData: any = {
        lastTouchSource: touchpoint.source,
        lastTouchCampaign: touchpoint.campaign,
        lastTouchDate: now,
        touchpointsCount: journey.touchpointsCount + 1,
      };

      // Si es conversión, actualizar datos
      if (touchpoint.eventType === "purchase" || touchpoint.eventType === "trial_start") {
        if (!journey.hasConverted) {
          updateData.hasConverted = true;
          updateData.conversionDate = now;

          // Calcular days to conversion
          if (journey.firstTouchDate) {
            const diffTime = now.getTime() - journey.firstTouchDate.getTime();
            updateData.daysToConversion = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }
      }

      await prisma.customerJourney.update({
        where: { userId },
        data: updateData,
      });

      console.log(
        `🔄 Updated journey for user ${userId}: touchpoint #${journey.touchpointsCount + 1}`
      );
    }
  }

  /**
   * Calculate attribution for a conversion
   */
  async calculateAttribution(
    userId: string,
    conversionValue: number
  ): Promise<AttributionBreakdown> {
    // Obtener todos los eventos del usuario
    const events = await prisma.attributionEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    if (events.length === 0) {
      throw new Error(`No events found for user ${userId}`);
    }

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];

    // 1. First-touch attribution (100% al primero)
    const firstTouch = {
      source: firstEvent.source || "direct",
      campaign: firstEvent.campaign || "none",
      value: conversionValue,
    };

    // 2. Last-touch attribution (100% al último)
    const lastTouch = {
      source: lastEvent.source || "direct",
      campaign: lastEvent.campaign || "none",
      value: conversionValue,
    };

    // 3. Linear attribution (divide igual entre todos)
    const linearValue = conversionValue / events.length;
    const linear = {
      touchpoints: events.map((e) => ({
        source: e.source || "direct",
        campaign: e.campaign || "none",
        value: linearValue,
      })),
    };

    // 4. Time-decay attribution (más peso a recientes)
    const timeDecayWeights = this.calculateTimeDecayWeights(events.length);
    const timeDecay = {
      touchpoints: events.map((e, i) => ({
        source: e.source || "direct",
        campaign: e.campaign || "none",
        value: conversionValue * timeDecayWeights[i],
      })),
    };

    // Actualizar CustomerJourney con valores
    await prisma.customerJourney.update({
      where: { userId },
      data: {
        firstTouchValue: firstTouch.value,
        lastTouchValue: lastTouch.value,
        linearValue: linearValue,
        conversionValue,
        lifetimeValue: conversionValue, // Por ahora igual, después se suma
      },
    });

    console.log(`💰 Attribution calculated for user ${userId}: €${conversionValue}`);

    return {
      userId,
      conversionValue,
      firstTouch,
      lastTouch,
      linear,
      timeDecay,
    };
  }

  /**
   * Get ROI metrics for a campaign
   */
  async getROI(campaignId: string, timeRange?: { start: Date; end: Date }): Promise<ROIMetrics> {
    // Buscar la campaña
    const campaign = await prisma.marketingAdCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Obtener eventos de esa campaña
    const whereClause: any = {
      campaign: campaign.name,
    };

    if (timeRange) {
      whereClause.createdAt = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    const events = await prisma.attributionEvent.findMany({
      where: whereClause,
    });

    // Calcular revenue total (suma de purchase events)
    const conversionEvents = events.filter((e) => e.eventType === "purchase" && e.eventValue);
    const totalRevenue = conversionEvents.reduce((sum, e) => sum + (e.eventValue || 0), 0);
    const conversions = conversionEvents.length;

    // Obtener spend de la campaña (del JSON budget)
    const totalSpend = this.extractSpendFromCampaign(campaign);

    // Calcular ROI y ROAS
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    // Breakdown por source
    const sourceBreakdown = this.calculateSourceBreakdown(events, totalSpend);

    return {
      campaignId,
      campaignName: campaign.name,
      totalSpend,
      totalRevenue,
      roi,
      roas,
      conversions,
      breakdown: sourceBreakdown,
    };
  }

  /**
   * Get campaign performance for an organization
   */
  async getCampaignPerformance(
    organizationId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<any[]> {
    // Obtener todas las campañas activas
    const campaigns = await prisma.marketingAdCampaign.findMany({
      where: {
        organizationId,
        status: { in: ["ACTIVE", "PAUSED"] },
      },
    });

    const performance = [];

    for (const campaign of campaigns) {
      try {
        const roi = await this.getROI(campaign.id, timeRange);

        // Actualizar o crear CampaignPerformance
        await prisma.campaignPerformance.upsert({
          where: {
            organizationId_campaignId_periodStart: {
              organizationId,
              campaignId: campaign.id,
              periodStart: timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
          update: {
            totalSpent: roi.totalSpend,
            totalRevenue: roi.totalRevenue,
            roi: roi.roi,
            roas: roi.roas,
            conversions: roi.conversions,
            updatedAt: new Date(),
          },
          create: {
            organizationId,
            campaignId: campaign.id,
            campaignName: campaign.name,
            source: campaign.platform,
            status: campaign.status,
            periodStart: timeRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            periodEnd: timeRange?.end || new Date(),
            totalSpent: roi.totalSpend,
            totalRevenue: roi.totalRevenue,
            roi: roi.roi,
            roas: roi.roas,
            conversions: roi.conversions,
          },
        });

        performance.push({
          ...campaign,
          ...roi,
        });
      } catch (error) {
        console.error(`Error calculating performance for campaign ${campaign.id}:`, error);
      }
    }

    // Ordenar por ROI descendente
    performance.sort((a, b) => b.roi - a.roi);

    return performance;
  }

  /**
   * Get attribution report for organization
   */
  async getAttributionReport(
    organizationId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<any> {
    const whereClause: any = {
      organizationId,
    };

    if (timeRange) {
      whereClause.createdAt = {
        gte: timeRange.start,
        lte: timeRange.end,
      };
    }

    // Total conversions y revenue
    const conversionEvents = await prisma.attributionEvent.findMany({
      where: {
        ...whereClause,
        eventType: "purchase",
      },
    });

    const totalRevenue = conversionEvents.reduce((sum, e) => sum + (e.eventValue || 0), 0);
    const totalConversions = conversionEvents.length;

    // Revenue por modelo de atribución (de CustomerJourney)
    const journeys = await prisma.customerJourney.findMany({
      where: {
        organizationId,
        hasConverted: true,
      },
    });

    const revenueByModel = {
      first_touch: journeys.reduce((sum, j) => sum + j.firstTouchValue, 0),
      last_touch: journeys.reduce((sum, j) => sum + j.lastTouchValue, 0),
      linear: journeys.reduce((sum, j) => sum + j.linearValue, 0),
    };

    // Top campaigns por performance
    const topCampaigns = await this.getCampaignPerformance(organizationId, timeRange);

    // Customer journey stats
    const avgTouchpoints =
      journeys.length > 0
        ? journeys.reduce((sum, j) => sum + j.touchpointsCount, 0) / journeys.length
        : 0;

    const convertedJourneys = journeys.filter((j) => j.daysToConversion !== null);
    const avgTimeToConversion =
      convertedJourneys.length > 0
        ? convertedJourneys.reduce((sum, j) => sum + (j.daysToConversion || 0), 0) /
          convertedJourneys.length
        : 0;

    // Calcular ROAS promedio
    const totalSpend = topCampaigns.reduce((sum, c) => sum + c.totalSpend, 0);
    const avgROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return {
      totalRevenue,
      totalConversions,
      avgROAS,
      revenueByModel,
      topCampaigns: topCampaigns.slice(0, 5), // Top 5
      avgTouchpoints: Math.round(avgTouchpoints * 10) / 10,
      avgTimeToConversion: Math.round(avgTimeToConversion * 10) / 10,
    };
  }

  // ========== HELPER METHODS ==========

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  private calculateTimeDecayWeights(touchpointCount: number): number[] {
    // Decay exponencial: cada touchpoint tiene la mitad del peso del siguiente
    const weights: number[] = [];
    let totalWeight = 0;

    for (let i = 0; i < touchpointCount; i++) {
      const weight = Math.pow(2, i); // 1, 2, 4, 8, ...
      weights.push(weight);
      totalWeight += weight;
    }

    // Normalizar para que sumen 1
    return weights.map((w) => w / totalWeight);
  }

  private extractSpendFromCampaign(campaign: any): number {
    try {
      if (campaign.budget && typeof campaign.budget === "object") {
        return campaign.budget.total || campaign.budget.daily * 30 || 0;
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  private calculateSourceBreakdown(
    events: any[],
    totalSpend: number
  ): Array<{ source: string; spend: number; revenue: number; roi: number; roas: number }> {
    const sourceGroups: Record<
      string,
      { events: any[]; revenue: number; conversions: number }
    > = {};

    events.forEach((e) => {
      const source = e.source || "direct";
      if (!sourceGroups[source]) {
        sourceGroups[source] = { events: [], revenue: 0, conversions: 0 };
      }
      sourceGroups[source].events.push(e);
      if (e.eventType === "purchase" && e.eventValue) {
        sourceGroups[source].revenue += e.eventValue;
        sourceGroups[source].conversions++;
      }
    });

    const breakdown: any[] = [];
    const totalEvents = events.length;

    Object.entries(sourceGroups).forEach(([source, data]) => {
      const eventRatio = data.events.length / totalEvents;
      const spend = totalSpend * eventRatio;
      const revenue = data.revenue;
      const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;
      const roas = spend > 0 ? revenue / spend : 0;

      breakdown.push({
        source,
        spend,
        revenue,
        roi,
        roas,
      });
    });

    return breakdown.sort((a, b) => b.roi - a.roi);
  }
}

// Export singleton instance
export const attributionTracker = new AttributionTracker();





