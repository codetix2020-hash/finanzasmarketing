import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@repo/database";

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { prompt, organizationSlug, postContent } = await request.json();

    console.log("Generating image with Nano Banana:", prompt?.slice(0, 50));

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
Style: Clean, professional, eye-catching, vibrant colors, suitable for social media.
DO NOT include any text, words, or letters in the image.`;

    let imageUrl: string;

    if (process.env.GOOGLE_AI_API_KEY) {
      try {
        const response = await genai.models.generateContent({
          model: "gemini-2.5-flash-preview-05-20",
          contents: imagePrompt,
          config: {
            responseModalities: ["image", "text"],
          },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
          if ((part as any).inlineData) {
            const inlineData = (part as any).inlineData as {
              data: string;
              mimeType?: string;
            };
            const base64 = inlineData.data;
            const mimeType = inlineData.mimeType || "image/png";
            imageUrl = `data:${mimeType};base64,${base64}`;
            break;
          }
        }

        if (!imageUrl) {
          throw new Error("No image in response");
        }

        console.log("Nano Banana generated image successfully");
      } catch (geminiError: any) {
        console.error("Nano Banana error:", geminiError.message);

        if (process.env.OPENAI_API_KEY) {
          const OpenAIModule = await import("openai");
          const OpenAI = OpenAIModule.default;
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          const dalleResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
          });

          imageUrl = dalleResponse.data[0].url!;
        } else {
          imageUrl = `https://picsum.photos/seed/${Date.now()}/1080/1080`;
        }
      }
    } else if (process.env.OPENAI_API_KEY) {
      const OpenAIModule = await import("openai");
      const OpenAI = OpenAIModule.default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
      });

      imageUrl = response.data[0].url!;
    } else {
      imageUrl = `https://picsum.photos/seed/${Date.now()}/1080/1080`;
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
