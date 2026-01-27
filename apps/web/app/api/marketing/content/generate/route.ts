import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

const anthropic = new Anthropic();

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Función para crear prompts de imagen más realistas
function createRealisticImagePrompt(
  industry: string,
  contentText: string,
  contentType: string
): string {
  // Extraer tema principal del texto (primeras palabras clave)
  const keywords = contentText
    .slice(0, 100)
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(w => w.length > 4)
    .slice(0, 3)
    .join(' ');

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
  // Unsplash Source API (gratuito, imágenes reales)
  const searchTerms = encodeURIComponent(keywords);
  
  // Usar Unsplash con términos específicos de negocio
  const url = `https://source.unsplash.com/1080x1080/?${searchTerms},business,professional,minimal`;
  
  // Hacer request para obtener URL final (Unsplash redirige)
  try {
    const response = await fetch(url, { redirect: 'follow' });
    return response.url;
  } catch {
    return url;
  }
}

// Función para generar imagen
async function generateImage(prompt: string, index: number): Promise<string> {
  // Primero intentar con AI (Nano Banana)
  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: { responseModalities: ["image", "text"] } as any,
      });

      if (index > 0) await new Promise(r => setTimeout(r, 3000));

      const result = await model.generateContent(prompt);
      for (const part of result.response.candidates?.[0]?.content?.parts || []) {
        if ((part as any).inlineData) {
          const inlineData = (part as any).inlineData;
          return `data:${inlineData.mimeType};base64,${inlineData.data}`;
        }
      }
    } catch (err: any) {
      console.error(`Gemini error for image ${index}:`, err.message);
      // Continuar con fallback
    }
  }

  // Segundo intento: DALL-E 3
  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      if (index > 0) await new Promise(r => setTimeout(r, 2000));
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });
      return response.data[0].url!;
    } catch (err: any) {
      console.error(`DALL-E error:`, err.message);
      // Continuar con fallback
    }
  }

  // Fallback: usar imágenes de stock reales de Unsplash
  console.log('Using stock photos from Unsplash as fallback');
  const keywords = prompt
    .match(/\b(office|workspace|laptop|team|meeting|coffee|desk|business|professional|modern|minimalist)\b/gi)
    ?.slice(0, 3)
    .join(',') || 'business,professional';
    
  return await getStockImage(keywords);
}
  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-exp",
        generationConfig: { responseModalities: ["image", "text"] } as any,
      });

      if (index > 0) await new Promise(r => setTimeout(r, 3000));

      const result = await model.generateContent(prompt);
      for (const part of result.response.candidates?.[0]?.content?.parts || []) {
        if ((part as any).inlineData) {
          const inlineData = (part as any).inlineData;
          return `data:${inlineData.mimeType};base64,${inlineData.data}`;
        }
      }
    } catch (err: any) {
      console.error(`Gemini error for image ${index}:`, err.message);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      if (index > 0) await new Promise(r => setTimeout(r, 2000));
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      });
      return response.data[0].url!;
    } catch (err: any) {
      console.error(`DALL-E error:`, err.message);
    }
  }

  return `https://picsum.photos/seed/${Date.now() + index}/1080/1080`;
}

export async function POST(request: NextRequest) {
  try {
    const { organizationSlug, contentType, customTopic } = await request.json();

    // 1. OBTENER ORGANIZACIÓN
    const organization = await prisma.organization.findFirst({
      where: { slug: organizationSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organización no encontrada" }, { status: 404 });
    }

    // 2. OBTENER PERFIL COMPLETO DE EMPRESA
    const profile = await prisma.businessProfile.findUnique({
      where: { organizationId: organization.id },
    });

    if (!profile) {
      return NextResponse.json({ 
        error: "Primero debes completar el perfil de tu empresa",
        redirectTo: `/app/${organizationSlug}/marketing/profile`
      }, { status: 400 });
    }

    // 3. CONSTRUIR CONTEXTO COMPLETO DE LA EMPRESA
    const businessContext = `
INFORMACIÓN DE LA EMPRESA:
- Nombre: ${profile.businessName || 'No especificado'}
- Industria: ${profile.industry || 'No especificada'}
- Descripción: ${profile.description || 'No especificada'}
- Tagline: ${profile.tagline || 'No especificado'}
- Ubicación: ${profile.location || 'No especificada'}
- Año de fundación: ${profile.foundedYear || 'No especificado'}
- Sitio web: ${profile.websiteUrl || 'No especificado'}

PÚBLICO OBJETIVO:
- Cliente ideal: ${profile.targetAudience || 'No especificado'}
- Rango de edad: ${profile.ageRangeMin || 18} - ${profile.ageRangeMax || 65} años
- Género objetivo: ${profile.targetGender || 'Todos'}
- Ubicaciones objetivo: ${Array.isArray(profile.targetLocations) ? profile.targetLocations.join(', ') : profile.targetLocations || 'No especificadas'}
- Problemas que resuelve: ${profile.customerPainPoints || 'No especificados'}

VOZ DE MARCA:
- Personalidad: ${Array.isArray(profile.brandPersonality) ? profile.brandPersonality.join(', ') : profile.brandPersonality || 'Profesional'}
- Tono de voz: ${profile.toneOfVoice || 'Amigable y profesional'}
- Usa emojis: ${profile.useEmojis ? 'Sí' : 'No'}
- Estilo de emojis: ${profile.emojiStyle || 'Moderado'}
- Palabras a usar: ${Array.isArray(profile.wordsToUse) && profile.wordsToUse.length > 0 ? profile.wordsToUse.join(', ') : 'No especificadas'}
- Palabras a evitar: ${Array.isArray(profile.wordsToAvoid) && profile.wordsToAvoid.length > 0 ? profile.wordsToAvoid.join(', ') : 'No especificadas'}
- Hashtags de marca: ${Array.isArray(profile.hashtagsToUse) && profile.hashtagsToUse.length > 0 ? profile.hashtagsToUse.map(h => '#' + h).join(' ') : 'No especificados'}

PRODUCTOS/SERVICIOS:
${profile.mainProducts || profile.services || 'No especificados'}
- Rango de precios: ${profile.priceRange || 'No especificado'}
- Propuesta única de valor: ${profile.uniqueSellingPoint || 'No especificada'}

OBJETIVOS DE MARKETING:
- Objetivos: ${Array.isArray(profile.marketingGoals) ? profile.marketingGoals.join(', ') : profile.marketingGoals || 'No especificados'}
- Frecuencia de publicación: ${(profile.contentPreferences as any)?.postingFrequency || 'Diaria'}

REDES SOCIALES:
- Instagram: ${profile.instagramUrl || 'No configurado'}
- Facebook: ${profile.facebookUrl || 'No configurado'}
- TikTok: ${profile.tiktokUrl || 'No configurado'}
`.trim();

    // 4. DETERMINAR TIPO DE CONTENIDO
    const contentTypes: Record<string, string> = {
      'promotional': 'Promocionar un producto o servicio de la empresa. Destacar beneficios y llamada a la acción.',
      'educational': 'Contenido educativo que posicione a la empresa como experta. Tips, consejos, datos útiles para el público objetivo.',
      'entertaining': 'Contenido entretenido y cercano. Mostrar el lado humano de la empresa, humor relacionado con la industria.',
      'behind-scenes': 'Mostrar el detrás de escenas. El equipo, el proceso de trabajo, el día a día de la empresa.',
      'testimonial': 'Destacar resultados de clientes o casos de éxito (sin inventar nombres reales).',
      'news': 'Compartir una novedad, actualización o logro de la empresa.',
      'engagement': 'Post diseñado para generar interacción. Preguntas, encuestas, opiniones.',
      'surprise': 'Elige tú el mejor tipo de contenido basándote en los objetivos de marketing de la empresa.',
    };

    const selectedType = contentType || 'surprise';
    const typeInstruction = contentTypes[selectedType] || contentTypes['surprise'];

    // 5. GENERAR CONTENIDO CON CLAUDE
    const prompt = `Eres un experto en marketing digital y community manager profesional.

${businessContext}

TIPO DE CONTENIDO A CREAR:
${typeInstruction}

${customTopic ? `TEMA ESPECÍFICO DEL CLIENTE: ${customTopic}` : 'El cliente NO ha especificado un tema. Tú debes elegir el mejor tema basándote en el perfil de la empresa, sus productos/servicios y objetivos de marketing.'}

INSTRUCCIONES:
1. Genera EXACTAMENTE 3 variaciones de posts para Instagram
2. Cada post debe ser ÚNICO en enfoque pero coherente con la marca
3. Usa el tono de voz y personalidad especificados
4. ${profile.useEmojis ? 'Incluye emojis de forma natural' : 'NO uses emojis'}
5. Incluye hashtags relevantes (máximo 10 por post)
6. El texto debe ser óptimo para Instagram (máximo 2200 caracteres, pero idealmente 150-300)
7. IMPORTANTE: El contenido debe parecer escrito por la propia empresa, no por una IA

RESPONDE EN ESTE FORMATO JSON EXACTO:
{
  "variations": [
    {
      "text": "Texto completo del post aquí...",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
      "hook": "Primera línea que engancha (para preview)",
      "callToAction": "Llamada a la acción del post",
      "bestTimeToPost": "Mejor hora para publicar este tipo de contenido",
      "contentType": "promotional|educational|entertaining|behind-scenes|testimonial|news|engagement"
    }
  ],
  "reasoning": "Breve explicación de por qué elegiste estos temas/enfoques"
}`;

    console.log('Generating content with Claude...');

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    // Parsear respuesta
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    let parsedResponse;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      return NextResponse.json({ error: "Error al generar contenido" }, { status: 500 });
    }

    const variations = parsedResponse.variations || [];

    // 6. GENERAR IMÁGENES PARA CADA VARIACIÓN
    console.log('Generating images for variations...');
    
    const variationsWithImages = await Promise.all(
      variations.map(async (variation: any, index: number) => {
        // Crear prompt realista basado en la industria y contenido
        const imagePrompt = createRealisticImagePrompt(
          profile?.industry || 'technology',
          variation.text || '',
          variation.contentType || 'promotional'
        );

        console.log('Image prompt:', imagePrompt.slice(0, 100));

        const imageUrl = await generateImage(imagePrompt, index);
        
        return {
          ...variation,
          imageUrl,
        };
      })
    );

    return NextResponse.json({ 
      variations: variationsWithImages,
      reasoning: parsedResponse.reasoning,
      businessName: profile.businessName,
    });

  } catch (error: any) {
    console.error("Error generating content:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

