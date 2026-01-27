import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Buscar imagen de stock profesional en Unsplash
async function getStockImage(contentType: string, industry: string): Promise<string> {
  // Mapeo de tipo de contenido a búsquedas de stock realistas
  const searchTerms: Record<string, string[]> = {
    'promotional': ['product photography', 'business professional', 'modern office', 'team success'],
    'educational': ['laptop workspace', 'notebook pen', 'learning study', 'professional desk'],
    'entertaining': ['coffee break', 'team celebration', 'office fun', 'workspace lifestyle'],
    'behind-scenes': ['team meeting', 'office candid', 'workspace real', 'business casual'],
    'tips': ['checklist notebook', 'organized desk', 'planning strategy', 'professional advice'],
    'news': ['business newspaper', 'announcement celebration', 'milestone achievement', 'company growth'],
  };

  const industryTerms: Record<string, string> = {
    'technology': 'tech,software,digital',
    'desarrollo web': 'coding,developer,programming',
    'marketing': 'marketing,creative,strategy',
    'diseño': 'design,creative,minimal',
    'consultoría': 'business,consulting,professional',
    'default': 'business,professional,modern',
  };

  const contentTerms = searchTerms[contentType] || searchTerms['promotional'];
  const randomTerm = contentTerms[Math.floor(Math.random() * contentTerms.length)];
  const industryTerm = industryTerms[industry.toLowerCase()] || industryTerms['default'];

  // Unsplash Source API - imágenes reales de fotógrafos profesionales
  const query = encodeURIComponent(`${randomTerm},${industryTerm}`);
  const timestamp = Date.now(); // Para evitar caché y obtener variedad
  
  return `https://source.unsplash.com/1080x1080/?${query}&${timestamp}`;
}

// Buscar en el banco de fotos del usuario primero
async function getUserImage(organizationId: string): Promise<string | null> {
  try {
    const media = await prisma.mediaLibrary.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (media.length > 0) {
      // Seleccionar una imagen aleatoria del banco del usuario
      const randomMedia = media[Math.floor(Math.random() * media.length)];
      return randomMedia.fileUrl;
    }
  } catch (err) {
    console.error('Error fetching user media:', err);
  }
  return null;
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
      "style": "direct|storytelling|educational"
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

    // OBTENER IMÁGENES - PRIORIDAD:
    // 1. Banco de fotos del usuario (si tiene)
    // 2. Fotos de stock profesionales de Unsplash

    const variationsWithImages = await Promise.all(
      variations.map(async (variation: any, index: number) => {
        let imageUrl: string;

        // Primero: intentar usar imagen del banco del usuario
        const userImage = await getUserImage(organization.id);
        
        if (userImage && Math.random() > 0.5) {
          // 50% chance de usar imagen del usuario si tiene
          imageUrl = userImage;
          console.log(`Variation ${index}: Using user's own image`);
        } else {
          // Usar stock de Unsplash (fotos reales de fotógrafos)
          imageUrl = await getStockImage(
            variation.style || contentType || 'promotional',
            profile.industry || 'technology'
          );
          console.log(`Variation ${index}: Using Unsplash stock photo`);
        }

        return {
          ...variation,
          imageUrl,
        };
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
