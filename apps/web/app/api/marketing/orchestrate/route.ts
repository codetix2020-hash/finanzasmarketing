/**
 * POST /api/marketing/orchestrate
 * 
 * Ejecuta el ciclo completo de marketing automation
 */

import { NextResponse } from 'next/server';
import { marketingOrchestrator } from '@repo/api/modules/marketing/services/marketing-orchestrator';
import { logger } from '@repo/api/modules/marketing/services/logger';
import { prisma } from "@repo/database";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { productId, mode } = await request.json();

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

    logger.info('🚀 API: Starting marketing orchestration', { productId, mode });

    let result;

    switch (mode) {
      case 'full':
        result = await marketingOrchestrator.runFullMarketingCycle(productId);
        break;
      
      case 'content_only':
        result = await marketingOrchestrator.runContentGenerationOnly(productId);
        break;
      
      default:
        result = await marketingOrchestrator.runFullMarketingCycle(productId);
    }

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error('API error in orchestration', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




