import { NextRequest, NextResponse } from "next/server";
import { d2cContentGenerator } from "@repo/api/modules/marketing/services/content-generator";
import { prisma } from "@repo/database";
import { StripeService } from "@repo/api/modules/billing/stripe-service";
import { getAuthContext } from "@repo/api/lib/auth-guard";
import { checkRateLimit } from "@repo/api/lib/rate-limiter";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, contentType, platform, productId, eventId, customPrompt } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

    const authCtx = await getAuthContext(organizationId);
    if (!authCtx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: max 10 generations per org per minute
    const rl = checkRateLimit(`generate:${authCtx.organizationId}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before generating more content.", retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    const { allowed, used, limit } = await StripeService.canCreatePost(authCtx.organizationId);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "Límite de posts alcanzado",
          code: "LIMIT_EXCEEDED",
          usage: { used, limit },
        },
        { status: 402 }
      );
    }

    // Cargar todo el contexto del negocio en paralelo
    const [identity, audience, style, products, events] = await Promise.all([
      prisma.businessIdentity.findUnique({ where: { organizationId } }),
      prisma.targetAudience.findUnique({ where: { organizationId } }),
      prisma.contentStyle.findUnique({ where: { organizationId } }),
      prisma.product.findMany({ where: { organizationId, isActive: true }, take: 20 }),
      prisma.marketingEvent.findMany({ where: { organizationId, status: "active" } }),
    ]);

    // Construir contexto
    const context = {
      identity: identity || {},
      audience: audience || {},
      style: style || {},
      products: products.map((p) => ({
        name: p.name,
        shortDescription: p.shortDescription,
        price: p.price,
        features: p.features,
        isBestseller: p.isBestseller,
        isNew: p.isNew,
        promotionHook: p.promotionHook,
      })),
      activeEvents: events.map((e) => ({
        eventType: e.eventType,
        title: e.title,
        prize: e.prize,
        discountValue: e.discountValue,
        discountCode: e.discountCode,
        endDate: e.endDate?.toISOString(),
      })),
    };

    // Generar contenido con IA
    const result = await d2cContentGenerator.generateContent(context as any, {
      contentType,
      platform,
      productId,
      eventId,
      customPrompt,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}


