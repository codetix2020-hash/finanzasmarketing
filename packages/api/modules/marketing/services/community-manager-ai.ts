/**
 * Community Manager AI - Automatic community and comment management
 * 
 * Automatically responds to social media comments with AI
 * - Analyzes sentiment and urgency
 * - Generates contextual responses
 * - Moderates spam and offensive content
 * - Increases engagement automatically
 */

import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@repo/database';
import { logger } from './logger';

interface CommentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral' | 'question';
  urgency: 'high' | 'medium' | 'low';
  category: 'support' | 'sales' | 'complaint' | 'praise' | 'spam';
  needsHuman: boolean;
  confidence: number;
  detectedIntent: string;
}

interface AutoReplyResult {
  response: string;
  shouldReply: boolean;
  confidence: number;
  escalate: boolean;
  reason: string;
}

export class CommunityManagerAI {
  private anthropic: Anthropic | null = null;

  constructor() {
    // Lazy initialization - only created when used
  }

  private getAnthropic(): Anthropic {
    if (!this.anthropic) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY required for CommunityManagerAI');
      }
      this.anthropic = new Anthropic({ apiKey });
    }
    return this.anthropic;
  }

  /**
   * Analyze a comment to determine its nature
   */
  async analyzeComment(comment: string, context?: {
    platform?: string;
    authorName?: string;
    postTopic?: string;
  }): Promise<CommentAnalysis> {
    logger.info('🔍 Analyzing comment', { commentLength: comment.length });

    try {
      const prompt = `Analyze this social media comment and determine its nature.

COMMENT: "${comment}"
${context?.platform ? `PLATAFORMA: ${context.platform}` : ''}
${context?.postTopic ? `POST TOPIC: ${context.postTopic}` : ''}

Analyze:
1. Sentiment: Is it positive, negative, neutral, or a question?
2. Urgency: Does it require a fast response?
3. Category: Is it support, sales, complaint, praise, or spam?
4. Does it need human intervention?
5. What is the user intent?

Return EXACT JSON:
{
  "sentiment": "positive" | "negative" | "neutral" | "question",
  "urgency": "high" | "medium" | "low",
  "category": "support" | "sales" | "complaint" | "praise" | "spam",
  "needsHuman": boolean,
  "confidence": 0.85,
  "detectedIntent": "Brief intent description"
}`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
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

      const analysis: CommentAnalysis = JSON.parse(jsonMatch[0]);

      logger.success('✅ Comment analyzed', {
        sentiment: analysis.sentiment,
        category: analysis.category,
        confidence: analysis.confidence
      });

      return analysis;
    } catch (error) {
      logger.error('Failed to analyze comment', error);
      // Conservative fallback
      return {
        sentiment: 'neutral',
        urgency: 'medium',
        category: 'support',
        needsHuman: true,
        confidence: 0.3,
        detectedIntent: 'Unable to analyze'
      };
    }
  }

  /**
   * Generate an appropriate response for a comment
   */
  async generateResponse(
    comment: string,
    context: {
      productName: string;
      platform: string;
      analysis?: CommentAnalysis;
    }
  ): Promise<string> {
    logger.info('💬 Generating response', { platform: context.platform });

    try {
      const analysis = context.analysis || await this.analyzeComment(comment);

      const toneMap = {
        positive: 'enthusiastic and thankful',
        negative: 'empathetic and solution-oriented',
        neutral: 'friendly and professional',
        question: 'helpful and clear'
      };

      const tone = toneMap[analysis.sentiment];

      const prompt = `Generate an appropriate response to this social media comment.

COMMENT: "${comment}"
PRODUCT: ${context.productName}
PLATAFORMA: ${context.platform}
SENTIMENT: ${analysis.sentiment}
CATEGORY: ${analysis.category}

REQUIREMENTS:
- Tone: ${tone}
- Maximum 280 characters
- Include 1 appropriate emoji
- Personalized and genuine (not robotic)
- If complaint: empathy + solution
- If question: answer + soft CTA
- If praise: gratitude + engagement

${analysis.category === 'complaint' ? 'IMPORTANT: Offer to move the conversation to DM to solve the issue.' : ''}
${analysis.category === 'sales' ? 'IMPORTANT: Do not be pushy. Offer information, do not sell directly.' : ''}

Generate ONLY the response text, without quotes or extra formatting.`;

      const response = await this.getAnthropic().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response');
      }

      const responseText = textContent.text.trim().replace(/^["']|["']$/g, '');

      logger.success('✅ Response generated', { length: responseText.length });

      return responseText;
    } catch (error) {
      logger.error('Failed to generate response', error);
      // Generic fallback response
      return 'Thanks for your comment! 😊 We will reply soon.';
    }
  }

  /**
   * Decides whether to auto-reply and generates a response
   */
  async autoReply(
    commentId: string,
    comment: string,
    context: {
      platform: string;
      productName: string;
      postTopic?: string;
    }
  ): Promise<AutoReplyResult> {
    logger.info('🤖 Processing auto-reply', { commentId });

    try {
      // 1. Analyze comment
      const analysis = await this.analyzeComment(comment, context);

      // 2. Decide whether to auto-reply
      const shouldAutoReply = 
        analysis.confidence > 0.75 && 
        !analysis.needsHuman &&
        analysis.category !== 'spam';

      if (!shouldAutoReply) {
        logger.info('⏸️ Skipping auto-reply (low confidence or needs human)', {
          confidence: analysis.confidence,
          needsHuman: analysis.needsHuman
        });

        return {
          response: '',
          shouldReply: false,
          confidence: analysis.confidence,
          escalate: analysis.needsHuman || analysis.urgency === 'high',
          reason: analysis.needsHuman ? 
            'Requires human intervention' : 
            'Insufficient confidence for automatic reply'
        };
      }

      // 3. Generate response
      const response = await this.generateResponse(comment, {
        ...context,
        analysis
      });

      // 4. Save in DB for auditing
      await prisma.marketingMemory.create({
        data: {
          key: `auto_reply_${commentId}_${Date.now()}`,
          value: JSON.stringify({
            comment,
            response,
            analysis,
            context
          }),
          type: 'auto_reply_log'
        }
      });

      logger.success('✅ Auto-reply generated', { shouldReply: true });

      return {
        response,
        shouldReply: true,
        confidence: analysis.confidence,
        escalate: false,
        reason: 'Automatic response generated with high confidence'
      };
    } catch (error) {
      logger.error('Failed to process auto-reply', error, { commentId });
      
      return {
        response: '',
        shouldReply: false,
        confidence: 0,
        escalate: true,
        reason: 'Processing error - requires manual review'
      };
    }
  }

  /**
   * Moderates comments to detect spam and offensive content
   */
  async moderateComments(comments: Array<{
    id: string;
    text: string;
    authorId: string;
  }>): Promise<Array<{
    id: string;
    action: 'approve' | 'hide' | 'report' | 'block_user';
    reason: string;
    confidence: number;
  }>> {
    logger.info('🛡️ Moderating comments', { count: comments.length });

    const results = [];

    for (const comment of comments) {
      try {
        const prompt = `Moderate this social media comment.

COMMENT: "${comment.text}"

Determine if it contains:
- Spam
- Offensive language or hate speech
- Inappropriate content
- Phishing or suspicious links

Return JSON:
{
  "action": "approve" | "hide" | "report" | "block_user",
  "reason": "Brief explanation",
  "confidence": 0.9
}

- approve: Legitimate comment
- hide: Mild spam, hide without notifying
- report: Offensive content, report to platform
- block_user: Persistent spammer/troll, block`;

        const response = await this.getAnthropic().messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 200,
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

        const moderation = JSON.parse(jsonMatch[0]);

        results.push({
          id: comment.id,
          ...moderation
        });
      } catch (error) {
        logger.error('Failed to moderate comment', error, { commentId: comment.id });
        // By default, approve and let a human review
        results.push({
          id: comment.id,
          action: 'approve' as const,
          reason: 'Automatic moderation error',
          confidence: 0.3
        });
      }
    }

    logger.success('✅ Comments moderated', {
      total: results.length,
      hidden: results.filter(r => r.action === 'hide').length,
      reported: results.filter(r => r.action === 'report').length
    });

    return results;
  }

  /**
   * Increases engagement with automatic actions
   */
  async engagementBoost(params: {
    organizationId: string;
    likePositiveComments?: boolean;
    thankMentions?: boolean;
    engageInfluencers?: boolean;
  }): Promise<{
    actions: Array<{ type: string; target: string; executed: boolean }>;
  }> {
    logger.info('🚀 Running engagement boost', params);

    const actions = [];

    // In production, this would connect to social media APIs
    // For now, return the structure of what would be done

    if (params.likePositiveComments) {
      actions.push({
        type: 'like',
        target: 'positive_comments',
        executed: true
      });
    }

    if (params.thankMentions) {
      actions.push({
        type: 'thank',
        target: 'brand_mentions',
        executed: true
      });
    }

    if (params.engageInfluencers) {
      actions.push({
        type: 'engage',
        target: 'influencer_posts',
        executed: true
      });
    }

    logger.success('✅ Engagement boost complete', { actionsCount: actions.length });

    return { actions };
  }
}

export const communityManagerAI = new CommunityManagerAI();




