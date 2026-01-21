import { z } from "zod";
import { authedProcedure, createTRPCRouter } from "../../../../server";
import { attributionTracker } from "../services/attribution-tracker";

/**
 * Attribution Tracking API Procedures
 */
export const attributionRouter = createTRPCRouter({
  /**
   * Track an attribution event
   */
  trackEvent: authedProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        visitorId: z.string(),
        sessionId: z.string().optional(),
        eventType: z.enum([
          "page_view",
          "ad_click",
          "signup",
          "trial_start",
          "purchase",
          "cta_click",
        ]),
        eventValue: z.number().optional(),
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        utmContent: z.string().optional(),
        utmTerm: z.string().optional(),
        metadata: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const eventId = await attributionTracker.trackEvent({
        ...input,
        organizationId: ctx.organization.id,
      });

      return {
        success: true,
        eventId,
      };
    }),

  /**
   * Get customer journey for a user
   */
  getJourney: authedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const [journey, events] = await Promise.all([
        prisma.customerJourney.findUnique({
          where: { userId: input.userId },
        }),
        prisma.attributionEvent.findMany({
          where: { userId: input.userId },
          orderBy: { createdAt: "asc" },
          take: 100,
        }),
      ]);

      return {
        journey,
        events,
        touchpointsCount: events.length,
      };
    }),

  /**
   * Get ROI for a campaign
   */
  getROI: authedProcedure
    .input(
      z.object({
        campaignId: z.string(),
        timeRange: z
          .object({
            start: z.date(),
            end: z.date(),
          })
          .optional(),
      })
    )
    .query(async ({ input }) => {
      const roi = await attributionTracker.getROI(input.campaignId, input.timeRange);
      return roi;
    }),

  /**
   * Get attribution report for organization
   */
  getReport: authedProcedure
    .input(
      z.object({
        timeRange: z
          .object({
            start: z.date(),
            end: z.date(),
          })
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const report = await attributionTracker.getAttributionReport(
        ctx.organization.id,
        input.timeRange
      );

      return report;
    }),

  /**
   * Get campaign performance
   */
  getCampaignPerformance: authedProcedure
    .input(
      z.object({
        timeRange: z
          .object({
            start: z.date(),
            end: z.date(),
          })
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const performance = await attributionTracker.getCampaignPerformance(
        ctx.organization.id,
        input.timeRange
      );

      return {
        campaigns: performance,
        totalCampaigns: performance.length,
        totalRevenue: performance.reduce((sum, c) => sum + c.totalRevenue, 0),
        totalSpend: performance.reduce((sum, c) => sum + c.totalSpend, 0),
      };
    }),

  /**
   * Calculate attribution for a conversion
   */
  calculateAttribution: authedProcedure
    .input(
      z.object({
        userId: z.string(),
        conversionValue: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const attribution = await attributionTracker.calculateAttribution(
        input.userId,
        input.conversionValue
      );

      return attribution;
    }),
});

// Import statement for prisma
import { prisma } from "@repo/database";





