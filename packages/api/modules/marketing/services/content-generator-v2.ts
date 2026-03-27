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
  console.log("📝 Generating weekly content for:", product.name);
  
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  // Definir los 7 tipos de posts de la semana
  const weekPlan = [
    { day: "Monday", type: "educational", goal: "value" },
    { day: "Tuesday", type: "problem_solution", goal: "awareness" },
    { day: "Wednesday", type: "testimonial", goal: "social proof" },
    { day: "Thursday", type: "educational", goal: "value" },
    { day: "Friday", type: "promotional", goal: "conversion" },
    { day: "Saturday", type: "carousel_hook", goal: "engagement" },
    { day: "Sunday", type: "problem_solution", goal: "awareness" },
  ];

  // UN SOLO PROMPT para generar los 7 posts (ahorra 80% tokens)
  const prompt = `You are a social media expert for ${nicho} businesses.

PRODUCT: ${product.name}
DESCRIPTION: ${product.description}
AUDIENCE: ${product.targetAudience}
USP: ${product.usp}
COMPETITORS: ${product.competitors?.join(", ") || "Not specified"}

GENERATE 7 POSTS (one per day of the week) following this plan:

${weekPlan.map((p, i) => `${i + 1}. ${p.day} - Type: ${p.type} - Goal: ${p.goal}`).join("\n")}

CRITICAL RULES:
- Each post MUST be at most 150 characters (hashtags not included)
- ALWAYS start with a strong hook (question, data point, POV, etc.)
- Use emojis strategically (2-4 per post)
- Tone: approachable, professional, Spain Spanish
- DO NOT use unnecessary English words
- The CTA must be natural, not forced
- Each post must work on its own (without context)

USE THESE HOOK FORMULAS:
- Problem: "Still doing X?", "The mistake 90% make..."
- Curiosity: "What no one tells you about..."
- Social proof: "X+ businesses already..."
- Urgency: "If you don't do X now..."

RESPONSE FORMAT (JSON):
{
  "posts": [
    {
      "day": "Monday",
      "type": "educational",
      "hook": "the hook used",
      "content": "full post text WITHOUT hashtags",
      "cta": "call to action",
      "estimated_engagement": "high/medium/low"
    }
  ]
}

Respond ONLY with JSON, nothing else.`;

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
    console.error("❌ Error parsing response:", e);
    parsedPosts = [];
  }

  // Procesar y añadir hashtags
  const posts: GeneratedPost[] = parsedPosts.map((post: any) => {
    const hashtags = selectHashtags(nicho, "instagram");
    const hashtagString = hashtags.map(h => h.startsWith("#") ? h : `#${h}`).join(" ");
    
    return {
      platform: "instagram", // Generamos para IG, adaptamos para TikTok después
      content: `${post.content || post.contenido || ""}\n\n${post.cta || ""}\n\n${hashtagString}`,
      hook: post.hook,
      type: post.type || post.tipo || "educational",
      hashtags,
      estimatedEngagement: post.estimated_engagement || post.engagement_estimado || "medium"
    };
  });

  console.log(`✅ Generated ${posts.length} posts with ${tokensUsed} tokens`);

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
  console.log(`📝 Generating ${tipo} post for ${platform}...`);
  
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  const rules = PLATFORM_RULES[platform as keyof typeof PLATFORM_RULES] || PLATFORM_RULES.instagram;
  
  const prompt = `Generate ONE ${tipo} post for ${platform}.

PRODUCT: ${product.name} - ${product.usp}
AUDIENCE: ${product.targetAudience}

RULES:
- Maximum ${rules.idealLength} characters
- Strong hook at the beginning
- Maximum ${rules.hashtagCount} hashtags
- Approachable tone, Spain Spanish
- Strategic emojis

Respond ONLY with the post text (include hashtags at the end).`;

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
    estimatedEngagement: "medium"
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
  console.log("🔬 Generating A/B variants...");
  
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Generate 2 DIFFERENT VERSIONS of the same post for A/B testing.

PRODUCT: ${product.name} - ${product.usp}
TYPE: ${tipo}
AUDIENCE: ${product.targetAudience}

VERSION A: Use a PROBLEM/PAIN hook
VERSION B: Use a BENEFIT/ASPIRATION hook

Both versions must:
- Maximum 150 characters (without hashtags)
- Same core message, different angle
- Strategic emojis

RESPOND IN JSON:
{
  "variantA": {
    "hook_type": "problem",
    "content": "full text"
  },
  "variantB": {
    "hook_type": "benefit", 
    "content": "full text"
  },
  "hypothesis": "what we are testing and why"
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
      hook: parsed.variantA?.hook_type || "problem",
      type: tipo,
      hashtags,
      estimatedEngagement: "medium"
    },
    variantB: {
      platform: "instagram",
      content: `${parsed.variantB?.content || ""}\n\n${hashtagString}`,
      hook: parsed.variantB?.hook_type || "benefit",
      type: tipo,
      hashtags,
      estimatedEngagement: "medium"
    },
    testHypothesis: parsed.hypothesis || "Testing problem vs benefit hook"
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
  console.log(`📊 Generating carousel with ${slides} slides...`);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Generate an Instagram CAROUSEL with ${slides} slides.

PRODUCT: ${product.name}
TOPIC: ${tema}
AUDIENCE: ${product.targetAudience}

STRUCTURE:
- Slide 1: Strong hook (question or impactful data point)
- Slides 2-${slides - 1}: Valuable content (1 idea per slide)
- Slide ${slides}: Clear CTA

RULES:
- Each slide MAX 30 words
- Text that works without design (text-only)
- Numbering or emojis to guide
- Approachable Spain Spanish

RESPOND IN JSON:
{
  "titulo": "carousel title for the caption",
  "slides": ["slide1", "slide2", ...],
  "cta": "final call to action",
  "caption": "text for the post caption"
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
  week: number;
  posts: {
    day: string;
    date: string;
    time: string;
    platform: string;
    type: string;
    goal: string;
    content?: string;
    status: "pending" | "scheduled" | "published";
  }[];
}

export function generateEditorialCalendar(
  startDate: Date,
  weeks: number = 4
): EditorialCalendar[] {
  const calendar: EditorialCalendar[] = [];
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  
  // Distribución semanal óptima
  const weeklyPlan = [
    { day: "monday", type: "educational", goal: "awareness" },
    { day: "tuesday", type: "problem_solution", goal: "awareness" },
    { day: "wednesday", type: "testimonial", goal: "conversion" },
    { day: "thursday", type: "tips", goal: "engagement" },
    { day: "friday", type: "promotional", goal: "conversion" },
    { day: "saturday", type: "behind_the_scenes", goal: "engagement" },
    { day: "sunday", type: "inspirational", goal: "retention" }
  ];

  const dayToPostingTimeKey: Record<string, keyof typeof BEST_POSTING_TIMES.instagram> = {
    monday: "lunes",
    tuesday: "martes",
    wednesday: "miercoles",
    thursday: "jueves",
    friday: "viernes",
    saturday: "sabado",
    sunday: "domingo",
  };

  for (let week = 0; week < weeks; week++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (week * 7));
    
    const posts = weeklyPlan.map((plan, dayIndex) => {
      const postDate = new Date(weekStart);
      postDate.setDate(postDate.getDate() + dayIndex);
      
      const postingTimeKey = dayToPostingTimeKey[plan.day] || "lunes";
      const bestTimes = BEST_POSTING_TIMES.instagram[postingTimeKey];
      const time = bestTimes?.[0] || "10:00"; // First best time
      
      return {
        day: plan.day,
        date: postDate.toISOString().split("T")[0],
        time,
        platform: "instagram+tiktok",
        type: plan.type,
        goal: plan.goal,
        status: "pending" as const
      };
    });

    calendar.push({
      week: week + 1,
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
    mejorHook: avgByHook[0]?.hook || "problem",
    mejorHora: "10:00", // TODO: calcular de analytics reales
    mejorDia: "thursday" // TODO: calculate from real analytics
  };
}

