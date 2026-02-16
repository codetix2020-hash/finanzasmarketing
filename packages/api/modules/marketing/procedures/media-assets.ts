import { publicProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { prisma } from "@repo/database";

const mediaAssetSchema = z.object({
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  category: z.string(),
  subcategory: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  altText: z.string().optional(),
  tags: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  takenAt: z.string().transform((s) => new Date(s)).optional(),
  location: z.string().optional(),
  isFavorite: z.boolean().optional(),
  isApproved: z.boolean().optional(),
});

export const mediaAssetsList = publicProcedure
  .route({ method: "GET", path: "/marketing/media-assets-list" })
  .input(z.object({
    organizationId: z.string(),
    category: z.string().optional(),
    isFavorite: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  }))
  .handler(async ({ input }) => {
    const assets = await prisma.mediaAsset.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.category && { category: input.category }),
        ...(input.isFavorite !== undefined && { isFavorite: input.isFavorite }),
        ...(input.tags && input.tags.length > 0 && { tags: { hasSome: input.tags } }),
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: assets };
  });

export const mediaAssetsGet = publicProcedure
  .route({ method: "GET", path: "/marketing/media-assets-get" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: input.id },
    });
    return { success: true, data: asset };
  });

export const mediaAssetsCreate = publicProcedure
  .route({ method: "POST", path: "/marketing/media-assets-create" })
  .input(z.object({
    organizationId: z.string(),
    data: mediaAssetSchema,
  }))
  .handler(async ({ input }) => {
    const asset = await prisma.mediaAsset.create({
      data: {
        organizationId: input.organizationId,
        ...input.data,
      },
    });
    return { success: true, data: asset };
  });

export const mediaAssetsUpdate = publicProcedure
  .route({ method: "POST", path: "/marketing/media-assets-update" })
  .input(z.object({
    id: z.string(),
    data: mediaAssetSchema.partial(),
  }))
  .handler(async ({ input }) => {
    const asset = await prisma.mediaAsset.update({
      where: { id: input.id },
      data: input.data,
    });
    return { success: true, data: asset };
  });

export const mediaAssetsDelete = publicProcedure
  .route({ method: "POST", path: "/marketing/media-assets-delete" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    await prisma.mediaAsset.delete({
      where: { id: input.id },
    });
    return { success: true };
  });

export const mediaAssetsToggleFavorite = publicProcedure
  .route({ method: "POST", path: "/marketing/media-assets-toggle-favorite" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const asset = await prisma.mediaAsset.findUnique({
      where: { id: input.id },
    });
    const updated = await prisma.mediaAsset.update({
      where: { id: input.id },
      data: { isFavorite: !asset?.isFavorite },
    });
    return { success: true, data: updated };
  });

export const mediaAssetsIncrementUsage = publicProcedure
  .route({ method: "POST", path: "/marketing/media-assets-increment-usage" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const asset = await prisma.mediaAsset.update({
      where: { id: input.id },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
    return { success: true, data: asset };
  });

export const mediaAssetsBulkCreate = publicProcedure
  .route({ method: "POST", path: "/marketing/media-assets-bulk-create" })
  .input(z.object({
    organizationId: z.string(),
    assets: z.array(mediaAssetSchema),
  }))
  .handler(async ({ input }) => {
    const result = await prisma.mediaAsset.createMany({
      data: input.assets.map((asset) => ({
        organizationId: input.organizationId,
        ...asset,
      })),
    });
    return { success: true, count: result.count };
  });


