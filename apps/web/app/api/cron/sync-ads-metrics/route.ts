import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { GoogleAdsClient } from "@repo/api/modules/marketing/services/google-ads-client";
import { FacebookAdsClient } from "@repo/api/modules/marketing/services/facebook-ads-client";

export const dynamic = 'force-dynamic';

/**
 * Cron Job: Sync Ads Metrics
 * 
 * Ejecutar cada 6 horas para sincronizar métricas de todas las campañas activas
 * 
 * Railway/Vercel Cron: 0 (star)/6 * * * (replace star with asterisk)
 * 
 * Autenticación: Bearer token con CRON_SECRET
 */
export async function GET(request: NextRequest) {
  console.log("⏰ CRON: Sincronizando métricas de campañas...");

  // Verificar autorización
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.log("❌ No autorizado");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const googleClient = new GoogleAdsClient();
  const fbClient = new FacebookAdsClient();

  // Obtener campañas activas
  const campaigns = await prisma.marketingAdCampaign.findMany({
    where: {
      status: "ACTIVE",
    },
  });

  let synced = 0;
  const errors: string[] = [];

  console.log(`📊 Encontradas ${campaigns.length} campañas activas para sincronizar`);

  for (const campaign of campaigns) {
    try {
      // Sincronizar Google Ads
      if (campaign.platform === "google" && campaign.googleCampaignId) {
        console.log(`🔍 Sincronizando Google campaña: ${campaign.id}`);
        
        const metrics = await googleClient.syncMetrics(campaign.googleCampaignId);
        
        await prisma.marketingAdCampaign.update({
          where: { id: campaign.id },
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

        synced++;
        console.log(`✅ Google campaña ${campaign.id} sincronizada`);
      }

      // Sincronizar Facebook Ads
      if (campaign.platform === "facebook" && campaign.facebookCampaignId) {
        console.log(`🔍 Sincronizando Facebook campaña: ${campaign.id}`);
        
        const insights = await fbClient.syncInsights(campaign.facebookCampaignId);
        
        await prisma.marketingAdCampaign.update({
          where: { id: campaign.id },
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

        synced++;
        console.log(`✅ Facebook campaña ${campaign.id} sincronizada`);
      }

      // Si no tiene ni Google ni Facebook ID
      if (!campaign.googleCampaignId && !campaign.facebookCampaignId) {
        console.log(`⚠️ Campaña ${campaign.id} sin ID externo (Google/Facebook)`);
      }
      
    } catch (error: any) {
      console.error(`❌ Error sincronizando campaña ${campaign.id}:`, error.message);
      errors.push(`${campaign.id}: ${error.message}`);
    }
  }

  const result = {
    success: true,
    synced,
    total: campaigns.length,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: new Date().toISOString(),
  };

  console.log(`✅ Sync completado: ${synced}/${campaigns.length} campañas sincronizadas`);

  return NextResponse.json(result);
}

