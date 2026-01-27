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
async function getStockImage(customQuery: string, industry: string): Promise<string> {
  // Limpiar y mejorar el query
  let searchQuery = customQuery || `${industry} business`;
  
  // Agregar términos que mejoran calidad en Pexels
  const qualityTerms = ['minimal', 'professional', 'modern'];
  const randomQuality = qualityTerms[Math.floor(Math.random() * qualityTerms.length)];
  searchQuery = `${searchQuery} ${randomQuality}`;
  
  console.log('Pexels search:', searchQuery);

  if (process.env.PEXELS_API_KEY) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=20&orientation=square`,
        {
          headers: { 'Authorization': process.env.PEXELS_API_KEY },
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.photos && data.photos.length > 0) {
          // Filtrar fotos muy pequeñas
          const goodPhotos = data.photos.filter((p: any) => p.width >= 1000);
          const photos = goodPhotos.length > 0 ? goodPhotos : data.photos;
          
          const randomIndex = Math.floor(Math.random() * Math.min(photos.length, 10));
          const photo = photos[randomIndex];
          
          return photo.src.large2x || photo.src.large || photo.src.original;
        }
      }
    } catch (err) {
      console.error('Pexels error:', err);
    }
  }

  // Fallback
  return `https://picsum.photos/1080/1080?random=${Date.now()}`;
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

    // PROMPT MEJORADO - MÁS HUMANO
    const prompt = `Eres un Social Media Manager freelance con 8 años de experiencia. Manejas la cuenta de Instagram de esta empresa y te pagan por resultados.

EMPRESA:
- Nombre: ${profile.businessName}
- Qué hacen: ${profile.description}
- Industria: ${profile.industry}
- Público: ${profile.targetAudience || 'No especificado'}
- Tono: ${profile.toneOfVoice || 'Profesional pero cercano'}
- Emojis: ${profile.useEmojis ? 'Sí, con moderación' : 'Muy pocos'}
- Propuesta única: ${profile.uniqueSellingPoint || 'No especificada'}
- Productos/Servicios: ${profile.mainProducts ? JSON.stringify(profile.mainProducts) : profile.services ? JSON.stringify(profile.services) : 'No especificado'}

${topic ? `TEMA DEL POST: ${topic}` : 'TEMA: Elige tú el mejor tema para hoy basándote en la empresa'}
${contentType && contentType !== 'auto' ? `TIPO: ${contentType}` : 'TIPO: Decide qué tipo de post funcionará mejor'}

CÓMO ESCRIBES TÚ (un humano real):
- Escribes como si hablaras con un amigo que tiene un negocio
- NUNCA empiezas con emoji + pregunta retórica (eso es de bots)
- Usas frases cortas. Párrafos de 1-2 líneas máximo.
- El gancho es TODO. Si no enganchas en 1 segundo, pierdes.
- Cuentas mini-historias reales o creíbles
- El CTA es natural, no forzado

PROHIBIDO (esto delata que es IA):
- "¿Sabías que...?" como inicio
- "En el mundo actual..." / "En la era digital..."
- "¡Descubre cómo...!" 
- "Es importante destacar que..."
- Emojis al inicio de cada línea 🚀💡✨
- Más de 3 hashtags seguidos
- Preguntas retóricas obvias

EJEMPLOS BUENOS (copia este estilo):
---
"3 semanas. Eso tardamos en lanzar la app de María.
Ella tenía la idea hace 2 años. Nosotros la ejecutamos en 21 días.
¿Tienes algo guardado en notas del móvil? Hablemos."
---
"No voy a mentirte: el 80% de los proyectos web fallan.
Pero no por la tecnología. Fallan porque nadie validó la idea antes de construir.
Nosotros primero preguntamos, después programamos."
---
"Cliente real, historia real:
Llegó con un Excel de 47 pestañas. 'Es mi sistema de reservas', dijo.
Hoy tiene una app. Tarda 10 segundos en lo que antes tardaba 10 minutos."
---

Genera 3 variaciones MUY diferentes entre sí.

JSON (sin markdown, sin backticks):
{
  "variations": [
    {
      "text": "texto del post SIN hashtags",
      "hashtags": ["sin#", "maximo5"],
      "hook": "gancho en 5 palabras",
      "style": "direct|storytelling|educational",
      "imageSearchQuery": "query en inglés para Pexels, 3-4 palabras, específico para ESTA empresa"
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
