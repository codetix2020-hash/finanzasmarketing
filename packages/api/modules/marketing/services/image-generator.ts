import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface GenerateImageParams {
  productName: string;
  contentText: string;
  platform: "instagram" | "tiktok";
  tipo: string;
  description?: string;
  usp?: string;
}

/**
 * Genera una imagen profesional para posts de redes sociales usando DALL-E 3
 * 
 * Costo: $0.040 por imagen (DALL-E 3 standard quality)
 */
export async function generatePostImage(params: GenerateImageParams): Promise<{
  imageUrl: string;
  cost: number;
}> {
  console.log("🎨 Generando imagen con DALL-E...");
  console.log("  📦 Producto:", params.productName);
  console.log("  📱 Plataforma:", params.platform);
  console.log("  📝 Tipo:", params.tipo);

  // Crear prompt optimizado para DALL-E
  const prompt = `Create a professional, eye-catching ${params.platform === "instagram" ? "Instagram" : "TikTok"} post image for ${params.productName}.

Style: Modern, clean, professional, marketing-optimized
Theme: ${params.tipo}
Product: ${params.productName}
${params.description ? `Description: ${params.description.substring(0, 150)}` : ""}
${params.usp ? `Unique Value: ${params.usp.substring(0, 100)}` : ""}
Message tone: ${params.contentText.substring(0, 200)}

Visual Requirements:
- High quality, visually appealing, professional marketing aesthetic
- Brand-appropriate colors (modern, vibrant but professional)
- NO text in image (text will be added in caption)
- ${params.platform === "instagram" ? "Square format (1080x1080 optimized)" : "Vertical format (1080x1920 optimized)"}
- Clean composition with focus on visual impact
- Professional photography or illustration style
- Suitable for social media marketing

Avoid:
- Text overlays
- Watermarks
- Cluttered designs
- Unprofessional elements`.trim();

  console.log("  📝 Prompt (primeros 200 chars):", prompt.substring(0, 200) + "...");

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: params.platform === "instagram" ? "1024x1024" : "1024x1792", // Square for IG, vertical for TikTok
      quality: "standard",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error("No image URL returned from DALL-E");
    }

    console.log("✅ Imagen generada exitosamente");
    console.log("  🖼️ URL:", imageUrl);

    // DALL-E 3 pricing: $0.040 per image (standard quality, 1024x1024)
    // Vertical (1024x1792) también es $0.040
    const cost = 0.040;

    return { imageUrl, cost };
  } catch (error: any) {
    console.error("❌ Error generando imagen con DALL-E:", error);
    console.error("  - Mensaje:", error.message);
    console.error("  - Code:", error.code);
    throw error;
  }
}

/**
 * Genera múltiples imágenes (para carrusel de Instagram)
 */
export async function generateCarouselImages(params: GenerateImageParams & { count: number }): Promise<{
  imageUrls: string[];
  totalCost: number;
}> {
  console.log(`🎨 Generando ${params.count} imágenes para carrusel...`);

  const images = await Promise.all(
    Array.from({ length: params.count }).map((_, index) =>
      generatePostImage({
        ...params,
        tipo: `${params.tipo} - Slide ${index + 1}/${params.count}`
      })
    )
  );

  const imageUrls = images.map(img => img.imageUrl);
  const totalCost = images.reduce((sum, img) => sum + img.cost, 0);

  console.log(`✅ ${images.length} imágenes generadas. Costo total: $${totalCost.toFixed(3)}`);

  return { imageUrls, totalCost };
}

