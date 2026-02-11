import { NextRequest, NextResponse } from "next/server";
import { contentGenerator } from "@repo/api/modules/marketing/services/content-generator";
import { prisma } from "@repo/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, contentType, platform, productId, eventId, customPrompt } = body;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId required" }, { status: 400 });
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
    const result = await contentGenerator.generateContent(context as any, {
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

