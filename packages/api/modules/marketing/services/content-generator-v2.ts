import Anthropic from "@anthropic-ai/sdk";
import { 
  VIRAL_HOOKS, 
  POST_STRUCTURES, 
  CTAS, 
  HASHTAGS, 
  PLATFORM_RULES,
  BEST_POSTING_TIMES,
  COMMENT_RESPONSES
} from "../data/content-templates";

interface ProductContext {
  name: string;
  description: string;
  targetAudience: string;
  usp: string;
  pricing?: any;
  competitors?: string[];
}

interface GeneratedPost {
  platform: string;
  content: string;
  hook: string;
  type: string;
  hashtags: string[];
  estimatedEngagement: string;
}

interface ContentBatch {
  posts: GeneratedPost[];
  tokensUsed: number;
  generatedAt: string;
}

// Seleccionar hashtags relevantes
function selectHashtags(nicho: string, platform: string): string[] {
  const rules = PLATFORM_RULES[platform as keyof typeof PLATFORM_RULES];
  const count = rules?.hashtagCount || 5;
  
  const nichoTags = HASHTAGS[nicho as keyof typeof HASHTAGS] || HASHTAGS.business;
  const reservasTags = HASHTAGS.reservas;
  
  // Mezclar hashtags del nicho + reservas
  const allTags = [...nichoTags, ...reservasTags];
  const shuffled = allTags.sort(() => Math.random() - 0.5);
  
  return shuffled.slice(0, count);
}

// Seleccionar hook aleatorio de una categoría
function selectHook(category: keyof typeof VIRAL_HOOKS): string {
  const hooks = VIRAL_HOOKS[category];
  return hooks[Math.floor(Math.random() * hooks.length)];
}

// Seleccionar CTA
function selectCTA(type: 'engagement' | 'conversion' | 'seguimiento'): string {
  const ctas = CTAS[type];
  return ctas[Math.floor(Math.random() * ctas.length)];
}

// GENERADOR PRINCIPAL - BATCH DE 7 POSTS
export async function generateWeeklyContent(
  product: ProductContext,
  nicho: string = "peluqueria"
): Promise<ContentBatch> {
  console.log("📝 Generando contenido semanal para:", product.name);
  
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  // Definir los 7 tipos de posts de la semana
  const weekPlan = [
    { dia: "Lunes", tipo: "educativo", objetivo: "valor" },
    { dia: "Martes", tipo: "problema_solucion", objetivo: "awareness" },
    { dia: "Miércoles", tipo: "testimonio", objetivo: "social proof" },
    { dia: "Jueves", tipo: "educativo", objetivo: "valor" },
    { dia: "Viernes", tipo: "promotional", objetivo: "conversión" },
    { dia: "Sábado", tipo: "carrusel_hook", objetivo: "engagement" },
    { dia: "Domingo", tipo: "problema_solucion", objetivo: "awareness" },
  ];

  // UN SOLO PROMPT para generar los 7 posts (ahorra 80% tokens)
  const prompt = `Eres un experto en social media para negocios de ${nicho}.

PRODUCTO: ${product.name}
DESCRIPCIÓN: ${product.description}
AUDIENCIA: ${product.targetAudience}
USP: ${product.usp}
COMPETIDORES: ${product.competitors?.join(", ") || "No especificados"}

GENERA 7 POSTS (uno por día de la semana) siguiendo este plan:

${weekPlan.map((p, i) => `${i + 1}. ${p.dia} - Tipo: ${p.tipo} - Objetivo: ${p.objetivo}`).join("\n")}

REGLAS CRÍTICAS:
- Cada post MÁXIMO 150 caracteres (sin contar hashtags)
- Empezar SIEMPRE con un hook potente (pregunta, dato, POV, etc)
- Usar emojis estratégicamente (2-4 por post)
- Tono: cercano, profesional, español de España
- NO usar palabras en inglés innecesarias
- El CTA debe ser natural, no forzado
- Cada post debe poder funcionar solo (sin contexto)

USA ESTAS FÓRMULAS DE HOOKS:
- Problema: "¿Todavía X?", "El error que comete el 90%..."
- Curiosidad: "Lo que nadie te cuenta sobre..."
- Social proof: "X+ negocios ya..."
- Urgencia: "Si no X ahora..."

FORMATO DE RESPUESTA (JSON):
{
  "posts": [
    {
      "dia": "Lunes",
      "tipo": "educativo",
      "hook": "el hook usado",
      "contenido": "texto completo del post SIN hashtags",
      "cta": "call to action",
      "engagement_estimado": "alto/medio/bajo"
    }
  ]
}

Responde SOLO con el JSON, nada más.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }]
  });

  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
  const responseText = response.content[0].type === "text" ? response.content[0].text : "";

  // Parsear respuesta
  let parsedPosts: any[] = [];
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      parsedPosts = parsed.posts || [];
    }
  } catch (e) {
    console.error("❌ Error parseando respuesta:", e);
    parsedPosts = [];
  }

  // Procesar y añadir hashtags
  const posts: GeneratedPost[] = parsedPosts.map((post: any) => {
    const hashtags = selectHashtags(nicho, "instagram");
    const hashtagString = hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ");
    
    return {
      platform: "instagram", // Generamos para IG, adaptamos para TikTok después
      content: `${post.contenido}\n\n${post.cta}\n\n${hashtagString}`,
      hook: post.hook,
      type: post.tipo,
      hashtags,
      estimatedEngagement: post.engagement_estimado || "medio"
    };
  });

  console.log(`✅ Generados ${posts.length} posts con ${tokensUsed} tokens`);

  return {
    posts,
    tokensUsed,
    generatedAt: new Date().toISOString()
  };
}

// Adaptar post de Instagram a TikTok
export function adaptToTikTok(instagramPost: GeneratedPost): GeneratedPost {
  const rules = PLATFORM_RULES.tiktok;
  
  // Extraer solo el hook y contenido principal (sin hashtags)
  let content = instagramPost.content.split("\n\n")[0]; // Primera parte
  
  // Acortar si es necesario
  if (content.length > rules.maxLength) {
    content = content.substring(0, rules.maxLength - 20) + "...";
  }
  
  // Hashtags reducidos para TikTok
  const tiktokHashtags = instagramPost.hashtags.slice(0, rules.hashtagCount);
  const hashtagString = tiktokHashtags.join(" ");
  
  return {
    ...instagramPost,
    platform: "tiktok",
    content: `${content}\n\n${hashtagString}`,
    hashtags: tiktokHashtags
  };
}

// Generar un solo post rápido (para tests o urgencias)
export async function generateSinglePost(
  product: ProductContext,
  tipo: string = "educativo",
  platform: string = "instagram"
): Promise<GeneratedPost> {
  console.log(`📝 Generando post ${tipo} para ${platform}...`);
  
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const rules = PLATFORM_RULES[platform as keyof typeof PLATFORM_RULES] || PLATFORM_RULES.instagram;
  
  const prompt = `Genera UN post de ${tipo} para ${platform}.

PRODUCTO: ${product.name} - ${product.usp}
AUDIENCIA: ${product.targetAudience}

REGLAS:
- Máximo ${rules.idealLength} caracteres
- Hook potente al inicio
- ${rules.hashtagCount} hashtags máximo
- Tono cercano, español de España
- Emojis estratégicos

Responde SOLO con el texto del post (incluye hashtags al final).`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }]
  });

  const content = response.content[0].type === "text" ? response.content[0].text : "";
  const hashtags = selectHashtags("peluqueria", platform);

  return {
    platform,
    content,
    hook: content.split("\n")[0],
    type: tipo,
    hashtags,
    estimatedEngagement: "medio"
  };
}

// Generar 2 versiones de cada post para A/B testing
export async function generateABVariants(
  product: ProductContext,
  tipo: string = "educativo"
): Promise<{
  variantA: GeneratedPost;
  variantB: GeneratedPost;
  testHypothesis: string;
}> {
  console.log("🔬 Generando variantes A/B...");
  
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Genera 2 VERSIONES DIFERENTES del mismo post para A/B testing.

PRODUCTO: ${product.name} - ${product.usp}
TIPO: ${tipo}
AUDIENCIA: ${product.targetAudience}

VERSION A: Usa un hook de PROBLEMA/DOLOR
VERSION B: Usa un hook de BENEFICIO/ASPIRACIÓN

Ambas versiones deben:
- Máximo 150 caracteres (sin hashtags)
- Mismo mensaje core, diferente ángulo
- Emojis estratégicos

RESPONDE EN JSON:
{
  "variantA": {
    "hook_type": "problema",
    "content": "texto completo"
  },
  "variantB": {
    "hook_type": "beneficio", 
    "content": "texto completo"
  },
  "hypothesis": "qué estamos testeando y por qué"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }]
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");

  const hashtags = selectHashtags("peluqueria", "instagram");
  const hashtagString = hashtags.join(" ");

  return {
    variantA: {
      platform: "instagram",
      content: `${parsed.variantA?.content || ""}\n\n${hashtagString}`,
      hook: parsed.variantA?.hook_type || "problema",
      type: tipo,
      hashtags,
      estimatedEngagement: "medio"
    },
    variantB: {
      platform: "instagram",
      content: `${parsed.variantB?.content || ""}\n\n${hashtagString}`,
      hook: parsed.variantB?.hook_type || "beneficio",
      type: tipo,
      hashtags,
      estimatedEngagement: "medio"
    },
    testHypothesis: parsed.hypothesis || "Testeando hook de problema vs beneficio"
  };
}

// Evitar repetir hooks o estructuras recientes
export class ContentMemory {
  private recentHooks: string[] = [];
  private recentTopics: string[] = [];
  private maxMemory: number = 20;

  addPost(hook: string, topic: string) {
    this.recentHooks.push(hook.toLowerCase());
    this.recentTopics.push(topic.toLowerCase());
    
    // Mantener solo los últimos N
    if (this.recentHooks.length > this.maxMemory) {
      this.recentHooks.shift();
      this.recentTopics.shift();
    }
  }

  isRepetitive(hook: string, topic: string): boolean {
    const hookLower = hook.toLowerCase();
    const topicLower = topic.toLowerCase();
    
    // Verificar si el hook es muy similar a uno reciente
    const similarHook = this.recentHooks.some(h => 
      this.similarity(h, hookLower) > 0.7
    );
    
    // Verificar si el topic es muy similar
    const similarTopic = this.recentTopics.some(t => 
      this.similarity(t, topicLower) > 0.8
    );
    
    return similarHook || similarTopic;
  }

  private similarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/));
    const wordsB = new Set(b.split(/\s+/));
    const intersection = [...wordsA].filter(w => wordsB.has(w));
    return intersection.length / Math.max(wordsA.size, wordsB.size);
  }

  getAvoidList(): string[] {
    return [...new Set([...this.recentHooks.slice(-5)])];
  }
}

// Generador de carruseles (Instagram)
export async function generateCarousel(
  product: ProductContext,
  tema: string,
  slides: number = 5
): Promise<{
  titulo: string;
  slides: string[];
  cta: string;
  hashtags: string[];
}> {
  console.log(`📊 Generando carrusel de ${slides} slides...`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Genera un CARRUSEL de Instagram de ${slides} slides.

PRODUCTO: ${product.name}
TEMA: ${tema}
AUDIENCIA: ${product.targetAudience}

ESTRUCTURA:
- Slide 1: Hook potente (pregunta o dato impactante)
- Slides 2-${slides - 1}: Contenido de valor (1 idea por slide)
- Slide ${slides}: CTA claro

REGLAS:
- Cada slide MÁXIMO 30 palabras
- Texto que funcione sin diseño (solo texto)
- Numeración o emojis para guiar
- Español de España, cercano

RESPONDE EN JSON:
{
  "titulo": "título del carrusel para el caption",
  "slides": ["slide1", "slide2", ...],
  "cta": "call to action final",
  "caption": "texto para el caption del post"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }]
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");

  return {
    titulo: parsed.titulo || tema,
    slides: parsed.slides || [],
    cta: parsed.cta || "Link en bio",
    hashtags: selectHashtags("peluqueria", "instagram")
  };
}

// Respuestas automáticas a comentarios
export function getCommentResponse(commentType: keyof typeof COMMENT_RESPONSES): string {
  const responses = COMMENT_RESPONSES[commentType];
  return responses[Math.floor(Math.random() * responses.length)];
}

// Calendario editorial inteligente
export interface EditorialCalendar {
  semana: number;
  posts: {
    dia: string;
    fecha: string;
    hora: string;
    plataforma: string;
    tipo: string;
    objetivo: string;
    contenido?: string;
    estado: "pendiente" | "programado" | "publicado";
  }[];
}

export function generateEditorialCalendar(
  startDate: Date,
  weeks: number = 4
): EditorialCalendar[] {
  const calendar: EditorialCalendar[] = [];
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  
  // Distribución semanal óptima
  const weeklyPlan = [
    { dia: "lunes", tipo: "educativo", objetivo: "awareness" },
    { dia: "martes", tipo: "problema_solucion", objetivo: "awareness" },
    { dia: "miercoles", tipo: "testimonio", objetivo: "conversion" },
    { dia: "jueves", tipo: "tips", objetivo: "engagement" },
    { dia: "viernes", tipo: "promotional", objetivo: "conversion" },
    { dia: "sabado", tipo: "detras_camaras", objetivo: "engagement" },
    { dia: "domingo", tipo: "inspiracional", objetivo: "retention" }
  ];

  for (let week = 0; week < weeks; week++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (week * 7));
    
    const posts = weeklyPlan.map((plan, dayIndex) => {
      const postDate = new Date(weekStart);
      postDate.setDate(postDate.getDate() + dayIndex);
      
      const bestTimes = BEST_POSTING_TIMES.instagram[plan.dia as keyof typeof BEST_POSTING_TIMES.instagram];
      const hora = bestTimes?.[0] || "10:00"; // Primera mejor hora
      
      return {
        dia: plan.dia,
        fecha: postDate.toISOString().split("T")[0],
        hora,
        plataforma: "instagram+tiktok",
        tipo: plan.tipo,
        objetivo: plan.objetivo,
        estado: "pendiente" as const
      };
    });

    calendar.push({
      semana: week + 1,
      posts
    });
  }

  return calendar;
}

// Analytics framework
export interface PostAnalytics {
  postId: string;
  plataforma: string;
  tipo: string;
  hookType: string;
  publicadoAt: string;
  metricas: {
    likes: number;
    comentarios: number;
    compartidos: number;
    guardados: number;
    alcance: number;
    impresiones: number;
  };
  engagementRate: number;
}

export function calculateEngagementRate(metricas: PostAnalytics["metricas"], seguidores: number): number {
  const totalEngagement = metricas.likes + metricas.comentarios + metricas.compartidos + metricas.guardados;
  return (totalEngagement / seguidores) * 100;
}

export function getBestPerformingContent(analytics: PostAnalytics[]): {
  mejorTipo: string;
  mejorHook: string;
  mejorHora: string;
  mejorDia: string;
} {
  // Agrupar por tipo y calcular promedio de engagement
  const porTipo: Record<string, number[]> = {};
  const porHook: Record<string, number[]> = {};
  
  analytics.forEach(post => {
    if (!porTipo[post.tipo]) porTipo[post.tipo] = [];
    if (!porHook[post.hookType]) porHook[post.hookType] = [];
    
    porTipo[post.tipo].push(post.engagementRate);
    porHook[post.hookType].push(post.engagementRate);
  });

  const avgByType = Object.entries(porTipo).map(([tipo, rates]) => ({
    tipo,
    avg: rates.reduce((a, b) => a + b, 0) / rates.length
  })).sort((a, b) => b.avg - a.avg);

  const avgByHook = Object.entries(porHook).map(([hook, rates]) => ({
    hook,
    avg: rates.reduce((a, b) => a + b, 0) / rates.length
  })).sort((a, b) => b.avg - a.avg);

  return {
    mejorTipo: avgByType[0]?.tipo || "educativo",
    mejorHook: avgByHook[0]?.hook || "problema",
    mejorHora: "10:00", // TODO: calcular de analytics reales
    mejorDia: "jueves" // TODO: calcular de analytics reales
  };
}

