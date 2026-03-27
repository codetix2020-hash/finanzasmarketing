import Anthropic from "@anthropic-ai/sdk";
import { d2cTemplates, getTemplatesForProductType, getTemplatesForPlatform } from "../templates/d2c-templates";

// Types
interface D2CBusinessContext {
  // Brand
  brandName: string;
  tagline?: string;
  productCategory: string;
  brandStory?: string;
  yearFounded?: string;

  // Product
  priceRange: string;
  avgPrice?: string;
  uniqueSellingPoints: string[];
  materials?: string[];
  madeIn?: string;
  certifications?: string[];
  bestSellers?: string;

  // Customer
  targetAge: string;
  targetGender: string;
  targetLocation: string[];
  customerPains: string[];
  customerDesires: string[];
  competitors?: string[];

  // Voice
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

  // Specific products (from catalog)
  products?: Array<{
    name: string;
    shortDescription?: string;
    price?: number;
    features?: string[];
    isBestseller?: boolean;
    isNew?: boolean;
    promotionHook?: string;
  }>;

  // Active events
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
  templateId?: string; // Specific template to use
  productId?: string; // If this is about a specific product
  eventId?: string; // If this is about a specific event
  customPrompt?: string; // Additional instructions
  includeImageSuggestion?: boolean;
}

interface GeneratedD2CContent {
  mainText: string;
  hashtags: string[];
  suggestedCTA: string;
  imagePrompt?: string;
  imageSearchQuery?: string; // For searching in Pexels
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
    // Map brand personality
    const personalityDescriptions: Record<string, string> = {
      minimal_elegante: "Sophisticated, clean, less is more. Use spacing, short lines, effortless elegance.",
      fun_colorful: "Cheerful, youthful, bold. Use exclamations, colorful emojis, contagious energy.",
      eco_conscious: "Conscious, natural, honest. Talk about sustainability without sounding preachy, connect with values.",
      bold_edgy: "Disruptive, unique, statement-driven. Strong opinions, direct language, unafraid to stand out.",
      romantic_soft: "Delicate, feminine, dreamy. Use beautiful words, soft metaphors, create atmosphere.",
      urban_street: "Street, current, real. Modern slang, cultural references, unfiltered tone.",
      luxury_premium: "Exclusive, aspirational, selective. Elevated vocabulary, create desire, less is more.",
      artesanal_handmade: "Made with love, unique, with a story. Highlight the process, the hands behind it, the dedication.",
    };

    // Map formality tone
    const formalityDescriptions: Record<number, string> = {
      1: "Very close and casual. Speak like to a friend. Use informal language and colloquial expressions.",
      2: "Close but polished. Friendly and approachable, with a touch of professionalism.",
      3: "Balanced. Neither too formal nor too casual. Professional but human.",
      4: "Professional. Careful wording, avoid colloquialisms, but not cold.",
      5: "Very formal. Elevated language and maximum elegance.",
    };

    // Map price range to sales tone
    const priceStrategyDescriptions: Record<string, string> = {
      low: "Emphasize value for money, accessibility, and low-friction buying.",
      mid: "Balance quality and price. Justify why it is worth it.",
      high: "Emphasize quality and long-term investment: buy less, buy better.",
      luxury: "Never use price as the main argument. Sell exclusivity, aspiration, and belonging.",
    };

    return `You are the expert copywriter for "${context.brandName}", a D2C brand in ${this.getCategoryName(context.productCategory)}.

## BRAND IDENTITY
- Name: ${context.brandName}
- Tagline: ${context.tagline || "Not defined"}
- Category: ${this.getCategoryName(context.productCategory)}
- Founding year: ${context.yearFounded || "Not specified"}
- Story: ${context.brandStory || "Not specified"}

## BRAND PERSONALITY
${personalityDescriptions[context.brandPersonality] || "Balanced personality"}

## COMMUNICATION TONE
${formalityDescriptions[context.toneFormality] || formalityDescriptions[3]}

## EMOJIS
${context.useEmojis 
  ? `Use emojis in moderation (3-5 per post). Brand favorites: ${context.favoriteEmojis?.join(" ") || "✨ 🤍 💫"}`
  : "DO NOT use emojis. The brand prefers a clean style without them."
}

## PRODUCT
- Price range: ${context.priceRange} - ${priceStrategyDescriptions[context.priceRange]}
- Average price: ${context.avgPrice ? `${context.avgPrice}€` : "Not specified"}
- What makes the products special: ${context.uniqueSellingPoints?.join(", ") || "Not specified"}
- Materials: ${context.materials?.join(", ") || "Not specified"}
- Manufacturing: ${context.madeIn || "Not specified"}
- Certifications: ${context.certifications?.join(", ") || "None"}
- Bestseller: ${context.bestSellers || "Not specified"}

## IDEAL CUSTOMER
- Age: ${context.targetAge}
- Gender: ${context.targetGender}
- Location: ${context.targetLocation?.join(", ") || "Not specified"}
- Pain points: ${context.customerPains?.join(", ") || "Not specified"}
- Desires: ${context.customerDesires?.join(", ") || "Not specified"}
- Competes with / inspired by: ${context.competitors?.join(", ") || "Not specified"}

## VOCABULARY
- Words to use: ${context.wordsToUse?.join(", ") || "No restrictions"}
- FORBIDDEN words (never use): ${context.wordsToAvoid?.join(", ") || "None"}

## BRAND STYLE EXAMPLE
${context.sampleCaption ? `This is how the brand usually writes:\n"${context.sampleCaption}"` : "No example available."}

## CRITICAL RULES
1. NEVER invent product data (prices, materials) not provided to you
2. ALWAYS write in first-person plural ("we", "our brand") or impersonal tone based on style
3. Content must sound AUTHENTIC, as if written by the brand owner
4. Adapt the message to this brand’s specific ideal customer
5. Hashtags must be relevant to the ${this.getCategoryName(context.productCategory)} niche
6. STRICTLY respect emoji and forbidden-word preferences
7. If this is a luxury brand, NEVER mention "cheap", "deal", or bargain language
8. If this is an eco/sustainable brand, reference values without sounding preachy

## PLATFORM
Adapt the content to the specific platform:
- Instagram: Visual, aspiracional, hashtags al final, max 2200 chars
- Facebook: Can be longer, fewer hashtags (3-5), more explanatory
- TikTok: Muy corto, directo, trending, max 150 chars
- Stories: One impactful sentence, direct CTA, maximum 2 lines`;
  }

  private buildD2CUserPrompt(context: D2CBusinessContext, request: D2CContentRequest): string {
    // Look up template if specified or pick a relevant one
    let templateInfo = "";
    if (request.templateId) {
      const template = d2cTemplates.find(t => t.id === request.templateId);
      if (template) {
        templateInfo = `
## TEMPLATE TO USE
Name: ${template.name}
Structure:
${template.template}

Reference example:
${template.example}

Tips: ${template.tips}
`;
      }
    } else {
      // Select relevant templates
      const relevantTemplates = d2cTemplates
        .filter(t => t.category === request.contentType)
        .filter(t => t.platforms.includes(request.platform))
        .slice(0, 3);
      
      if (relevantTemplates.length > 0) {
        templateInfo = `
## REFERENCE TEMPLATES (choose the most suitable one or combine them)
${relevantTemplates.map(t => `
### ${t.name}
${t.template}

Example: ${t.example}
`).join("\n---\n")}
`;
      }
    }

    // Specific product info if applicable
    let productInfo = "";
    if (request.productId && context.products) {
      const product = context.products.find(p => p.name === request.productId);
      if (product) {
        productInfo = `
## SPECIFIC PRODUCT FOR THIS POST
- Name: ${product.name}
- Description: ${product.shortDescription || "Not specified"}
- Price: ${product.price ? `${product.price}€` : "Not specified"}
- Features: ${product.features?.join(", ") || "Not specified"}
- Is bestseller: ${product.isBestseller ? "Yes" : "No"}
- Is new: ${product.isNew ? "Yes" : "No"}
- Promotional hook: ${product.promotionHook || "None"}
`;
      }
    }

    // Active event/offer info if applicable
    let eventInfo = "";
    if (request.eventId && context.activeEvents) {
      const event = context.activeEvents.find(e => e.title === request.eventId);
      if (event) {
        eventInfo = `
## ACTIVE EVENT/OFFER
- Type: ${event.eventType}
- Title: ${event.title}
- Discount: ${event.discountValue ? `${event.discountValue}%` : "Not specified"}
- Code: ${event.discountCode || "None"}
- End date: ${event.endDate || "Not specified"}
`;
      }
    }

    // D2C content type description
    const contentTypeDescriptions: Record<string, string> = {
      producto: "Post highlighting a product. Focus on benefits, what makes it special, and why the customer needs it.",
      engagement: "Post designed to drive comments and interaction. Questions, debates, 'this or that'. The goal is to get people commenting.",
      social_proof: "Post showing social proof: reviews, testimonials, sales numbers, satisfied customers.",
      behind_scenes: "Post showing behind the scenes: packaging, creation process, team, day-to-day.",
      urgencia: "Post creating urgency: limited stock, limited time, last chance. ONLY if urgency is real.",
      educativo: "Value post: tips, advice, product usage, myths vs reality. Position the brand as an expert.",
      storytelling: "Post telling a story: brand origin, why we do this, a special moment.",
      oferta: "Post promoting an offer, discount, or bundle. Clear, direct, with a strong CTA.",
    };

    return `Generate a "${request.contentType}" post for ${request.platform}.

## CONTENT TYPE
${contentTypeDescriptions[request.contentType]}

${templateInfo}
${productInfo}
${eventInfo}

${request.customPrompt ? `## USER ADDITIONAL INSTRUCTIONS\n${request.customPrompt}` : ""}

## RESPONSE FORMAT
Respond EXACTLY in this JSON format:

{
  "mainText": "The full main post text, with line breaks (\\n) where needed",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "...up to 10-15 for Instagram, 3-5 for Facebook"],
  "suggestedCTA": "Suggested call to action",
  "imagePrompt": "Detailed description of the best matching image for this post",
  "imageSearchQuery": "English search terms for Pexels (e.g.: 'woman skincare morning routine')",
  "alternativeVersion": "A shorter alternative version or a different angle"
}

IMPORTANT: 
- Respond ONLY with JSON, no additional text
- mainText must include emojis if the brand uses them
- Hashtags must be returned without the # symbol
- imageSearchQuery must be in English for better Pexels results`;
  }

  private getCategoryName(category: string): string {
    const categoryNames: Record<string, string> = {
      moda_ropa: "fashion and apparel",
      moda_accesorios: "fashion accessories",
      joyeria: "jewelry",
      calzado: "footwear",
      cosmetica: "cosmetics and makeup",
      skincare: "skincare and skin care",
      fitness: "fitness products",
      hogar: "home and decor",
      mascotas: "pet products",
      bebes: "baby products",
      tech_accesorios: "tech accessories",
      arte: "art and prints",
      otro: "products",
    };
    return categoryNames[category] || "products";
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

  // Generate multiple variants
  async generateVariants(
    context: D2CBusinessContext,
    request: D2CContentRequest,
    count: number = 3
  ): Promise<GeneratedD2CContent[]> {
    const variants: GeneratedD2CContent[] = [];

    for (let i = 0; i < count; i++) {
      const variant = await this.generateContent(context, {
        ...request,
        customPrompt: `${request.customPrompt || ""}\n\nThis is variant ${i + 1} of ${count}. Make it DIFFERENT from the previous ones: different hook, angle, and style.`,
      });
      variants.push(variant);
    }

    return variants;
  }

  // Generate weekly calendar for D2C
  async generateWeeklyCalendar(
    context: D2CBusinessContext
  ): Promise<Array<{ day: string; contentType: string; idea: string }>> {
    // Optimized calendar for D2C brands
    const weeklyPlan = [
      { day: "Monday", contentType: "producto", idea: "Star product or new release" },
      { day: "Tuesday", contentType: "educativo", idea: "Tips or how-to use" },
      { day: "Wednesday", contentType: "behind_scenes", idea: "Process or packaging" },
      { day: "Thursday", contentType: "engagement", idea: "Question or 'this or that'" },
      { day: "Friday", contentType: "social_proof", idea: "Review or testimonial" },
      { day: "Saturday", contentType: "storytelling", idea: "Story or values" },
      { day: "Sunday", contentType: "producto", idea: "Bestseller or favorite" },
    ];

    return weeklyPlan;
  }
}

export const d2cContentGenerator = new D2CContentGenerator();
