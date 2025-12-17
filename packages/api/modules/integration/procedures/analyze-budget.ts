import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { CrossSystemController } from "../services/cross-system-controller";

const inputSchema = z.object({
	organizationId: z.string(),
	autoExecute: z.boolean().optional(),
});

export const analyzeBudget = protectedProcedure
	.route({ method: "POST", path: "/analyze-budget" })
	.input(inputSchema)
	.output(z.any())
	.handler(async ({ input }) => {
		const decisions = await CrossSystemController.analyzeAndControlBudget(
			input.organizationId,
		);

		if (input.autoExecute) {
			const results = await CrossSystemController.executeBudgetDecisions(
				input.organizationId,
				decisions,
				true,
			);

			return { ...decisions, execution: results };
		}

		return decisions;
	});



