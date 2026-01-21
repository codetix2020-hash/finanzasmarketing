import { z } from "zod";

/**
 * Validadores para campañas de marketing
 */

export const createCampaignSchema = z.object({
  platform: z.enum(["google", "facebook"]),
  productId: z.string().min(1),
  name: z.string().min(3).max(100),
  objective: z.enum(["CONVERSIONS", "TRAFFIC", "AWARENESS", "ENGAGEMENT", "LEADS"]),
  dailyBudget: z.number().min(1).max(10000),
  targeting: z.object({
    locations: z.array(z.string()).optional(),
    ageMin: z.number().min(18).max(65).optional(),
    ageMax: z.number().min(18).max(65).optional(),
    genders: z.array(z.enum(["male", "female", "all"])).optional(),
    interests: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  keywords: z.array(z.string()).optional(),
  creatives: z.array(z.object({
    headline: z.string().min(3).max(100),
    primaryText: z.string().min(10).max(500),
    description: z.string().max(150).optional(),
    callToAction: z.string().optional(),
    imageUrl: z.string().url().optional(),
    link: z.string().url().optional(),
  })).optional(),
});

export const syncMetricsSchema = z.object({
  campaignId: z.string().min(1),
});

export const generateContentSchema = z.object({
  productId: z.string().min(1),
  platform: z.enum(["instagram", "tiktok", "facebook", "twitter"]),
  contentType: z.enum([
    "educativo",
    "problema_solucion",
    "testimonio",
    "oferta",
    "carrusel_hook",
    "urgencia",
  ]).optional(),
  count: z.number().min(1).max(10).optional(),
});

export const attributionEventSchema = z.object({
  userId: z.string().optional(),
  visitorId: z.string().min(1),
  sessionId: z.string().optional(),
  organizationId: z.string().min(1),
  eventType: z.enum(["page_view", "click", "signup", "trial_start", "purchase"]),
  eventValue: z.number().min(0).optional(),
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Helper para validar datos
 */
export function validateCampaign(data: unknown) {
  return createCampaignSchema.parse(data);
}

export function validateSyncMetrics(data: unknown) {
  return syncMetricsSchema.parse(data);
}

export function validateGenerateContent(data: unknown) {
  return generateContentSchema.parse(data);
}

export function validateAttributionEvent(data: unknown) {
  return attributionEventSchema.parse(data);
}




