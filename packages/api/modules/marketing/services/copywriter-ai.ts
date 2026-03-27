/**
 * Copywriter AI - Advanced copywriting system with professional frameworks
 * 
 * Generates persuasive copy using proven frameworks:
 * - AIDA (Attention, Interest, Desire, Action)
 * - PAS (Problem, Agitate, Solution)
 * - BAB (Before, After, Bridge)
 * - FAB (Features, Advantages, Benefits)
 * - 4Ps (Picture, Promise, Prove, Push)
 * 
 * Capabilities:
 * - Automatic A/B variations
 * - Platform optimization
 * - Secuencias de email
 * - Landing page copy
 * - Sentiment and readability analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@repo/database';
import { logger } from './logger';

type CopyFramework = 'AIDA' | 'PAS' | 'BAB' | 'FAB' | '4Ps';
type CopyTone = 'casual' | 'professional' | 'funny' | 'urgent' | 'empathetic' | 'enthusiastic';
type Platform = 'instagram' | 'tiktok' | 'facebook' | 'twitter' | 'linkedin' | 'email';

interface CopyGenerationParams {
  topic: string;
  framework: CopyFramework;
  tone: CopyTone;
  platform: Platform;
  productId: string;
  maxLength?: number;
  includeEmojis?: boolean;
  includeHashtags?: boolean;
  ctaType?: 'soft' | 'medium' | 'hard';
}

interface CopyVersion {
  text: string;
  hooks: string[];
  cta: string;
  hashtags: string[];
  estimatedPerformance: number;
}

interface CopyResult {
  versions: CopyVersion[];
  metadata: {
    framework: CopyFramework;
    tone: CopyTone;
    platform: Platform;
    readabilityScore: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

interface EmailSequence {
  emails: Array<{
    day: number;
    subject: string;
    preheader: string;
    body: string;
    cta: string;
  }>;
  goal: string;
  expectedConversion: number;
}

interface LandingPageCopy {
  headline: string;
  subheadline: string;
  benefits: string[];
  features: Array<{ title: string; description: string }>;
  testimonialSuggestions: string[];
  faq: Array<{ question: string; answer: string }>;
  ctas: Array<{ position: string; text: string }>;
  seoKeywords: string[];
}

export class CopywriterAI {
  private anthropic: Anthropic | null = null;

  constructor() {
    // Lazy initialization - only created when needed
  }

  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is required for CopywriterAI');
      }
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
  }

  /**
   * Generates persuasive copy with A/B variations
   */
  async generateCopy(params: CopyGenerationParams): Promise<CopyResult> {
    logger.info('✍️ Generating copy', { 
      framework: params.framework, 
      platform: params.platform,
      topic: params.topic
    });

    try {
      // Get product info
      const product = await prisma.saasProduct.findUnique({
        where: { id: params.productId }
      });

      if (!product) {
        throw new Error(`Product ${params.productId} not found`);
      }

      const frameworkDescriptions = {
        AIDA: 'Attention (hook) → Interest (build interest) → Desire (create desire) → Action (call to action)',
        PAS: 'Problem (identify the problem) → Agitate (intensify the pain) → Solution (present the solution)',
        BAB: 'Before (current problematic situation) → After (improved outcome) → Bridge (how to get there)',
        FAB: 'Features (characteristics) → Advantages (advantages) → Benefits (real benefits)',
        '4Ps': 'Picture (paint the scenario) → Promise (promise) → Prove (prove with evidence) → Push (drive action)'
      };

      const platformLimits: Record<Platform, number> = {
        instagram: 2200,
        tiktok: 2200,
        facebook: 5000,
        twitter: 280,
        linkedin: 3000,
        email: 10000
      };

      const maxLength = params.maxLength || platformLimits[params.platform];

      const prompt = `You are a professional copywriter expert in persuasion. Generate copy using the ${params.framework} framework.

FRAMEWORK: ${params.framework}
Structure: ${frameworkDescriptions[params.framework]}

PRODUCT:
- Name: ${product.name}
- Description: ${product.description}
- Target: ${product.targetAudience || 'Entrepreneurs and startups'}
- Price: ${product.price ? `€${product.price}` : 'Freemium'}

TOPIC: ${params.topic}

REQUIREMENTS:
- Tone: ${params.tone}
- Platform: ${params.platform}
- Max characters: ${maxLength}
- Emojis: ${params.includeEmojis !== false ? 'Yes (max 3, strategic)' : 'No'}
- Hashtags: ${params.includeHashtags !== false ? 'Yes (5-8 relevant)' : 'No'}
- CTA: ${params.ctaType || 'medium'} (soft=subtle, medium=direct, hard=urgent)

GENERATE 3 different A/B variations of the same message.
Each variation must:
1. Follow the ${params.framework} framework
2. Use a different and powerful hook
3. Be genuinely persuasive
4. Include a clear CTA
5. Feel natural, not spammy

Return EXACT JSON:
{
  "versions": [
    {
      "text": "Full copy here...",
      "hooks": ["Main hook used"],
      "cta": "Specific CTA",
      "hashtags": ["hashtag1", "hashtag2"],
      "estimatedPerformance": 8.5
    }
  ]
}

Performance is 0-10 estimating expected engagement.`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const data = JSON.parse(jsonMatch[0]);

      const result: CopyResult = {
        versions: data.versions,
        metadata: {
          framework: params.framework,
          tone: params.tone,
          platform: params.platform,
          readabilityScore: 85, // Simplified, use a real algorithm in production
          sentiment: 'positive'
        }
      };

      logger.success('✅ Copy generated successfully', {
        versionsCount: result.versions.length,
        avgPerformance: result.versions.reduce((sum, v) => sum + v.estimatedPerformance, 0) / result.versions.length
      });

      return result;
    } catch (error) {
      logger.error('Failed to generate copy', error, { params });
      throw error;
    }
  }

  /**
   * Generates a complete email sequence for nurturing
   */
  async generateEmailSequence(
    productId: string,
    goal: 'onboarding' | 'conversion' | 'retention' | 'upsell'
  ): Promise<EmailSequence> {
    logger.info('📧 Generating email sequence', { productId, goal });

    try {
      const product = await prisma.saasProduct.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      const goalDescriptions = {
        onboarding: 'Guide users to complete setup and start using the product',
        conversion: 'Convert trial/freemium users to a paid plan',
        retention: 'Re-engage inactive users',
        upsell: 'Upgrade to a higher-tier plan'
      };

      const prompt = `Generate a strategic email sequence for ${goal}.

PRODUCT: ${product.name}
DESCRIPTION: ${product.description}
GOAL: ${goalDescriptions[goal]}

CREATE A 5-7 EMAIL SEQUENCE:

Suggested timing:
- Day 1: Welcome/introduction
- Day 3: Value/education
- Day 7: Social proof/testimonials
- Day 14: Benefits/features
- Day 21: Urgency/offer
- Day 28: Final push

Each email must include:
1. Irresistible subject line (< 50 characters)
2. Preheader text (< 90 characters)
3. Persuasive but conversational body copy
4. Clear and specific CTA

Return JSON:
{
  "emails": [
    {
      "day": 1,
      "subject": "Subject line here",
      "preheader": "Preheader text",
      "body": "Full email body...",
      "cta": "Specific CTA"
    }
  ],
  "expectedConversion": 0.15
}`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const data = JSON.parse(jsonMatch[0]);

      const sequence: EmailSequence = {
        emails: data.emails,
        goal,
        expectedConversion: data.expectedConversion || 0.12
      };

      logger.success('✅ Email sequence generated', {
        emailCount: sequence.emails.length,
        expectedConversion: `${(sequence.expectedConversion * 100).toFixed(1)}%`
      });

      return sequence;
    } catch (error) {
      logger.error('Failed to generate email sequence', error, { productId, goal });
      throw error;
    }
  }

  /**
   * Generates complete landing page copy
   */
  async generateLandingPageCopy(productId: string): Promise<LandingPageCopy> {
    logger.info('🌐 Generating landing page copy', { productId });

    try {
      const product = await prisma.saasProduct.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      const prompt = `Generate complete copy for a conversion-focused landing page.

PRODUCT: ${product.name}
DESCRIPTION: ${product.description}
TARGET: ${product.targetAudience || 'Entrepreneurs'}
PRICE: ${product.price ? `€${product.price}` : 'From €0'}

GENERATE:

1. HEADLINE: Clear and powerful value proposition (< 80 characters)
2. SUBHEADLINE: Amplify the headline (< 150 characters)
3. BENEFITS: 5 main benefits (NOT features, real BENEFITS)
4. FEATURES: 6 highlighted features with descriptions
5. TESTIMONIALS: 3 suggested testimonials (fictional but realistic)
6. FAQ: 6 frequently asked questions with answers
7. CTAs: 4 calls to action for different sections
8. SEO KEYWORDS: 10 primary keywords

Return JSON:
{
  "headline": "Powerful headline",
  "subheadline": "Descriptive subheadline",
  "benefits": ["Benefit 1", "Benefit 2", ...],
  "features": [
    {"title": "Feature 1", "description": "Description..."}
  ],
  "testimonialSuggestions": ["Testimonial 1...", ...],
  "faq": [
    {"question": "Question?", "answer": "Answer..."}
  ],
  "ctas": [
    {"position": "Hero", "text": "CTA text"}
  ],
  "seoKeywords": ["keyword1", "keyword2", ...]
}`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3500,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const landingPageCopy: LandingPageCopy = JSON.parse(jsonMatch[0]);

      logger.success('✅ Landing page copy generated', {
        benefitsCount: landingPageCopy.benefits.length,
        featuresCount: landingPageCopy.features.length,
        faqCount: landingPageCopy.faq.length
      });

      return landingPageCopy;
    } catch (error) {
      logger.error('Failed to generate landing page copy', error, { productId });
      throw error;
    }
  }

  /**
   * Optimizes existing copy for a specific platform
   */
  async optimizeCopy(text: string, platform: Platform): Promise<{
    optimized: string;
    changes: string[];
    scores: {
      readability: number;
      sentiment: number;
      spamLikelihood: number;
    };
  }> {
    logger.info('🔧 Optimizing copy', { platform, originalLength: text.length });

    try {
      const prompt = `Optimize this copy for ${platform}:

ORIGINAL COPY:
"${text}"

OPTIMIZE FOR:
- Character limits on ${platform}
- Better readability
- Remove spam words
- Improve positive sentiment
- Optimize for engagement

Return JSON:
{
  "optimized": "Optimized copy here",
  "changes": ["Change 1", "Change 2"],
  "scores": {
    "readability": 8.5,
    "sentiment": 9.0,
    "spamLikelihood": 1.5
  }
}

Scores from 0-10. Spam likelihood must be < 3.`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response');
      }

      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const result = JSON.parse(jsonMatch[0]);

      logger.success('✅ Copy optimized', {
        readability: result.scores.readability,
        changesMade: result.changes.length
      });

      return result;
    } catch (error) {
      logger.error('Failed to optimize copy', error);
      throw error;
    }
  }
}

export const copywriterAI = new CopywriterAI();




