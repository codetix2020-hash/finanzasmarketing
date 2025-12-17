import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { CrossSystemController } from "../services/cross-system-controller";

const inputSchema = z.object({
	organizationId: z.string(),
});

export const getIntegrationDashboard = protectedProcedure
	.route({ method: "POST", path: "/get-integration-dashboard" })
	.input(inputSchema)
	.output(z.any())
	.handler(async ({ input }) => {
		const data = await CrossSystemController.getDashboardData(
			input.organizationId,
		);

		return data;
	});



