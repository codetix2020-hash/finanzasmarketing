import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";
import { publishToSocial } from "@repo/api/modules/marketing/services/publer-service";

// Configuración
const ORGANIZATION_ID = "b0a57f66-6cae-4f6f-8e8d-c8dfd5d9b08d";

// Tipos de contenido que rota
const CONTENT_TYPES = [
  "educativo",
  "problema_solucion", 
  "testimonio",
  "oferta",
  "carrusel_hook",
  "urgencia"
];

// Información de ReservasPro
const RESERVAS_PRO = {
  name: "ReservasPro",
  description: "Sistema de reservas premium para barberías con gamificación. Clientes ganan XP por cada corte, suben de nivel (Bronce→Plata→Oro→Platino→VIP) y desbloquean recompensas.",
  targetAudience: "Dueños de barberías modernas en España, 1-5 barberos, clientela joven 18-40",
  usp: "Sistema XP único que convierte clientes en fans. Lo que Booksy NO tiene.",
  pricing: {
    oferta: "30 días GRATIS sin tarjeta",
    primeros10: "€19,99/mes DE POR VIDA (50% descuento)",
    normal: "€39,99/mes"
  },
  oferta: {
    vigente: true,
    mensaje: "🔥 OFERTA DE LANZAMIENTO: 30 días GRATIS + Primeras 10 barberías: 50% de por vida",
    urgencia: "Solo quedan X plazas de las 10"
  }
};

// Hashtags
const HASHTAGS = {
  principales: ["#barberia", "#barbershop", "#reservasonline", "#barberiamoderna"],
  oferta: ["#oferta", "#lanzamiento", "#gratis", "#descuento"],
  engagement: ["#barberoespañol", "#cortedepelo", "#barberlife", "#emprendedor"]
};

export async function GET(request: NextRequest) {
  console.log("⏰ CRON: Generando contenido para redes sociales...");
  
  try {
    // Verificar autorización
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      console.log("❌ No autorizado");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener producto ReservasPro (debe existir en la base de datos)
    const product = await prisma.saasProduct.findFirst({
      where: {
        organizationId: ORGANIZATION_ID,
        name: "ReservasPro"
      }
    });

    // Si no existe, devolver error (el producto debe crearse manualmente o mediante otro proceso)
    if (!product) {
      console.error("❌ Producto ReservasPro no encontrado en la base de datos");
      return NextResponse.json(
        {
          success: false,
          error: "Producto ReservasPro no encontrado. El producto debe existir en la base de datos antes de generar contenido.",
          organizationId: ORGANIZATION_ID
        },
        { status: 404 }
      );
    }

    // Verificar que el producto tenga marketing habilitado
    if (!product.marketingEnabled) {
      console.warn("⚠️ Marketing no está habilitado para este producto");
    }

    // Verificar cuántos posts se han generado hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const postsToday = await prisma.marketingContent.count({
      where: {
        productId: product.id,
        type: "SOCIAL",
        createdAt: { gte: today }
      }
    });

    // Límite diario (aumentado para testing - puede ajustarse)
    const DAILY_LIMIT = parseInt(process.env.DAILY_POST_LIMIT || "20", 10);
    console.log(`📊 Posts hoy: ${postsToday}/${DAILY_LIMIT}`);
    
    if (postsToday >= DAILY_LIMIT) {
      console.log(`⏭️ Límite diario alcanzado: ${postsToday}/${DAILY_LIMIT} posts`);
      return NextResponse.json({
        success: true,
        message: `Daily limit reached (${DAILY_LIMIT} posts)`,
        postsToday,
        limit: DAILY_LIMIT
      });
    }

    // Seleccionar tipo de contenido (rota entre los tipos)
    const contentType = CONTENT_TYPES[postsToday % CONTENT_TYPES.length];
    console.log(`📝 Generando contenido tipo: ${contentType}`);

    // Generar contenido con Claude
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = `Genera UN post para Instagram/TikTok para una barbería.

PRODUCTO: ${RESERVAS_PRO.name}

DESCRIPCIÓN: ${RESERVAS_PRO.description}

AUDIENCIA: ${RESERVAS_PRO.targetAudience}

USP: ${RESERVAS_PRO.usp}

🔥 OFERTA ACTUAL (INCLUIRLA SIEMPRE):
- 30 días GRATIS sin tarjeta
- Primeras 10 barberías: €19,99/mes DE POR VIDA (50% descuento)
- Después: €39,99/mes
- Setup profesional GRATIS
- Página lista en 24 horas

TIPO DE POST: ${contentType}

${contentType === "educativo" ? "Enseña algo útil sobre gestión de barberías o reservas" : ""}
${contentType === "problema_solucion" ? "Presenta un problema común (WhatsApp, no-shows, tiempo perdido) y la solución" : ""}
${contentType === "testimonio" ? "Crea un testimonio ficticio pero realista de un barbero que usa el sistema" : ""}
${contentType === "oferta" ? "Enfócate 100% en la oferta de lanzamiento con urgencia" : ""}
${contentType === "carrusel_hook" ? "Hook intrigante que haga querer ver más" : ""}
${contentType === "urgencia" ? "Crea urgencia: plazas limitadas, oferta por tiempo limitado" : ""}

REGLAS CRÍTICAS:
- MÁXIMO 200 caracteres (sin hashtags)
- Empezar con hook potente (pregunta, dato, POV)
- Emojis estratégicos (3-5 máximo)
- Español de España, cercano pero profesional
- CTA claro: "DM QUIERO" o "Link en bio"
- SIEMPRE mencionar la oferta o el precio

FORMATO DE RESPUESTA (JSON):

{
  "instagram": {
    "content": "texto del post para Instagram",
    "hashtags": ["hashtag1", "hashtag2", ...]
  },
  "tiktok": {
    "content": "texto más corto para TikTok (máx 150 chars)",
    "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
  },
  "hook": "el hook usado",
  "tipo": "${contentType}"
}

Responde SOLO con el JSON.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }]
    });

    const responseText = response.content[0].type === "text" ? response.content[0].text : "";
    
    // Parsear respuesta
    let parsedContent;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("❌ Error parseando respuesta:", e);
      parsedContent = {
        instagram: { content: responseText, hashtags: HASHTAGS.principales },
        tiktok: { content: responseText.substring(0, 150), hashtags: HASHTAGS.principales.slice(0, 3) },
        hook: "default",
        tipo: contentType
      };
    }

    // Guardar en base de datos (dos registros: Instagram y TikTok)
    const savedInstagram = await prisma.marketingContent.create({
      data: {
        type: "SOCIAL",
        platform: "instagram",
        title: `Post ${contentType} - ${new Date().toLocaleDateString("es-ES")}`,
        content: JSON.stringify(parsedContent.instagram),
        status: "READY",
        productId: product.id,
        organizationId: ORGANIZATION_ID,
        metadata: {
          tipo: contentType,
          hook: parsedContent.hook,
          instagram: parsedContent.instagram,
          tiktok: parsedContent.tiktok,
          generatedAt: new Date().toISOString(),
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens
        }
      }
    });

    const savedTikTok = await prisma.marketingContent.create({
      data: {
        type: "SOCIAL",
        platform: "tiktok",
        title: `Post ${contentType} - ${new Date().toLocaleDateString("es-ES")}`,
        content: JSON.stringify(parsedContent.tiktok),
        status: "READY",
        productId: product.id,
        organizationId: ORGANIZATION_ID,
        metadata: {
          tipo: contentType,
          hook: parsedContent.hook,
          instagram: parsedContent.instagram,
          tiktok: parsedContent.tiktok,
          generatedAt: new Date().toISOString(),
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens
        }
      }
    });

    console.log("✅ Contenido generado y guardado:", savedInstagram.id, savedTikTok.id);

    // Publicar automáticamente en Postiz (MOCK o real según POSTIZ_USE_MOCK)
    console.log("\n📤 Publicando contenido automáticamente en Postiz...");
    
    // Helper para leer POSTIZ_USE_MOCK de forma robusta
    const useMockRaw = process.env.POSTIZ_USE_MOCK;
    const useMock = useMockRaw === "true" || useMockRaw === "TRUE" || useMockRaw === "True" || useMockRaw === "1";
    
    console.log(`  🔑 POSTIZ_USE_MOCK env: "${useMockRaw}" (type: ${typeof useMockRaw})`);
    console.log(`  🔄 Modo: ${useMock ? "MOCK ✅" : "REAL ⚠️"}`);
    console.log(`  📦 publishToSocial importado: ${typeof publishToSocial}`);
    
    if (!useMock) {
      console.warn("  ⚠️ ADVERTENCIA: POSTIZ_USE_MOCK no está en 'true', se usará Postiz REAL");
      console.warn("  ⚠️ Si no hay integraciones conectadas, dará error 401");
      console.warn("  💡 Para usar MOCK, configura POSTIZ_USE_MOCK=true en Railway");
    }

    const publishResults: Array<{
      contentId: string;
      platform: string;
      success: boolean;
      postId?: string;
      error?: string;
    }> = [];

    // Publicar Instagram
    try {
      console.log("  📱 Iniciando publicación automática de Instagram...");
      const instagramText = `${parsedContent.instagram.content}\n\n${Array.isArray(parsedContent.instagram.hashtags) ? parsedContent.instagram.hashtags.join(" ") : parsedContent.instagram.hashtags || ""}`.trim();
      console.log("  📝 Texto Instagram (primeros 100 chars):", instagramText.substring(0, 100));
      
      const instagramResults = await publishToSocial({
        content: instagramText,
        platforms: ["instagram"]
      });

      console.log("  📊 Resultados de publishToSocial:", JSON.stringify(instagramResults, null, 2));
      
      const instagramResult = instagramResults.find(r => r.platform.toLowerCase().includes("instagram")) || instagramResults[0];
      
      console.log("  🎯 Resultado seleccionado para Instagram:", JSON.stringify(instagramResult, null, 2));
      
      if (instagramResult?.success && instagramResult.postId) {
        const existingMetadata = (savedInstagram.metadata as any) || {};
        await prisma.marketingContent.update({
          where: { id: savedInstagram.id },
          data: {
            status: "PUBLISHED",
            metadata: {
              ...existingMetadata,
              postizPostId: instagramResult.postId,
              publishedAt: new Date().toISOString(),
              publishedOn: "instagram"
            }
          }
        });
        console.log(`✅ Instagram publicado automáticamente: ${instagramResult.postId}`);
        publishResults.push({
          contentId: savedInstagram.id,
          platform: "instagram",
          success: true,
          postId: instagramResult.postId
        });
      } else {
        console.warn(`⚠️ Instagram no se pudo publicar: ${instagramResult?.error || "Unknown error"}`);
        publishResults.push({
          contentId: savedInstagram.id,
          platform: "instagram",
          success: false,
          error: instagramResult?.error || "Unknown error"
        });
      }
    } catch (error: any) {
      console.error(`❌ Error publicando Instagram: ${error.message}`);
      publishResults.push({
        contentId: savedInstagram.id,
        platform: "instagram",
        success: false,
        error: error.message
      });
    }

    // Publicar TikTok
    try {
      console.log("  📱 Iniciando publicación automática de TikTok...");
      const tiktokText = `${parsedContent.tiktok.content}\n\n${Array.isArray(parsedContent.tiktok.hashtags) ? parsedContent.tiktok.hashtags.join(" ") : parsedContent.tiktok.hashtags || ""}`.trim();
      console.log("  📝 Texto TikTok (primeros 100 chars):", tiktokText.substring(0, 100));
      
      const tiktokResults = await publishToSocial({
        content: tiktokText,
        platforms: ["tiktok"]
      });

      console.log("  📊 Resultados de publishToSocial:", JSON.stringify(tiktokResults, null, 2));
      
      const tiktokResult = tiktokResults.find(r => r.platform.toLowerCase().includes("tiktok")) || tiktokResults[0];
      
      console.log("  🎯 Resultado seleccionado para TikTok:", JSON.stringify(tiktokResult, null, 2));
      
      if (tiktokResult?.success && tiktokResult.postId) {
        const existingMetadata = (savedTikTok.metadata as any) || {};
        await prisma.marketingContent.update({
          where: { id: savedTikTok.id },
          data: {
            status: "PUBLISHED",
            metadata: {
              ...existingMetadata,
              postizPostId: tiktokResult.postId,
              publishedAt: new Date().toISOString(),
              publishedOn: "tiktok"
            }
          }
        });
        console.log(`✅ TikTok publicado automáticamente: ${tiktokResult.postId}`);
        publishResults.push({
          contentId: savedTikTok.id,
          platform: "tiktok",
          success: true,
          postId: tiktokResult.postId
        });
      } else {
        console.warn(`⚠️ TikTok no se pudo publicar: ${tiktokResult?.error || "Unknown error"}`);
        publishResults.push({
          contentId: savedTikTok.id,
          platform: "tiktok",
          success: false,
          error: tiktokResult?.error || "Unknown error"
        });
      }
    } catch (error: any) {
      console.error(`❌ Error publicando TikTok: ${error.message}`);
      publishResults.push({
        contentId: savedTikTok.id,
        platform: "tiktok",
        success: false,
        error: error.message
      });
    }

    const successfulPublishes = publishResults.filter(r => r.success).length;
    const failedPublishes = publishResults.filter(r => !r.success).length;

    console.log(`\n📊 Resumen de publicación:`);
    console.log(`   ✅ Exitosos: ${successfulPublishes}`);
    console.log(`   ❌ Fallidos: ${failedPublishes}`);

    return NextResponse.json({
      success: true,
      contentIds: {
        instagram: savedInstagram.id,
        tiktok: savedTikTok.id
      },
      tipo: contentType,
      instagram: parsedContent.instagram,
      tiktok: parsedContent.tiktok,
      published: publishResults,
      publishedCount: successfulPublishes,
      failedCount: failedPublishes,
      message: successfulPublishes > 0 
        ? `Contenido generado y publicado automáticamente en ${successfulPublishes} plataforma(s).`
        : "Contenido generado. La publicación automática falló, disponible para publicación manual."
    });

  } catch (error: any) {
    console.error("❌ Error en cron:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
