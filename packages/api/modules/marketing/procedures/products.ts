import { publicProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { prisma } from "@repo/database";

const productSchema = z.object({
  name: z.string(),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  price: z.number().optional(),
  priceRange: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  isBestseller: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isSeasonal: z.boolean().optional(),
  isLimitedEdition: z.boolean().optional(),
  isPromo: z.boolean().optional(),
  availability: z.string().optional(),
  seasonStart: z.string().optional(),
  seasonEnd: z.string().optional(),
  mainImageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  promotionHook: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const productsList = publicProcedure
  .route({ method: "GET", path: "/marketing/products-list" })
  .input(z.object({
    organizationId: z.string(),
    category: z.string().optional(),
    isActive: z.boolean().optional(),
  }))
  .handler(async ({ input }) => {
    const products = await prisma.product.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.category && { category: input.category }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
      orderBy: { displayOrder: "asc" },
    });
    return { success: true, data: products };
  });

export const productsGet = publicProcedure
  .route({ method: "GET", path: "/marketing/products-get" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const product = await prisma.product.findUnique({
      where: { id: input.id },
    });
    return { success: true, data: product };
  });

export const productsCreate = publicProcedure
  .route({ method: "POST", path: "/marketing/products-create" })
  .input(z.object({
    organizationId: z.string(),
    data: productSchema,
  }))
  .handler(async ({ input }) => {
    const product = await prisma.product.create({
      data: {
        organizationId: input.organizationId,
        ...input.data,
      },
    });
    return { success: true, data: product };
  });

export const productsUpdate = publicProcedure
  .route({ method: "POST", path: "/marketing/products-update" })
  .input(z.object({
    id: z.string(),
    data: productSchema.partial(),
  }))
  .handler(async ({ input }) => {
    const product = await prisma.product.update({
      where: { id: input.id },
      data: input.data,
    });
    return { success: true, data: product };
  });

export const productsDelete = publicProcedure
  .route({ method: "POST", path: "/marketing/products-delete" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    await prisma.product.delete({
      where: { id: input.id },
    });
    return { success: true };
  });

export const productsReorder = publicProcedure
  .route({ method: "POST", path: "/marketing/products-reorder" })
  .input(z.object({
    items: z.array(z.object({
      id: z.string(),
      displayOrder: z.number(),
    })),
  }))
  .handler(async ({ input }) => {
    await Promise.all(
      input.items.map((item) =>
        prisma.product.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        })
      )
    );
    return { success: true };
  });

