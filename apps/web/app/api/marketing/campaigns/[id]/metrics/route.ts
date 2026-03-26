import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { GoogleAdsClient } from "@repo/api/modules/marketing/services/google-ads-client";
import { FacebookAdsClient } from "@repo/api/modules/marketing/services/facebook-ads-client";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

// Force dynamic rendering - no pre-render during build
export const dynamic = 'force-dynamic';

/**
 * GET /api/marketing/campaigns/[id]/metrics
 * 
 * Obtener y sincronizar métricas de una campaña
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = params.id;

    // Obtener campaña
    const campaign = await prisma.marketingAdCampaign.findUnique({
      where: { id: campaignId },
      include: { product: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const authCtx = await getAuthContext(campaign.organizationId);
    if (!authCtx) {
      return unauthorizedResponse();
    }

    // ========== GOOGLE ADS ==========
    if (campaign.platform === "google" && campaign.googleCampaignId) {
      console.log(`📊 Sincronizando métricas Google de campaña ${campaignId}...`);

      const googleClient = new GoogleAdsClient();
      const metrics = await googleClient.syncMetrics(campaign.googleCampaignId);

      // Actualizar en BD
      await prisma.marketingAdCampaign.update({
        where: { id: campaignId },
        data: {
          performance: {
            impressions: metrics.impressions,
            clicks: metrics.clicks,
            conversions: metrics.conversions,
            ctr: metrics.ctr,
            cpc: metrics.cpc,
            cpa: metrics.cost / (metrics.conversions || 1),
            roas: 0,
            spend: metrics.cost,
            lastSyncAt: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json({
        success: true,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          platform: "google",
          status: campaign.status,
        },
        metrics: {
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          conversions: metrics.conversions,
          ctr: `${metrics.ctr}%`,
          cpc: `€${metrics.cpc}`,
          cost: `€${metrics.cost}`,
          conversionRate: `${metrics.conversionRate}%`,
        },
        lastSync: new Date().toISOString(),
      });
    }

    // ========== FACEBOOK ADS ==========
    if (campaign.platform === "facebook" && campaign.facebookCampaignId) {
      console.log(`📊 Sincronizando métricas Facebook de campaña ${campaignId}...`);

      const fbClient = new FacebookAdsClient();
      const insights = await fbClient.syncInsights(campaign.facebookCampaignId);

      // Actualizar en BD
      await prisma.marketingAdCampaign.update({
        where: { id: campaignId },
        data: {
          performance: {
            impressions: insights.impressions,
            clicks: insights.clicks,
            conversions: insights.conversions,
            ctr: insights.ctr,
            cpc: insights.cpc,
            cpm: insights.cpm,
            cpa: insights.spend / (insights.conversions || 1),
            roas: 0,
            spend: insights.spend,
            lastSyncAt: new Date().toISOString(),
          },
        },
      });

      return NextResponse.json({
        success: true,
        campaign: {
          id: campaign.id,
          name: campaign.name,
          platform: "facebook",
          status: campaign.status,
        },
        metrics: {
          impressions: insights.impressions,
          clicks: insights.clicks,
          conversions: insights.conversions,
          ctr: `${insights.ctr}%`,
          cpc: `€${insights.cpc}`,
          cpm: `€${insights.cpm}`,
          spend: `€${insights.spend}`,
          conversionRate: `${insights.conversionRate}%`,
        },
        lastSync: new Date().toISOString(),
      });
    }

    // Sin ID externo
    return NextResponse.json({
      success: false,
      error: "Campaign has no external ID (Google/Facebook)",
      campaign: {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        performance: campaign.performance,
      },
    });
  } catch (error: any) {
    console.error("❌ Error obteniendo métricas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}




