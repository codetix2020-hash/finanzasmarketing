import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

export const dynamic = 'force-dynamic';

const ORGANIZATION_ID = "8uu4-W6mScG8IQtY";

export async function GET(request: NextRequest) {
  try {
    // Obtener contenido listo para publicar
    const content = await prisma.marketingContent.findMany({
      where: {
        organizationId: ORGANIZATION_ID,
        type: "SOCIAL",
        status: "READY"
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        product: {
          select: { name: true }
        }
      }
    });

    // Formatear para fácil copia
    const formattedContent = content.map(item => {
      const metadata = item.metadata as any;
      return {
        id: item.id,
        producto: item.product?.name || "ReservasPro",
        tipo: metadata?.tipo || "general",
        fecha: item.createdAt,
        instagram: {
          texto: metadata?.instagram?.content || "",
          hashtags: metadata?.instagram?.hashtags?.join(" ") || "",
          textoCompleto: `${metadata?.instagram?.content || ""}\n\n${metadata?.instagram?.hashtags?.join(" ") || ""}`
        },
        tiktok: {
          texto: metadata?.tiktok?.content || "",
          hashtags: metadata?.tiktok?.hashtags?.join(" ") || "",
          textoCompleto: `${metadata?.tiktok?.content || ""}\n\n${metadata?.tiktok?.hashtags?.join(" ") || ""}`
        },
        hook: metadata?.hook || "",
        estado: item.status
      };
    });

    return NextResponse.json({
      success: true,
      total: formattedContent.length,
      content: formattedContent
    });
  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Marcar como publicado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, platform } = body;

    const existing = await prisma.marketingContent.findUnique({ where: { id: contentId } });
    const existingMetadata = (existing?.metadata as any) || {};

    await prisma.marketingContent.update({
      where: { id: contentId },
      data: {
        status: "PUBLISHED",
        metadata: {
          ...existingMetadata,
          publishedAt: new Date().toISOString(),
          publishedOn: platform
        }
      }
    });

    return NextResponse.json({ success: true, message: "Marcado como publicado" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

