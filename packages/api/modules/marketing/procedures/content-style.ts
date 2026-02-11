import { publicProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { prisma } from "@repo/database";

const contentStyleSchema = z.object({
  formalityLevel: z.number().min(1).max(5).optional(),
  humorLevel: z.number().min(1).max(5).optional(),
  emojiUsage: z.string().optional(),
  favoriteEmojis: z.array(z.string()).optional(),
  language: z.string().optional(),
  dialect: z.string().optional(),
  useLocalSlang: z.boolean().optional(),
  signaturePhrases: z.array(z.string()).optional(),
  bannedWords: z.array(z.string()).optional(),
  favoriteCTAs: z.array(z.string()).optional(),
  fixedHashtags: z.array(z.string()).optional(),
  alwaysMention: z.array(z.string()).optional(),
  preferredLength: z.string().optional(),
  useLineBreaks: z.boolean().optional(),
  useBulletPoints: z.boolean().optional(),
  preferredTimes: z.any().optional(),
});

export const contentStyleGet = publicProcedure
  .route({ method: "GET", path: "/marketing/content-style" })
  .input(z.object({ organizationId: z.string() }))
  .handler(async ({ input }) => {
    const style = await prisma.contentStyle.findUnique({
      where: { organizationId: input.organizationId },
    });
    return { success: true, data: style };
  });

export const contentStyleUpsert = publicProcedure
  .route({ method: "POST", path: "/marketing/content-style-upsert" })
  .input(z.object({
    organizationId: z.string(),
    data: contentStyleSchema,
  }))
  .handler(async ({ input }) => {
    const style = await prisma.contentStyle.upsert({
      where: { organizationId: input.organizationId },
      create: {
        organizationId: input.organizationId,
        ...input.data,
      },
      update: input.data,
    });
    return { success: true, data: style };
  });

