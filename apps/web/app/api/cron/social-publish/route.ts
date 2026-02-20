import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";
import { validateContent } from "@repo/api/modules/marketing/services/content-guards";
import { verifyCronAuth, unauthorizedCronResponse } from "@repo/api/lib/cron-auth";

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CONTENT_TYPES = [
  "educativo",
  "problema_solucion",
  "testimonio",
  "oferta",
  "carrusel_hook",
  "urgencia"
];

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request)) {
    return unauthorizedCronResponse();
  }

  const results: Array<{ organizationId: string; organizationName: string; status: string; detail?: string }> = [];

  try {
    // Multi-tenant: obtener TODAS las organizaciones con productos marketingEnabled
    const products = await prisma.saasProduct.findMany({
      where: { marketingEnabled: true },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No organizations with marketingEnabled products",
        results: [],
      });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    for (const product of products) {
      const orgId = product.organizationId;
      const orgName = product.organization.name;

      try {
        // Verificar cuántos posts se han generado hoy para este producto
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const postsToday = await prisma.marketingContent.count({
          where: {
            productId: product.id,
            type: "SOCIAL",
            createdAt: { gte: today },
          },
        });

        // Máximo 4 posts por día
        if (postsToday >= 4) {
          results.push({ organizationId: orgId, organizationName: orgName, status: "skipped", detail: "Daily limit reached (4 posts)" });
          continue;
        }

        // Seleccionar tipo de contenido (rota entre los tipos)
        const contentType = CONTENT_TYPES[postsToday % CONTENT_TYPES.length];

        // Generar contenido con Claude
        const prompt = `Genera UN post para Instagram/TikTok.

PRODUCTO: ${product.name}
DESCRIPCIÓN: ${product.description || "Sin descripción"}
AUDIENCIA: ${product.targetAudience || "General"}
USP: ${product.usp || "N/A"}

TIPO DE POST: ${contentType}

${contentType === "educativo" ? "Enseña algo útil relacionado con el producto" : ""}
${contentType === "problema_solucion" ? "Presenta un problema común y cómo el producto lo soluciona" : ""}
${contentType === "testimonio" ? "Crea un testimonio ficticio pero realista" : ""}
${contentType === "oferta" ? "Enfócate en una oferta o beneficio con urgencia" : ""}
${contentType === "carrusel_hook" ? "Hook intrigante que haga querer ver más" : ""}
${contentType === "urgencia" ? "Crea urgencia: plazas limitadas, oferta por tiempo limitado" : ""}

REGLAS:
- MÁXIMO 200 caracteres (sin hashtags)
- Hook potente al inicio
- Emojis estratégicos (3-5 máximo)
- Español de España
- CTA claro

FORMATO (JSON):
{
  "instagram": { "content": "texto", "hashtags": ["h1", "h2"] },
  "tiktok": { "content": "texto corto (máx 150 chars)", "hashtags": ["h1", "h2", "h3"] },
  "hook": "el hook usado",
  "tipo": "${contentType}"
}

Responde SOLO con el JSON.`;

        const response = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 512,
          messages: [{ role: "user", content: prompt }],
        });

        const responseText = response.content[0].type === "text" ? response.content[0].text : "";

        let parsedContent;
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedContent = JSON.parse(jsonMatch[0]);
          }
        } catch {
          parsedContent = {
            instagram: { content: responseText, hashtags: [] },
            tiktok: { content: responseText.substring(0, 150), hashtags: [] },
            hook: "default",
            tipo: contentType,
          };
        }

        // Guardar en base de datos
        const savedInstagram = await prisma.marketingContent.create({
          data: {
            type: "SOCIAL",
            platform: "instagram",
            title: `Post ${contentType} - ${new Date().toLocaleDateString("es-ES")}`,
            content: JSON.stringify(parsedContent.instagram),
            status: "READY",
            productId: product.id,
            organizationId: orgId,
            metadata: {
              tipo: contentType,
              hook: parsedContent.hook,
              instagram: parsedContent.instagram,
              tiktok: parsedContent.tiktok,
              generatedAt: new Date().toISOString(),
              tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
            },
          },
        });

        const savedTikTok = await prisma.marketingContent.create({
          data: {
            type: "SOCIAL",
            platform: "tiktok",
            title: `Post ${contentType} - ${new Date().toLocaleDateString("es-ES")}`,
            content: JSON.stringify(parsedContent.tiktok),
            status: "READY",
            productId: product.id,
            organizationId: orgId,
            metadata: {
              tipo: contentType,
              hook: parsedContent.hook,
              instagram: parsedContent.instagram,
              tiktok: parsedContent.tiktok,
              generatedAt: new Date().toISOString(),
              tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
            },
          },
        });

        // Auto-publicación si está activada
        let autoPublishResult = null;
        if (product.autoPublish) {
          const instagramGuards = await validateContent({
            content: { text: parsedContent.instagram.content },
            platform: "instagram",
            productName: product.name,
            hasImage: false,
          });

          const tiktokGuards = await validateContent({
            content: { text: parsedContent.tiktok.content },
            platform: "tiktok",
            productName: product.name,
            hasImage: false,
          });

          if (instagramGuards.passed && tiktokGuards.passed) {
            await prisma.marketingContent.update({
              where: { id: savedInstagram.id },
              data: {
                status: "AUTO_PUBLISHED",
                metadata: {
                  ...(savedInstagram.metadata as object),
                  autoPublished: true,
                  guardsScore: instagramGuards.score,
                  publishedAt: new Date().toISOString(),
                },
              },
            });

            await prisma.marketingContent.update({
              where: { id: savedTikTok.id },
              data: {
                status: "AUTO_PUBLISHED",
                metadata: {
                  ...(savedTikTok.metadata as object),
                  autoPublished: true,
                  guardsScore: tiktokGuards.score,
                  publishedAt: new Date().toISOString(),
                },
              },
            });

            autoPublishResult = { success: true };
          } else {
            autoPublishResult = { success: false, reason: "Guards failed" };
          }
        }

        results.push({
          organizationId: orgId,
          organizationName: orgName,
          status: "success",
          detail: autoPublishResult?.success ? "Generated + auto-published" : "Generated (ready for review)",
        });
      } catch (orgError: any) {
        results.push({
          organizationId: orgId,
          organizationName: orgName,
          status: "error",
          detail: orgError.message,
        });
      }

      // Delay entre organizaciones para no saturar APIs
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
