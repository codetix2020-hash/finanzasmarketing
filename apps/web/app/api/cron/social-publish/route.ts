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

// Hashtags genéricos (se pueden personalizar por producto)
const DEFAULT_HASHTAGS = {
  principales: ["#saas", "#startup", "#tech", "#emprendedor"],
  oferta: ["#oferta", "#lanzamiento", "#gratis", "#descuento"],
  engagement: ["#marketing", "#negocio", "#innovacion", "#digital"]
};

/**
 * Procesa un producto individual: genera y publica contenido
 */
async function processProduct(product: any, client: Anthropic) {
  console.log(`\n📦 Procesando producto: ${product.name} (${product.id})`);
  
  // Verificar que el producto tenga marketing habilitado
  if (!product.marketingEnabled) {
    console.warn(`⚠️ Marketing no está habilitado para ${product.name}, saltando...`);
    return {
      success: false,
      productId: product.id,
      productName: product.name,
      error: "Marketing no habilitado"
    };
  }

  // Verificar cuántos posts se han generado hoy para este producto
  const now = new Date();
  const todayStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ));
  const todayEnd = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  
  const postsToday = await prisma.marketingContent.count({
    where: {
      productId: product.id,
      type: "SOCIAL",
      createdAt: { 
        gte: todayStart,
        lt: todayEnd
      }
    }
  });
  
  console.log(`  📊 Posts hoy para ${product.name}: ${postsToday}`);

  // Límite diario por producto
  const DAILY_POST_LIMIT_RAW = process.env.DAILY_POST_LIMIT;
  const DISABLE_LIMIT = process.env.DISABLE_DAILY_LIMIT === "true" || process.env.DISABLE_DAILY_LIMIT === "1";
  
  let DAILY_LIMIT: number | null = null;
  if (!DISABLE_LIMIT) {
    DAILY_LIMIT = DAILY_POST_LIMIT_RAW 
      ? parseInt(DAILY_POST_LIMIT_RAW, 10) 
      : 20;
  }
  
  if (!DISABLE_LIMIT && DAILY_LIMIT !== null && postsToday >= DAILY_LIMIT) {
    console.log(`⏭️ Límite diario alcanzado para ${product.name}: ${postsToday}/${DAILY_LIMIT} posts`);
    return {
      success: false,
      productId: product.id,
      productName: product.name,
      error: `Daily limit reached (${DAILY_LIMIT} posts)`
    };
  }

  // Seleccionar tipo de contenido (rota entre los tipos)
  const contentType = CONTENT_TYPES[postsToday % CONTENT_TYPES.length];
  console.log(`  📝 Generando contenido tipo: ${contentType} para ${product.name}`);

  // Obtener pricing del producto si existe
  const pricing = product.pricing as any || {};
  const pricingText = pricing.oferta 
    ? `🔥 OFERTA: ${pricing.oferta}${pricing.normal ? ` | Precio normal: ${pricing.normal}` : ''}`
    : pricing.normal 
    ? `💰 Precio: ${pricing.normal}`
    : '';

  // Generar contenido con Claude usando datos del producto
  const prompt = `Genera UN post para Instagram/TikTok para un SaaS.

PRODUCTO: ${product.name}

DESCRIPCIÓN: ${product.description || 'SaaS innovador'}

AUDIENCIA: ${product.targetAudience || 'Emprendedores y profesionales'}

USP: ${product.usp || 'Solución única en el mercado'}

${pricingText ? `${pricingText}\n` : ''}

TIPO DE POST: ${contentType}

${contentType === "educativo" ? "Enseña algo útil relacionado con el producto o su industria" : ""}
${contentType === "problema_solucion" ? "Presenta un problema común que el producto resuelve" : ""}
${contentType === "testimonio" ? "Crea un testimonio ficticio pero realista de un usuario del producto" : ""}
${contentType === "oferta" ? "Enfócate 100% en la oferta o precio con urgencia" : ""}
${contentType === "carrusel_hook" ? "Hook intrigante que haga querer ver más" : ""}
${contentType === "urgencia" ? "Crea urgencia: oferta limitada, tiempo limitado" : ""}

REGLAS CRÍTICAS:
- MÁXIMO 200 caracteres (sin hashtags)
- Empezar con hook potente (pregunta, dato, POV)
- Emojis estratégicos (3-5 máximo)
- Español de España, cercano pero profesional
- CTA claro: "DM QUIERO" o "Link en bio"
- ${pricingText ? 'SIEMPRE mencionar la oferta o el precio' : 'Mencionar el valor del producto'}

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
    console.error(`❌ Error parseando respuesta para ${product.name}:`, e);
    parsedContent = {
      instagram: { content: responseText, hashtags: DEFAULT_HASHTAGS.principales },
      tiktok: { content: responseText.substring(0, 150), hashtags: DEFAULT_HASHTAGS.principales.slice(0, 3) },
      hook: "default",
      tipo: contentType
    };
  }

  // Guardar en base de datos (dos registros: Instagram y TikTok)
  const savedInstagram = await prisma.marketingContent.create({
    data: {
      type: "SOCIAL",
      platform: "instagram",
      title: `${product.name} - Post ${contentType} - ${new Date().toLocaleDateString("es-ES")}`,
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
      title: `${product.name} - Post ${contentType} - ${new Date().toLocaleDateString("es-ES")}`,
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

  console.log(`  ✅ Contenido generado y guardado para ${product.name}:`, savedInstagram.id, savedTikTok.id);

  // Publicar automáticamente en Postiz (MOCK o real según POSTIZ_USE_MOCK)
  console.log(`  📤 Publicando contenido automáticamente en Postiz para ${product.name}...`);
  
  const useMockRaw = process.env.POSTIZ_USE_MOCK;
  const useMock = useMockRaw === "true" || useMockRaw === "TRUE" || useMockRaw === "True" || useMockRaw === "1";

  const publishResults: Array<{
    contentId: string;
    platform: string;
    success: boolean;
    postId?: string;
    error?: string;
  }> = [];

  // Publicar Instagram
  try {
    const instagramText = `${parsedContent.instagram.content}\n\n${Array.isArray(parsedContent.instagram.hashtags) ? parsedContent.instagram.hashtags.join(" ") : parsedContent.instagram.hashtags || ""}`.trim();
    
    const instagramResults = await publishToSocial({
      content: instagramText,
      platforms: ["instagram"]
    });

    const instagramResult = instagramResults.find(r => r.platform.toLowerCase().includes("instagram")) || instagramResults[0];
    
    if (instagramResult?.success && instagramResult.postId) {
      try {
        const existingMetadata = (savedInstagram.metadata as any) || {};
        await prisma.marketingContent.update({
          where: { id: savedInstagram.id },
          data: {
            status: "PUBLISHED" as const,
            metadata: {
              ...existingMetadata,
              postizPostId: instagramResult.postId,
              publishedAt: new Date().toISOString(),
              publishedOn: "instagram"
            }
          }
        });
        console.log(`  ✅ Instagram publicado para ${product.name}: ${instagramResult.postId}`);
        publishResults.push({
          contentId: savedInstagram.id,
          platform: "instagram",
          success: true,
          postId: instagramResult.postId
        });
      } catch (updateError: any) {
        console.error(`  ❌ Error actualizando status para ${product.name} Instagram:`, updateError.message);
        publishResults.push({
          contentId: savedInstagram.id,
          platform: "instagram",
          success: true,
          postId: instagramResult.postId,
          error: `Publicado pero error actualizando status: ${updateError.message}`
        });
      }
    } else {
      publishResults.push({
        contentId: savedInstagram.id,
        platform: "instagram",
        success: false,
        error: instagramResult?.error || "Unknown error"
      });
    }
  } catch (error: any) {
    console.error(`  ❌ Error publicando Instagram para ${product.name}:`, error.message);
    publishResults.push({
      contentId: savedInstagram.id,
      platform: "instagram",
      success: false,
      error: error.message
    });
  }

  // Publicar TikTok
  try {
    const tiktokText = `${parsedContent.tiktok.content}\n\n${Array.isArray(parsedContent.tiktok.hashtags) ? parsedContent.tiktok.hashtags.join(" ") : parsedContent.tiktok.hashtags || ""}`.trim();
    
    const tiktokResults = await publishToSocial({
      content: tiktokText,
      platforms: ["tiktok"]
    });

    const tiktokResult = tiktokResults.find(r => r.platform.toLowerCase().includes("tiktok")) || tiktokResults[0];
    
    if (tiktokResult?.success && tiktokResult.postId) {
      try {
        const existingMetadata = (savedTikTok.metadata as any) || {};
        await prisma.marketingContent.update({
          where: { id: savedTikTok.id },
          data: {
            status: "PUBLISHED" as const,
            metadata: {
              ...existingMetadata,
              postizPostId: tiktokResult.postId,
              publishedAt: new Date().toISOString(),
              publishedOn: "tiktok"
            }
          }
        });
        console.log(`  ✅ TikTok publicado para ${product.name}: ${tiktokResult.postId}`);
        publishResults.push({
          contentId: savedTikTok.id,
          platform: "tiktok",
          success: true,
          postId: tiktokResult.postId
        });
      } catch (updateError: any) {
        console.error(`  ❌ Error actualizando status para ${product.name} TikTok:`, updateError.message);
        publishResults.push({
          contentId: savedTikTok.id,
          platform: "tiktok",
          success: true,
          postId: tiktokResult.postId,
          error: `Publicado pero error actualizando status: ${updateError.message}`
        });
      }
    } else {
      publishResults.push({
        contentId: savedTikTok.id,
        platform: "tiktok",
        success: false,
        error: tiktokResult?.error || "Unknown error"
      });
    }
  } catch (error: any) {
    console.error(`  ❌ Error publicando TikTok para ${product.name}:`, error.message);
    publishResults.push({
      contentId: savedTikTok.id,
      platform: "tiktok",
      success: false,
      error: error.message
    });
  }

  const successfulPublishes = publishResults.filter(r => r.success).length;
  const failedPublishes = publishResults.filter(r => !r.success).length;

  console.log(`  📊 Resumen para ${product.name}: ${successfulPublishes} exitosos, ${failedPublishes} fallidos`);

  return {
    success: successfulPublishes > 0,
    productId: product.id,
    productName: product.name,
    contentIds: {
      instagram: savedInstagram.id,
      tiktok: savedTikTok.id
    },
    tipo: contentType,
    published: publishResults,
    publishedCount: successfulPublishes,
    failedCount: failedPublishes
  };
}

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

    // Obtener TODOS los productos con marketing habilitado
    const products = await prisma.saasProduct.findMany({
      where: {
        organizationId: ORGANIZATION_ID,
        marketingEnabled: true
      }
    });

    if (products.length === 0) {
      console.warn("⚠️ No hay productos con marketing habilitado");
      return NextResponse.json({
        success: false,
        error: "No hay productos con marketing habilitado",
        organizationId: ORGANIZATION_ID
      }, { status: 404 });
    }

    console.log(`📦 Encontrados ${products.length} producto(s) con marketing habilitado:`);
    products.forEach(p => console.log(`  - ${p.name} (${p.id})`));

    // Inicializar cliente de Anthropic
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Procesar cada producto
    const results = [];
    for (const product of products) {
      try {
        const result = await processProduct(product, client);
        results.push(result);
      } catch (error: any) {
        console.error(`❌ Error procesando producto ${product.name}:`, error);
        results.push({
          success: false,
          productId: product.id,
          productName: product.name,
          error: error.message
        });
      }
    }

    // Resumen final
    const totalSuccessful = results.filter(r => r.success).length;
    const totalFailed = results.filter(r => !r.success).length;
    const totalPublished = results.reduce((sum, r) => sum + (r.publishedCount || 0), 0);
    const totalFailedPublishes = results.reduce((sum, r) => sum + (r.failedCount || 0), 0);

    console.log(`\n📊 RESUMEN FINAL:`);
    console.log(`   ✅ Productos procesados exitosamente: ${totalSuccessful}/${products.length}`);
    console.log(`   ❌ Productos con errores: ${totalFailed}`);
    console.log(`   📤 Posts publicados: ${totalPublished}`);
    console.log(`   ❌ Posts fallidos: ${totalFailedPublishes}`);

    return NextResponse.json({
      success: totalSuccessful > 0,
      productsProcessed: products.length,
      productsSuccessful: totalSuccessful,
      productsFailed: totalFailed,
      totalPublished,
      totalFailedPublishes,
      results
    });


  } catch (error: any) {
    console.error("❌ Error en cron:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
