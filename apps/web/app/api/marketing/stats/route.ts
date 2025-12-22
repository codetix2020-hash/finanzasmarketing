import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";

const ORGANIZATION_ID = "b0a57f66-6cae-4f6f-8e8d-c8dfd5d9b08d";

/**
 * Calcula el costo aproximado basado en tokens usados
 * Claude Sonnet 4: $3 per 1M input tokens + $15 per 1M output tokens
 */
function calculateCost(tokensUsed: number): number {
  // Aproximación: asumimos 70% input, 30% output
  const inputTokens = tokensUsed * 0.7;
  const outputTokens = tokensUsed * 0.3;
  
  const inputCost = (inputTokens / 1_000_000) * 3; // $3 per 1M input
  const outputCost = (outputTokens / 1_000_000) * 15; // $15 per 1M output
  
  const totalCostUSD = inputCost + outputCost;
  const totalCostEUR = totalCostUSD * 0.92; // Conversión aproximada EUR/USD
  
  return totalCostEUR;
}

export async function GET(request: NextRequest) {
  try {
    console.log("📊 Obteniendo estadísticas de marketing...");
    console.log("  Organization ID:", ORGANIZATION_ID);

    // Obtener todas las métricas en paralelo
    const [
      productsCount,
      contentCount,
      allContent,
      recentActivity
    ] = await Promise.all([
      // A) Productos activos
      prisma.saasProduct.count({
        where: {
          organizationId: ORGANIZATION_ID,
          marketingEnabled: true
        }
      }),
      
      // B) Contenido generado total
      prisma.marketingContent.count({
        where: {
          organizationId: ORGANIZATION_ID,
          type: "SOCIAL"
        }
      }),
      
      // C) Obtener todo el contenido para calcular tokens e imágenes
      prisma.marketingContent.findMany({
        where: {
          organizationId: ORGANIZATION_ID,
          type: "SOCIAL"
        },
        select: {
          metadata: true
        }
      }),
      
      // D) Actividad reciente (últimos 5 posts publicados)
      prisma.marketingContent.findMany({
        where: {
          organizationId: ORGANIZATION_ID,
          status: "PUBLISHED",
          type: "SOCIAL"
        },
        orderBy: {
          updatedAt: "desc"
        },
        take: 5,
        select: {
          id: true,
          platform: true,
          title: true,
          content: true,
          metadata: true,
          createdAt: true,
          updatedAt: true
        }
      })
    ]);

    // Calcular tokens totales, costo e imágenes
    let totalTokens = 0;
    let imagesCount = 0;
    
    allContent.forEach((item) => {
      const metadata = item.metadata as any;
      
      // Contar tokens
      if (metadata?.tokensUsed) {
        totalTokens += typeof metadata.tokensUsed === 'number' 
          ? metadata.tokensUsed 
          : parseInt(metadata.tokensUsed) || 0;
      }
      
      // Contar imágenes
      if (metadata?.imageUrl || metadata?.imageGenerated === true) {
        imagesCount++;
      }
    });

    const totalCostEUR = calculateCost(totalTokens);

    // Formatear actividad reciente
    const formattedActivity = recentActivity.map((item) => {
      const metadata = item.metadata as any;
      const contentData = item.content as any;
      
      // Extraer texto del contenido
      let contentText = "";
      if (typeof contentData === 'string') {
        contentText = contentData;
      } else if (contentData?.content) {
        contentText = contentData.content;
      } else if (contentData?.instagram?.content) {
        contentText = contentData.instagram.content;
      } else if (contentData?.tiktok?.content) {
        contentText = contentData.tiktok.content;
      }
      
      return {
        id: item.id,
        platform: item.platform,
        title: item.title || `Post ${item.platform}`,
        content: contentText.substring(0, 100) + (contentText.length > 100 ? "..." : ""),
        date: item.updatedAt || item.createdAt,
        metadata: {
          tipo: metadata?.tipo || "general",
          postizPostId: metadata?.postizPostId
        }
      };
    });

    const stats = {
      products: productsCount,
      content: contentCount,
      images: imagesCount,
      cost: totalCostEUR.toFixed(2),
      tokens: totalTokens,
      recentActivity: formattedActivity
    };

    console.log("✅ Estadísticas obtenidas:", {
      products: stats.products,
      content: stats.content,
      images: stats.images,
      cost: `€${stats.cost}`,
      tokens: stats.tokens,
      recentActivity: stats.recentActivity.length
    });

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error("❌ Error obteniendo estadísticas:", error);
    console.error("  Error message:", error.message);
    console.error("  Error stack:", error.stack);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error desconocido",
        stats: {
          products: 0,
          content: 0,
          images: 0,
          cost: "0.00",
          tokens: 0,
          recentActivity: []
        }
      },
      { status: 500 }
    );
  }
}

