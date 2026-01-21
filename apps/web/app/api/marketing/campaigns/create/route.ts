import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import { GoogleAdsClient } from "@repo/api/modules/marketing/services/google-ads-client";
import { FacebookAdsClient } from "@repo/api/modules/marketing/services/facebook-ads-client";

/**
 * POST /api/marketing/campaigns/create
 * 
 * Crear campaña en Google Ads o Facebook Ads
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      platform, // "google" | "facebook"
      productId,
      name,
      objective, // "conversions" | "traffic" | "awareness" | etc
      dailyBudget,
      targeting,
      creatives, // Para Facebook
      keywords, // Para Google
    } = body;

    // Validar campos requeridos
    if (!platform || !productId || !name || !dailyBudget) {
      return NextResponse.json(
        { error: "Missing required fields: platform, productId, name, dailyBudget" },
        { status: 400 }
      );
    }

    // Obtener producto
    const product = await prisma.saasProduct.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // ========== GOOGLE ADS ==========
    if (platform === "google") {
      console.log("📢 Creando campaña Google Ads...");

      const googleClient = new GoogleAdsClient();

      // Crear campaña en Google Ads API
      const googleCampaign = await googleClient.createCampaign({
        name,
        budget: dailyBudget,
        keywords: keywords || [],
        targetLocation: targeting?.location,
      });

      // Guardar en BD
      const campaign = await prisma.marketingAdCampaign.create({
        data: {
          organizationId: product.organizationId,
          productId,
          name,
          platform: "google",
          googleCampaignId: googleCampaign.id,
          status: "ACTIVE",
          budget: {
            daily: dailyBudget,
            currency: "EUR",
            spent: 0,
            limit: dailyBudget * 30,
          },
          targeting: targeting || {},
          performance: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cpa: 0,
            roas: 0,
          },
          startDate: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        campaign: {
          id: campaign.id,
          googleCampaignId: googleCampaign.id,
          name: campaign.name,
          status: campaign.status,
          platform: "google",
        },
      });
    }

    // ========== FACEBOOK ADS ==========
    if (platform === "facebook") {
      console.log("📢 Creando campaña Facebook Ads...");

      const fbClient = new FacebookAdsClient();

      // Mapear objective
      const fbObjective = {
        conversions: "CONVERSIONS",
        traffic: "LINK_CLICKS",
        awareness: "REACH",
        engagement: "POST_ENGAGEMENT",
        leads: "LEAD_GENERATION",
      }[objective] || "LINK_CLICKS";

      // 1. Crear campaña
      const fbCampaign = await fbClient.createCampaign({
        name,
        objective: fbObjective,
        dailyBudget,
        status: "PAUSED",
      });

      // 2. Crear ad set
      const adSet = await fbClient.createAdSet(fbCampaign.id, {
        targeting: targeting || {},
        optimization: objective === "conversions" ? "CONVERSIONS" : "LINK_CLICKS",
      });

      // 3. Si hay creative, crear anuncio
      let adId = null;
      if (creatives && creatives.length > 0) {
        const creative = creatives[0];

        // Si hay imagen, subirla
        let imageHash;
        if (creative.imageUrl) {
          try {
            const imageResponse = await fetch(creative.imageUrl);
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
            const upload = await fbClient.uploadImage(imageBuffer);
            imageHash = upload.hash;
          } catch (error) {
            console.error("❌ Error subiendo imagen:", error);
          }
        }

        // Crear anuncio
        const ad = await fbClient.createAd(adSet.id, {
          headline: creative.headline,
          primaryText: creative.primaryText,
          description: creative.description,
          imageHash,
          callToAction: creative.callToAction || "LEARN_MORE",
          link: creative.link || product.url,
        });

        adId = ad.id;
      }

      // 4. Guardar en BD
      const campaign = await prisma.marketingAdCampaign.create({
        data: {
          organizationId: product.organizationId,
          productId,
          name,
          platform: "facebook",
          facebookCampaignId: fbCampaign.id,
          status: "ACTIVE",
          budget: {
            daily: dailyBudget,
            currency: "EUR",
            spent: 0,
            limit: dailyBudget * 30,
          },
          targeting: targeting || {},
          performance: {
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cpa: 0,
            roas: 0,
          },
          startDate: new Date(),
          metadata: {
            adSetId: adSet.id,
            adId,
          },
        },
      });

      return NextResponse.json({
        success: true,
        campaign: {
          id: campaign.id,
          facebookCampaignId: fbCampaign.id,
          name: campaign.name,
          status: campaign.status,
          platform: "facebook",
          adSetId: adSet.id,
          adId,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid platform. Use 'google' or 'facebook'" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("❌ Error creando campaña:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}




