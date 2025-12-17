import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { AttributionEngine } from "../services/attribution-engine";

const inputSchema = z.object({
	userId: z.string().optional(),
	sessionId: z.string(),
	visitorId: z.string(),
	organizationId: z.string().optional(),
	eventType: z.string(),
	eventValue: z.number().optional(),
	source: z.string().optional(),
	campaign: z.string().optional(),
	utmParams: z
		.object({
			source: z.string().optional(),
			medium: z.string().optional(),
			campaign: z.string().optional(),
		})
		.optional(),
});

export const trackAttribution = protectedProcedure
	.route({ method: "POST", path: "/track-attribution" })
	.input(inputSchema)
	.output(z.any())
	.handler(async ({ input }) => {
		const event = await AttributionEngine.trackEvent(input);

		// Update customer journey if userId provided
		if (input.userId && input.organizationId) {
			await AttributionEngine.updateCustomerJourney(
				input.userId,
				input.organizationId,
				{
					source: input.source || "direct",
					campaign: input.campaign,
					timestamp: new Date(),
				},
				input.eventType === "purchase"
					? {
							hasConverted: true,
							conversionValue: input.eventValue,
						}
					: undefined,
			);
		}

		return { success: true, event };
	});



