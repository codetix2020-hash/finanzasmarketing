import { NextRequest, NextResponse } from "next/server";
import { 
  publishToSocial, 
  generateAndPublish, 
  getPublerAccounts,
  generateWeeklyAndSchedule,
  generateAndPublishOptimized
} from "@repo/api/modules/marketing/services/publer-service";
import { 
  generateWeeklyContent,
  generateABVariants,
  generateCarousel,
  generateEditorialCalendar
} from "@repo/api/modules/marketing/services/content-generator-v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  console.log("📤 Social publish endpoint llamado");

  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case "get-accounts":
        const accounts = await getPublerAccounts();
        result = { success: true, accounts };
        break;

      case "publish":
        const publishResults = await publishToSocial({
          content: params.content,
          imageUrl: params.imageUrl,
          platforms: params.platforms || ["instagram", "tiktok"],
          scheduleAt: params.scheduleAt ? new Date(params.scheduleAt) : undefined
        });
        result = { success: true, results: publishResults };
        break;

      case "generate-and-publish":
        const genResult = await generateAndPublish({
          productName: params.productName,
          productDescription: params.productDescription,
          topic: params.topic,
          platforms: params.platforms || ["instagram", "tiktok"],
          imageUrl: params.imageUrl
        });
        result = { success: true, ...genResult };
        break;

      case "generate-weekly":
        const weeklyResult = await generateWeeklyAndSchedule({
          product: {
            name: params.productName,
            description: params.productDescription,
            targetAudience: params.targetAudience,
            usp: params.usp,
            competitors: params.competitors
          },
          nicho: params.nicho || "peluqueria",
          startDate: params.startDate ? new Date(params.startDate) : undefined
        });
        result = { success: true, ...weeklyResult };
        break;

      case "generate-single":
        const singleResult = await generateAndPublishOptimized({
          product: {
            name: params.productName,
            description: params.productDescription,
            targetAudience: params.targetAudience,
            usp: params.usp
          },
          tipo: params.tipo,
          platforms: params.platforms || ["instagram", "tiktok"],
          immediate: params.immediate
        });
        result = { success: true, ...singleResult };
        break;

      case "preview":
        // Solo genera sin publicar, para revisar
        const previewBatch = await generateWeeklyContent(
          {
            name: params.productName,
            description: params.productDescription,
            targetAudience: params.targetAudience,
            usp: params.usp,
            competitors: params.competitors
          },
          params.nicho || "peluqueria"
        );
        result = { 
          success: true, 
          posts: previewBatch.posts,
          tokensUsed: previewBatch.tokensUsed,
          message: "Preview generado. Usa 'generate-weekly' para programar."
        };
        break;

      case "calendar":
        const weeks = params.weeks || 4;
        const calendarStart = params.startDate ? new Date(params.startDate) : new Date();
        const editorialCalendar = generateEditorialCalendar(calendarStart, weeks);
        result = { 
          success: true, 
          calendar: editorialCalendar,
          totalPosts: editorialCalendar.reduce((acc, week) => acc + week.posts.length, 0),
          message: `Calendario editorial de ${weeks} semanas generado`
        };
        break;

      case "carousel":
        const carouselResult = await generateCarousel(
          {
            name: params.productName,
            description: params.productDescription,
            targetAudience: params.targetAudience,
            usp: params.usp
          },
          params.tema || "tips",
          params.slides || 5
        );
        result = { success: true, ...carouselResult };
        break;

      case "ab-test":
        const abResult = await generateABVariants(
          {
            name: params.productName,
            description: params.productDescription,
            targetAudience: params.targetAudience,
            usp: params.usp
          },
          params.tipo || "educativo"
        );
        result = { success: true, ...abResult };
        break;

      default:
        result = { success: false, error: "Invalid action. Use: get-accounts, publish, generate-and-publish, generate-weekly, generate-single, preview, calendar, carousel, ab-test" };
    }

    return NextResponse.json(result, { headers: corsHeaders });

  } catch (error: any) {
    console.error("❌ Error en social-publish:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

