/**
 * Facebook Ads Client - Auto-detección Mock/Real
 * 
 * SIN credenciales → Modo MOCK (para testing)
 * CON credenciales → Modo REAL (facebook-nodejs-business-sdk)
 */

interface FacebookCampaignParams {
  name: string;
  objective: string; // 'CONVERSIONS', 'LINK_CLICKS', 'REACH', etc.
  dailyBudget: number;
  status?: string;
}

interface FacebookAdSetParams {
  name?: string;
  targeting: Record<string, any>;
  optimization: string;
  billingEvent?: string;
  bidAmount?: number;
}

interface FacebookAdCreative {
  headline: string;
  primaryText: string;
  description?: string;
  imageHash?: string;
  callToAction?: string;
  link?: string;
}

interface FacebookInsights {
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversionRate: number;
}

interface FacebookCampaignResult {
  id: string;
  status: string;
}

interface FacebookAdSetResult {
  id: string;
}

interface FacebookAdResult {
  id: string;
}

interface FacebookImageUploadResult {
  hash: string;
  url?: string;
}

export class FacebookAdsClient {
  private isMockMode: boolean;
  private adAccountId?: string;

  constructor() {
    // Detectar si hay credenciales configuradas
    this.isMockMode = !process.env.FACEBOOK_ACCESS_TOKEN;
    this.adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID;

    if (this.isMockMode) {
      console.log("🧪 FacebookAdsClient: Modo MOCK activado (sin credenciales)");
    } else {
      console.log("🔌 FacebookAdsClient: Modo REAL activado");
    }
  }

  /**
   * Crear campaña en Facebook Ads
   */
  async createCampaign(params: FacebookCampaignParams): Promise<FacebookCampaignResult> {
    if (this.isMockMode) {
      return this.mockCreateCampaign(params);
    }

    return this.realCreateCampaign(params);
  }

  /**
   * Crear Ad Set (conjunto de anuncios)
   */
  async createAdSet(campaignId: string, params: FacebookAdSetParams): Promise<FacebookAdSetResult> {
    if (this.isMockMode) {
      return this.mockCreateAdSet(campaignId, params);
    }

    return this.realCreateAdSet(campaignId, params);
  }

  /**
   * Crear anuncio
   */
  async createAd(adSetId: string, creative: FacebookAdCreative): Promise<FacebookAdResult> {
    if (this.isMockMode) {
      return this.mockCreateAd(adSetId, creative);
    }

    return this.realCreateAd(adSetId, creative);
  }

  /**
   * Sincronizar insights (métricas) de campaña
   */
  async syncInsights(campaignId: string): Promise<FacebookInsights> {
    if (this.isMockMode) {
      return this.mockSyncInsights(campaignId);
    }

    return this.realSyncInsights(campaignId);
  }

  /**
   * Subir imagen a Facebook
   */
  async uploadImage(imageBuffer: Buffer): Promise<FacebookImageUploadResult> {
    if (this.isMockMode) {
      return this.mockUploadImage(imageBuffer);
    }

    return this.realUploadImage(imageBuffer);
  }

  /**
   * Pausar campaña
   */
  async pauseCampaign(campaignId: string): Promise<{ success: boolean }> {
    if (this.isMockMode) {
      console.log(`🧪 MOCK: Pausando campaña ${campaignId}`);
      return { success: true };
    }

    return this.realPauseCampaign(campaignId);
  }

  /**
   * Reactivar campaña
   */
  async resumeCampaign(campaignId: string): Promise<{ success: boolean }> {
    if (this.isMockMode) {
      console.log(`🧪 MOCK: Reactivando campaña ${campaignId}`);
      return { success: true };
    }

    return this.realResumeCampaign(campaignId);
  }

  /**
   * Obtener audiencias guardadas
   */
  async getSavedAudiences(): Promise<Array<{ id: string; name: string; size: number }>> {
    if (this.isMockMode) {
      return this.mockGetSavedAudiences();
    }

    return this.realGetSavedAudiences();
  }

  // ==========================================
  // MOCK IMPLEMENTATIONS
  // ==========================================

  private mockCreateCampaign(params: FacebookCampaignParams): FacebookCampaignResult {
    const mockId = `fb_camp_mock_${Date.now()}`;
    console.log(`🧪 MOCK: Creando campaña Facebook Ads:`, params);
    
    return {
      id: mockId,
      status: params.status || "PAUSED",
    };
  }

  private mockCreateAdSet(campaignId: string, params: FacebookAdSetParams): FacebookAdSetResult {
    const mockId = `fb_adset_mock_${Date.now()}`;
    console.log(`🧪 MOCK: Creando ad set para campaña ${campaignId}:`, params);
    
    return {
      id: mockId,
    };
  }

  private mockCreateAd(adSetId: string, creative: FacebookAdCreative): FacebookAdResult {
    const mockId = `fb_ad_mock_${Date.now()}`;
    console.log(`🧪 MOCK: Creando anuncio para ad set ${adSetId}:`, creative);
    
    return {
      id: mockId,
    };
  }

  private mockSyncInsights(campaignId: string): FacebookInsights {
    console.log(`🧪 MOCK: Sincronizando insights de ${campaignId}`);
    
    // Generar métricas fake realistas
    const impressions = Math.floor(Math.random() * 20000) + 1000;
    const clicks = Math.floor(impressions * (Math.random() * 0.04 + 0.01)); // CTR 1-5%
    const spend = clicks * (Math.random() * 1.5 + 0.3); // CPC €0.30-€1.80
    const conversions = Math.floor(clicks * (Math.random() * 0.08 + 0.01)); // CR 1-9%

    return {
      impressions,
      clicks,
      spend: Math.round(spend * 100) / 100,
      conversions,
      ctr: Math.round((clicks / impressions) * 10000) / 100,
      cpc: Math.round((spend / clicks) * 100) / 100,
      cpm: Math.round((spend / impressions) * 1000 * 100) / 100,
      conversionRate: Math.round((conversions / clicks) * 10000) / 100,
    };
  }

  private mockUploadImage(imageBuffer: Buffer): FacebookImageUploadResult {
    const mockHash = `mock_hash_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log(`🧪 MOCK: Subiendo imagen (${imageBuffer.length} bytes)`);
    
    return {
      hash: mockHash,
      url: `https://mock.facebook.com/images/${mockHash}`,
    };
  }

  private mockGetSavedAudiences(): Array<{ id: string; name: string; size: number }> {
    console.log(`🧪 MOCK: Obteniendo audiencias guardadas`);
    
    return [
      { id: "mock_aud_1", name: "Audiencia 25-40 Interesados en Barberías", size: 50000 },
      { id: "mock_aud_2", name: "Lookalike de Clientes", size: 120000 },
      { id: "mock_aud_3", name: "Retargeting Visitantes Web", size: 8000 },
    ];
  }

  // ==========================================
  // REAL IMPLEMENTATIONS (con facebook-nodejs-business-sdk)
  // ==========================================

  private async realCreateCampaign(params: FacebookCampaignParams): Promise<FacebookCampaignResult> {
    console.log("🔌 REAL: Creando campaña en Facebook Ads API...");
    
    try {
      // TODO: Implementar con facebook-nodejs-business-sdk cuando tengamos credenciales
      //
      // const bizSdk = await import('facebook-nodejs-business-sdk');
      // const { AdAccount, Campaign } = bizSdk;
      //
      // const account = new AdAccount(this.adAccountId);
      //
      // const campaign = await account.createCampaign([], {
      //   name: params.name,
      //   objective: params.objective,
      //   status: params.status || 'PAUSED',
      //   daily_budget: params.dailyBudget * 100, // centavos
      //   special_ad_categories: [],
      // });
      //
      // return {
      //   id: campaign.id,
      //   status: params.status || 'PAUSED',
      // };

      throw new Error("Facebook Ads API credentials not configured. Add FACEBOOK_ACCESS_TOKEN to use real mode.");
    } catch (error: any) {
      console.error("❌ Error creando campaña Facebook Ads:", error.message);
      throw error;
    }
  }

  private async realCreateAdSet(campaignId: string, params: FacebookAdSetParams): Promise<FacebookAdSetResult> {
    console.log("🔌 REAL: Creando ad set en Facebook Ads API...");
    
    try {
      // const bizSdk = await import('facebook-nodejs-business-sdk');
      // const { Campaign, AdSet } = bizSdk;
      //
      // const campaign = new Campaign(campaignId);
      //
      // const adSet = await campaign.createAdSet([], {
      //   name: params.name || `AdSet ${Date.now()}`,
      //   optimization_goal: params.optimization,
      //   billing_event: params.billingEvent || 'IMPRESSIONS',
      //   bid_amount: params.bidAmount ? params.bidAmount * 100 : undefined,
      //   targeting: params.targeting,
      //   status: 'PAUSED',
      // });
      //
      // return {
      //   id: adSet.id,
      // };

      throw new Error("Facebook Ads API credentials not configured");
    } catch (error: any) {
      console.error("❌ Error creando ad set:", error.message);
      throw error;
    }
  }

  private async realCreateAd(adSetId: string, creative: FacebookAdCreative): Promise<FacebookAdResult> {
    console.log("🔌 REAL: Creando anuncio en Facebook Ads API...");
    
    try {
      // const bizSdk = await import('facebook-nodejs-business-sdk');
      // const { AdSet, AdCreative, Ad } = bizSdk;
      //
      // // 1. Crear creative
      // const adCreative = await new AdAccount(this.adAccountId).createAdCreative([], {
      //   name: `Creative ${Date.now()}`,
      //   object_story_spec: {
      //     page_id: process.env.FACEBOOK_PAGE_ID,
      //     link_data: {
      //       link: creative.link,
      //       message: creative.primaryText,
      //       name: creative.headline,
      //       description: creative.description,
      //       image_hash: creative.imageHash,
      //       call_to_action: {
      //         type: creative.callToAction || 'LEARN_MORE',
      //       },
      //     },
      //   },
      // });
      //
      // // 2. Crear ad
      // const adSet = new AdSet(adSetId);
      // const ad = await adSet.createAd([], {
      //   name: `Ad ${Date.now()}`,
      //   creative: { creative_id: adCreative.id },
      //   status: 'PAUSED',
      // });
      //
      // return {
      //   id: ad.id,
      // };

      throw new Error("Facebook Ads API credentials not configured");
    } catch (error: any) {
      console.error("❌ Error creando anuncio:", error.message);
      throw error;
    }
  }

  private async realSyncInsights(campaignId: string): Promise<FacebookInsights> {
    console.log("🔌 REAL: Sincronizando insights de Facebook Ads API...");
    
    try {
      // const bizSdk = await import('facebook-nodejs-business-sdk');
      // const { Campaign } = bizSdk;
      //
      // const campaign = new Campaign(campaignId);
      // const insights = await campaign.getInsights([], {
      //   fields: [
      //     'impressions',
      //     'clicks',
      //     'spend',
      //     'actions', // includes conversions
      //     'ctr',
      //     'cpc',
      //     'cpm',
      //   ],
      //   time_range: { since: 'last_30d' },
      // });
      //
      // const data = insights[0];
      // const conversions = data.actions?.find(a => a.action_type === 'purchase')?.value || 0;
      //
      // return {
      //   impressions: parseInt(data.impressions),
      //   clicks: parseInt(data.clicks),
      //   spend: parseFloat(data.spend),
      //   conversions: parseInt(conversions),
      //   ctr: parseFloat(data.ctr),
      //   cpc: parseFloat(data.cpc),
      //   cpm: parseFloat(data.cpm),
      //   conversionRate: (conversions / parseInt(data.clicks)) * 100,
      // };

      throw new Error("Facebook Ads API credentials not configured");
    } catch (error: any) {
      console.error("❌ Error sincronizando insights:", error.message);
      throw error;
    }
  }

  private async realUploadImage(imageBuffer: Buffer): Promise<FacebookImageUploadResult> {
    console.log("🔌 REAL: Subiendo imagen a Facebook Ads API...");
    
    try {
      // const bizSdk = await import('facebook-nodejs-business-sdk');
      // const { AdAccount, AdImage } = bizSdk;
      //
      // const account = new AdAccount(this.adAccountId);
      //
      // const image = await account.createAdImage([], {
      //   bytes: imageBuffer.toString('base64'),
      // });
      //
      // return {
      //   hash: image.hash,
      //   url: image.url,
      // };

      throw new Error("Facebook Ads API credentials not configured");
    } catch (error: any) {
      console.error("❌ Error subiendo imagen:", error.message);
      throw error;
    }
  }

  private async realPauseCampaign(campaignId: string): Promise<{ success: boolean }> {
    console.log("🔌 REAL: Pausando campaña en Facebook Ads API...");
    
    try {
      // const bizSdk = await import('facebook-nodejs-business-sdk');
      // const { Campaign } = bizSdk;
      //
      // const campaign = new Campaign(campaignId);
      // await campaign.update([], { status: 'PAUSED' });

      throw new Error("Facebook Ads API credentials not configured");
    } catch (error: any) {
      console.error("❌ Error pausando campaña:", error.message);
      throw error;
    }
  }

  private async realResumeCampaign(campaignId: string): Promise<{ success: boolean }> {
    console.log("🔌 REAL: Reactivando campaña en Facebook Ads API...");
    
    try {
      // const bizSdk = await import('facebook-nodejs-business-sdk');
      // const { Campaign } = bizSdk;
      //
      // const campaign = new Campaign(campaignId);
      // await campaign.update([], { status: 'ACTIVE' });

      throw new Error("Facebook Ads API credentials not configured");
    } catch (error: any) {
      console.error("❌ Error reactivando campaña:", error.message);
      throw error;
    }
  }

  private async realGetSavedAudiences(): Promise<Array<{ id: string; name: string; size: number }>> {
    console.log("🔌 REAL: Obteniendo audiencias guardadas de Facebook Ads API...");
    
    try {
      // const bizSdk = await import('facebook-nodejs-business-sdk');
      // const { AdAccount } = bizSdk;
      //
      // const account = new AdAccount(this.adAccountId);
      // const audiences = await account.getCustomAudiences([], {
      //   fields: ['id', 'name', 'approximate_count'],
      // });
      //
      // return audiences.map(aud => ({
      //   id: aud.id,
      //   name: aud.name,
      //   size: aud.approximate_count || 0,
      // }));

      throw new Error("Facebook Ads API credentials not configured");
    } catch (error: any) {
      console.error("❌ Error obteniendo audiencias:", error.message);
      throw error;
    }
  }
}







