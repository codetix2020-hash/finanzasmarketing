import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@repo/database";

// Función para crear prompts de imagen más realistas
function createRealisticImagePrompt(
  industry: string,
  contentText: string,
  contentType: string = 'promotional'
): string {
  // Mapeo de industrias a escenas fotográficas realistas
  const industryScenes: Record<string, string[]> = {
    'technology': [
      'modern minimalist office workspace with laptop and coffee, natural lighting through window',
      'hands typing on MacBook in cozy cafe, shallow depth of field, warm tones',
      'team meeting in bright modern office, candid moment, professional photography',
      'smartphone on wooden desk with plants, flat lay, clean aesthetic',
    ],
    'marketing': [
      'creative team brainstorming with sticky notes on glass wall, natural light',
      'laptop showing analytics dashboard, coffee cup beside, morning light',
      'professional workspace with notebook and pen, minimal style',
      'hands holding smartphone showing social media app, blurred background',
    ],
    'desarrollo web': [
      'developer workspace with multiple monitors showing code, ambient lighting',
      'MacBook on clean white desk, minimalist setup, natural light',
      'close-up of hands on keyboard, code on screen, shallow depth of field',
      'modern home office setup, plants and natural elements, cozy atmosphere',
    ],
    'default': [
      'professional business meeting, natural candid moment, soft lighting',
      'modern workspace with laptop, coffee and notebook, clean aesthetic',
      'team collaboration in bright office space, authentic moment',
      'hands working on laptop, minimalist desk setup, warm tones',
    ],
  };

  // Seleccionar escena aleatoria para la industria
  const scenes = industryScenes[industry.toLowerCase()] || industryScenes['default'];
  const randomScene = scenes[Math.floor(Math.random() * scenes.length)];

  // Construir prompt realista
  return `Professional stock photography style image. ${randomScene}. 

STYLE REQUIREMENTS:
- Shot on Canon EOS R5 or Sony A7IV
- Natural lighting, not artificial or neon
- Realistic colors, not oversaturated
- Clean, minimalist composition
- Professional but warm and approachable
- Could be from Unsplash or Shutterstock premium
- NO digital art, NO illustrations, NO 3D renders
- NO glowing effects, NO neon colors, NO futuristic elements
- NO text, NO logos, NO watermarks
- Photorealistic only

The image should look like it was taken by a professional photographer for a business magazine or premium stock photo site.`;
}

// Función para obtener imágenes de stock reales de Unsplash
async function getStockImage(keywords: string): Promise<string> {
  const searchTerms = encodeURIComponent(keywords);
  const url = `https://source.unsplash.com/1080x1080/?${searchTerms},business,professional,minimal`;
  
  try {
    const response = await fetch(url, { redirect: 'follow' });
    return response.url;
  } catch {
    return url;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, organizationSlug, postContent } = await request.json();

    console.log("Generating image with realistic prompts");

    const organization = await prisma.organization.findFirst({
      where: { slug: organizationSlug },
    });

    const profile = organization
      ? await prisma.businessProfile.findUnique({
          where: { organizationId: organization.id },
        })
      : null;

    // Usar prompt personalizado o generar uno realista
    const imagePrompt = prompt || createRealisticImagePrompt(
      profile?.industry || 'technology',
      postContent || profile?.description || '',
      'promotional'
    );

    let imageUrl = "";

    // 1) Nano Banana (Gemini)
    if (process.env.GOOGLE_AI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.0-flash-exp",
          // Tipado de config todavía experimental
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          generationConfig: { responseModalities: ["image", "text"] } as any,
        });

        const result = await model.generateContent(imagePrompt);

        for (const part of result.response.candidates?.[0]?.content?.parts ||
          []) {
          if ((part as any).inlineData) {
            const inlineData = (part as any).inlineData as {
              data: string;
              mimeType?: string;
            };
            imageUrl = `data:${inlineData.mimeType};base64,${inlineData.data}`;
            console.log("Nano Banana generated image successfully");
            break;
          }
        }

        if (!imageUrl) {
          throw new Error("No image generated");
        }
      } catch (geminiError: any) {
        console.error("Nano Banana error:", geminiError?.message);
      }
    }

    // 2) DALL-E 3 (fallback)
    if (!imageUrl && process.env.OPENAI_API_KEY) {
      try {
        const OpenAIModule = await import("openai");
        const OpenAI = OpenAIModule.default;
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        imageUrl = response.data[0].url!;
        console.log("DALL-E 3 generated image");
      } catch (dalleError: any) {
        console.error("DALL-E error:", dalleError?.message);
      }
    }

    // 3) Unsplash (fallback final - imágenes reales de stock)
    if (!imageUrl) {
      console.log("Using Unsplash stock photos as fallback");
      const keywords = imagePrompt
        .match(/\b(office|workspace|laptop|team|meeting|coffee|desk|business|professional|modern|minimalist)\b/gi)
        ?.slice(0, 3)
        .join(',') || 'business,professional';
      imageUrl = await getStockImage(keywords);
    }

    return NextResponse.json({
      imageUrl,
      success: true,
    });
  } catch (error: any) {
    console.error("Error generating image:", error);
    // Fallback a Unsplash en caso de error
    const keywords = 'business,professional,office';
    const fallbackUrl = await getStockImage(keywords).catch(() => 
      `https://source.unsplash.com/1080x1080/?${keywords}`
    );
    return NextResponse.json({
      imageUrl: fallbackUrl,
      error: error.message,
      isFallback: true,
    });
  }
}
