import { publicProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { prisma } from "@repo/database";

const targetAudienceSchema = z.object({
  ageRangeMin: z.number().optional(),
  ageRangeMax: z.number().optional(),
  gender: z.string().optional(),
  targetLocations: z.array(z.string()).optional(),
  idealCustomer: z.string().optional(),
  customerPains: z.array(z.string()).optional(),
  customerDesires: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  buyingFrequency: z.string().optional(),
  averageTicket: z.number().optional(),
});

export const targetAudienceGet = publicProcedure
  .route({ method: "GET", path: "/marketing/target-audience" })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input }) => {
    const audience = await prisma.targetAudience.findUnique({
      where: { organizationId: input.organizationId },
    });
    return { success: true, data: audience };
  });

export const targetAudienceUpsert = publicProcedure
  .route({ method: "POST", path: "/marketing/target-audience-upsert" })
  .input(z.object({
    organizationId: z.string(),
    data: targetAudienceSchema,
  }))
  .handler(async ({ input }) => {
    const audience = await prisma.targetAudience.upsert({
      where: { organizationId: input.organizationId },
      create: {
        organizationId: input.organizationId,
        ...input.data,
      },
      update: input.data,
    });
    return { success: true, data: audience };
  });


