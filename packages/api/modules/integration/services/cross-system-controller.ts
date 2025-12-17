import { db } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";

export class CrossSystemController {
	/**
	 * Finance Agent analiza campañas y toma decisiones de presupuesto
	 */
	static async analyzeAndControlBudget(organizationId: string) {
		// Get all active campaigns with performance data
		const campaigns = await db.campaignPerformance.findMany({
			where: {
				organizationId,
				status: "active",
			},
			orderBy: { roi: "desc" },
		});

		if (campaigns.length === 0) {
			return {
				decisions: [],
				message: "No active campaigns to analyze",
			};
		}

		// Get current budget allocation
		const currentBudget = await db.budgetAllocation.findFirst({
			where: {
				organizationId,
				periodEnd: { gte: new Date() },
			},
			orderBy: { createdAt: "desc" },
		});

		// Use AI to analyze and make decisions
		const anthropic = new Anthropic({
			apiKey: process.env.ANTHROPIC_API_KEY || "",
		});

		const prompt = `Eres el Finance Agent del sistema FinanzaDIOS. Analiza estas campañas de marketing y decide cómo optimizar el presupuesto.

PRESUPUESTO ACTUAL:
${currentBudget
	? `
Total: €${currentBudget.totalBudget}
Gastado: €${currentBudget.totalSpent}
Remaining: €${currentBudget.remainingBudget}
Google Ads: €${currentBudget.googleAdsBudget}
Meta Ads: €${currentBudget.metaAdsBudget}
`
	: "No budget data available"}

CAMPAÑAS ACTIVAS:
${campaigns
	.map(
		(c, i) => `
${i + 1}. ${c.campaignName} (${c.source})
   - Spend: €${c.totalSpend}
   - Revenue: €${c.revenue}
   - ROI: ${c.roi.toFixed(1)}%
   - ROAS: ${c.roas.toFixed(1)}%
   - Conversions: ${c.conversions}
   - CPA: €${c.cpa.toFixed(2)}
`,
	)
	.join("\n")}

TAREA:
Para cada campaña, decide:
1. SCALE (+25%, +50%, +100%) - Si ROI > 300%
2. MAINTAIN - Si ROI 150-300%
3. OPTIMIZE - Si ROI 50-150%
4. REDUCE (-25%, -50%) - Si ROI 0-50%
5. PAUSE - Si ROI < 0%

También sugiere redistribución de presupuesto entre Google Ads y Meta Ads.

RESPONDE EN JSON:
{
  "campaignDecisions": [
    {
      "campaignId": "string",
      "campaignName": "string",
      "action": "SCALE | MAINTAIN | OPTIMIZE | REDUCE | PAUSE",
      "budgetChange": number (porcentaje, ej: 50 para +50%, -25 para -25%),
      "newBudget": number (euros),
      "reasoning": "string"
    }
  ],
  "budgetReallocation": {
    "googleAdsChange": number (porcentaje),
    "metaAdsChange": number (porcentaje),
    "reasoning": "string"
  },
  "summary": "string (resumen ejecutivo)",
  "expectedImpact": {
    "totalROIChange": number,
    "totalRevenueChange": number
  }
}`;

		try {
			const message = await anthropic.messages.create({
				model: "claude-sonnet-4-20250514",
				max_tokens: 3000,
				messages: [{ role: "user", content: prompt }],
			});

			const content = message.content[0];
			if (content.type !== "text") {
				throw new Error("Unexpected response");
			}

			const responseText = content.text.trim();
			const jsonMatch = responseText.match(/\{[\s\S]*\}/);
			if (!jsonMatch) {
				throw new Error("No JSON in response");
			}

			const decisions = JSON.parse(jsonMatch[0]);

			// Log integration event
			await db.integrationEvent.create({
				data: {
					organizationId,
					eventType: "budget_analysis",
					sourceSystem: "finance",
					targetSystem: "marketing",
					title: "Finance Agent Budget Analysis",
					description: decisions.summary,
					severity: "info",
					metadata: decisions,
				},
			});

			return decisions;
		} catch (error) {
			console.error("Error in budget analysis:", error);

			// Fallback to simple rules
			const decisions = {
				campaignDecisions: campaigns.map((c) => {
					let action: string;
					let budgetChange: number;

					if (c.roi > 300) {
						action = "SCALE";
						budgetChange = 50;
					} else if (c.roi > 150) {
						action = "MAINTAIN";
						budgetChange = 0;
					} else if (c.roi > 50) {
						action = "OPTIMIZE";
						budgetChange = -15;
					} else if (c.roi > 0) {
						action = "REDUCE";
						budgetChange = -25;
					} else {
						action = "PAUSE";
						budgetChange = -100;
					}

					return {
						campaignId: c.campaignId,
						campaignName: c.campaignName,
						action,
						budgetChange,
						newBudget: c.totalSpend * (1 + budgetChange / 100),
						reasoning: `ROI of ${c.roi.toFixed(1)}% indicates ${action} action`,
					};
				}),
				budgetReallocation: {
					googleAdsChange: 0,
					metaAdsChange: 0,
					reasoning: "Fallback rules applied - AI analysis failed",
				},
				summary: "Automated budget decisions based on ROI rules",
				expectedImpact: {
					totalROIChange: 0,
					totalRevenueChange: 0,
				},
			};

			return decisions;
		}
	}

	/**
	 * Execute budget decisions
	 */
	static async executeBudgetDecisions(
		organizationId: string,
		decisions: any,
		autoExecute: boolean = false,
	) {
		const results = [];

		for (const decision of decisions.campaignDecisions) {
			// Update campaign status/budget
			const campaign = await db.campaignPerformance.findFirst({
				where: {
					organizationId,
					campaignId: decision.campaignId,
				},
			});

			if (!campaign) continue;

			// Update campaign
			const updated = await db.campaignPerformance.update({
				where: { id: campaign.id },
				data: {
					dailyBudget: decision.newBudget,
					status: decision.action === "PAUSE" ? "paused" : "active",
					recommendedAction: decision.action,
					recommendedBudget: decision.newBudget,
					lastAnalyzedAt: new Date(),
				},
			});

			// Log event
			await db.integrationEvent.create({
				data: {
					organizationId,
					eventType: "budget_change",
					sourceSystem: "finance",
					targetSystem: "marketing",
					title: `Campaign ${decision.action}: ${campaign.campaignName}`,
					description: decision.reasoning,
					severity: decision.action === "PAUSE" ? "warning" : "info",
					actionType: "scale_budget",
					actionStatus: autoExecute ? "executed" : "pending",
					campaignId: campaign.campaignId,
					metadata: decision,
				},
			});

			results.push({
				campaignId: decision.campaignId,
				action: decision.action,
				status: autoExecute ? "executed" : "pending_approval",
				updated,
			});
		}

		return {
			results,
			summary: `Processed ${results.length} campaign decisions`,
			autoExecuted: autoExecute,
		};
	}

	/**
	 * Get integration dashboard data
	 */
	static async getDashboardData(organizationId: string) {
		const [campaigns, budget, recentEvents, attributionStats] =
			await Promise.all([
				db.campaignPerformance.findMany({
					where: { organizationId, status: "active" },
					orderBy: { roi: "desc" },
					take: 10,
				}),
				db.budgetAllocation.findFirst({
					where: {
						organizationId,
						periodEnd: { gte: new Date() },
					},
					orderBy: { createdAt: "desc" },
				}),
				db.integrationEvent.findMany({
					where: { organizationId },
					orderBy: { createdAt: "desc" },
					take: 20,
				}),
				db.customerJourney.groupBy({
					by: ["firstTouchSource"],
					where: {
						organizationId,
						hasConverted: true,
					},
					_sum: {
						conversionValue: true,
						lifetimeValue: true,
					},
					_count: true,
				}),
			]);

		// Calculate aggregate metrics
		const totalSpend = campaigns.reduce((sum, c) => sum + c.totalSpend, 0);
		const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);
		const totalROI =
			totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
		const totalConversions = campaigns.reduce(
			(sum, c) => sum + c.conversions,
			0,
		);
		const avgCPA =
			totalConversions > 0 ? totalSpend / totalConversions : 0;

		return {
			campaigns,
			budget,
			recentEvents,
			attributionStats,
			aggregateMetrics: {
				totalSpend,
				totalRevenue,
				totalROI,
				totalConversions,
				avgCPA,
				activeCampaigns: campaigns.length,
			},
		};
	}
}



