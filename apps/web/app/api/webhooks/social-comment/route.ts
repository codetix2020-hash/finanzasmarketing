/**
 * POST /api/webhooks/social-comment
 * 
 * Webhook para recibir comentarios de redes sociales y responder automáticamente
 */

import { NextResponse } from 'next/server';
import { communityManagerAI } from '@repo/api/modules/marketing/services/community-manager-ai';
import { logger } from '@repo/api/modules/marketing/services/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { platform, commentId, text, postId, productName } = await request.json();

    if (!commentId || !text || !platform) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    logger.info('💬 Webhook: New comment received', { platform, commentId });

    const result = await communityManagerAI.autoReply(commentId, text, {
      platform,
      productName: productName || 'MarketingOS',
      postTopic: undefined
    });

    return NextResponse.json({
      success: true,
      shouldReply: result.shouldReply,
      response: result.response,
      escalate: result.escalate,
      reason: result.reason
    });
  } catch (error) {
    logger.error('API error processing comment', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




