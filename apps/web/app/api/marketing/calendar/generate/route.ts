/**
 * POST /api/marketing/calendar/generate
 * 
 * Generates a monthly editorial calendar for a product
 */

import { NextResponse } from 'next/server';
import { contentCalendar } from '@repo/api/modules/marketing/services/content-calendar';
import { logger } from '@repo/api/modules/marketing/services/logger';
import { prisma } from "@repo/database";
import { getAuthContext, unauthorizedResponse } from "@repo/api/lib/auth-guard";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { productId, month } = await request.json();

    if (!productId || !month) {
      return NextResponse.json(
        { success: false, error: 'productId and month are required' },
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

    logger.info('📅 Generating calendar via API', { productId, month });

    const calendar = await contentCalendar.generateMonthlyCalendar(productId, month);

    return NextResponse.json({
      success: true,
      calendar
    });
  } catch (error) {
    logger.error('API error generating calendar', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/marketing/calendar/generate?productId=X&month=2025-02
 * 
 * Retrieves a saved calendar
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const month = searchParams.get('month');

    if (!productId || !month) {
      return NextResponse.json(
        { success: false, error: 'productId and month are required' },
        { status: 400 }
      );
    }

    const product = await prisma.saasProduct.findUnique({ where: { id: productId }, select: { organizationId: true } });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }
    const authCtx2 = await getAuthContext(product.organizationId);
    if (!authCtx2) {
      return unauthorizedResponse();
    }

    const calendar = await contentCalendar.getCalendar(productId, month);

    if (!calendar) {
      return NextResponse.json(
        { success: false, error: 'Calendar not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      calendar
    });
  } catch (error) {
    logger.error('API error fetching calendar', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}




