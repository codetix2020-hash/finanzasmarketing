/**
 * GET /api/marketing/health?org=XXX
 * 
 * Obtiene el health score del marketing
 */

import { NextResponse } from 'next/server';
import { healthMonitor } from '@repo/api/modules/marketing/services/health-monitor';
import { logger } from '@repo/api/modules/marketing/services/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org');

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'org parameter is required' },
        { status: 400 }
      );
    }

    const health = await healthMonitor.calculateMarketingHealth(orgId);

    return NextResponse.json({
      success: true,
      health
    });
  } catch (error) {
    logger.error('API error fetching health', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}








