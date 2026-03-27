/**
 * Content Calendar - Smart Editorial Calendar
 * 
 * Generates monthly social media content plans
 * considering:
 * - Balanced content types (educational, promotional, testimonial)
 * - Optimal timing by platform
 * - Relevant events and key dates
 * - Competitor analysis
 * - Historical performance
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@repo/database';
import { logger } from './logger';

interface CalendarPost {
  platform: 'instagram' | 'tiktok' | 'facebook';
  type: 'carousel' | 'reel' | 'post' | 'story';
  topic: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  contentType: 'educational' | 'promotional' | 'testimonial' | 'behind-the-scenes' | 'user-generated';
}

interface CalendarDay {
  date: string;
  posts: CalendarPost[];
  specialEvent?: string;
}

interface MonthlyCalendar {
  month: string;
  year: number;
  days: CalendarDay[];
  themes: string[];
  kpis: {
    expectedReach: number;
    expectedEngagement: number;
    expectedConversions: number;
  };
  summary: {
    totalPosts: number;
    byPlatform: Record<string, number>;
    byType: Record<string, number>;
  };
}

interface CampaignSuggestion {
  name: string;
  objective: string;
  platform: string;
  budget: number;
  duration: number;
  expectedROI: number;
  confidence: number;
  reasoning: string;
}

export class ContentCalendar {
  private anthropic: Anthropic | null = null;

  constructor() {
    // Lazy initialization - only created when used
    // This allows importing the module during build
  }

  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is required for ContentCalendar');
      }
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
  }

  /**
   * Generates a full monthly editorial calendar
   */
  async generateMonthlyCalendar(
    productId: string, 
    month: string
  ): Promise<MonthlyCalendar> {
    logger.info('📅 Generating monthly content calendar', { productId, month });

    try {
      // 1. Get product information
      const product = await prisma.saasProduct.findUnique({
        where: { id: productId },
        include: {
          organization: true
        }
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // 2. Analyze historical performance
      const historicalPerformance = await this.analyzeHistoricalPerformance(
        product.organizationId
      );

      // 3. Generate calendar with Claude
      const prompt = `You are an expert Content Manager. Generate an editorial calendar for the month of ${month}.

PRODUCT INFORMATION:
- Name: ${product.name}
- Description: ${product.description}
- Target audience: ${product.targetAudience || 'General'}
- Price: ${product.price ? `€${product.price}` : 'Freemium'}

HISTORICAL PERFORMANCE:
${historicalPerformance}

REQUIREMENTS:
1. Content balance:
   - 70% educational/value content (tips, tutorials, insights)
   - 20% social proof (testimonials, success stories, reviews)
   - 10% promotional (offers, features, direct CTAs)

2. Frequency:
   - 2 posts per day (1 Instagram + 1 TikTok)
   - Vary formats (carousel, reel, static post)

3. Optimal timing:
   - Instagram: 18:00-20:00 (best engagement)
   - TikTok: 12:00-14:00 y 19:00-21:00

4. Consider relevant events:
   - Black Friday (if applicable)
   - Christmas/New Year
   - Tech industry dates
   - Feature launches

5. Diverse and engaging topics

Generate JSON using this EXACT format:
{
  "days": [
    {
      "date": "2025-02-01",
      "posts": [
        {
          "platform": "instagram",
          "type": "carousel",
          "topic": "5 common mistakes when...",
          "time": "18:00",
          "priority": "high",
          "contentType": "educational"
        },
        {
          "platform": "tiktok",
          "type": "reel",
          "topic": "Quick tutorial on...",
          "time": "13:00",
          "priority": "medium",
          "contentType": "educational"
        }
      ],
      "specialEvent": "Start of month - January recap"
    }
  ],
  "themes": ["Product education", "Customer success", "Industry trends"],
  "kpis": {
    "expectedReach": 50000,
    "expectedEngagement": 2500,
    "expectedConversions": 15
  }
}

Generate 30 full days of content.`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      // Extract JSON from the response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const calendarData = JSON.parse(jsonMatch[0]);

      // 4. Calculate summary
      const summary = this.calculateSummary(calendarData.days);

      // 5. Save in system memory
      await prisma.marketingMemory.upsert({
        where: {
          key: `calendar_${productId}_${month}`
        },
        create: {
          key: `calendar_${productId}_${month}`,
          value: JSON.stringify(calendarData),
          type: 'calendar',
          organizationId: product.organizationId
        },
        update: {
          value: JSON.stringify(calendarData),
          updatedAt: new Date()
        }
      });

      const calendar: MonthlyCalendar = {
        month,
        year: new Date().getFullYear(),
        days: calendarData.days,
        themes: calendarData.themes,
        kpis: calendarData.kpis,
        summary
      };

      logger.success('✅ Monthly calendar generated', {
        productId,
        totalPosts: summary.totalPosts,
        themes: calendarData.themes.length
      });

      return calendar;
    } catch (error) {
      logger.error('Failed to generate monthly calendar', error, { productId, month });
      throw error;
    }
  }

  /**
   * Analyze historical performance to inform the calendar
   */
  private async analyzeHistoricalPerformance(organizationId: string): Promise<string> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentPosts = await prisma.marketingContent.findMany({
      where: {
        organizationId,
        createdAt: { gte: thirtyDaysAgo },
        status: { in: ['PUBLISHED', 'AUTO_PUBLISHED'] }
      },
      select: {
        platform: true,
        analytics: true
      }
    });

    if (recentPosts.length === 0) {
      return 'No historical data available (new product)';
    }

    const avgEngagement = recentPosts.reduce((sum, post: any) => {
      const analytics = post.analytics || {};
      return sum + (analytics.engagement || 0);
    }, 0) / recentPosts.length;

    const platformDistribution = recentPosts.reduce((acc: any, post) => {
      acc[post.platform] = (acc[post.platform] || 0) + 1;
      return acc;
    }, {});

    return `Posts in last 30 days: ${recentPosts.length}
Average engagement: ${avgEngagement.toFixed(0)}
Distribution: ${JSON.stringify(platformDistribution)}`;
  }

  /**
   * Calculates statistical calendar summary
   */
  private calculateSummary(days: CalendarDay[]): MonthlyCalendar['summary'] {
    let totalPosts = 0;
    const byPlatform: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const day of days) {
      for (const post of day.posts) {
        totalPosts++;
        byPlatform[post.platform] = (byPlatform[post.platform] || 0) + 1;
        byType[post.contentType] = (byType[post.contentType] || 0) + 1;
      }
    }

    return { totalPosts, byPlatform, byType };
  }

  /**
   * Suggests ad campaigns based on seasonality and performance
   */
  async suggestCampaigns(productId: string): Promise<CampaignSuggestion[]> {
    logger.info('🎯 Generating campaign suggestions', { productId });

    try {
      const product = await prisma.saasProduct.findUnique({
        where: { id: productId },
        include: { organization: true }
      });

      if (!product) {
        throw new Error(`Product ${productId} not found`);
      }

      // Analyze historical campaigns
      const pastCampaigns = await prisma.marketingAdCampaign.findMany({
        where: {
          organizationId: product.organizationId
        },
        select: {
          name: true,
          platform: true,
          budget: true,
          performance: true
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      const prompt = `You are an expert Ads Manager. Suggest 3-5 ad campaigns for:

PRODUCT: ${product.name}
DESCRIPTION: ${product.description}
PRICE: ${product.price ? `€${product.price}` : 'Freemium'}

PREVIOUS CAMPAIGNS:
${pastCampaigns.length > 0 ? JSON.stringify(pastCampaigns, null, 2) : 'No previous campaigns'}

CURRENT MONTH: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

Consider:
1. Seasonality (monthly events)
2. Past campaign performance
3. Realistic budget (€50-500/day)
4. Expected ROI based on SaaS industry benchmarks

Return JSON:
{
  "campaigns": [
    {
      "name": "Descriptive name",
      "objective": "CONVERSIONS | TRAFFIC | AWARENESS",
      "platform": "google | facebook",
      "budget": 100,
      "duration": 14,
      "expectedROI": 2.5,
      "confidence": 0.75,
      "reasoning": "Why this campaign will work"
    }
  ]
}`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
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

      logger.success('✅ Campaign suggestions generated', {
        count: data.campaigns.length
      });

      return data.campaigns;
    } catch (error) {
      logger.error('Failed to generate campaign suggestions', error, { productId });
      throw error;
    }
  }

  /**
   * Gets saved calendar
   */
  async getCalendar(productId: string, month: string): Promise<MonthlyCalendar | null> {
    try {
      const memory = await prisma.marketingMemory.findUnique({
        where: { key: `calendar_${productId}_${month}` }
      });

      if (!memory) return null;

      const data = JSON.parse(memory.value as string);
      const summary = this.calculateSummary(data.days);

      return {
        month,
        year: new Date().getFullYear(),
        days: data.days,
        themes: data.themes,
        kpis: data.kpis,
        summary
      };
    } catch (error) {
      logger.error('Failed to get calendar', error, { productId, month });
      return null;
    }
  }
}

export const contentCalendar = new ContentCalendar();




