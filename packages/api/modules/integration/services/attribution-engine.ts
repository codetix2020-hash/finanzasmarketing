import { db } from "@repo/database";

export interface TouchPoint {
	source: string;
	campaign?: string;
	timestamp: Date;
	value?: number;
}

export class AttributionEngine {
	/**
	 * Track attribution event
	 */
	static async trackEvent(data: {
		userId?: string;
		sessionId: string;
		visitorId: string;
		organizationId?: string;
		eventType: string;
		eventValue?: number;
		source?: string;
		medium?: string;
		campaign?: string;
		adGroup?: string;
		keyword?: string;
		adId?: string;
		landingPage?: string;
		referrer?: string;
		utmParams?: {
			source?: string;
			medium?: string;
			campaign?: string;
			content?: string;
			term?: string;
		};
		device?: string;
		country?: string;
		city?: string;
		metadata?: any;
	}) {
		return await db.attributionEvent.create({
			data: {
				userId: data.userId,
				sessionId: data.sessionId,
				visitorId: data.visitorId,
				organizationId: data.organizationId,
				eventType: data.eventType,
				eventValue: data.eventValue,
				source: data.source,
				medium: data.medium,
				campaign: data.campaign,
				adGroup: data.adGroup,
				keyword: data.keyword,
				adId: data.adId,
				landingPage: data.landingPage,
				referrer: data.referrer,
				utmSource: data.utmParams?.source,
				utmMedium: data.utmParams?.medium,
				utmCampaign: data.utmParams?.campaign,
				utmContent: data.utmParams?.content,
				utmTerm: data.utmParams?.term,
				device: data.device,
				country: data.country,
				city: data.city,
				metadata: data.metadata,
			},
		});
	}

	/**
	 * Create or update customer journey
	 */
	static async updateCustomerJourney(
		userId: string,
		organizationId: string,
		touchpoint: TouchPoint,
		conversionData?: {
			hasConverted: boolean;
			conversionValue?: number;
		},
	) {
		// Get existing journey or create new
		let journey = await db.customerJourney.findUnique({
			where: { userId },
		});

		const now = new Date();

		if (!journey) {
			// First touch - create journey
			journey = await db.customerJourney.create({
				data: {
					userId,
					organizationId,
					firstTouchSource: touchpoint.source,
					firstTouchCampaign: touchpoint.campaign,
					firstTouchDate: now,
					lastTouchSource: touchpoint.source,
					lastTouchCampaign: touchpoint.campaign,
					lastTouchDate: now,
					touchpointsCount: 1,
					hasConverted: conversionData?.hasConverted || false,
					conversionDate: conversionData?.hasConverted ? now : undefined,
					conversionValue: conversionData?.conversionValue,
					lifetimeValue: conversionData?.conversionValue || 0,
				},
			});
		} else {
			// Update existing journey
			const touchpointsCount = journey.touchpointsCount + 1;
			const daysToConversion =
				conversionData?.hasConverted && journey.firstTouchDate
					? Math.floor(
							(now.getTime() - journey.firstTouchDate.getTime()) /
								(1000 * 60 * 60 * 24),
						)
					: journey.daysToConversion;

			journey = await db.customerJourney.update({
				where: { userId },
				data: {
					lastTouchSource: touchpoint.source,
					lastTouchCampaign: touchpoint.campaign,
					lastTouchDate: now,
					touchpointsCount,
					...(conversionData?.hasConverted && {
						hasConverted: true,
						conversionDate: now,
						conversionValue: conversionData.conversionValue,
						daysToConversion,
					}),
					...(conversionData?.conversionValue && {
						lifetimeValue:
							journey.lifetimeValue + conversionData.conversionValue,
					}),
				},
			});
		}

		// Calculate attribution if converted
		if (conversionData?.hasConverted && conversionData.conversionValue) {
			await this.calculateAttribution(userId, conversionData.conversionValue);
		}

		return journey;
	}

	/**
	 * Calculate attribution values (First Touch, Last Touch, Linear)
	 */
	private static async calculateAttribution(
		userId: string,
		conversionValue: number,
	) {
		const journey = await db.customerJourney.findUnique({
			where: { userId },
		});

		if (!journey) return;

		// Get all touchpoints for this user
		const touchpoints = await db.attributionEvent.findMany({
			where: {
				userId,
				eventType: { in: ["ad_click", "page_view"] },
			},
			orderBy: { createdAt: "asc" },
		});

		if (touchpoints.length === 0) return;

		// First Touch: 100% to first touchpoint
		const firstTouchValue = conversionValue;

		// Last Touch: 100% to last touchpoint
		const lastTouchValue = conversionValue;

		// Linear: Distributed equally across all touchpoints
		const linearValue = conversionValue;

		await db.customerJourney.update({
			where: { userId },
			data: {
				firstTouchValue,
				lastTouchValue,
				linearValue,
			},
		});
	}

	/**
	 * Get attribution report by campaign
	 */
	static async getAttributionByCampaign(
		organizationId: string,
		dateRange: { start: Date; end: Date },
	) {
		// Get all conversions in date range
		const journeys = await db.customerJourney.findMany({
			where: {
				organizationId,
				hasConverted: true,
				conversionDate: {
					gte: dateRange.start,
					lte: dateRange.end,
				},
			},
		});

		// Aggregate by campaign
		const campaignStats: Record<
			string,
			{
				firstTouch: number;
				lastTouch: number;
				linear: number;
				conversions: number;
			}
		> = {};

		for (const journey of journeys) {
			// First Touch Attribution
			if (journey.firstTouchCampaign) {
				if (!campaignStats[journey.firstTouchCampaign]) {
					campaignStats[journey.firstTouchCampaign] = {
						firstTouch: 0,
						lastTouch: 0,
						linear: 0,
						conversions: 0,
					};
				}
				campaignStats[journey.firstTouchCampaign].firstTouch +=
					journey.firstTouchValue;
			}

			// Last Touch Attribution
			if (journey.lastTouchCampaign) {
				if (!campaignStats[journey.lastTouchCampaign]) {
					campaignStats[journey.lastTouchCampaign] = {
						firstTouch: 0,
						lastTouch: 0,
						linear: 0,
						conversions: 0,
					};
				}
				campaignStats[journey.lastTouchCampaign].lastTouch +=
					journey.lastTouchValue;
				campaignStats[journey.lastTouchCampaign].conversions += 1;
			}

			// Linear Attribution (simplified - would need all touchpoints for accurate linear)
			if (journey.firstTouchCampaign) {
				campaignStats[journey.firstTouchCampaign].linear +=
					journey.linearValue / journey.touchpointsCount;
			}
		}

		return campaignStats;
	}

	/**
	 * Update campaign performance with attribution data
	 */
	static async updateCampaignPerformance(
		organizationId: string,
		campaignId: string,
		data: {
			spend?: number;
			impressions?: number;
			clicks?: number;
			conversions?: number;
		},
	) {
		// Get existing or create new
		let campaign = await db.campaignPerformance.findFirst({
			where: {
				organizationId,
				campaignId,
			},
		});

		if (!campaign) {
			campaign = await db.campaignPerformance.create({
				data: {
					organizationId,
					campaignId,
					campaignName: `Campaign ${campaignId}`,
					source: "google_ads", // Would come from actual data
					status: "active",
					startDate: new Date(),
					totalSpend: data.spend || 0,
					impressions: data.impressions || 0,
					clicks: data.clicks || 0,
					conversions: data.conversions || 0,
				},
			});
		} else {
			campaign = await db.campaignPerformance.update({
				where: { id: campaign.id },
				data: {
					totalSpend: campaign.totalSpend + (data.spend || 0),
					impressions: campaign.impressions + (data.impressions || 0),
					clicks: campaign.clicks + (data.clicks || 0),
					conversions: campaign.conversions + (data.conversions || 0),
				},
			});
		}

		// Get attribution data for this campaign
		const attributionStats = await this.getAttributionByCampaign(
			organizationId,
			{ start: campaign.startDate, end: new Date() },
		);

		const campaignStats = attributionStats[campaignId];
		if (campaignStats) {
			// Calculate metrics
			const revenue = campaignStats.lastTouch; // Using last touch for revenue
			const ctr =
				campaign.impressions > 0
					? (campaign.clicks / campaign.impressions) * 100
					: 0;
			const cpc =
				campaign.clicks > 0 ? campaign.totalSpend / campaign.clicks : 0;
			const cpa =
				campaign.conversions > 0
					? campaign.totalSpend / campaign.conversions
					: 0;
			const roas =
				campaign.totalSpend > 0 ? (revenue / campaign.totalSpend) * 100 : 0;
			const roi =
				campaign.totalSpend > 0
					? ((revenue - campaign.totalSpend) / campaign.totalSpend) * 100
					: 0;

			await db.campaignPerformance.update({
				where: { id: campaign.id },
				data: {
					revenue,
					ctr,
					cpc,
					cpa,
					roas,
					roi,
					firstTouchRevenue: campaignStats.firstTouch,
					lastTouchRevenue: campaignStats.lastTouch,
					linearRevenue: campaignStats.linear,
				},
			});
		}

		return campaign;
	}
}



