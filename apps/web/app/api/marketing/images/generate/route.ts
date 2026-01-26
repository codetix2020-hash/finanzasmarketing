import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@repo/database";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { prompt, organizationSlug, postContent } = await request.json();

    console.log('Generating image with DALL-E 3:', prompt?.slice(0, 50));

    const organization = await prisma.organization.findFirst({
      where: { slug: organizationSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    const profile = await prisma.businessProfile.findUnique({
      where: { organizationId: organization.id },
    });

    // Crear prompt para DALL-E
    const imagePrompt = prompt || `Professional social media image for ${profile?.industry || 'technology'} company. 
Modern, clean design. Theme: ${postContent?.slice(0, 100) || profile?.description || 'business services'}.
Style: Professional photography, high quality, vibrant colors, suitable for Instagram.
DO NOT include any text, words, or letters in the image.`;

    let imageUrl: string;

    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: imagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        imageUrl = response.data[0].url!;
        console.log('DALL-E 3 generated:', imageUrl);

      } catch (dalleError: any) {
        console.error('DALL-E error:', dalleError.message);
        // Fallback a Picsum
        const seed = Date.now();
        imageUrl = `https://picsum.photos/seed/${seed}/1080/1080`;
      }
    } else {
      // Fallback a Picsum
      const seed = Date.now();
      imageUrl = `https://picsum.photos/seed/${seed}/1080/1080`;
    }

    return NextResponse.json({ 
      imageUrl,
      success: true,
    });

  } catch (error: any) {
    console.error("Error generating image:", error);
    const seed = Date.now();
    return NextResponse.json({
      imageUrl: `https://picsum.photos/seed/${seed}/1080/1080`,
      error: error.message,
      isFallback: true,
    });
  }
}
