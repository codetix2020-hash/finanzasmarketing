import { protectedProcedure } from '../../../orpc/procedures'
import { z } from 'zod'
import { 
  checkFinancialGuard, 
  checkReputationGuard, 
  checkLegalGuard,
  runAllGuards 
} from '../services/guard-service'

export const checkFinancialGuardProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
      productId: z.string().optional()
    })
  )
  .mutation(async ({ input }) => {
    const result = await checkFinancialGuard(input)
    return { success: true, ...result }
  })

export const checkReputationGuardProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
      productId: z.string().optional()
    })
  )
  .mutation(async ({ input }) => {
    const result = await checkReputationGuard(input)
    return { success: true, ...result }
  })

export const checkLegalGuardProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string(),
      productId: z.string().optional()
    })
  )
  .mutation(async ({ input }) => {
    const result = await checkLegalGuard(input)
    return { success: true, ...result }
  })

export const runAllGuardsProcedure = protectedProcedure
  .input(
    z.object({
      organizationId: z.string()
    })
  )
  .mutation(async ({ input }) => {
    const result = await runAllGuards(input.organizationId)
    return { success: true, ...result }
  })

