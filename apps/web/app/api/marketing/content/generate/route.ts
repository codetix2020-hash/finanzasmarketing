import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Buscar foto propia que coincida con el contenido
async function getBrandPhoto(
  organizationId: string, 
  contentType: string, 
  searchTerms: string[]
): Promise<string | null> {
  try {
    // Buscar fotos que coincidan con el tipo de contenido o tags
    const photos = await prisma.brandPhoto.findMany({
      where: {
        organizationId,
        OR: [
          { useFor: { hasSome: [contentType] } },
          { tags: { hasSome: searchTerms } },
          { category: contentType },
        ],
      },
    });

    if (photos.length > 0) {
      // Seleccionar una aleatoria para variedad
      const randomPhoto = photos[Math.floor(Math.random() * photos.length)];
      console.log('Using brand photo:', randomPhoto.description || randomPhoto.url);
      return randomPhoto.url;
    }
  } catch (err) {
    console.error('Error fetching brand photos:', err);
  }
  
  return null;
}

// Obtener imagen de stock de Pexels usando query personalizado de Claude
async function getStockImage(customQuery: string, fallbackIndustry: string): Promise<string> {
  // Usar el query personalizado de Claude, o fallback a industria
  const searchQuery = customQuery || `${fallbackIndustry} business`;
  
  console.log('Pexels search query:', searchQuery);

  if (process.env.PEXELS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=15&orientation=square`,
        {
          headers: {
            'Authorization': process.env.PEXELS_API_KEY,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.photos && data.photos.length > 0) {
          const randomIndex = Math.floor(Math.random() * data.photos.length);
          const photo = data.photos[randomIndex];
          const directUrl = photo.src.large2x || photo.src.large || photo.src.original;
          console.log('Pexels image found:', directUrl);
          return directUrl;
        }
      }
    } catch (err) {
      console.error('Pexels API error:', err);
    }
  }

  // Fallback: Resolver el redirect de Unsplash manualmente
  try {
    const unsplashUrl = `https://source.unsplash.com/1080x1080/?${encodeURIComponent(searchQuery)}`;
    const response = await fetch(unsplashUrl, { 
      method: 'HEAD',
      redirect: 'follow' 
    });
    
    if (response.url && response.url.includes('images.unsplash.com')) {
      console.log('Unsplash resolved URL:', response.url);
      return response.url;
    }
  } catch (err) {
    console.error('Unsplash resolve error:', err);
  }

  // Fallback final: Picsum (siempre funciona, URLs directas)
  const picsum = `https://picsum.photos/1080/1080?random=${Date.now()}`;
  console.log('Using Picsum fallback:', picsum);
  return picsum;
}

export async function POST(request: NextRequest) {
  try {
    const { organizationSlug, topic, contentType, platform } = await request.json();

    const organization = await prisma.organization.findFirst({
      where: { slug: organizationSlug },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const profile = await prisma.businessProfile.findUnique({
      where: { organizationId: organization.id },
    });

    if (!profile) {
      return NextResponse.json({ 
        error: "Primero debes completar el perfil de tu empresa",
        redirectTo: `/app/${organizationSlug}/marketing/profile`
      }, { status: 400 });
    }

    // PROMPT QUE PIENSA COMO HUMANO
    const prompt = `Eres un Social Media Manager profesional con 5 años de experiencia manejando cuentas de empresas en Instagram.

EMPRESA QUE MANEJAS:
- Nombre: ${profile.businessName}
- Industria: ${profile.industry}
- Descripción: ${profile.description}
- Público objetivo: ${profile.targetAudience || 'Empresas y emprendedores'}
- Tono de voz: ${profile.toneOfVoice || 'Profesional pero cercano'}
- Usa emojis: ${profile.useEmojis ? 'Sí, con moderación' : 'Muy pocos o ninguno'}

TU TAREA:
${contentType && contentType !== 'auto' 
  ? `Crear un post de tipo: ${contentType}` 
  : 'Decidir qué tipo de post sería más efectivo hoy'}
${topic ? `Tema específico: ${topic}` : 'Elige un tema relevante basándote en la empresa'}

PIENSA COMO LO HARÍA UN HUMANO:
1. ¿Qué quiero que mi audiencia sienta/haga al ver este post?
2. ¿Qué gancho uso para captar atención en los primeros 2 segundos?
3. ¿Cómo escribo esto de forma natural, no robótica?
4. ¿Qué call-to-action tiene sentido?

REGLAS DE UN BUEN SOCIAL MEDIA MANAGER:
- NUNCA escribas como IA (nada de "En el mundo actual...", "¿Sabías que...?", "Es importante destacar...")
- Escribe como hablarías con un cliente en persona
- Usa frases cortas y directas
- El primer párrafo es el gancho - hazlo irresistible
- Los hashtags van al final, no interrumpen el texto
- Máximo 5-7 hashtags relevantes, no spam
- Si usas emojis, que sean naturales, no al inicio de cada línea

EJEMPLOS DE LO QUE NO QUIERO (típico de IA):
❌ "🚀 ¿Tienes una idea brillante pero no sabes cómo llevarla al mundo digital? 💡"
❌ "En la era digital actual, es fundamental..."
❌ "¡Descubre cómo transformar tu negocio!"

EJEMPLOS DE LO QUE SÍ QUIERO (humano real):
✅ "La semana pasada un cliente nos dijo: 'Tengo la idea, pero no sé por dónde empezar'. Le construimos su app en 3 semanas."
✅ "Esto es lo que nadie te cuenta sobre lanzar un producto digital..."
✅ "Pregunta honesta: ¿cuántas ideas tienes guardadas en notas del móvil que nunca ejecutaste?"

SOBRE LA IMAGEN (imageSearchQuery):
Piensa como un Social Media Manager buscando la foto PERFECTA en Pexels/Unsplash.
- La foto debe ser ESPECÍFICA para esta empresa y este post
- NO uses términos genéricos como "business" o "professional"
- USA términos que describan exactamente lo que debería mostrar la foto
- El query debe estar en INGLÉS (Pexels funciona mejor en inglés)
- 3-5 palabras máximo, muy específicas

EJEMPLOS por industria:
- Si la empresa es una PANADERÍA y el post habla de croissants → "fresh croissants bakery display"
- Si la empresa es de DESARROLLO WEB y el post habla de apps → "smartphone app interface hand"
- Si la empresa es un RESTAURANTE y el post habla de reservas → "restaurant table reservation elegant"
- Si la empresa es un GIMNASIO y el post habla de resultados → "before after fitness transformation"

La foto debe COMPLEMENTAR el texto, no ser genérica.

Genera EXACTAMENTE 3 variaciones diferentes. Cada una con enfoque distinto:
1. Una más directa/vendedora
2. Una más storytelling/emocional  
3. Una más educativa/valor

Responde SOLO con JSON válido (sin markdown):
{
  "variations": [
    {
      "text": "El texto completo del post (SIN hashtags en el texto)",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
      "hook": "El gancho principal en 5 palabras",
      "style": "direct|storytelling|educational",
      "imageSearchQuery": "query específico para buscar la foto perfecta en un banco de imágenes (en inglés, 3-5 palabras, MUY específico para esta empresa y este post)"
    }
  ]
}`;

    console.log('Generating human-like content for:', profile.businessName);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) cleanedResponse = cleanedResponse.slice(7);
    if (cleanedResponse.startsWith('```')) cleanedResponse = cleanedResponse.slice(3);
    if (cleanedResponse.endsWith('```')) cleanedResponse = cleanedResponse.slice(0, -3);
    cleanedResponse = cleanedResponse.trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      return NextResponse.json({ error: "Error al generar contenido" }, { status: 500 });
    }

    const variations = parsed.variations || [];

    // OBTENER IMÁGENES - PRIORIDAD: Fotos propias primero, luego stock
    const variationsWithImages = await Promise.all(
      variations.map(async (variation: any, index: number) => {
        // PRIORIDAD 1: Foto propia del negocio
        const brandPhoto = await getBrandPhoto(
          organization.id,
          variation.style || contentType || 'promotional',
          variation.imageSearchQuery?.split(' ') || []
        );
        
        if (brandPhoto) {
          console.log(`Variation ${index}: Using BRAND photo`);
          return { ...variation, imageUrl: brandPhoto, isOwnPhoto: true };
        }
        
        // PRIORIDAD 2: Stock de Pexels
        const stockPhoto = await getStockImage(
          variation.imageSearchQuery,
          profile.industry || 'business'
        );
        
        console.log(`Variation ${index}: Using stock photo - Query="${variation.imageSearchQuery}"`);
        return { ...variation, imageUrl: stockPhoto, isOwnPhoto: false };
      })
    );

    return NextResponse.json({ 
      variations: variationsWithImages,
      companyName: profile.businessName,
    });

  } catch (error: any) {
    console.error("Error generating content:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
