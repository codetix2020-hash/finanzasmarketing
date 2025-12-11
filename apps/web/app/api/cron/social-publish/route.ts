import { NextRequest, NextResponse } from "next/server";
import { generateWeeklyContent, adaptToTikTok } from "@repo/api/modules/marketing/services/content-generator-v2";
import { publishToSocial } from "@repo/api/modules/marketing/services/publer-service";
import { prisma } from "@repo/database";

// Este endpoint se llama cada X horas via cron (Railway, Vercel, etc.)
export async function GET(request: NextRequest) {
  console.log("⏰ Cron de publicación social ejecutándose...");

  try {
    // Verificar autorización (opcional, para seguridad)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Obtener productos activos
    const products = await prisma.saasProduct.findMany({
      where: {
        marketingEnabled: true,
        organizationId: "8uu4-W6mScG8IQtY"
      }
    });

    if (products.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No hay productos activos para publicar" 
      });
    }

    const results = [];

    for (const product of products) {
      // Verificar si ya publicamos hoy para este producto
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const publishedToday = await prisma.marketingContent.count({
        where: {
          productId: product.id,
          type: "SOCIAL",
          createdAt: {
            gte: today
          }
        }
      });

      if (publishedToday > 0) {
        console.log(`⏭️ Ya se publicó hoy para ${product.name}`);
        continue;
      }

      // Generar contenido
      console.log(`📝 Generando contenido para ${product.name}...`);
      
      const batch = await generateWeeklyContent({
        name: product.name,
        description: product.description || "",
        targetAudience: product.targetAudience || "",
        usp: product.usp || "",
        competitors: (product.pricing as any)?.competitors || []
      }, "peluqueria");

      // Tomar el primer post del batch
      const post = batch.posts[0];
      if (!post) continue;

      // Adaptar para TikTok
      const tiktokPost = adaptToTikTok(post);

      // Publicar en Instagram
      const igResult = await publishToSocial({
        content: post.content,
        platforms: ["instagram"]
      });

      // Publicar en TikTok
      const tkResult = await publishToSocial({
        content: tiktokPost.content,
        platforms: ["tiktok"]
      });

      // Guardar en BD
      await prisma.marketingContent.create({
        data: {
          type: "SOCIAL",
          platform: "instagram+tiktok",
          title: post.hook,
          content: {
            instagram: post.content,
            tiktok: tiktokPost.content,
            hook: post.hook,
            type: post.type
          } as any,
          status: "PUBLISHED",
          productId: product.id,
          organizationId: product.organizationId,
          metadata: {
            instagramResult: igResult,
            tiktokResult: tkResult,
            tokensUsed: batch.tokensUsed
          } as any
        }
      });

      results.push({
        product: product.name,
        instagram: igResult,
        tiktok: tkResult
      });
    }

    return NextResponse.json({
      success: true,
      message: `Publicación completada para ${results.length} productos`,
      results
    });

  } catch (error: any) {
    console.error("❌ Error en cron de publicación:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

