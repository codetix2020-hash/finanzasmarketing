import { wsServer } from "./websocket-server";
import { db } from "@repo/database";

export interface RealtimeEvent {
	type:
		| "metric_update"
		| "campaign_change"
		| "budget_change"
		| "notification"
		| "transaction";
	organizationId: string;
	timestamp: Date;
	data: any;
	severity?: "info" | "warning" | "critical";
}

export class RealtimeEvents {
	/**
	 * Broadcast metric update
	 */
	static async broadcastMetricUpdate(
		organizationId: string,
		metrics: {
			totalRevenue?: number;
			totalSpend?: number;
			totalROI?: number;
			activeCampaigns?: number;
			conversions?: number;
		},
	) {
		const event: RealtimeEvent = {
			type: "metric_update",
			organizationId,
			timestamp: new Date(),
			data: metrics,
		};

		wsServer.broadcastToOrganization(organizationId, "metric_update", event);

		// Log event
		await this.logEvent(event);
	}

	/**
	 * Broadcast campaign change
	 */
	static async broadcastCampaignChange(
		organizationId: string,
		campaign: {
			id: string;
			name: string;
			action: string;
			oldBudget?: number;
			newBudget?: number;
			reason: string;
		},
	) {
		const event: RealtimeEvent = {
			type: "campaign_change",
			organizationId,
			timestamp: new Date(),
			data: campaign,
			severity: campaign.action === "PAUSE" ? "critical" : "info",
		};

		wsServer.broadcastToOrganization(
			organizationId,
			"campaign_change",
			event,
		);

		// Log event
		await this.logEvent(event);

		// También broadcast una notificación
		await this.broadcastNotification(
			organizationId,
			`Campaign ${campaign.action}: ${campaign.name}`,
			campaign.reason,
			event.severity,
		);
	}

	/**
	 * Broadcast budget change
	 */
	static async broadcastBudgetChange(
		organizationId: string,
		budget: {
			totalBudget: number;
			allocatedBudget: number;
			remainingBudget: number;
			changes: Array<{
				channel: string;
				oldBudget: number;
				newBudget: number;
			}>;
			reason: string;
		},
	) {
		const event: RealtimeEvent = {
			type: "budget_change",
			organizationId,
			timestamp: new Date(),
			data: budget,
			severity: "warning",
		};

		wsServer.broadcastToOrganization(organizationId, "budget_change", event);

		// Log event
		await this.logEvent(event);

		// Notificación
		await this.broadcastNotification(
			organizationId,
			"Budget Allocation Updated",
			budget.reason,
			"warning",
		);
	}

	/**
	 * Broadcast notification
	 */
	static async broadcastNotification(
		organizationId: string,
		title: string,
		message: string,
		severity: "info" | "warning" | "critical" = "info",
	) {
		const event: RealtimeEvent = {
			type: "notification",
			organizationId,
			timestamp: new Date(),
			data: { title, message },
			severity,
		};

		wsServer.broadcastToOrganization(organizationId, "notification", event);

		// Log event
		await this.logEvent(event);
	}

	/**
	 * Broadcast transaction (purchase, signup, etc.)
	 */
	static async broadcastTransaction(
		organizationId: string,
		transaction: {
			type: "purchase" | "signup" | "trial_start" | "subscription";
			userId?: string;
			amount?: number;
			source?: string;
			campaign?: string;
		},
	) {
		const event: RealtimeEvent = {
			type: "transaction",
			organizationId,
			timestamp: new Date(),
			data: transaction,
		};

		wsServer.broadcastToOrganization(organizationId, "transaction", event);

		// Log event
		await this.logEvent(event);
	}

	/**
	 * Log event to database
	 */
	private static async logEvent(event: RealtimeEvent) {
		try {
			await db.integrationEvent.create({
				data: {
					organizationId: event.organizationId,
					eventType: event.type,
					sourceSystem: "realtime",
					title: `Real-time ${event.type}`,
					description: JSON.stringify(event.data),
					severity: event.severity || "info",
					metadata: event.data,
				},
			});
		} catch (error) {
			console.error("Error logging realtime event:", error);
		}
	}

	/**
	 * Start real-time metrics simulation (for demo)
	 */
	static startMetricsSimulation(organizationId: string) {
		// Simulate metric updates every 5 seconds
		const interval = setInterval(async () => {
			const randomChange = () => (Math.random() - 0.5) * 1000;

			await this.broadcastMetricUpdate(organizationId, {
				totalRevenue: 45230 + randomChange(),
				totalSpend: 12100 + randomChange() * 0.3,
				totalROI: 273.8 + (Math.random() - 0.5) * 10,
			});

			// Random transaction every 10 seconds
			if (Math.random() > 0.5) {
				await this.broadcastTransaction(organizationId, {
					type: "purchase",
					amount: 49 + Math.random() * 100,
					source: Math.random() > 0.5 ? "google_ads" : "meta_ads",
					campaign: `Campaign ${Math.floor(Math.random() * 5) + 1}`,
				});
			}
		}, 5000);

		// Return cleanup function
		return () => clearInterval(interval);
	}
}



