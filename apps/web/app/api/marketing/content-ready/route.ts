import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

const ORGANIZATION_ID = "b0a57f66-6cae-4f6f-8e8d-c8dfd5d9b08d";

export async function GET(request: NextRequest) {
  try {
    console.log("📋 Obteniendo contenido listo para publicar...");
    console.log("  Organization ID:", ORGANIZATION_ID);

    // Obtener contenido listo para publicar Y publicado
    // Incluir tanto READY como PUBLISHED para mostrar todo el contenido
    // Intentar con include, pero manejar si la relación no existe
    let content;
    try {
      content = await prisma.marketingContent.findMany({
        where: {
          organizationId: ORGANIZATION_ID,
          type: "SOCIAL",
          status: {
            in: ["READY", "PUBLISHED"]
          }
        },
        orderBy: { createdAt: "desc" },
        take: 50, // Aumentado para mostrar más contenido
        include: {
          product: {
            select: { name: true }
          }
        }
      });
    } catch (includeError: any) {
      console.warn("⚠️ Error con include de product, intentando sin include:", includeError.message);
      // Si falla el include, intentar sin la relación
      content = await prisma.marketingContent.findMany({
        where: {
          organizationId: ORGANIZATION_ID,
          type: "SOCIAL",
          status: {
            in: ["READY", "PUBLISHED"]
          }
        },
        orderBy: { createdAt: "desc" },
        take: 50 // Aumentado para mostrar más contenido
      });
    }

    console.log(`✅ Contenido encontrado: ${content.length} items`);
    
    // Log de distribución por status
    const statusCounts = content.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`📊 Distribución por status:`, statusCounts);

    // Formatear para fácil copia con manejo seguro de errores
    const formattedContent = content.map(item => {
      try {
        const metadata = (item.metadata as any) || {};
        const productName = (item as any).product?.name || "ReservasPro";
        
        // Manejar metadata de forma segura
        const instagramContent = metadata?.instagram?.content || "";
        const instagramHashtags = Array.isArray(metadata?.instagram?.hashtags) 
          ? metadata.instagram.hashtags.join(" ") 
          : "";
        const instagramTextoCompleto = instagramContent 
          ? `${instagramContent}\n\n${instagramHashtags}`.trim()
          : "";

        const tiktokContent = metadata?.tiktok?.content || "";
        const tiktokHashtags = Array.isArray(metadata?.tiktok?.hashtags) 
          ? metadata.tiktok.hashtags.join(" ") 
          : "";
        const tiktokTextoCompleto = tiktokContent 
          ? `${tiktokContent}\n\n${tiktokHashtags}`.trim()
          : "";

        return {
          id: item.id,
          producto: productName,
          tipo: metadata?.tipo || "general",
          fecha: item.createdAt,
          instagram: {
            texto: instagramContent,
            hashtags: instagramHashtags,
            textoCompleto: instagramTextoCompleto
          },
          tiktok: {
            texto: tiktokContent,
            hashtags: tiktokHashtags,
            textoCompleto: tiktokTextoCompleto
          },
          hook: metadata?.hook || "",
          estado: item.status
        };
      } catch (formatError: any) {
        console.error(`⚠️ Error formateando item ${item.id}:`, formatError.message);
        // Devolver objeto mínimo si hay error
        return {
          id: item.id,
          producto: "ReservasPro",
          tipo: "general",
          fecha: item.createdAt,
          instagram: {
            texto: "",
            hashtags: "",
            textoCompleto: ""
          },
          tiktok: {
            texto: "",
            hashtags: "",
            textoCompleto: ""
          },
          hook: "",
          estado: item.status
        };
      }
    });

    console.log(`✅ Contenido formateado: ${formattedContent.length} items`);

    return NextResponse.json({
      success: true,
      total: formattedContent.length,
      content: formattedContent
    });
  } catch (error: any) {
    console.error("❌ Error en GET /api/marketing/content-ready:", error);
    console.error("  Error message:", error.message);
    console.error("  Error stack:", error.stack);
    
    // Devolver respuesta segura incluso si hay error
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Error desconocido",
        content: [],
        total: 0
      },
      { status: 500 }
    );
  }
}

// Marcar como publicado
export async function POST(request: NextRequest) {
  try {
    console.log("📝 Marcando contenido como publicado...");
    
    const body = await request.json();
    const { contentId, platform } = body;

    console.log("  Content ID:", contentId);
    console.log("  Platform:", platform);

    if (!contentId) {
      return NextResponse.json(
        { success: false, error: "contentId es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el contenido existe
    const existing = await prisma.marketingContent.findUnique({ 
      where: { id: contentId } 
    });

    if (!existing) {
      console.error(`❌ Contenido no encontrado: ${contentId}`);
      return NextResponse.json(
        { success: false, error: "Contenido no encontrado" },
        { status: 404 }
      );
    }

    // Obtener metadata existente de forma segura
    let existingMetadata: any = {};
    try {
      existingMetadata = (existing.metadata as any) || {};
    } catch (metaError) {
      console.warn("⚠️ Error parseando metadata existente, usando objeto vacío");
    }

    // Actualizar estado
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

    console.log(`✅ Contenido ${contentId} marcado como publicado en ${platform}`);

    return NextResponse.json({ 
      success: true, 
      message: `Marcado como publicado en ${platform}` 
    });
  } catch (error: any) {
    console.error("❌ Error en POST /api/marketing/content-ready:", error);
    console.error("  Error message:", error.message);
    console.error("  Error stack:", error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Error desconocido al marcar como publicado"
      },
      { status: 500 }
    );
  }
}

