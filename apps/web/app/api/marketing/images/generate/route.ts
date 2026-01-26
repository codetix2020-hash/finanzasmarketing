import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";
import { put } from "@vercel/blob";
import { prisma } from "@repo/database";

export async function POST(request: NextRequest) {
  try {
    const { prompt, organizationSlug, postContent } = await request.json();

    console.log('Generating image for:', prompt?.slice(0, 50));

    // Obtener organización
    const organization = await prisma.organization.findFirst({
      where: { slug: organizationSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: "Org not found" }, { status: 404 });
    }

    // Obtener perfil para contexto
    const profile = await prisma.businessProfile.findUnique({
      where: { organizationId: organization.id },
    });

    // Crear prompt para la imagen basado en el contenido del post
    const imagePrompt = prompt || `Professional social media image for ${profile?.industry || 'business'}. 
Modern, clean design. Topic: ${postContent?.slice(0, 100) || profile?.description || 'business services'}.
Style: Professional photography, high quality, vibrant colors, suitable for Instagram.
NO text, NO words, NO letters in the image.`;

    let imageUrl: string;

    if (process.env.REPLICATE_API_TOKEN) {
      // Generar con Replicate Flux
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });

      console.log('Calling Replicate with prompt:', imagePrompt.slice(0, 100));

      const output = await replicate.run(
        "black-forest-labs/flux-schnell",
        {
          input: {
            prompt: imagePrompt,
            aspect_ratio: "1:1",
            output_format: "webp",
            output_quality: 90,
          }
        }
      );

      // Flux retorna un array o una URL directa
      const generatedUrl = Array.isArray(output) ? output[0] : output;
      console.log('Replicate generated:', generatedUrl);

      // Descargar la imagen y subirla a Vercel Blob para persistencia
      const imageResponse = await fetch(generatedUrl as string);
      const imageBlob = await imageResponse.blob();

      const blobResult = await put(
        `marketing/${organization.id}/generated-${Date.now()}.webp`,
        imageBlob,
        { 
          access: 'public',
          contentType: 'image/webp',
        }
      );

      imageUrl = blobResult.url;
      console.log('Saved to Vercel Blob:', imageUrl);

    } else {
      // Sin API key de Replicate, usar imagen de stock de Unsplash
      const searchTerms = profile?.industry || 'technology business';
      imageUrl = `https://source.unsplash.com/1080x1080/?${encodeURIComponent(searchTerms)}`;
      console.log('Using Unsplash fallback:', imageUrl);
    }

    // Guardar en MediaLibrary
    const media = await prisma.mediaLibrary.create({
      data: {
        organizationId: organization.id,
        fileUrl: imageUrl,
        fileName: `generated-${Date.now()}.webp`,
        fileType: 'image/webp',
        fileSize: 0,
        category: 'other',
        tags: [],
        isAiGenerated: true,
        aiPrompt: imagePrompt,
      },
    });

    return NextResponse.json({ 
      imageUrl,
      mediaId: media.id,
      success: true,
    });

  } catch (error: any) {
    console.error("Error generating image:", error);
    
    // Fallback a Unsplash si falla
    const fallbackUrl = `https://source.unsplash.com/1080x1080/?technology,business`;
    
    return NextResponse.json({
      imageUrl: fallbackUrl,
      error: error.message,
      isFallback: true,
    });
  }
}

