import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { ActionExecutor } from "../services/action-executor";

const inputSchema = z.object({
  type: z.enum(['slack', 'email', 'stripe_pricing', 'alert']),
  params: z.record(z.string(), z.any()),
  autoExecute: z.boolean().default(false),
});

export const executeAction = protectedProcedure
  .route({ method: "POST", path: "/execute-action" })
  .input(inputSchema)
  .output(z.any())
  .handler(async ({ input }) => {
    const executor = new ActionExecutor();
    const result = await executor.execute(input);
    
    return result;
  });

