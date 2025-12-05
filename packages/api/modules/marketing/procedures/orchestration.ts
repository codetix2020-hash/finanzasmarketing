import { z } from 'zod'
import { protectedProcedure } from '../../../orpc/procedures'
import { orchestrate, orchestrateMaster, orchestrateProduct } from '../../../src/lib/ai/orchestrator'
import { saveMemory, searchMemory } from '../../../src/lib/ai/embeddings'

export const orchestrateProcedure = protectedProcedure
  .input(z.object({
    organizationId: z.string(),
    productId: z.string().optional()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await orchestrate(input)
    return { success: true, ...result }
  })

export const orchestrateMasterProcedure = protectedProcedure
  .input(z.object({
    organizationId: z.string()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await orchestrateMaster(input.organizationId)
    return { success: true, ...result }
  })

export const orchestrateProductProcedure = protectedProcedure
  .input(z.object({
    productId: z.string()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await orchestrateProduct(input.productId)
    return { success: true, ...result }
  })

export const saveMemoryProcedure = protectedProcedure
  .input(z.object({
    organizationId: z.string(),
    memoryType: z.enum(['business_dna', 'learning', 'prompt_template']),
    content: z.string(),
    metadata: z.record(z.string(), z.any()).optional(),
    importance: z.number().min(1).max(10).optional()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await saveMemory(
      input.organizationId,
      input.memoryType,
      input.content,
      input.metadata || {},
      input.importance || 5
    )
    return { success: true, memory: result }
  })

export const searchMemoryProcedure = protectedProcedure
  .input(z.object({
    organizationId: z.string(),
    query: z.string(),
    memoryType: z.string().optional(),
    limit: z.number().min(1).max(20).optional()
  }))
  .output(z.any())
  .handler(async ({ input }) => {
    const result = await searchMemory(
      input.organizationId,
      input.query,
      input.memoryType,
      input.limit || 5
    )
    return { success: true, memories: result }
  })

