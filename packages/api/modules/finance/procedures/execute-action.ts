import { protectedProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { ActionExecutor } from "../services/action-executor";

const actionExecutor = new ActionExecutor();

export const executeAction = protectedProcedure
  .route({ method: "POST", path: "/finance/execute-action" })
  .input(z.object({
    actionId: z.string(),
  }))
  .output(z.object({
    success: z.boolean(),
    result: z.any().optional(),
    error: z.string().optional(),
  }))
  .handler(async ({ input }) => {
    const { actionId } = input;
    
    try {
      const result = await actionExecutor.executeAction(actionId);
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

