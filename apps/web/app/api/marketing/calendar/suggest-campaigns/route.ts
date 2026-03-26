/**
 * POST /api/marketing/calendar/suggest-campaigns
 * 
 * Genera sugerencias de campañas publicitarias para un producto
 */

import { NextResponse } from 'next/server';
import { contentCalendar } from '@repo/api/modules/marketing/services/content-calendar';
import { logger } from '@repo/api/modules/marketing/services/logger';
import { prisma } from "@repo/database";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'productId is required' },
        { status: 400 }
      );
    }

    const product = await prisma.saasProduct.findUnique({ where: { id: productId }, select: { organizationId: true } });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    const authCtx = await getAuthContext(product.organizationId);
    if (!authCtx) {
      return unauthorizedResponse();
    }

    logger.info('🎯 Generating campaign suggestions via API', { productId });

    const suggestions = await contentCalendar.suggestCampaigns(productId);

    return NextResponse.json({
      success: true,
      suggestions
    });
  } catch (error) {
    logger.error('API error generating campaign suggestions', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




