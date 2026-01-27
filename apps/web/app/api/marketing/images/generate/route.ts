import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@repo/database";

export async function POST(request: NextRequest) {
  try {
    const { prompt, organizationSlug, postContent } = await request.json();

    console.log("Generating image with Nano Banana (Gemini)");

    const organization = await prisma.organization.findFirst({
      where: { slug: organizationSlug },
    });

    const profile = organization
      ? await prisma.businessProfile.findUnique({
          where: { organizationId: organization.id },
        })
      : null;

    const imagePrompt =
      prompt ||
      `Professional Instagram post image for ${
        profile?.industry || "technology"
      } company.
Theme: ${
        postContent?.slice(0, 150) ||
        profile?.description ||
        "modern business"
      }
Style: Clean, modern, professional, eye-catching, vibrant colors, perfect for social media marketing.
DO NOT include any text, words, letters, or watermarks in the image.`;

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

    // 3) Picsum (fallback final)
    if (!imageUrl) {
      imageUrl = `https://picsum.photos/seed/${Date.now()}/1080/1080`;
      console.log("Using Picsum fallback");
    }

    return NextResponse.json({
      imageUrl,
      success: true,
    });
  } catch (error: any) {
    console.error("Error generating image:", error);
    return NextResponse.json({
      imageUrl: `https://picsum.photos/seed/${Date.now()}/1080/1080`,
      error: error.message,
      isFallback: true,
    });
  }
}
