import Anthropic from "@anthropic-ai/sdk";
import { d2cTemplates, getTemplatesForProductType, getTemplatesForPlatform } from "../templates/d2c-templates";

// Tipos
interface D2CBusinessContext {
  // Marca
  brandName: string;
  tagline?: string;
  productCategory: string;
  brandStory?: string;
  yearFounded?: string;

  // Producto
  priceRange: string;
  avgPrice?: string;
  uniqueSellingPoints: string[];
  materials?: string[];
  madeIn?: string;
  certifications?: string[];
  bestSellers?: string;

  // Cliente
  targetAge: string;
  targetGender: string;
  targetLocation: string[];
  customerPains: string[];
  customerDesires: string[];
  competitors?: string[];

  // Voz
  brandPersonality: string;
  toneFormality: number;
  useEmojis: boolean;
  favoriteEmojis?: string[];
  wordsToUse?: string[];
  wordsToAvoid?: string[];
  sampleCaption?: string;

  // Visual
  photoStyle?: string;
  brandColors?: string[];

  // Productos específicos (del catálogo)
  products?: Array<{
    name: string;
    shortDescription?: string;
    price?: number;
    features?: string[];
    isBestseller?: boolean;
    isNew?: boolean;
    promotionHook?: string;
  }>;

  // Eventos activos
  activeEvents?: Array<{
    eventType: string;
    title: string;
    discountValue?: number;
    discountCode?: string;
    endDate?: string;
  }>;
}

interface D2CContentRequest {
  contentType: "producto" | "engagement" | "social_proof" | "behind_scenes" | "urgencia" | "educativo" | "storytelling" | "oferta";
  platform: "instagram" | "facebook" | "tiktok" | "stories";
  templateId?: string; // Template específico a usar
  productId?: string; // Si es sobre un producto específico
  eventId?: string; // Si es sobre un evento específico
  customPrompt?: string; // Indicaciones adicionales
  includeImageSuggestion?: boolean;
}

interface GeneratedD2CContent {
  mainText: string;
  hashtags: string[];
  suggestedCTA: string;
  imagePrompt?: string;
  imageSearchQuery?: string; // Para buscar en Pexels
  alternativeVersion?: string;
  templateUsed?: string;
  platform: string;
  contentType: string;
}

export class D2CContentGenerator {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }

  async generateContent(
    context: D2CBusinessContext,
    request: D2CContentRequest
  ): Promise<GeneratedD2CContent> {
    const systemPrompt = this.buildD2CSystemPrompt(context);
    const userPrompt = this.buildD2CUserPrompt(context, request);

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

  private buildD2CSystemPrompt(context: D2CBusinessContext): string {
    // Mapear personalidad de marca
    const personalityDescriptions: Record<string, string> = {
      minimal_elegante: "Sofisticado, limpio, menos es más. Usa espacios, frases cortas, elegancia sin esfuerzo.",
      fun_colorful: "Alegre, juvenil, atrevido. Usa exclamaciones, emojis coloridos, energía contagiosa.",
      eco_conscious: "Consciente, natural, honesto. Habla de sostenibilidad sin ser preachy, conecta con valores.",
      bold_edgy: "Rompedor, único, statement. Opiniones fuertes, lenguaje directo, no tienes miedo de destacar.",
      romantic_soft: "Delicado, femenino, soñador. Usa palabras bonitas, metáforas suaves, crea atmósfera.",
      urban_street: "Callejero, actual, real. Jerga moderna, referencias culturales, sin filtros.",
      luxury_premium: "Exclusivo, aspiracional, selecto. Vocabulario elevado, crea deseo, menos es más.",
      artesanal_handmade: "Hecho con amor, único, con historia. Habla del proceso, las manos detrás, la dedicación.",
    };

    // Mapear tono de formalidad
    const formalityDescriptions: Record<number, string> = {
      1: "Muy cercano y casual. Hablas como a una amiga. Usa 'tú', expresiones coloquiales, incluso algo de jerga.",
      2: "Cercano pero cuidado. Amigable, accesible, pero con un toque de profesionalidad.",
      3: "Equilibrado. Ni muy formal ni muy casual. Profesional pero humano.",
      4: "Profesional. Cuidas el lenguaje, evitas coloquialismos, pero sin ser frío.",
      5: "Muy formal. Lenguaje elevado, trato de usted si aplica, máxima elegancia.",
    };

    // Mapear rango de precios para el tono de venta
    const priceStrategyDescriptions: Record<string, string> = {
      low: "Enfatiza el value for money, la accesibilidad, el 'no te lo pienses'.",
      mid: "Equilibrio entre calidad y precio. Justifica por qué vale lo que vale.",
      high: "Enfatiza la calidad, la inversión a largo plazo, el 'compra menos pero mejor'.",
      luxury: "Nunca hables de precio como argumento. Vende exclusividad, aspiración, pertenencia.",
    };

    return `Eres el copywriter experto de "${context.brandName}", una marca D2C de ${this.getCategoryName(context.productCategory)}.

## IDENTIDAD DE MARCA
- Nombre: ${context.brandName}
- Tagline: ${context.tagline || "No definido"}
- Categoría: ${this.getCategoryName(context.productCategory)}
- Año fundación: ${context.yearFounded || "No especificado"}
- Historia: ${context.brandStory || "No especificada"}

## PERSONALIDAD DE MARCA
${personalityDescriptions[context.brandPersonality] || "Personalidad equilibrada"}

## TONO DE COMUNICACIÓN
${formalityDescriptions[context.toneFormality] || formalityDescriptions[3]}

## EMOJIS
${context.useEmojis 
  ? `Usa emojis con moderación (3-5 por post). Favoritos de la marca: ${context.favoriteEmojis?.join(" ") || "✨ 🤍 💫"}`
  : "NO uses emojis. La marca prefiere un estilo limpio sin ellos."
}

## PRODUCTO
- Rango de precio: ${context.priceRange} - ${priceStrategyDescriptions[context.priceRange]}
- Precio medio: ${context.avgPrice ? `${context.avgPrice}€` : "No especificado"}
- Lo que hace especiales los productos: ${context.uniqueSellingPoints?.join(", ") || "No especificado"}
- Materiales: ${context.materials?.join(", ") || "No especificados"}
- Fabricación: ${context.madeIn || "No especificado"}
- Certificaciones: ${context.certifications?.join(", ") || "Ninguna"}
- Bestseller: ${context.bestSellers || "No especificado"}

## CLIENTE IDEAL
- Edad: ${context.targetAge}
- Género: ${context.targetGender}
- Ubicación: ${context.targetLocation?.join(", ") || "No especificada"}
- Problemas que tiene: ${context.customerPains?.join(", ") || "No especificados"}
- Lo que desea: ${context.customerDesires?.join(", ") || "No especificado"}
- Compite/se inspira en: ${context.competitors?.join(", ") || "No especificado"}

## VOCABULARIO
- Palabras a usar: ${context.wordsToUse?.join(", ") || "Sin restricciones"}
- Palabras PROHIBIDAS (nunca las uses): ${context.wordsToAvoid?.join(", ") || "Ninguna"}

## EJEMPLO DE ESTILO DE LA MARCA
${context.sampleCaption ? `Así escribe la marca normalmente:\n"${context.sampleCaption}"` : "No hay ejemplo disponible."}

## REGLAS CRÍTICAS
1. NUNCA inventes datos de producto (precios, materiales) que no te haya dado
2. Escribe SIEMPRE en primera persona del plural ("nosotras", "nuestra marca") o impersonal según el tono
3. El contenido debe sonar AUTÉNTICO, como si lo escribiera el dueño de la marca
4. Adapta el mensaje al cliente ideal específico de esta marca
5. Los hashtags deben ser relevantes para el nicho de ${this.getCategoryName(context.productCategory)}
6. Respeta ESTRICTAMENTE las preferencias de emojis y palabras prohibidas
7. Si es marca de lujo, NUNCA menciones "barato", "oferta", "chollo"
8. Si es marca eco/sostenible, incluye referencias a valores pero sin ser preachy

## PLATAFORMA
Adapta el contenido a la plataforma específica:
- Instagram: Visual, aspiracional, hashtags al final, max 2200 chars
- Facebook: Puede ser más largo, menos hashtags (3-5), más explicativo
- TikTok: Muy corto, directo, trending, max 150 chars
- Stories: Una frase impactante, CTA directo, máximo 2 líneas`;
  }

  private buildD2CUserPrompt(context: D2CBusinessContext, request: D2CContentRequest): string {
    // Buscar template si se especificó o seleccionar uno apropiado
    let templateInfo = "";
    if (request.templateId) {
      const template = d2cTemplates.find(t => t.id === request.templateId);
      if (template) {
        templateInfo = `
## TEMPLATE A USAR
Nombre: ${template.name}
Estructura:
${template.template}

Ejemplo de referencia:
${template.example}

Tips: ${template.tips}
`;
      }
    } else {
      // Seleccionar templates relevantes
      const relevantTemplates = d2cTemplates
        .filter(t => t.category === request.contentType)
        .filter(t => t.platforms.includes(request.platform))
        .slice(0, 3);
      
      if (relevantTemplates.length > 0) {
        templateInfo = `
## TEMPLATES DE REFERENCIA (elige el más apropiado o combina)
${relevantTemplates.map(t => `
### ${t.name}
${t.template}

Ejemplo: ${t.example}
`).join("\n---\n")}
`;
      }
    }

    // Información de producto específico si aplica
    let productInfo = "";
    if (request.productId && context.products) {
      const product = context.products.find(p => p.name === request.productId);
      if (product) {
        productInfo = `
## PRODUCTO ESPECÍFICO PARA ESTE POST
- Nombre: ${product.name}
- Descripción: ${product.shortDescription || "No especificada"}
- Precio: ${product.price ? `${product.price}€` : "No especificado"}
- Características: ${product.features?.join(", ") || "No especificadas"}
- Es bestseller: ${product.isBestseller ? "Sí" : "No"}
- Es novedad: ${product.isNew ? "Sí" : "No"}
- Hook promocional: ${product.promotionHook || "No tiene"}
`;
      }
    }

    // Información de evento/oferta activa si aplica
    let eventInfo = "";
    if (request.eventId && context.activeEvents) {
      const event = context.activeEvents.find(e => e.title === request.eventId);
      if (event) {
        eventInfo = `
## EVENTO/OFERTA ACTIVA
- Tipo: ${event.eventType}
- Título: ${event.title}
- Descuento: ${event.discountValue ? `${event.discountValue}%` : "No especificado"}
- Código: ${event.discountCode || "No tiene"}
- Fecha fin: ${event.endDate || "No especificada"}
`;
      }
    }

    // Descripción del tipo de contenido D2C
    const contentTypeDescriptions: Record<string, string> = {
      producto: "Post destacando un producto. Enfoca en beneficios, lo que lo hace especial, por qué el cliente lo necesita.",
      engagement: "Post diseñado para generar comentarios y interacción. Preguntas, debates, 'esto o esto'. El objetivo es que la gente comente.",
      social_proof: "Post mostrando prueba social: reviews, testimonios, números de ventas, clientes satisfechas.",
      behind_scenes: "Post mostrando el detrás de cámaras: packaging, proceso de creación, el equipo, el día a día.",
      urgencia: "Post creando urgencia: stock limitado, tiempo limitado, última oportunidad. SOLO si es urgencia real.",
      educativo: "Post de valor: tips, consejos, cómo usar el producto, mitos vs realidad. Posiciona como experto.",
      storytelling: "Post contando una historia: origen de la marca, por qué hacemos esto, un momento especial.",
      oferta: "Post promocionando una oferta, descuento o bundle. Claro, directo, con CTA fuerte.",
    };

    return `Genera un post de tipo "${request.contentType}" para ${request.platform}.

## TIPO DE CONTENIDO
${contentTypeDescriptions[request.contentType]}

${templateInfo}
${productInfo}
${eventInfo}

${request.customPrompt ? `## INDICACIONES ADICIONALES DEL USUARIO\n${request.customPrompt}` : ""}

## FORMATO DE RESPUESTA
Responde EXACTAMENTE en este formato JSON:

{
  "mainText": "El texto principal del post completo, con saltos de línea (\\n) donde corresponda",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "...hasta 10-15 para Instagram, 3-5 para Facebook"],
  "suggestedCTA": "El call to action sugerido",
  "imagePrompt": "Descripción detallada de qué imagen iría bien con este post",
  "imageSearchQuery": "Términos de búsqueda para Pexels en inglés (ej: 'woman skincare morning routine')",
  "alternativeVersion": "Una versión alternativa más corta o con diferente enfoque"
}

IMPORTANTE: 
- Responde SOLO con el JSON, sin texto adicional
- El mainText debe incluir emojis si la marca los usa
- Los hashtags sin el símbolo #
- imageSearchQuery debe ser en inglés para mejores resultados en Pexels`;
  }

  private getCategoryName(category: string): string {
    const categoryNames: Record<string, string> = {
      moda_ropa: "moda y ropa",
      moda_accesorios: "accesorios de moda",
      joyeria: "joyería",
      calzado: "calzado",
      cosmetica: "cosmética y maquillaje",
      skincare: "skincare y cuidado de la piel",
      fitness: "productos fitness",
      hogar: "decoración y hogar",
      mascotas: "productos para mascotas",
      bebes: "productos para bebés",
      tech_accesorios: "accesorios tech",
      arte: "arte y prints",
      otro: "productos",
    };
    return categoryNames[category] || "productos";
  }

  private parseResponse(text: string, request: D2CContentRequest): GeneratedD2CContent {
    try {
      const cleanText = text.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "");
      const parsed = JSON.parse(cleanText);

      return {
        mainText: parsed.mainText || "",
        hashtags: parsed.hashtags || [],
        suggestedCTA: parsed.suggestedCTA || "",
        imagePrompt: parsed.imagePrompt,
        imageSearchQuery: parsed.imageSearchQuery,
        alternativeVersion: parsed.alternativeVersion,
        templateUsed: request.templateId,
        platform: request.platform,
        contentType: request.contentType,
      };
    } catch (error) {
      return {
        mainText: text,
        hashtags: [],
        suggestedCTA: "",
        platform: request.platform,
        contentType: request.contentType,
      };
    }
  }

  // Generar múltiples variantes
  async generateVariants(
    context: D2CBusinessContext,
    request: D2CContentRequest,
    count: number = 3
  ): Promise<GeneratedD2CContent[]> {
    const variants: GeneratedD2CContent[] = [];

    for (let i = 0; i < count; i++) {
      const variant = await this.generateContent(context, {
        ...request,
        customPrompt: `${request.customPrompt || ""}\n\nEsta es la variante ${i + 1} de ${count}. Hazla DIFERENTE a las anteriores: diferente hook, diferente enfoque, diferente estilo.`,
      });
      variants.push(variant);
    }

    return variants;
  }

  // Generar calendario semanal para D2C
  async generateWeeklyCalendar(
    context: D2CBusinessContext
  ): Promise<Array<{ day: string; contentType: string; idea: string }>> {
    // Calendario optimizado para marcas D2C
    const weeklyPlan = [
      { day: "Lunes", contentType: "producto", idea: "Producto estrella o nuevo" },
      { day: "Martes", contentType: "educativo", idea: "Tips o cómo usar" },
      { day: "Miércoles", contentType: "behind_scenes", idea: "Proceso o packaging" },
      { day: "Jueves", contentType: "engagement", idea: "Pregunta o 'esto o esto'" },
      { day: "Viernes", contentType: "social_proof", idea: "Review o testimonio" },
      { day: "Sábado", contentType: "storytelling", idea: "Historia o valores" },
      { day: "Domingo", contentType: "producto", idea: "Bestseller o favorito" },
    ];

    return weeklyPlan;
  }
}

export const d2cContentGenerator = new D2CContentGenerator();
