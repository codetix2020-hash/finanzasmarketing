import { z } from 'zod'
import { publicProcedure } from '../../../orpc/procedures'
import { orchestrateLaunch, getLaunchStatus } from '../services/launch-orchestrator'

export const orchestrateLaunchProcedure = publicProcedure
  .input(z.object({
    organizationId: z.string(),
    productId: z.string(),
    launchDate: z.coerce.date(),
    launchType: z.enum(['soft', 'full', 'beta'])
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await orchestrateLaunch(input)
    return { success: true, ...result }
  })

export const getLaunchStatusProcedure = publicProcedure
  .input(z.object({
    productId: z.string()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await getLaunchStatus(input.productId)
    return { success: true, ...result }
  })

