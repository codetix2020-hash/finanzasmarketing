import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/database";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Buscar imagen de stock profesional en Unsplash (SIEMPRE FUNCIONA)
async function getStockImage(contentType: string, industry: string): Promise<string> {
  const searchTerms: Record<string, string[]> = {
    'direct': ['business meeting', 'team success', 'modern office', 'laptop workspace'],
    'storytelling': ['coffee shop work', 'creative team', 'startup office', 'entrepreneur'],
    'educational': ['notebook desk', 'learning workspace', 'professional planning', 'strategy meeting'],
    'promotional': ['product showcase', 'business professional', 'modern technology', 'success celebration'],
    'default': ['business professional', 'modern workspace', 'team collaboration', 'office lifestyle'],
  };

  const industryTerms: Record<string, string> = {
    'technology': 'tech,software,computer',
    'desarrollo web': 'coding,developer,laptop',
    'marketing': 'marketing,creative,digital',
    'diseño': 'design,creative,minimal',
    'default': 'business,professional,modern',
  };

  const contentTerms = searchTerms[contentType] || searchTerms['default'];
  const randomTerm = contentTerms[Math.floor(Math.random() * contentTerms.length)];
  const industryTerm = industryTerms[industry?.toLowerCase()] || industryTerms['default'];

  // Unsplash Source API - fotos REALES de fotógrafos profesionales
  const query = encodeURIComponent(`${randomTerm},${industryTerm}`);
  const timestamp = Date.now();
  
  // Esta URL SIEMPRE devuelve una imagen real
  return `https://source.unsplash.com/1080x1080/?${query}&t=${timestamp}`;
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

    // OBTENER IMÁGENES - SIEMPRE usar Unsplash (fotos reales que Instagram puede descargar)
    const variationsWithImages = await Promise.all(
      variations.map(async (variation: any, index: number) => {
        // SIEMPRE usar Unsplash - fotos reales que Instagram puede descargar
        const imageUrl = await getStockImage(
          variation.style || contentType || 'promotional',
          profile.industry || 'technology'
        );
        
        console.log(`Variation ${index}: Stock photo URL:`, imageUrl);

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
