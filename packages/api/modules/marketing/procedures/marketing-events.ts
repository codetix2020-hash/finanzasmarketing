import { publicProcedure } from "../../../orpc/procedures";
import { z } from "zod";
import { prisma } from "@repo/database";

const marketingEventSchema = z.object({
  eventType: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  prize: z.string().optional(),
  rules: z.array(z.string()).optional(),
  winnersCount: z.number().optional(),
  discountType: z.string().optional(),
  discountValue: z.number().optional(),
  discountCode: z.string().optional(),
  productId: z.string().optional(),
  status: z.string().optional(),
  imageUrl: z.string().optional(),
});

export const marketingEventsList = publicProcedure
  .route({ method: "GET", path: "/marketing/events-list" })
  .input(z.object({
    organizationId: z.string(),
    eventType: z.string().optional(),
    status: z.string().optional(),
  }))
  .handler(async ({ input }) => {
    const events = await prisma.marketingEvent.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.eventType && { eventType: input.eventType }),
        ...(input.status && { status: input.status }),
      },
      orderBy: { startDate: "desc" },
    });
    return { success: true, data: events };
  });

export const marketingEventsGet = publicProcedure
  .route({ method: "GET", path: "/marketing/events-get" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const event = await prisma.marketingEvent.findUnique({
      where: { id: input.id },
    });
    return { success: true, data: event };
  });

export const marketingEventsCreate = publicProcedure
  .route({ method: "POST", path: "/marketing/events-create" })
  .input(z.object({
    organizationId: z.string(),
    data: marketingEventSchema,
  }))
  .handler(async ({ input }) => {
    const event = await prisma.marketingEvent.create({
      data: {
        organizationId: input.organizationId,
        ...input.data,
      },
    });
    return { success: true, data: event };
  });

export const marketingEventsUpdate = publicProcedure
  .route({ method: "POST", path: "/marketing/events-update" })
  .input(z.object({
    id: z.string(),
    data: marketingEventSchema.partial(),
  }))
  .handler(async ({ input }) => {
    const event = await prisma.marketingEvent.update({
      where: { id: input.id },
      data: input.data,
    });
    return { success: true, data: event };
  });

export const marketingEventsDelete = publicProcedure
  .route({ method: "POST", path: "/marketing/events-delete" })
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    await prisma.marketingEvent.delete({
      where: { id: input.id },
    });
    return { success: true };
  });

export const marketingEventsUpdateStatus = publicProcedure
  .route({ method: "POST", path: "/marketing/events-update-status" })
  .input(z.object({
    id: z.string(),
    status: z.string(),
  }))
  .handler(async ({ input }) => {
    const event = await prisma.marketingEvent.update({
      where: { id: input.id },
      data: { status: input.status },
    });
    return { success: true, data: event };
  });


