import Anthropic from "@anthropic-ai/sdk";

// Tipos
interface BusinessContext {
  identity: {
    businessName: string;
    slogan?: string;
    shortDescription?: string;
    uniqueValue?: string;
    brandPersonality?: string;
    brandValues?: string[];
    foundingStory?: string;
    ownerName?: string;
    city?: string;
    neighborhood?: string;
    industry?: string;
    subIndustry?: string;
  };
  audience: {
    idealCustomer?: string;
    customerPains?: string[];
    customerDesires?: string[];
    interests?: string[];
    ageRangeMin?: number;
    ageRangeMax?: number;
  };
  style: {
    formalityLevel?: number;
    humorLevel?: number;
    emojiUsage?: string;
    favoriteEmojis?: string[];
    signaturePhrases?: string[];
    bannedWords?: string[];
    favoriteCTAs?: string[];
    fixedHashtags?: string[];
    preferredLength?: string;
    useLineBreaks?: boolean;
  };
  products?: Array<{
    name: string;
    shortDescription?: string;
    price?: number;
    features?: string[];
    isBestseller?: boolean;
    isNew?: boolean;
    promotionHook?: string;
  }>;
  activeEvents?: Array<{
    eventType: string;
    title: string;
    prize?: string;
    discountValue?: number;
    discountCode?: string;
    endDate?: string;
  }>;
}

interface ContentRequest {
  contentType:
    | "promocional"
    | "educativo"
    | "engagement"
    | "behind_scenes"
    | "testimonio"
    | "sorteo"
    | "oferta"
    | "lanzamiento"
    | "historia"
    | "equipo";
  platform: "instagram" | "facebook" | "tiktok" | "stories";
  productId?: string;
  eventId?: string;
  customPrompt?: string;
  includeImage?: boolean;
}

interface GeneratedContent {
  mainText: string;
  hashtags: string[];
  suggestedCTA: string;
  imagePrompt?: string;
  alternativeVersions?: string[];
  platform: string;
  contentType: string;
}

export class ContentGenerator {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  async generateContent(
    context: BusinessContext,
    request: ContentRequest
  ): Promise<GeneratedContent> {
    const systemPrompt = this.buildSystemPrompt(context);
    const userPrompt = this.buildUserPrompt(context, request);

    const response = await this.anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    return this.parseResponse(content.text, request);
  }

  private buildSystemPrompt(context: BusinessContext): string {
    const { identity, audience, style } = context;

    const formalityMap: Record<number, string> = {
      1: "muy informal y coloquial, como hablando con amigos",
      2: "informal pero respetuoso",
      3: "equilibrado, ni muy formal ni muy informal",
      4: "profesional y educado",
      5: "muy formal y corporativo",
    };

    const humorMap: Record<number, string> = {
      1: "serio y directo, sin humor",
      2: "ocasionalmente ligero pero principalmente serio",
      3: "equilibrado, con toques de humor cuando es apropiado",
      4: "divertido y con personalidad",
      5: "muy gracioso y desenfadado",
    };

    const emojiMap: Record<string, string> = {
      none: "NO uses emojis bajo ninguna circunstancia",
      minimal: "usa máximo 1-2 emojis por post, solo al principio o final",
      moderate:
        "usa 3-5 emojis distribuidos naturalmente en el texto",
      heavy:
        "usa muchos emojis para dar energía y personalidad al texto",
    };

    const lengthMap: Record<string, string> = {
      short: "Posts muy cortos, 1-2 líneas máximo. Directo al grano.",
      medium:
        "Posts de longitud media, 3-5 líneas. Suficiente para explicar pero sin aburrir.",
      long: "Posts largos y detallados, 6+ líneas. Storytelling completo.",
    };

    return `Eres el community manager experto de "${identity.businessName || "este negocio"}".

## IDENTIDAD DEL NEGOCIO
- Nombre: ${identity.businessName || "No especificado"}
- Slogan: ${identity.slogan || "No tiene"}
- Descripción: ${identity.shortDescription || "No especificada"}
- Industria: ${identity.industry || "General"} ${identity.subIndustry ? `(${identity.subIndustry})` : ""}
- Ubicación: ${identity.neighborhood ? `${identity.neighborhood}, ` : ""}${identity.city || "No especificada"}
- Propuesta de valor única: ${identity.uniqueValue || "No especificada"}
- Historia: ${identity.foundingStory || "No especificada"}
- Propietario: ${identity.ownerName || "No especificado"}
- Personalidad de marca: ${identity.brandPersonality || "cercano"}
- Valores: ${identity.brandValues?.join(", ") || "No especificados"}

## AUDIENCIA OBJETIVO
- Cliente ideal: ${audience.idealCustomer || "No especificado"}
- Rango de edad: ${audience.ageRangeMin || 18}-${audience.ageRangeMax || 65} años
- Problemas que tienen: ${audience.customerPains?.join(", ") || "No especificados"}
- Lo que desean: ${audience.customerDesires?.join(", ") || "No especificado"}
- Intereses: ${audience.interests?.join(", ") || "No especificados"}

## ESTILO DE COMUNICACIÓN (MUY IMPORTANTE - SIGUE ESTO AL PIE DE LA LETRA)
- Tono: ${formalityMap[style.formalityLevel || 3]}
- Humor: ${humorMap[style.humorLevel || 3]}
- Emojis: ${emojiMap[style.emojiUsage || "moderate"]}
${style.favoriteEmojis?.length ? `- Emojis favoritos para usar: ${style.favoriteEmojis.join(" ")}` : ""}
- Longitud: ${lengthMap[style.preferredLength || "medium"]}
${style.useLineBreaks ? "- Usa saltos de línea para separar ideas y hacer el texto más legible" : "- Escribe en párrafos continuos sin muchos saltos de línea"}
${style.signaturePhrases?.length ? `- Frases características que DEBES usar cuando sea natural: "${style.signaturePhrases.join('", "')}"` : ""}
${style.bannedWords?.length ? `- Palabras PROHIBIDAS que NUNCA debes usar: ${style.bannedWords.join(", ")}` : ""}
${style.favoriteCTAs?.length ? `- CTAs favoritos para usar: "${style.favoriteCTAs.join('", "')}"` : ""}
${style.fixedHashtags?.length ? `- Hashtags que SIEMPRE debes incluir: ${style.fixedHashtags.join(" ")}` : ""}

## REGLAS IMPORTANTES
1. Escribe SIEMPRE como si fueras el negocio, en primera persona del plural (nosotros) o singular según el tono
2. El contenido debe sonar AUTÉNTICO, no como un template genérico de marketing
3. Adapta el mensaje a la audiencia específica del negocio
4. Si hay una historia o propietario con nombre, úsalo para humanizar cuando sea apropiado
5. Los hashtags deben ser relevantes para el nicho específico, no genéricos
6. Respeta ESTRICTAMENTE las preferencias de emojis, longitud y tono
7. Nunca inventes datos o precios - usa solo la información proporcionada
8. Si el negocio tiene ubicación, menciónala cuando sea relevante (especialmente para contenido local)`;
  }

  private buildUserPrompt(
    context: BusinessContext,
    request: ContentRequest
  ): string {
    const { contentType, platform, customPrompt } = request;

    let productInfo = "";
    if (request.productId && context.products) {
      const product = context.products.find(
        (p) => p.name === request.productId
      );
      if (product) {
        productInfo = `
## PRODUCTO A PROMOCIONAR
- Nombre: ${product.name}
- Descripción: ${product.shortDescription || "No especificada"}
- Precio: ${product.price ? `${product.price}€` : "No especificado"}
- Características: ${product.features?.join(", ") || "No especificadas"}
- Es bestseller: ${product.isBestseller ? "Sí" : "No"}
- Es novedad: ${product.isNew ? "Sí" : "No"}
- Frase gancho: ${product.promotionHook || "No tiene"}`;
      }
    }

    let eventInfo = "";
    if (request.eventId && context.activeEvents) {
      const event = context.activeEvents.find(
        (e) => e.title === request.eventId
      );
      if (event) {
        eventInfo = `
## EVENTO/PROMOCIÓN ACTIVA
- Tipo: ${event.eventType}
- Título: ${event.title}
${event.prize ? `- Premio: ${event.prize}` : ""}
${event.discountValue ? `- Descuento: ${event.discountValue}` : ""}
${event.discountCode ? `- Código: ${event.discountCode}` : ""}
${event.endDate ? `- Fecha fin: ${event.endDate}` : ""}`;
      }
    }

    let productsReference = "";
    if (context.products && context.products.length > 0) {
      productsReference = `
## PRODUCTOS/SERVICIOS DISPONIBLES (para referencia)
${context.products
  .slice(0, 10)
  .map(
    (p) =>
      `- ${p.name}${p.isBestseller ? " ⭐" : ""}${p.isNew ? " 🆕" : ""}${p.price ? ` (${p.price}€)` : ""}`
  )
  .join("\n")}`;
    }

    const contentTypeDescriptions: Record<string, string> = {
      promocional:
        "Post promocionando el negocio o un producto/servicio específico. Destaca beneficios y genera deseo de compra.",
      educativo:
        "Post educativo que aporta valor. Tips, consejos, datos interesantes relacionados con tu industria. Posiciona al negocio como experto.",
      engagement:
        "Post diseñado para generar interacción. Preguntas, encuestas, 'esto o aquello', opiniones. El objetivo es que comenten.",
      behind_scenes:
        "Post mostrando el detrás de cámaras. El proceso, el equipo trabajando, la preparación. Humaniza la marca.",
      testimonio:
        "Post compartiendo una experiencia positiva de cliente (sin inventar nombres específicos, habla en general de clientes satisfechos).",
      sorteo:
        "Post anunciando un sorteo o giveaway. Debe incluir el premio, las reglas claras para participar y la fecha límite.",
      oferta:
        "Post anunciando una oferta o descuento especial. Crea urgencia y destaca el ahorro.",
      lanzamiento:
        "Post anunciando un nuevo producto o servicio. Genera expectativa y emoción.",
      historia:
        "Post contando una historia del negocio, su origen, anécdotas. Storytelling puro.",
      equipo:
        "Post presentando al equipo o a un miembro. Humaniza la marca mostrando las personas detrás.",
    };

    const platformSpecs: Record<string, string> = {
      instagram:
        "Para Instagram Feed. Máximo 2200 caracteres pero idealmente menos de 500. Los hashtags van al final (máximo 30 pero recomendado 10-15).",
      facebook:
        "Para Facebook. Puede ser más largo y explicativo. Menos hashtags (3-5 máximo). Tono puede ser ligeramente más formal.",
      tiktok:
        "Para descripción de TikTok. Muy corto y directo (máximo 150 caracteres). 3-5 hashtags relevantes. Tono joven y dinámico.",
      stories:
        "Para Instagram/Facebook Stories. Una o dos frases muy cortas. Puede incluir call to action directo. Máximo 2-3 líneas.",
    };

    return `Genera un post de tipo "${contentType}" para ${platform}.

## TIPO DE CONTENIDO
${contentTypeDescriptions[contentType] || "Post general"}

## PLATAFORMA
${platformSpecs[platform] || "Red social general"}

${productInfo}
${eventInfo}
${productsReference}

${customPrompt ? `## INDICACIONES ADICIONALES DEL USUARIO\n${customPrompt}` : ""}

## FORMATO DE RESPUESTA
Responde EXACTAMENTE en este formato JSON:

{
  "mainText": "El texto principal del post completo, con saltos de línea donde corresponda",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "suggestedCTA": "El call to action sugerido",
  "imagePrompt": "Descripción de qué imagen iría bien con este post (para buscar o generar)",
  "alternativeVersion": "Una versión alternativa más corta o con diferente enfoque"
}

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional antes o después.`;
  }

  private parseResponse(
    text: string,
    request: ContentRequest
  ): GeneratedContent {
    try {
      const cleanText = text
        .trim()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "");
      const parsed = JSON.parse(cleanText);

      return {
        mainText: parsed.mainText || "",
        hashtags: parsed.hashtags || [],
        suggestedCTA: parsed.suggestedCTA || "",
        imagePrompt: parsed.imagePrompt,
        alternativeVersions: parsed.alternativeVersion
          ? [parsed.alternativeVersion]
          : [],
        platform: request.platform,
        contentType: request.contentType,
      };
    } catch {
      return {
        mainText: text,
        hashtags: [],
        suggestedCTA: "",
        platform: request.platform,
        contentType: request.contentType,
      };
    }
  }

  async generateVariants(
    context: BusinessContext,
    request: ContentRequest,
    count = 3
  ): Promise<GeneratedContent[]> {
    const variants: GeneratedContent[] = [];

    for (let i = 0; i < count; i++) {
      const variant = await this.generateContent(context, {
        ...request,
        customPrompt: `${request.customPrompt || ""}\n\nEsta es la variante ${i + 1} de ${count}. Hazla diferente a las anteriores en tono o enfoque.`,
      });
      variants.push(variant);
    }

    return variants;
  }

  async generateContentCalendar(
    context: BusinessContext,
    days = 7
  ): Promise<Array<{ day: number; contentType: string; suggestion: string }>> {
    const contentTypes = [
      "promocional",
      "educativo",
      "engagement",
      "behind_scenes",
      "promocional",
      "historia",
      "engagement",
    ];

    const calendar = [];
    for (let i = 0; i < days; i++) {
      calendar.push({
        day: i + 1,
        contentType: contentTypes[i % contentTypes.length],
        suggestion: `Día ${i + 1}: Post ${contentTypes[i % contentTypes.length]}`,
      });
    }

    return calendar;
  }
}

export const contentGenerator = new ContentGenerator();


