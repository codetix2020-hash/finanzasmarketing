import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";

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

    // Máximo 4 posts por día (cada 6 horas)
    if (postsToday >= 4) {
      console.log("⏭️ Ya se generaron 4 posts hoy");
      return NextResponse.json({
        success: true,
        message: "Daily limit reached (4 posts)",
        postsToday
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

    return NextResponse.json({
      success: true,
      contentIds: {
        instagram: savedInstagram.id,
        tiktok: savedTikTok.id
      },
      tipo: contentType,
      instagram: parsedContent.instagram,
      tiktok: parsedContent.tiktok,
      message: "Contenido generado. Disponible en dashboard para copiar."
    });

  } catch (error: any) {
    console.error("❌ Error en cron:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
