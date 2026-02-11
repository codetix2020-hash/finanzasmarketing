import { publicProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { prisma } from "@repo/database";

const businessIdentitySchema = z.object({
  businessName: z.string().optional(),
  slogan: z.string().optional(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  uniqueValue: z.string().optional(),
  competitorDiff: z.string().optional(),
  brandPersonality: z.string().optional(),
  brandValues: z.array(z.string()).optional(),
  foundingYear: z.number().optional(),
  foundingStory: z.string().optional(),
  ownerName: z.string().optional(),
  ownerStory: z.string().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  fullAddress: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  schedule: z.any().optional(),
  industry: z.string().optional(),
  subIndustry: z.string().optional(),
});

export const businessIdentityGet = publicProcedure
  .route({ method: "GET", path: "/marketing/business-identity" })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input }) => {
    const identity = await prisma.businessIdentity.findUnique({
      where: { organizationId: input.organizationId },
    });
    return { success: true, data: identity };
  });

export const businessIdentityUpsert = publicProcedure
  .route({ method: "POST", path: "/marketing/business-identity-upsert" })
  .input(z.object({
    organizationId: z.string(),
    data: businessIdentitySchema,
  }))
  .handler(async ({ input }) => {
    const identity = await prisma.businessIdentity.upsert({
      where: { organizationId: input.organizationId },
      create: {
        organizationId: input.organizationId,
        ...input.data,
      },
      update: input.data,
    });
    return { success: true, data: identity };
  });

