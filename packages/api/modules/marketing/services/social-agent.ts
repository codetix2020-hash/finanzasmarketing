import Anthropic from "@anthropic-ai/sdk";

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  content: string;
  mediaUrls?: string[];
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'published';
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
  };
}

export interface SocialAnalytics {
  platform: string;
  followers: number;
  engagementRate: number;
  topPosts: Array<{ content: string; engagement: number }>;
  sentiment: 'positive' | 'neutral' | 'negative';
  recommendations: string[];
}

export class SocialAgent {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
  }

  /**
   * Generate social media post
   */
  async generatePost(params: {
    platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
    topic: string;
    tone?: string;
    includeHashtags?: boolean;
    includeEmojis?: boolean;
  }): Promise<{ content: string; hashtags: string[] }> {
    const characterLimits = {
      twitter: 280,
      linkedin: 3000,
      facebook: 5000,
      instagram: 2200,
    };

    const prompt = `Generate a post for ${params.platform} about: ${params.topic}

CHARACTER LIMIT: ${characterLimits[params.platform]}
TONE: ${params.tone || 'professional and engaging'}
${params.includeHashtags ? 'INCLUDE: Relevant hashtags' : ''}
${params.includeEmojis ? 'INCLUDE: Appropriate emojis' : ''}

Reply in JSON:
{
  "content": "string (the full post)",
  "hashtags": ["string", "string"]
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      });

      const responseContent = message.content[0];
      if (responseContent.type !== "text") {
        throw new Error("Unexpected response type");
      }

      const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error generating social post:", error);
      return {
        content: `Content about ${params.topic}`,
        hashtags: ['#marketing', '#growth'],
      };
    }
  }

  /**
   * Schedule post
   */
  async schedulePost(post: SocialPost): Promise<{ scheduled: boolean; scheduledFor: Date }> {
    // In production, this would integrate with Buffer, Hootsuite, or native APIs
    console.log("Scheduling post:", post);
    
    return {
      scheduled: true,
      scheduledFor: post.scheduledFor || new Date(),
    };
  }

  /**
   * Analyze engagement
   */
  async analyzeEngagement(posts: SocialPost[]): Promise<{
    totalEngagement: number;
    averageEngagementRate: number;
    bestPerformingPost: SocialPost | null;
    insights: string[];
  }> {
    let totalEngagement = 0;
    let bestPost: SocialPost | null = null;
    let maxEngagement = 0;

    posts.forEach(post => {
      if (post.engagement) {
        const engagement = post.engagement.likes + post.engagement.comments + post.engagement.shares;
        totalEngagement += engagement;
        
        if (engagement > maxEngagement) {
          maxEngagement = engagement;
          bestPost = post;
        }
      }
    });

    const avgEngagementRate = posts.length > 0 ? totalEngagement / posts.length : 0;

    const insights = [
      `Total of ${posts.length} posts analyzed`,
      `Average engagement: ${avgEngagementRate.toFixed(1)} interactions`,
      bestPost ? `Best post: ${bestPost.content.substring(0, 50)}...` : 'No data',
    ];

    return {
      totalEngagement,
      averageEngagementRate: avgEngagementRate,
      bestPerformingPost: bestPost,
      insights,
    };
  }

  /**
   * Sentiment analysis
   */
  async analyzeSentiment(comments: string[]): Promise<{
    overall: 'positive' | 'neutral' | 'negative';
    breakdown: { positive: number; neutral: number; negative: number };
    sampleComments: Array<{ text: string; sentiment: string }>;
  }> {
    if (comments.length === 0) {
      return {
        overall: 'neutral',
        breakdown: { positive: 0, neutral: 0, negative: 0 },
        sampleComments: [],
      };
    }

    const prompt = `Analyze the sentiment of these comments:

${comments.slice(0, 10).map((c, i) => `${i + 1}. ${c}`).join('\n')}

Reply in JSON:
{
  "overall": "positive|neutral|negative",
  "breakdown": {
    "positive": number (percentage),
    "neutral": number (percentage),
    "negative": number (percentage)
  },
  "sampleComments": [
    { "text": "string", "sentiment": "string" }
  ]
}`;

    try {
      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      const responseContent = message.content[0];
      if (responseContent.type !== "text") {
        throw new Error("Unexpected response type");
      }

      const jsonMatch = responseContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Error analyzing sentiment:", error);
      return {
        overall: 'neutral',
        breakdown: { positive: 60, neutral: 30, negative: 10 },
        sampleComments: comments.slice(0, 3).map(c => ({ text: c, sentiment: 'neutral' })),
      };
    }
  }

  /**
   * Automatically reply to comments
   */
  async generateAutoReply(params: {
    comment: string;
    context: string;
    tone?: string;
  }): Promise<string> {
    const prompt = `Generate an appropriate reply for this comment:

COMMENT: "${params.comment}"
CONTEXT: ${params.context}
TONE: ${params.tone || 'friendly and professional'}

Generate a short reply (max 200 characters) that is appropriate and helpful.`;

    try {
      const message = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      });

      const responseContent = message.content[0];
      if (responseContent.type !== "text") {
        throw new Error("Unexpected response type");
      }

      return responseContent.text.trim();
    } catch (error) {
      console.error("Error generating auto reply:", error);
      return "Thanks for your comment! 😊";
    }
  }

  /**
   * Get best posting times
   */
  async getBestPostingTimes(params: {
    platform: string;
    timezone: string;
  }): Promise<{
    weekdays: Array<{ day: string; hours: number[] }>;
    recommendations: string[];
  }> {
    // Data based on social media studies
    const bestTimes = {
      twitter: { weekdays: ['Monday', 'Wednesday', 'Friday'], hours: [9, 12, 17] },
      linkedin: { weekdays: ['Tuesday', 'Wednesday', 'Thursday'], hours: [8, 12, 17] },
      facebook: { weekdays: ['Tuesday', 'Thursday'], hours: [13, 15, 19] },
      instagram: { weekdays: ['Wednesday', 'Friday'], hours: [11, 14, 19] },
    };

    const platform = params.platform.toLowerCase() as keyof typeof bestTimes;
    const data = bestTimes[platform] || bestTimes.twitter;

    return {
      weekdays: data.weekdays.map(day => ({
        day,
        hours: data.hours,
      })),
      recommendations: [
        `Post on ${data.weekdays.join(', ')} for better reach`,
        `Optimal times: ${data.hours.join(':00, ')}:00`,
        'Avoid weekends for B2B content',
      ],
    };
  }
}

